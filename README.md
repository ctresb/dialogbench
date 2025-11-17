<div align="center">
  <img src="https://dialogbench.com/logo.png" alt="Dialog Bench Logo" width="200"/>
  
  
  [![Live Demo](https://img.shields.io/badge/demo-dialogbench.com-blue?style=for-the-badge)](https://dialogbench.com)
  [![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
  
  **A beautiful, intuitive visual editor for creating and managing dialogue trees and conversation flows.**
  
  [Try it Now](https://dialogbench.com) | [Report Bug](https://github.com/ctresb/dialogbench/issues) | [Request Feature](https://github.com/ctresb/dialogbench/issues)
</div>

---

## Features

- **Visual Node-Based Editor** - Create dialogue flows with an intuitive drag-and-drop interface
- **Multi-language Support** - Available in Portuguese, Spanish, English, Japanese, and Chinese
- **Import/Export** - Save and load your dialogue trees as JSON files
- **Smart Connections** - Visually connect dialogue blocks with response options
- **Grid Snapping** - Precise block positioning with optional grid snapping
- **Custom Variables** - Add custom key-value pairs to dialogue blocks
- **Color Coding** - Organize responses and variables with custom colors
- **Keyboard Shortcuts** - Fast workflow with keyboard navigation
- **Auto-save** - Never lose your work with automatic local storage
- **Zoom & Pan** - Navigate large dialogue trees with ease

## Getting Started

### Try it Online

Visit [dialogbench.com](https://dialogbench.com) to start creating dialogue trees immediately - no installation required!

### Run Locally

1. Clone the repository:
```bash
git clone https://github.com/ctresb/dialogbench.git
cd dialogue_editor
```

2. Open `index.html` in your browser:
```bash
open index.html
```

That's it! No build process or dependencies needed.

## How to Use

1. **Create Blocks** - Click "Novo Bloco" (New Block) to add dialogue nodes
2. **Edit Content** - Click on text areas to edit dialogue lines
3. **Add Responses** - Click the `+` button in the responses section to add player choices
4. **Connect Blocks** - Link responses to other dialogue blocks
5. **Add Variables** - Add custom key-value pairs for game state or metadata
6. **Save Your Work** - Export as JSON or let auto-save handle it locally

### Keyboard Shortcuts

- `Shift + N` - Create new dialogue block
- `Shift + Enter` - Add new line in dialogue (while editing)
- `Backspace` (on empty line) - Delete current line

## Translations

Dialog Bench supports multiple languages:

- **Português** (Portuguese)
- **Español** (Spanish)
- **English**
- **日本語** (Japanese)
- **中文** (Chinese)

Want to add your language? See [Contributing](#-contributing) below!

## Tech Stack

- **Vanilla JavaScript** - No frameworks, pure JS for maximum performance
- **CSS3** - Modern styling with gradients and animations
- **SVG** - Smooth connection lines between blocks
- **LocalStorage** - Auto-save functionality
- **JSON** - Simple import/export format

## Roadmap

### Upcoming Features

- [ ] **Boards System** - Work on multiple dialogue files simultaneously with a board/project management system
- [ ] **Different Block Types** - Support for various block types:
  - Image blocks for visual references
  - Condition blocks for branching logic
  - Event blocks for triggering game actions
  - Note blocks for documentation
- [ ] **Advanced Search** - Find and filter dialogue blocks
- [ ] **Undo/Redo** - Full history management
- [ ] **Collaboration Mode** - Real-time collaborative editing
- [ ] **Templates** - Pre-built dialogue templates
- [ ] **Export Formats** - Support for various game engines (Unity, Godot, Unreal)
- [ ] **Dark/Light Themes** - Customizable appearance
- [ ] **Dialogue Testing** - Preview and test conversation flows
- [ ] **Character Management** - Assign speakers to dialogue blocks
- [ ] **Branching Analytics** - Visualize dialogue complexity and paths

## Contributing

We love contributions! Dialog Bench is open-source and community-driven.

### Ways to Contribute

1. **Add Translations**
   - Edit `locales.json` to add your language
   - Follow the existing structure for consistency
   - Test thoroughly before submitting

2. **Report Bugs**
   - Open an issue with detailed reproduction steps
   - Include browser version and OS information

3. **Suggest Features**
   - Open an issue with your feature idea
   - Explain the use case and benefits

4. **Code Contributions**
   - Fork the repository
   - Create a feature branch (`git checkout -b feature/amazing-feature`)
   - Commit your changes (`git commit -m 'Add amazing feature'`)
   - Push to the branch (`git push origin feature/amazing-feature`)
   - Open a Pull Request

### Translation Guidelines

To add a new language:

1. Add flag icon to `/icons/` folder (24x16px PNG)
2. Add locale entry in `locales.json`
3. Add language option in `index.html` language dropdown
4. Test all UI elements in the new language

## Project Structure

```
dialogue_editor/
├── index.html          # Main HTML file
├── style.css           # Styles and animations
├── script.js           # Entry point
├── locales.json        # Translation strings
├── icons/              # Flag icons for languages
└── scripts/
    ├── main.js         # App initialization
    ├── blocks.js       # Block management
    ├── canvas.js       # Canvas and zoom controls
    ├── connections.js  # Visual connections between blocks
    ├── modals.js       # Modal dialogs
    ├── storage.js      # Save/load functionality
    ├── i18n.js         # Internationalization
    ├── state.js        # Application state
    ├── dom.js          # DOM element references
    ├── autocomplete.js # Search/autocomplete
    ├── toast.js        # Notifications
    ├── modal.js        # Confirmation modals
    └── utils.js        # Utility functions
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for game developers, writers, and storytellers
- Inspired by the need for a simple, accessible dialogue editor
- Thanks to all contributors who help make this project better

## Contact & Support

- Website: [dialogbench.com](https://dialogbench.com)
- Issues: [GitHub Issues](https://github.com/ctresb/dialogbench/issues)
- Discussions: [GitHub Discussions](https://github.com/ctresb/dialogbench/discussions)

---

<div align="center">
  Made with ❤️ in Brasil.
  
  Star us on GitHub if you find this project useful!
</div>
