# Frontend Architecture

The DevOps Ontology Workbench frontend has been modularized into a clean, maintainable structure:

## Module Structure

```
frontend/src/
├── main.ts              # Main application entry point and orchestration
├── types.ts             # TypeScript type definitions and interfaces
├── constants.ts         # Application constants (colors, configurations)
├── data-loader.ts       # TTL file parsing and data loading utilities
├── graph-visualization.ts # D3.js graph rendering and visualization logic
├── ui-components.ts     # UI components (legend, instructions, panels)
├── node-details.ts      # Node selection and details panel management
├── sparql-interface.ts  # Yasgui SPARQL query interface integration
├── event-handlers.ts    # Keyboard shortcuts and event handling
├── resize-handlers.ts   # Panel resizing and layout management
└── utils.ts             # Utility functions and helpers
```

## Key Benefits

- **Separation of Concerns**: Each module handles a specific aspect of the application
- **Type Safety**: Full TypeScript support with proper type definitions
- **Maintainability**: Smaller, focused files are easier to understand and modify
- **Reusability**: Modules can be imported and used independently
- **Testing**: Each module can be unit tested in isolation

## Module Responsibilities

### main.ts
- Application initialization and orchestration
- Component lifecycle management
- Global function exposure for HTML interaction
- State management coordination

### types.ts
- All TypeScript interfaces and type definitions
- Centralized type system for the entire application

### constants.ts
- Color schemes and styling constants
- Configuration values
- Default settings

### data-loader.ts
- TTL file parsing using N3.js
- RDF data processing and transformation
- Node and link data structure creation

### graph-visualization.ts
- D3.js force simulation setup
- SVG rendering and manipulation
- Node and link drawing
- Zoom and pan functionality

### ui-components.ts
- Legend component management
- Instructions panel
- General UI utilities

### node-details.ts
- Node selection handling
- Details panel content generation
- Property display and formatting

### sparql-interface.ts
- Yasgui integration
- SPARQL query execution
- Results handling

### event-handlers.ts
- Keyboard shortcut handling
- Global event management
- User interaction coordination

### resize-handlers.ts
- Panel resizing logic
- Layout calculations
- Responsive behavior

### utils.ts
- Common utility functions
- Helper methods
- Shared functionality

## Migration Notes

The original monolithic `script.ts` (1,352 lines) has been successfully broken down into 11 focused modules, each under 300 lines. The application maintains all original functionality while gaining significant improvements in:

- Code organization
- Type safety
- Development experience
- Maintainability
- Testing capabilities

## Build Integration

- Entry point updated from `script.ts` to `src/main.ts`
- Vite handles ES module bundling automatically
- TypeScript compilation is fully integrated
- Hot module replacement works in development mode
