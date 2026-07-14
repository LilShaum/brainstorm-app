# Architecture

This document describes the system architecture, data flow, and design decisions of the Brainstorm App.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Application                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────┐   │
│  │  Sidebar  │   │   Canvas     │   │   Toolbar     │   │
│  │ (Projects)│   │ (React Flow) │   │ (Actions)     │   │
│  └─────┬────┘   └──────┬───────┘   └───────┬───────┘   │
│        │               │                   │            │
│        └───────────────┼───────────────────┘            │
│                        │                                │
│              ┌─────────▼─────────┐                      │
│              │   Zustand Store   │                      │
│              │  (projectStore)   │                      │
│              └─────────┬─────────┘                      │
│                        │                                │
│              ┌─────────▼─────────┐                      │
│              │  Persistence Layer│                      │
│              │  (Dexie/IndexedDB)│                      │
│              └───────────────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Data Model

### Core Types

The application manages three core entity types, all defined in `src/types/index.ts`:

#### Project
```typescript
interface Project {
  id: string;          // Unique identifier (timestamp + random)
  name: string;        // User-defined name
  description: string; // Optional description
  color: string;       // Hex color for theme
  createdAt: Date;     // Creation timestamp
  updatedAt: Date;     // Last modification timestamp
}
```

#### BrainstormNode
```typescript
interface BrainstormNode {
  id: string;          // Unique identifier
  projectId: string;   // Owning project
  text: string;        // Node content (max 200 chars)
  color: string;       // Hex background color
  shape: 'circle' | 'square' | 'rounded';  // Visual shape
  size: 'small' | 'medium' | 'large';      // Node size
  position: { x: number; y: number };       // Canvas position
  createdAt: Date;
  updatedAt: Date;
}
```

#### BrainstormEdge
```typescript
interface BrainstormEdge {
  id: string;          // Unique identifier
  projectId: string;   // Owning project
  source: string;      // Source node ID
  target: string;      // Target node ID
  label?: string;      // Optional edge label
  createdAt: Date;
  updatedAt: Date;
}
```

### Relationships

```
Project 1──* BrainstormNode
Project 1──* BrainstormEdge
BrainstormNode 1──* BrainstormEdge (source)
BrainstormNode 1──* BrainstormEdge (target)
```

Nodes and edges are scoped to a project. Switching projects filters the displayed entities. Deleting a project cascades to remove all its nodes and edges.

## State Management

### Zustand Store (`src/store/projectStore.ts`)

The Zustand store is the single source of truth for application state. It uses the `immer` middleware for immutable updates.

**State Shape:**
```typescript
interface ProjectStore extends AppState {
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  // ... all project, node, and edge actions
}
```

**Actions:**

| Category | Actions |
|----------|---------|
| Project | `createProject`, `deleteProject`, `switchProject`, `updateProject`, `duplicateProject` |
| Node | `addNode`, `updateNode`, `deleteNode`, `updateNodePosition` |
| Edge | `addEdge`, `updateEdge`, `deleteEdge` |
| Undo/Redo | `pushUndo`, `undo`, `redo`, `canUndo`, `canRedo` |
| State | `loadState`, `getCurrentNodes`, `getCurrentEdges` |

**Undo/Redo System:**

- Before any destructive action, `pushUndo()` snapshots the current state
- Maximum 50 undo levels (configurable via `MAX_UNDO`)
- Redo stack is cleared when a new undo entry is pushed
- Each snapshot clones all projects, nodes, and edges (deep copy)

### React Flow Integration (`src/hooks/useCanvas.ts`)

The `useCanvas` hook bridges the Zustand store with React Flow's node/edge model:

1. Converts `BrainstormNode[]` to React Flow `Node[]` with custom data props
2. Converts `BrainstormEdge[]` to React Flow `Edge[]` with custom data props
3. Syncs React Flow's `onNodesChange` and `onEdgesChange` back to the store
4. Manages selection state (`selectedNodeIds`, `selectedEdgeIds`)
5. Manages editing state (`editingNodeId`)
6. Triggers auto-save after mutations

**Data Flow:**

```
User Action
    │
    ▼
useCanvas hook
    │
    ├─► Zustand store (state mutation)
    │
    ├─► React Flow (visual update)
    │
    └─► scheduleSave (persistence)
```

## Persistence Layer

### Database (`src/store/db.ts`)

Uses Dexie.js (an IndexedDB wrapper) with four object stores:

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `projects` | `id` | `name`, `createdAt`, `updatedAt` | Project data |
| `nodes` | `id` | `projectId`, `createdAt`, `updatedAt` | Node data |
| `edges` | `id` | `projectId`, `source`, `target`, `createdAt`, `updatedAt` | Edge data |
| `meta` | `key` | — | Key-value metadata (e.g., last active project) |

### Auto-Save (`src/store/persistence.ts`)

- `scheduleSave()` debounces saves by 1 second
- `persistState()` performs a full sync within a single transaction:
  1. Delete any projects/nodes/edges not in the incoming state
  2. Bulk-put all incoming entities
  3. Store the current project ID in `meta`
- Dispatches `app:save-complete` event for UI feedback
- Supports multi-tab sync via `storage` events

### Data Serialization

Dates are serialized as numbers for IndexedDB storage:
- `ProjectRow`: `createdAt: number`, `updatedAt: number`
- `NodeRow`: `positionX: number`, `positionY: number` (flattened from `{x, y}`)
- Helper functions: `projectToRow`, `projectFromRow`, `nodeToRow`, `nodeFromRow`, `edgeToRow`, `edgeFromRow`

### Export/Import

- **Export single project**: `exportProject(projectId)` → `ExportedProject` JSON
- **Export all**: `exportAll()` → full bundle with version and timestamp
- **Import project**: `importProject(data)` → inserts into database
- **Import all**: `importAll(bundle)` → replaces entire database

## Component Architecture

### Layout

```
App
├── ProjectSidebar
│   ├── SidebarHeader (collapse + new project buttons)
│   ├── ProjectList (search + project items)
│   │   └── ProjectItem (per-project card with menu)
│   ├── Dark mode toggle
│   └── CreateProjectModal
│
└── BrainstormCanvas (wrapped in ReactFlowProvider)
    ├── ReactFlow
    │   ├── Background (dots pattern)
    │   ├── Controls (zoom controls)
    │   ├── MiniMap
    │   ├── CanvasToolbar (project name, undo/redo, zoom, add node)
    │   └── IdeaNode (custom node type)
    ├── ContextMenu (right-click)
    ├── AddNodeModal
    └── EditNodeModal
```

### Custom Node Type: IdeaNode

The `IdeaNode` component renders each brainstorm node with:

- **Shape**: CSS classes for circle (`rounded-full`), rounded (`rounded-xl`), square (`rounded-md`)
- **Size**: CSS classes for small/medium/large (min-width, padding, font-size)
- **Color**: Dynamic background with automatic contrast text color (luminance-based)
- **Handles**: Top (target) and bottom (source) connection points, visible on hover
- **Inline editing**: Double-click or Enter to edit text
- **Hover controls**: Color picker and delete button
- **Selection ring**: Primary color ring when selected

### Custom Edge Type: IdeaEdge

The `IdeaEdge` component renders connections with:

- **Bezier path**: Smooth curves between nodes
- **Label**: Click to add, double-click to edit
- **Delete button**: Appears at midpoint on hover
- **Selection state**: Stroke color and width change when selected

## Hooks

| Hook | Purpose |
|------|---------|
| `useCanvas` | Bridge between Zustand store and React Flow |
| `useKeyboardShortcuts` | Global keyboard event handling |
| `useDarkMode` | Dark mode state with system preference detection |
| `useLocalStorage` | Generic localStorage sync hook |

## Styling

### Tailwind CSS

- **Dark mode**: Class-based (`darkMode: 'class'`), toggled on `<html>` element
- **Custom tokens**: Colors, spacing, typography, shadows, animations defined in `tailwind.config.js`
- **Component classes**: Reusable classes defined in `globals.css` (`btn-primary`, `card`, `input`, etc.)

### Design System

- **Primary color**: Sky blue (`#0ea5e9`) with full shade range
- **Surface colors**: White for light, slate for dark mode
- **Shadows**: Soft (`shadow-soft`) and soft-lg (`shadow-soft-lg`) for depth
- **Border radius**: Custom `rounded-soft` (0.625rem)
- **Transitions**: Consistent 200ms duration with smooth easing

## Testing

- **Unit tests**: Zustand store actions (`projectStore.test.ts`)
- **Component tests**: Canvas behavior (`BrainstormCanvas.test.tsx`, `useCanvas.test.tsx`), sidebar (`ProjectSidebar.test.tsx`), toolbar (`CanvasToolbar.test.tsx`)
- **Test utilities**: `@testing-library/react` with `user-event` for interaction simulation
- **Coverage**: 61 tests covering core functionality

## Performance Considerations

- **Memoization**: `IdeaNode` and `IdeaEdge` are wrapped in `React.memo`
- **Debounced saves**: 1-second debounce prevents excessive IndexedDB writes
- **Virtualized lists**: React Flow handles rendering only visible nodes
- **Batch updates**: Zustand's immer middleware batches state changes within a single `set()` call
- **Lazy editing**: Editing state is managed in the hook, not persisted until confirmed
