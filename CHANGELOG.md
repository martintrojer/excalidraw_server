# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
