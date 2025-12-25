#!/usr/bin/env node

/**
 * Start script for standalone Next.js server
 * Loads .env file before starting the server
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// When running from standalone directory, __dirname will be the standalone dir
// When running from scripts directory, use process.cwd()
const standaloneDir = fs.existsSync(path.join(__dirname, 'server.js')) ? __dirname : process.cwd();
const envFile = path.join(standaloneDir, '.env');
const serverFile = path.join(standaloneDir, 'server.js');

/**
 * Parse .env file and set environment variables
 */
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    console.log('ℹ️  No .env file found, using environment variables from system\n');
    return;
  }

  console.log('📄 Loading .env file...\n');
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // Parse KEY=VALUE format
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      // Only set if not already set (system env vars take precedence)
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Start the server
 */
function startServer() {
  // Load .env file if it exists
  loadEnvFile(envFile);

  // Check if server.js exists
  if (!fs.existsSync(serverFile)) {
    console.error('❌ server.js not found in:', standaloneDir);
    console.error('   Make sure you are running this from the standalone directory');
    process.exit(1);
  }

  // Start the server
  console.log('🚀 Starting Next.js server...\n');
  const server = spawn('node', [serverFile], {
    stdio: 'inherit',
    cwd: standaloneDir,
    env: process.env,
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  server.on('exit', (code) => {
    process.exit(code || 0);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    server.kill('SIGINT');
  });
}

startServer();
