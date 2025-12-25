#!/usr/bin/env node

/**
 * Build script to create a standalone deployable bundle
 * - Runs Next.js build with standalone output
 * - Copies public directory to standalone output
 * - Copies static assets to standalone output
 * - Creates a deployable bundle
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const publicDir = path.join(projectRoot, 'public');
const staticDir = path.join(projectRoot, '.next', 'static');
const envFile = path.join(projectRoot, '.env');
const standalonePublicDir = path.join(standaloneDir, 'public');
const standaloneStaticDir = path.join(standaloneDir, '.next', 'static');
const standaloneEnvFile = path.join(standaloneDir, '.env');

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`⚠️  Source directory does not exist: ${src}`);
    return;
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main build function
 */
function buildStandalone() {
  console.log('🚀 Building standalone Next.js application...\n');

  try {
    // Step 1: Run Next.js build
    console.log('📦 Running Next.js build...');
    execSync('next build', { stdio: 'inherit', cwd: projectRoot });
    console.log('✅ Next.js build completed\n');

    // Step 2: Check if standalone directory exists
    if (!fs.existsSync(standaloneDir)) {
      throw new Error(
        'Standalone directory not found. Make sure output: "standalone" is set in next.config.js'
      );
    }

    // Step 3: Copy public directory if it exists
    if (fs.existsSync(publicDir)) {
      console.log('📁 Copying public directory...');
      copyDir(publicDir, standalonePublicDir);
      console.log('✅ Public directory copied\n');
    } else {
      console.log('ℹ️  No public directory found, skipping...\n');
    }

    // Step 4: Verify static assets are in standalone
    // Note: Next.js standalone output already includes .next/static automatically
    if (fs.existsSync(standaloneStaticDir)) {
      console.log('✅ Static assets are already included in standalone output\n');
    } else if (fs.existsSync(staticDir)) {
      console.log('📁 Copying static assets to standalone...');
      // Ensure .next directory exists in standalone
      const standaloneNextDir = path.join(standaloneDir, '.next');
      if (!fs.existsSync(standaloneNextDir)) {
        fs.mkdirSync(standaloneNextDir, { recursive: true });
      }
      copyDir(staticDir, standaloneStaticDir);
      console.log('✅ Static assets copied\n');
    } else {
      console.log('ℹ️  No static assets found\n');
    }

    // Step 5: Copy .env file if it exists
    if (fs.existsSync(envFile)) {
      console.log('📄 Copying .env file...');
      fs.copyFileSync(envFile, standaloneEnvFile);
      console.log('✅ .env file copied\n');
    } else {
      console.log('ℹ️  No .env file found (you can create one in the standalone directory)\n');
    }

    // Step 6: Copy start script to standalone
    const startScriptPath = path.join(projectRoot, 'scripts', 'start-standalone.js');
    const standaloneStartScript = path.join(standaloneDir, 'start.js');
    if (fs.existsSync(startScriptPath)) {
      console.log('📄 Copying start script...');
      fs.copyFileSync(startScriptPath, standaloneStartScript);
      // Make it executable
      fs.chmodSync(standaloneStartScript, '755');
      console.log('✅ Start script copied\n');
    }

    // Step 7: Create a README for deployment
    const readmePath = path.join(standaloneDir, 'DEPLOY.md');
    const readmeContent = `# Standalone Deployment

This is a standalone Next.js build that can be deployed independently.

## Structure

- \`start.js\` - **Start script that loads .env file** (recommended way to start)
- \`server.js\` - The Next.js server entry point (direct start, doesn't load .env)
- \`.env\` - Environment variables (copied from project root, if it exists)
- \`public/\` - Public static assets (copied from project root)
- \`.next/static/\` - Next.js static assets (automatically included)
- \`.next/BUILD_ID\` - Build identifier
- \`node_modules/\` - Production dependencies only (minimal set)

## Running

1. Make sure you have Node.js installed
2. Configure environment variables (see below)
3. Run: \`node start.js\` (recommended) or \`node server.js\`

## Environment Variables

You can set environment variables in two ways:

### Option 1: Using .env file (Recommended)
Create or edit the \`.env\` file in this directory:

\`\`\`bash
DRAWINGS_DIR=/path/to/drawings
HOST=127.0.0.1
PORT=9876
\`\`\`

Then run:
\`\`\`bash
node start.js
\`\`\`

The \`start.js\` script will automatically load the \`.env\` file before starting the server.

### Option 2: Export environment variables
\`\`\`bash
export DRAWINGS_DIR=/path/to/drawings
export PORT=3000
node server.js
\`\`\`

**Note:** If you use \`node server.js\` directly, it will NOT load the \`.env\` file. Use \`node start.js\` instead.

## Required Environment Variables

- \`DRAWINGS_DIR\` (required) - Path to directory where drawings will be stored

## Optional Environment Variables

- \`HOST\` (optional) - Server host (default: 127.0.0.1)
- \`PORT\` (optional) - Server port (default: 9876)
`;

    fs.writeFileSync(readmePath, readmeContent);
    console.log('📝 Created DEPLOY.md in standalone directory\n');

    console.log('✨ Standalone build completed successfully!');
    console.log(`📦 Deployable bundle location: ${standaloneDir}`);
    console.log('\nTo deploy, copy the entire .next/standalone directory to your server.');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
buildStandalone();
