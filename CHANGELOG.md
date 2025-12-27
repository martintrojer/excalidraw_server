# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-12-27

### Added

- **Metadata Rebuild Script**: New `rebuild-metadata` script to rebuild metadata database from `.excalidraw` files
  - Automatically renames non-UUID files to UUID format
  - Creates metadata entries for files missing from database
  - Removes orphaned database entries
  - Dry run mode by default with `--execute` flag to apply changes
  - Backs up database before making changes
  - Expands environment variables in `DRAWINGS_DIR` (e.g., `$HOME`, `${HOME}`)
- **Improved Error Handling**: Better error messages for non-existent drawings with troubleshooting guidance for `DRAWINGS_DIR` configuration

### Changed

- **Title Assignment Rules**: Metadata rebuild script follows strict title rules:
  - Files renamed to UUID: Use original filename as title
  - Files with existing UUID names: Use `imported-{timestamp}` as title
  - UUIDs are never used as titles in the database
- **Error Messages**: Enhanced "Drawing Not Found" error page with troubleshooting steps for `DRAWINGS_DIR` misconfiguration

### Technical

- Added `rebuild-metadata` npm script
- Environment variable expansion in rebuild script supports `$VAR`, `${VAR}`, and `${VAR:-default}` syntax
- Automatic UUID generation and file renaming for non-compliant filenames

## [0.2.1] - 2025-12-27

### Removed

- **Unused Error Classes**: Removed `lib/errors.ts` file containing unused error classes (`ValidationError`, `NotFoundError`, `InternalServerError`)
- **Unused Functions**: Removed `createButtonStyle()` and `disabledButtonStyle` from button styles
- **Unused Validation**: Removed `validateEnvironment()` function that only re-threw errors

### Changed

- **Performance**: Optimized `saveDrawing()` to reduce database operations from 3 to 1
- **Performance**: Replaced `loadDrawing()` with `fs.access()` in PUT route for faster existence checks
- **Code Quality**: Removed duplicate directory creation logic (consolidated into `getDatabase()`)
- **Code Quality**: Removed unnecessary host/port caching (env vars already cached by Node.js)
- **Code Quality**: Removed redundant validation checks in `saveDrawing()`

### Technical

- Consolidated directory creation to single source (`getDatabase()`)
- Simplified PUT route to only load metadata when needed
- Reduced redundant file system and database operations

## [0.2.0] - 2025-12-27

### Added

- **LowDB Database**: Metadata is now stored in a single LowDB database file (`metadata.json`) instead of individual `.meta.json` files
- **Server-side Pagination**: Drawings list now supports server-side pagination for better performance
- **Server-side Search**: Search functionality moved to server API with paginated results
- **Auto-refresh**: Drawings list automatically refreshes when returning to the page after editing

### Changed

- **Performance**: Significantly improved listing performance by using database instead of reading multiple files
- **Scalability**: Better handling of large numbers of drawings with pagination
- **Cache Strategy**: Updated caching to ensure fresh data after edits

### Technical

- Migrated from individual metadata files to LowDB database
- Added pagination support to API endpoints
- Improved frontend data fetching with cache-busting

## [0.1.0] - Initial Release

### Added

- Basic Excalidraw server functionality
- Local file storage for drawings
- Markdown link generation
- Dark theme interface
- Standalone build support
