#!/usr/bin/env node

/**
 * Rebuild metadata.json database from .excalidraw files in DRAWINGS_DIR
 * - Creates metadata entries for .excalidraw files that don't have metadata
 * - Preserves existing metadata (doesn't overwrite)
 * - Removes database entries that don't have corresponding .excalidraw files
 * - Dry run by default (use --execute to actually make changes)
 * - Backs up existing metadata.json before writing (in non-dry-run mode)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Expands environment variables in a string
 * Supports $VAR, ${VAR}, and ${VAR:-default} syntax
 */
function expandEnvVars(str) {
  if (!str || typeof str !== 'string') return str;

  // Expand ${VAR:-default} syntax first
  str = str.replace(/\$\{([^}]+):-([^}]*)\}/g, (match, varName, defaultValue) => {
    const value = process.env[varName.trim()];
    return value !== undefined ? value : defaultValue;
  });

  // Expand ${VAR} syntax
  str = str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const value = process.env[varName.trim()];
    return value !== undefined ? value : match;
  });

  // Expand $VAR syntax (but not $$)
  // First replace $$ with a placeholder, then expand $VAR, then restore $$
  str = str.replace(/\$\$/g, '\0DOLLAR\0');
  str = str.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (match, varName) => {
    const value = process.env[varName];
    return value !== undefined ? value : match;
  });
  str = str.replace(/\0DOLLAR\0/g, '$');

  return str;
}

// Try to load environment variables from .env file
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  // dotenv not available, try to read .env manually
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      // Skip comments and empty lines
      line = line.trim();
      if (!line || line.startsWith('#')) return;

      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        // Expand environment variables in the value
        value = expandEnvVars(value);
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

let DRAWINGS_DIR = process.env.DRAWINGS_DIR;

if (!DRAWINGS_DIR) {
  console.error('❌ Error: DRAWINGS_DIR environment variable is not set!');
  console.error('Please set DRAWINGS_DIR in your .env file.');
  process.exit(1);
}

// Expand environment variables in DRAWINGS_DIR (e.g., $HOME, ${HOME})
DRAWINGS_DIR = expandEnvVars(DRAWINGS_DIR);

if (!DRAWINGS_DIR) {
  console.error('❌ Error: DRAWINGS_DIR is empty after expanding environment variables!');
  process.exit(1);
}

const drawingsDir = path.isAbsolute(DRAWINGS_DIR)
  ? DRAWINGS_DIR
  : path.resolve(process.cwd(), DRAWINGS_DIR);

const dbPath = path.join(drawingsDir, 'metadata.json');

// Check if dry run mode
const isDryRun = !process.argv.includes('--execute');

/**
 * Validates a drawing ID - must be a valid UUID v4
 */
function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where x is any hexadecimal digit and y is one of 8, 9, A, or B
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Reads existing metadata database
 */
function readDatabase() {
  if (!fs.existsSync(dbPath)) {
    return { drawings: [] };
  }
  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    const data = JSON.parse(content);
    return {
      drawings: Array.isArray(data.drawings) ? data.drawings : [],
    };
  } catch (error) {
    console.error(`❌ Error reading database: ${error.message}`);
    return { drawings: [] };
  }
}

/**
 * Scans directory for .excalidraw files
 * Returns all files with their current IDs and whether they need renaming
 */
function scanDrawingsDirectory() {
  if (!fs.existsSync(drawingsDir)) {
    console.error(`❌ Error: Drawings directory does not exist: ${drawingsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(drawingsDir);
  const drawingFiles = files
    .filter((file) => file.endsWith('.excalidraw'))
    .map((file) => {
      const filePath = path.join(drawingsDir, file);
      const stats = fs.statSync(filePath);
      const currentId = file.replace(/\.excalidraw$/, '');
      const isValid = isValidUUID(currentId);
      const newId = isValid ? currentId : uuidv4();

      return {
        id: newId, // Use UUID (either existing or generated)
        currentId, // Original ID from filename
        filename: file,
        newFilename: isValid ? file : `${newId}.excalidraw`,
        filePath,
        newFilePath: isValid ? filePath : path.join(drawingsDir, `${newId}.excalidraw`),
        size: stats.size,
        needsRename: !isValid,
      };
    });

  return drawingFiles;
}

/**
 * Creates default metadata for a drawing file
 * Title rules:
 * 1. If file is being renamed to UUID, use original filename (without extension) as title
 * 2. If file already has UUID name, use 'imported-{timestamp}' as title
 */
function createDefaultMetadata(drawingFile) {
  const now = new Date().toISOString();
  let title;

  if (drawingFile.needsRename) {
    // File is being renamed to UUID - use original filename as title
    title = drawingFile.currentId;
  } else {
    // File already has UUID name - use imported-{timestamp}
    // Use timestamp to ensure uniqueness
    const timestamp = Date.now();
    title = `imported-${timestamp}`;
  }

  return {
    id: drawingFile.id,
    title: title,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Main rebuild function
 */
function rebuildMetadata() {
  console.log('🔍 Rebuilding metadata database...\n');
  console.log(`📁 Drawings directory: ${drawingsDir}`);
  console.log(`📄 Database path: ${dbPath}`);
  console.log(`🔧 Mode: ${isDryRun ? 'DRY RUN (use --execute to apply changes)' : 'EXECUTE'}\n`);

  // Read existing database
  const db = readDatabase();
  const existingMetadata = new Map();
  db.drawings.forEach((meta) => {
    existingMetadata.set(meta.id, meta);
  });

  console.log(`📊 Existing metadata entries: ${existingMetadata.size}`);

  // Scan for .excalidraw files
  const drawingFiles = scanDrawingsDirectory();
  console.log(`📝 Found .excalidraw files: ${drawingFiles.length}\n`);

  if (drawingFiles.length === 0) {
    console.log('⚠️  No .excalidraw files found in the directory.');
    return;
  }

  // Track changes
  const toAdd = [];
  const toKeep = [];
  const toRemove = [];
  const toRename = [];

  // Process each drawing file
  for (const drawingFile of drawingFiles) {
    // Check if file needs renaming
    if (drawingFile.needsRename) {
      toRename.push(drawingFile);
    }

    // Check for existing metadata by new ID (UUID)
    let existing = existingMetadata.get(drawingFile.id);

    // If not found and file was renamed, check by old ID
    if (!existing && drawingFile.needsRename) {
      existing = existingMetadata.get(drawingFile.currentId);
      // If found by old ID, update it to use new ID
      if (existing) {
        existing.id = drawingFile.id;
        existingMetadata.delete(drawingFile.currentId);
      }
    }

    if (existing) {
      // Keep existing metadata (may have been updated with new ID)
      toKeep.push({ id: drawingFile.id, metadata: existing });
    } else {
      // Create new metadata
      const newMetadata = createDefaultMetadata(drawingFile);
      toAdd.push({ id: drawingFile.id, metadata: newMetadata });
    }
  }

  // Find orphaned entries (metadata without corresponding files)
  for (const [id, metadata] of existingMetadata.entries()) {
    const hasFile = drawingFiles.some((file) => file.id === id);
    if (!hasFile) {
      toRemove.push({ id, metadata });
    }
  }

  // Report changes
  console.log('📋 Changes to be made:');
  console.log(`  🔄 Rename files: ${toRename.length}`);
  console.log(`  ✅ Add new entries: ${toAdd.length}`);
  console.log(`  🔄 Keep existing entries: ${toKeep.length}`);
  console.log(`  ❌ Remove orphaned entries: ${toRemove.length}\n`);

  if (toRename.length > 0) {
    console.log('📝 Files to rename (to UUID format):');
    toRename.forEach((file) => {
      console.log(`  ${file.filename} → ${file.newFilename}`);
    });
    console.log();
  }

  if (toAdd.length > 0) {
    console.log('📝 New metadata entries to add:');
    toAdd.forEach(({ id, metadata }) => {
      console.log(`  + ${id}: "${metadata.title}" (created: ${metadata.created_at})`);
    });
    console.log();
  }

  if (toRemove.length > 0) {
    console.log('🗑️  Orphaned entries to remove:');
    toRemove.forEach(({ id, metadata }) => {
      console.log(`  - ${id}: "${metadata.title}"`);
    });
    console.log();
  }

  if (toAdd.length === 0 && toRemove.length === 0 && toRename.length === 0) {
    console.log('✅ Database is already in sync. No changes needed.\n');
    return;
  }

  // Apply changes if not dry run
  if (isDryRun) {
    console.log('💡 This is a dry run. Use --execute to apply these changes.\n');
  } else {
    // Backup existing database
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`💾 Backed up existing database to: ${backupPath}\n`);
    }

    // Rename files that need UUID format
    if (toRename.length > 0) {
      console.log('🔄 Renaming files...');
      for (const file of toRename) {
        try {
          fs.renameSync(file.filePath, file.newFilePath);
          console.log(`  ✓ ${file.filename} → ${file.newFilename}`);
        } catch (error) {
          console.error(`  ✗ Failed to rename ${file.filename}: ${error.message}`);
        }
      }
      console.log();
    }

    // Build new database
    const newDrawings = [
      ...toKeep.map((item) => item.metadata),
      ...toAdd.map((item) => item.metadata),
    ];

    // Sort by updated_at (most recent first)
    newDrawings.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const newDb = { drawings: newDrawings };

    // Write new database
    fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2), 'utf-8');
    console.log('✅ Database updated successfully!\n');
    console.log(`📊 Total entries: ${newDrawings.length}`);
    console.log(`  - Renamed: ${toRename.length}`);
    console.log(`  - Added: ${toAdd.length}`);
    console.log(`  - Kept: ${toKeep.length}`);
    console.log(`  - Removed: ${toRemove.length}\n`);
  }
}

// Run the rebuild
try {
  rebuildMetadata();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
