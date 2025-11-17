# Dialogue Editor - Modular Architecture

## Overview
The dialogue editor has been refactored into a clean, modular architecture for better maintainability and code organization.

## File Structure

```
dialogue_editor/
├── index.html              # Main HTML file
├── style.css              # Styles
├── script.js              # Entry point (loads main.js)
└── scripts/               # Modular scripts
    ├── state.js           # Global state management
    ├── dom.js             # DOM element references
    ├── canvas.js          # Canvas operations (drag, zoom, pan)
    ├── blocks.js          # Block creation and rendering
    ├── modals.js          # Modal dialogs management
    ├── connections.js     # SVG connection drawing
    ├── autocomplete.js    # Target autocomplete functionality
    ├── storage.js         # Data persistence (localStorage, JSON)
    ├── utils.js           # Helper functions (colors, toasts)
    └── main.js            # Application initialization
```

## Module Responsibilities

### `state.js`
- Manages all global application state
- Provides getters/setters for dialog data
- Handles dragging and editing state
- Centralized state access prevents coupling

### `dom.js`
- Centralizes all DOM element references
- Prevents repeated `getElementById` calls
- Improves performance and maintainability

### `canvas.js`
- Canvas dragging (panning)
- Zoom controls (in/out/reset/wheel)
- Block dragging functionality
- Transform calculations

### `blocks.js`
- Block creation and rendering
- Dialog line management
- Event listener setup for block interactions
- Copy, edit, delete operations

### `modals.js`
- Modal open/close operations
- Response and custom value management
- Form validation and submission
- Delete confirmations

### `connections.js`
- SVG path generation
- Connection line drawing
- Visual linking between blocks

### `autocomplete.js`
- Target selection autocomplete
- Block ID filtering and display
- Selection handling

### `storage.js`
- LocalStorage persistence
- JSON export/import
- Auto-save functionality

### `utils.js`
- Random color generation (HSL to Hex)
- Toast notifications
- Clipboard operations
- Reusable helper functions

### `main.js`
- Application initialization coordinator
- Module setup and orchestration
- Event listener registration
- Startup logic

## Benefits of Modular Structure

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Maintainability**: Changes to one feature don't affect others
3. **Testability**: Modules can be tested independently
4. **Readability**: Smaller files are easier to understand
5. **Reusability**: Functions can be imported where needed
6. **Scalability**: Easy to add new features without bloating existing code

## ES6 Modules

The application uses ES6 modules with `import`/`export` statements. The HTML file loads the entry point with:

```html
<script type="module" src="script.js"></script>
```

## Dependencies Between Modules

```
main.js
  ├── state.js
  ├── dom.js
  ├── canvas.js
  │   ├── state.js
  │   ├── dom.js
  │   ├── connections.js
  │   ├── storage.js
  │   └── blocks.js
  ├── blocks.js
  │   ├── state.js
  │   ├── dom.js
  │   ├── connections.js
  │   ├── storage.js
  │   ├── utils.js
  │   ├── canvas.js
  │   └── modals.js
  ├── modals.js
  │   ├── state.js
  │   ├── dom.js
  │   ├── blocks.js
  │   ├── connections.js
  │   ├── storage.js
  │   └── utils.js
  ├── connections.js
  │   ├── state.js
  │   └── dom.js
  ├── autocomplete.js
  │   └── state.js
  ├── storage.js
  │   ├── state.js
  │   ├── dom.js
  │   ├── blocks.js
  │   ├── canvas.js
  │   └── utils.js
  └── utils.js
      └── dom.js
```

## Development Notes

- All modules use strict ES6 syntax
- Event handlers are properly scoped to avoid memory leaks
- The state module prevents direct state mutation from other modules
- DOM elements are initialized once at startup for performance
