# Excalidraw Server

A minimal, self-hosted Excalidraw server designed for local note-taking systems. This lightweight Next.js application manages a local store of Excalidraw drawings and provides a simple web interface for creating, editing, and managing drawings.

## Features

- **Local Storage**: All drawings are stored locally on your machine - no cloud dependencies
- **Self-Hosted**: Designed for self-hosted note stores and personal knowledge management systems
- **Markdown Integration**: Automatically generates markdown links when saving drawings, making it easy to reference drawings in your notes
- **Minimal & Simple**: Lightweight implementation with minimal dependencies, perfect for local-only use
- **Dark Theme**: Clean, dark-themed interface optimized for extended use

## Use Case

This server is ideal for:

- Personal note-taking systems (Obsidian, LogSeq, etc.)
- Self-hosted knowledge bases
- Local documentation projects
- Any scenario where you want to manage Excalidraw drawings locally without external services

When you save a drawing, the server provides a markdown link that you can copy and paste directly into your notes.

## Standalone Release (Recommended for Quick Setup)

For a quick setup without needing Node.js development tools, you can download a pre-built standalone release from the [GitHub Releases page](https://github.com/martintrojer/excalidraw_server/releases).

### Download and Run

1. **Download the release:**
   - Go to the [Releases page](https://github.com/martintrojer/excalidraw_server/releases)
   - Download the `excalidraw-server-0.2.0.tar.gz` file (or the latest version)

2. **Extract the archive:**

   ```bash
   tar -xzf excalidraw-server-0.2.0.tar.gz
   cd excalidraw-server-0.2.0
   ```

3. **Configure environment variables:**
   Create a `.env` file in the extracted directory:

   ```bash
   DRAWINGS_DIR=/path/to/your/drawings
   HOST=127.0.0.1
   PORT=9876
   ```

4. **Start the server:**
   ```bash
   node start.js
   ```

The server will run on `http://127.0.0.1:9876` (or the host/port you configured).

**Note:** The standalone release includes all dependencies and is ready to run. You only need Node.js installed on your system.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

The server will run on `http://127.0.0.1:9876`

## Build for Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables (Required)

**You must create a `.env` file** in the project root before starting the server:

```bash
# Drawings directory (REQUIRED - absolute or relative to project root)
DRAWINGS_DIR=/path/to/your/drawings

# Server host (optional, defaults to 127.0.0.1)
HOST=127.0.0.1

# Server port (optional, defaults to 9876)
PORT=9876
```

**Important**: `DRAWINGS_DIR` is **required**. The server will exit with an error if it's not set.

Example `.env` file:

```bash
DRAWINGS_DIR=$HOME/notes/excalidraw_drawings
```

### Optional: Local DNS Setup

To avoid using `127.0.0.1` in your note links, you can set up a local DNS entry for `excalidraw.local`. This makes your markdown links cleaner and more readable.

**On Mac/Linux:**

1. Edit the hosts file (requires sudo):

   ```bash
   sudo nano /etc/hosts
   ```

2. Add this line:

   ```
   127.0.0.1 excalidraw.local
   ```

3. Update your `.env` file to use the new hostname:

   ```bash
   HOST=excalidraw.local
   ```

4. Restart the server. Now your drawings will be accessible at `http://excalidraw.local:9876` instead of `http://127.0.0.1:9876`.

**Note:** The markdown links generated when saving drawings will now use the cleaner `excalidraw.local` domain instead of the IP address.

## Maintenance

### Rebuilding Metadata Database

The server uses a `metadata.json` file to track all drawings. If you have existing `.excalidraw` files in your `DRAWINGS_DIR` that aren't in the database, or if you need to clean up orphaned database entries, you can use the rebuild script.

**When to use:**

- After manually adding `.excalidraw` files to the drawings directory
- To clean up database entries for files that no longer exist
- To rebuild the database after moving or reorganizing drawings
- To automatically rename files to UUID format (if they don't already use UUIDs)

**File Naming:**

- Drawing files should be named with valid UUID v4 format (e.g., `550e8400-e29b-41d4-a716-446655440000.excalidraw`)
- **Automatic Renaming**: Files that don't match UUID format will be automatically renamed to UUID format
- If a file has existing metadata with the old filename, it will be migrated to use the new UUID

**Title Rules:**

The script follows specific rules for setting titles in the database:

1. **Files being renamed to UUID**: The original filename (without `.excalidraw` extension) is used as the title
   - Example: `my-drawing.excalidraw` → renamed to `550e8400-...excalidraw` → title: `"my-drawing"`

2. **Files already with UUID names**: Uses `imported-{timestamp}` as the title (timestamp ensures uniqueness)
   - Example: `550e8400-...excalidraw` → title: `"imported-1706380800000"`

3. **Existing metadata**: Preserved when found (including when migrating from old filename to new UUID)

**Important**: UUIDs are never used as titles in the database. The script ensures meaningful titles are always assigned.

**Usage:**

```bash
# Dry run (default) - shows what would be done without making changes
npm run rebuild-metadata

# Actually apply the changes
npm run rebuild-metadata -- --execute
```

**What it does:**

- 🔄 **Renames files to UUID format**: Automatically generates UUIDs and renames files that don't match UUID naming convention
- ✅ **Adds missing entries**: Creates metadata for `.excalidraw` files that don't have database entries
- 🔄 **Preserves existing metadata**: Keeps existing metadata (title, dates, etc.) - doesn't overwrite
- 🔄 **Migrates metadata**: If a file is renamed, existing metadata for the old filename is updated to use the new UUID
- ❌ **Removes orphaned entries**: Deletes database entries for files that no longer exist
- 💾 **Backs up database**: In execute mode, creates a timestamped backup before making changes

**Example output (dry run):**

```
🔍 Rebuilding metadata database...

📁 Drawings directory: /path/to/drawings
📄 Database path: /path/to/drawings/metadata.json
🔧 Mode: DRY RUN (use --execute to apply changes)

📊 Existing metadata entries: 5
📝 Found .excalidraw files: 7

📋 Changes to be made:
  🔄 Rename files: 1
  ✅ Add new entries: 2
  🔄 Keep existing entries: 5
  ❌ Remove orphaned entries: 1

📝 Files to rename (to UUID format):
  my-drawing.excalidraw → 550e8400-e29b-41d4-a716-446655440000.excalidraw

📝 New metadata entries to add:
  + 550e8400-e29b-41d4-a716-446655440000: "my-drawing" (created: 2025-01-27T...)
  + 6ba7b810-9dad-11d1-80b4-00c04fd430c8: "imported-1706380800000" (created: 2025-01-27T...)

🗑️  Orphaned entries to remove:
  - 123e4567-e89b-12d3-a456-426614174000: "Old Drawing"

💡 This is a dry run. Use --execute to apply these changes.
```

**Note:** The script sets both `created_at` and `updated_at` to the current time for new entries. Titles follow the rules above - original filenames for renamed files, or `imported-{timestamp}` for files that already have UUID names.
