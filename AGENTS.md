# AGENTS.md

Guidance for coding agents working in this repository.

## Project Snapshot

- Stack: Next.js 16 (App Router), React 19, TypeScript (strict mode), lowdb.
- Purpose: Local/self-hosted Excalidraw server for creating, editing, listing, and deleting drawings.
- Storage model:
  - Drawing content: `<DRAWINGS_DIR>/<id>.excalidraw`
  - Metadata index: `<DRAWINGS_DIR>/metadata.json`

## Setup and Commands

- Install: `npm install`
- Dev server: `npm run dev` (port `9876`)
- Lint: `npm run lint`
- Format: `npm run format` / `npm run format:check`
- Build standalone bundle: `npm run build`
- Start production: `npm run start`
- Rebuild metadata (dry-run by default): `npm run rebuild-metadata`
- Rebuild metadata (write changes): `npm run rebuild-metadata -- --execute`

## Environment

- Required: `DRAWINGS_DIR` in `.env`
- Optional: `HOST` (default `127.0.0.1`), `PORT` (default `9876`)
- `lib/env.ts` validates and resolves `DRAWINGS_DIR` at runtime; missing/empty values are fatal.

## Important Code Areas

- API routes:
  - `app/api/drawings/route.ts` (`GET` list + pagination/search, `POST` create)
  - `app/api/drawings/[id]/route.ts` (`GET`, `PUT`, `DELETE`)
- Core drawing/data logic: `lib/drawings.ts`, `lib/db.ts`
- Validation and API helpers: `lib/validation.ts`, `lib/apiHelpers.ts`
- Types/contracts: `lib/types.ts`
- Client drawing lifecycle: `hooks/useDrawing.ts`
- UI pages:
  - Home/list: `app/page.tsx` + `components/DrawingsList.tsx`
  - Editor: `app/drawing/[id]/page.tsx` + `components/Toolbar.tsx`

## Conventions to Preserve

- Validate all drawing IDs via existing helpers (`validateDrawingId` / `isValidDrawingId`) before file operations.
- Keep API responses consistent with shared types in `lib/types.ts`.
- Route errors should use `createErrorResponse()` and `ERROR_MESSAGES`.
- Excalidraw is loaded client-side only (dynamic import with `ssr: false`); preserve that pattern.
- Keep list pagination/search behavior server-driven (`page`, `limit`, `search` query params).
- Preserve no-cache behavior on drawing list fetches (`revalidate = 0`, cache-control headers, no-store fetch).

## Data Integrity Notes

- `saveDrawing()` writes both drawing file and metadata upsert; changes to save flow must keep both in sync.
- `scripts/rebuild-metadata.js` is the recovery path for mismatched files/metadata; avoid breaking its assumptions:
  - `.excalidraw` files are canonical for scan/rebuild.
  - IDs are normalized to UUID v4 filenames.

## If You Make Changes

- Run at least `npm run lint`.
- If formatting is affected, run `npm run format:check` (or `npm run format`).
- Update `README.md` when changing setup, env vars, API behavior, or scripts.
