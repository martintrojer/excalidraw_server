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
