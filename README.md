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
