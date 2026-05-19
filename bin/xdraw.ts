#!/usr/bin/env node

import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const MAX_REQUEST_BYTES = 50 * 1024 * 1024;
const HEARTBEAT_TIMEOUT_MS = 30_000;
const CLOSE_GRACE_MS = 5_000;

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
};

function randomPort() {
  return 3000 + Math.floor(Math.random() * 30000);
}

function printHelp() {
  console.log(`xdraw

Usage:
  xdraw [--keep-alive] <file>
  xdraw [--keep-alive] open <file>
  xdraw [--keep-alive] new <file>

Options:
  --keep-alive        Keep the local server running after the browser tab closes

Notes:
  - Opens Excalidraw in system browser
  - Saves back to same .excalidraw file
  - Requires Node.js 24+
  - Build/install from source: npm install && npm run build && npm install -g .
`);
}

function normalizeTarget(input?: string) {
  if (!input) {
    throw new Error('Missing file path');
  }

  return input.endsWith('.excalidraw') ? input : `${input}.excalidraw`;
}

function createEmptyScene() {
  return {
    type: 'excalidraw',
    version: 2,
    source: 'https://excalidraw.com',
    elements: [],
    appState: {
      viewBackgroundColor: '#ffffff',
    },
    files: {},
  };
}

function openBrowser(url: string) {
  if (process.env.XDRAW_NO_OPEN === '1') {
    return;
  }

  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];

  const child = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

async function readScene(targetPath: string) {
  const raw = await readFile(targetPath, 'utf8');
  return JSON.parse(raw);
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

function sendText(response: ServerResponse, statusCode: number, body: string) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  response.end(body);
}

async function readRequestJson(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.byteLength;

    if (size > MAX_REQUEST_BYTES) {
      throw new Error('Request body too large');
    }

    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function resolveAssetPath(urlPath: string) {
  const decodedPath = decodeURIComponent(urlPath);
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.slice(1);
  const assetPath = path.normalize(path.join(CLIENT_DIR, relativePath));

  if (assetPath !== CLIENT_DIR && !assetPath.startsWith(`${CLIENT_DIR}${path.sep}`)) {
    return null;
  }

  return assetPath;
}

async function sendAsset(response: ServerResponse, urlPath: string) {
  const assetPath = resolveAssetPath(urlPath);

  if (!assetPath) {
    sendText(response, 400, 'Bad request');
    return;
  }

  try {
    const assetStat = await stat(assetPath);

    if (!assetStat.isFile()) {
      sendText(response, 404, 'Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': CONTENT_TYPES[path.extname(assetPath)] ?? 'application/octet-stream',
      'Content-Length': assetStat.size,
    });
    createReadStream(assetPath).pipe(response);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;

    if (code === 'ENOENT') {
      sendText(response, 404, 'Not found');
      return;
    }

    throw error;
  }
}

async function startServer(targetPath: string, isNewFile: boolean, exitOnClose: boolean) {
  let heartbeatClientId: string | null = null;
  let heartbeatSeen = false;
  let lastHeartbeatAt = 0;
  let pendingExitTimer: NodeJS.Timeout | undefined;

  const cancelPendingExit = () => {
    if (!pendingExitTimer) {
      return;
    }

    clearTimeout(pendingExitTimer);
    pendingExitTimer = undefined;
  };

  const scheduleExit = (reason: string, delayMs: number) => {
    if (!exitOnClose || pendingExitTimer) {
      return;
    }

    pendingExitTimer = setTimeout(() => {
      console.log(`${reason}. Use --keep-alive to keep the server running.`);
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 500).unref();
    }, delayMs);
    pendingExitTimer.unref();
  };

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');

      if (url.pathname === '/api/heartbeat') {
        if (request.method !== 'POST') {
          sendText(response, 405, 'Method not allowed');
          return;
        }

        const body = (await readRequestJson(request)) as { clientId?: unknown };

        if (typeof body.clientId !== 'string' || body.clientId.length === 0) {
          sendText(response, 400, 'Missing client id');
          return;
        }

        heartbeatClientId ??= body.clientId;

        if (body.clientId === heartbeatClientId) {
          heartbeatSeen = true;
          lastHeartbeatAt = Date.now();
          cancelPendingExit();
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/close') {
        if (request.method !== 'POST') {
          sendText(response, 405, 'Method not allowed');
          return;
        }

        const body = (await readRequestJson(request)) as { clientId?: unknown };

        if (typeof body.clientId !== 'string' || body.clientId.length === 0) {
          sendText(response, 400, 'Missing client id');
          return;
        }

        heartbeatClientId ??= body.clientId;

        if (body.clientId === heartbeatClientId) {
          scheduleExit('xdraw browser tab closed; exiting', CLOSE_GRACE_MS);
        }

        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === '/api/scene') {
        if (request.method === 'GET') {
          sendJson(response, 200, {
            path: targetPath,
            basename: path.basename(targetPath),
            isNewFile,
            scene: await readScene(targetPath),
          });
          return;
        }

        if (request.method === 'PUT') {
          const body = await readRequestJson(request);
          await writeFile(targetPath, `${JSON.stringify(body, null, 2)}\n`);
          isNewFile = false;

          sendJson(response, 200, {
            basename: path.basename(targetPath),
            savedAt: new Date().toISOString(),
          });
          return;
        }

        sendText(response, 405, 'Method not allowed');
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendText(response, 405, 'Method not allowed');
        return;
      }

      await sendAsset(response, url.pathname);
    } catch (error) {
      console.error(error);
      sendText(response, 500, 'Internal server error');
    }
  });

  let heartbeatTimer: NodeJS.Timeout | undefined;

  if (exitOnClose) {
    heartbeatTimer = setInterval(() => {
      if (!heartbeatSeen || Date.now() - lastHeartbeatAt <= HEARTBEAT_TIMEOUT_MS) {
        return;
      }

      scheduleExit('xdraw browser tab heartbeat lost; exiting', 0);
    }, 1000);
    heartbeatTimer.unref();

    server.on('close', () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
      cancelPendingExit();
    });
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const port = randomPort();

    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          server.off('listening', onListening);
          reject(error);
        };
        const onListening = () => {
          server.off('error', onError);
          resolve();
        };

        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '127.0.0.1');
      });

      return { server, url: `http://127.0.0.1:${port}/` };
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;

      if (code !== 'EADDRINUSE') {
        throw error;
      }
    }
  }

  throw new Error('Failed to start server after multiple port attempts.');
}

async function main() {
  const args = process.argv.slice(2);

  const keepAlive = args.includes('--keep-alive');
  const positionalArgs = args.filter((arg) => arg !== '--keep-alive');

  if (
    positionalArgs.length === 0 ||
    positionalArgs.includes('--help') ||
    positionalArgs.includes('-h')
  ) {
    printHelp();
    process.exit(positionalArgs.length === 0 ? 1 : 0);
  }

  const [commandOrPath, maybePath] = positionalArgs;
  const command = ['open', 'new'].includes(commandOrPath) ? commandOrPath : 'open';
  const rawTarget = command === 'open' ? commandOrPath : maybePath;
  const targetPath = path.resolve(process.cwd(), normalizeTarget(rawTarget));

  let isNewFile = false;

  try {
    await stat(targetPath);

    if (command === 'new') {
      throw new Error(`File already exists: ${targetPath}`);
    }
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;

    if (code !== 'ENOENT') {
      throw error;
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, `${JSON.stringify(createEmptyScene(), null, 2)}\n`);
    isNewFile = true;
  }

  const { url } = await startServer(targetPath, isNewFile, !keepAlive);

  console.log(`xdraw serving ${targetPath}`);
  console.log(`xdraw opening ${url}`);
  openBrowser(url);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
