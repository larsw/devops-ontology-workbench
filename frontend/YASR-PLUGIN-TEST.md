# YASR Plugin Test Page

This document describes the test page for YASR plugin development and testing.

## Overview

The test page (`test.html`) has been integrated into the frontend Vite build system and uses the NPM packages for Yasgui/Yasr instead of CDN dependencies.

## Location

- **Source**: `frontend/test.html` and `frontend/src/test-plugin.ts`
- **Built**: `frontend/dist/test.html` (served by backend at `/test.html`)

## Development

### Running in Development Mode

```bash
cd frontend
bun run dev
```

Then visit: http://localhost:3000/test.html

### Building for Production

```bash
cd frontend
bun run build
```

The built files will be available in `frontend/dist/` and served by the backend.

### Production Access

When the backend is running, visit: http://localhost:8000/test.html

## Features

The test page includes:

1. **YASR Plugin Testing**: A custom plugin implementation following the official YASR API
2. **NPM Package Integration**: Uses `@zazuko/yasgui`, `@zazuko/yasqe`, and `@zazuko/yasr` from package.json
3. **Vite Build System**: Full integration with the frontend build pipeline
4. **TypeScript Support**: The plugin logic is written in TypeScript
5. **Debug Logging**: Comprehensive logging panel for troubleshooting

## Test Functions

- **Test Basic Plugin**: Attempts to inject and activate the custom YASR plugin
- **Test CONSTRUCT Query**: Sets up a sample CONSTRUCT query
- **Test SELECT Query**: Sets up a sample SELECT query  
- **Reset Yasgui**: Reinitializes Yasgui if something breaks
- **Clear Log**: Clears the debug logging panel

## Plugin Implementation

The custom YASR plugin (`CustomTestPlugin`) implements the required methods:

- `constructor(yasr)`: Initialize the plugin instance
- `canHandleResults()`: Returns true to handle any query results
- `getIcon()`: Returns an emoji icon for the plugin tab
- `draw()`: Renders the custom result visualization

## Technical Details

### Dependencies

The test page uses these NPM packages (already in package.json):
- `@zazuko/yasgui@^4.5.0`
- `@zazuko/yasqe@^4.5.0` 
- `@zazuko/yasr@^4.5.0`

### Build Configuration

The `vite.config.ts` has been updated to:
- Support multi-page builds (main app + test page)
- Bundle Yasgui dependencies efficiently
- Generate both development and production builds

### Integration with Main App

The test page is completely separate from the main application but shares:
- The same SPARQL endpoint (`/sparql`)
- The same backend server
- The same NPM dependencies (efficient bundling)

## Usage for Plugin Development

1. Modify `frontend/src/test-plugin.ts` to experiment with plugin functionality
2. Use `bun run dev` for hot-reload development
3. Test plugin integration without affecting the main application
4. Build with `bun run build` when ready for production testing
