# xdraw

Minimal Excalidraw file editor.

No database. No list page. One job only:

- open one `.excalidraw` file in system browser
- save back to same file
- create new file when needed

## Requirements

- Node.js 24+
- npm 11+ (bundled with Node 24)

## Install

From npm:

```bash
npm install -g @martintrojer/xdraw
```

## Use

Open existing file:

```bash
xdraw diagram.excalidraw
```

Create new file:

```bash
xdraw new sketch.excalidraw
```

Both commands launch the default browser and keep a tiny local Node.js server running for save/load.
By default, the server exits shortly after the opened browser tab is closed. Pass `--keep-alive` to keep it running:

```bash
xdraw --keep-alive diagram.excalidraw
```

## Develop

Install dependencies:

```bash
npm install
```

Build the browser bundle:

```bash
npm run build
```

Run directly without global install:

```bash
npm start -- diagram.excalidraw
```

Link the local checkout globally while developing:

```bash
npm install -g .
```

`npm install -g .` links the `xdraw` command globally to this local checkout. Re-run `npm run build` after frontend changes.

Typecheck and format:

```bash
npm run typecheck
npm run format:check
```

## Notes

- `Ctrl+S` / `Cmd+S` saves
- closing/reloading the tab warns when there are unsaved changes
- the local server exits after the browser tab closes unless `--keep-alive` is passed
- file path without extension gets `.excalidraw` added
- `new` fails if file already exists
- frontend assets are built into `dist/client` by Vite
- set `XDRAW_NO_OPEN=1` to skip browser launch during testing
