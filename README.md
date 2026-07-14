# Brainstorm App

A visual brainstorming and mind-mapping application built with React, TypeScript, and React Flow. Create, organize, and connect ideas on an infinite canvas with real-time persistence and a polished, accessible UI.

## Features

- **Project Management** - Create, switch between, duplicate, and delete projects
- **Visual Canvas** - Infinite canvas powered by React Flow with pan, zoom, and minimap
- **Custom Node Types** - Circle, rounded, and square shapes in three sizes (S/M/L)
- **Color Theming** - 10-color palette plus custom color picker per node and per project
- **Dark / Light Mode** - Respects system preference, toggleable in sidebar, persisted via localStorage
- **Auto-Save** - Debounced IndexedDB persistence (1 second) with visual save indicator
- **Undo / Redo** - Up to 50 levels of undo/redo with keyboard and toolbar support
- **Keyboard Shortcuts** - Full keyboard navigation for editing, deleting, and selection
- **Context Menus** - Right-click on nodes for quick actions (edit, duplicate, add child, delete)
- **Edge Labels** - Add and edit labels on connections between nodes
- **Multi-Select** - Shift+click to select multiple nodes for bulk operations
- **Export / Import** - JSON-based project export and import
- **Accessibility** - ARIA roles, keyboard navigation, focus management, and screen reader support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Language | TypeScript 5.5 |
| Build Tool | Vite 5.3 |
| Canvas | React Flow (@xyflow/react 12) |
| State | Zustand 4.5 + Immer |
| Styling | Tailwind CSS 3.4 |
| Persistence | Dexie.js 4.4 (IndexedDB) |
| Testing | Vitest + Testing Library |

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd brainstorm-app

# Install dependencies
npm install
```

### Development

```bash
# Start dev server (opens at http://localhost:3000)
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript type-checking (no emit) |
| `npm run lint` | Run ESLint with zero-warning policy |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run format` | Format source files with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run all tests once |

## Usage

### Creating a Project

1. Click the **+** button in the sidebar header
2. Enter a project name and optional description
3. Choose a color theme from the palette
4. Click **Create Project**

### Adding Ideas

- **Double-click** anywhere on the canvas to add a node at that position
- Click the **Add Node** button in the toolbar to open the node creation modal
- In the modal, set the text, color, shape, and size before creating

### Editing Nodes

- **Double-click** a node to edit its text inline
- Press **Enter** on a selected node to start editing
- Press **Escape** to cancel editing
- Hover over a node to see the **color picker** and **delete** buttons

### Connecting Ideas

- Drag from a node's bottom handle to another node's top handle to create an edge
- Hover over an edge to see the **delete** button or click the **+** button to add a label
- Double-click an existing label to edit it

### Right-Click Context Menu

Right-click on any node to access:
- **Edit** - Opens the full edit modal
- **Duplicate** - Creates a copy of the node
- **Add Child** - Creates a connected child node below
- **Delete** - Removes the node and its connections

### Keyboard Shortcuts

See [docs/keyboard-shortcuts.md](docs/keyboard-shortcuts.md) for the complete reference.

### Switching Projects

Click any project in the sidebar to switch to it. Use the search bar to filter projects by name or description.

### Dark Mode

Toggle between dark and light mode using the button in the sidebar footer. The setting is persisted across sessions and respects your system preference by default.

## Project Structure

```
brainstorm-app/
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── canvas/            # Canvas and node components
│   │   ├── sidebar/           # Project sidebar components
│   │   ├── toolbar/           # Toolbar and modal components
│   │   └── ui/                # Reusable UI primitives
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Zustand store and persistence
│   ├── styles/                # Global CSS (Tailwind)
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Root component
│   └── main.tsx               # Entry point
├── docs/                      # Documentation
├── index.html                 # HTML entry
├── tailwind.config.js         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite configuration
└── vitest.config.ts           # Vitest configuration
```

## Documentation

- [Architecture](docs/architecture.md) - System design, data flow, and state management
- [Components](docs/components.md) - Component API reference and responsibilities
- [Keyboard Shortcuts](docs/keyboard-shortcuts.md) - Complete keyboard shortcut reference
- [Deployment](docs/deployment.md) - Build and deployment instructions

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT
