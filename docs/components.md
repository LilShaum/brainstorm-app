# Component Reference

This document describes all components, their props, responsibilities, and usage.

## Canvas Components

### BrainstormCanvas

**File:** `src/components/canvas/BrainstormCanvas.tsx`

The root canvas component. Wraps everything in a `ReactFlowProvider` and orchestrates all canvas-related interactions.

**Responsibilities:**
- Renders the React Flow canvas with custom node and edge types
- Manages context menu state and modal visibility
- Handles canvas double-click for node creation
- Connects `useCanvas` and `useKeyboardShortcuts` hooks

**Key Behavior:**
- Double-click on canvas (not on a node) adds a new node at that position
- Right-click on a node opens the context menu
- The `CanvasToolbar` is rendered as a React Flow panel at the top center

---

### IdeaNode

**File:** `src/components/canvas/IdeaNode.tsx`

Custom React Flow node type for brainstorm ideas.

**Props (via React Flow `NodeProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `data.brainstormNode` | `BrainstormNode` | The underlying node data |
| `data.isEditing` | `boolean` | Whether the node is in edit mode |
| `data.onStartEdit` | `() => void` | Callback to enter edit mode |
| `data.onStopEdit` | `() => void` | Callback to exit edit mode |
| `data.onDelete` | `() => void` | Callback to delete the node |
| `data.onUpdateColor` | `(color: string) => void` | Callback to change node color |
| `data.onUpdateText` | `(text: string) => void` | Callback to update node text |
| `data.projectColor` | `string` | The parent project's theme color |
| `selected` | `boolean` | Whether the node is selected |

**Visual Variants:**

| Shape | CSS Class | Description |
|-------|-----------|-------------|
| `circle` | `rounded-full` | Fully circular node |
| `rounded` | `rounded-xl` | Rounded rectangle |
| `square` | `rounded-md` | Slightly rounded square |

| Size | Min Width | Min Height | Padding | Font |
|------|-----------|------------|---------|------|
| `small` | 80px | 60px | 8px | xs |
| `medium` | 120px | 80px | 12px | sm |
| `large` | 180px | 120px | 16px | base |

**Interaction:**
- **Double-click**: Enter inline text editing
- **Hover**: Show color picker button and delete button
- **Drag**: Move node on canvas
- **Handle (top/bottom)**: Drag to create connections

---

### IdeaEdge

**File:** `src/components/canvas/IdeaEdge.tsx`

Custom React Flow edge type for connections between nodes.

**Props (via React Flow `EdgeProps`):**

| Prop | Type | Description |
|------|------|-------------|
| `data.label` | `string \| undefined` | Optional edge label |
| `data.onDelete` | `(id: string) => void` | Callback to delete the edge |
| `data.onLabelChange` | `(id: string, label: string) => void` | Callback to update label |
| `selected` | `boolean` | Whether the edge is selected |

**Interaction:**
- **Hover**: Show delete button at midpoint and "+" button to add label
- **Double-click label**: Edit existing label
- **Click "+":** Open inline label editor

---

### CanvasControls

**File:** `src/components/canvas/CanvasControls.tsx`

Overlay controls rendered as React Flow panels.

**Panels:**
- **Top-left**: "Add Idea" button and "Fit View" button
- **Top-right**: Auto-save indicator (saving/saved/not saved)
- **Bottom-center**: Current project name with color dot

---

### ContextMenu

**File:** `src/components/canvas/ContextMenu.tsx`

A keyboard-accessible context menu for right-click actions.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `x` | `number` | Horizontal position (pixels) |
| `y` | `number` | Vertical position (pixels) |
| `items` | `ContextMenuItem[]` | Menu items to display |
| `onClose` | `() => void` | Callback to close the menu |

**ContextMenuItem:**

```typescript
interface ContextMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;  // Red styling for destructive actions
}
```

**Keyboard Navigation:**
- Arrow Up/Down: Navigate items
- Enter/Space: Activate item
- Escape: Close menu
- Tab/Shift+Tab: Cycle through items (focus trapped)

---

## Sidebar Components

### ProjectSidebar

**File:** `src/components/sidebar/ProjectSidebar.tsx`

Main sidebar container managing project CRUD operations.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `isCollapsed` | `boolean` | Whether sidebar is collapsed |
| `onToggleCollapse` | `() => void` | Toggle collapse state |
| `isDarkMode` | `boolean` | Current dark mode state |
| `onToggleDarkMode` | `() => void` | Toggle dark mode |

**Features:**
- Collapsible with smooth width transition (280px → 0)
- Dark mode toggle in footer
- Delete confirmation modal with warning text
- Create project modal triggered from header

---

### SidebarHeader

**File:** `src/components/sidebar/SidebarHeader.tsx`

Header bar with "Projects" title, new project button, and collapse toggle.

---

### ProjectList

**File:** `src/components/sidebar/ProjectList.tsx`

Displays all projects with search filtering.

**Features:**
- Search input filters projects by name or description
- Shows node count per project
- Empty state with illustration when no projects exist
- "No results" state when search has no matches

---

### ProjectItem

**File:** `src/components/sidebar/ProjectItem.tsx`

Individual project card in the list.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `projectId` | `string` | Project identifier |
| `name` | `string` | Project name |
| `color` | `string` | Project theme color |
| `updatedAt` | `Date` | Last modification time |
| `isActive` | `boolean` | Whether this is the current project |
| `nodeCount` | `number` | Number of nodes in the project |
| `onSwitch` | `() => void` | Switch to this project |
| `onDelete` | `() => void` | Request project deletion |
| `onDuplicate` | `() => void` | Duplicate this project |

**Features:**
- Color indicator dot
- Inline rename (via three-dot menu → Rename)
- Three-dot menu with Rename, Duplicate, Delete actions
- Active state highlighting

---

### CreateProjectModal

**File:** `src/components/sidebar/CreateProjectModal.tsx`

Modal form for creating a new project.

**Fields:**
- Project name (required, max 100 chars)
- Description (optional, max 300 chars)
- Color theme (10 preset colors + custom picker)

---

## Toolbar Components

### CanvasToolbar

**File:** `src/components/toolbar/CanvasToolbar.tsx`

Top-center toolbar rendered as a React Flow panel.

**Features:**
- Current project name with color indicator
- Undo/Redo buttons with keyboard shortcut labels
- Zoom in/out with percentage display
- "Add Node" button
- Keyboard shortcuts tooltip trigger
- Save indicator (saving/saved/not saved)

**Keyboard Shortcuts (registered here):**
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Redo
- `Ctrl+Y` / `Cmd+Y`: Redo (alternative)

---

### AddNodeModal

**File:** `src/components/toolbar/AddNodeModal.tsx`

Modal form for creating a new node with full customization.

**Fields:**
- Text (textarea, max 200 chars, defaults to "New idea")
- Color (10-color palette + custom picker)
- Shape (circle, rounded, square)
- Size (S, M, L)

**Positioning:** Appears at the double-click location, clamped to viewport bounds.

---

### EditNodeModal

**File:** `src/components/toolbar/EditNodeModal.tsx`

Modal form for editing an existing node's properties.

**Same fields as AddNodeModal**, pre-populated with the node's current values.

---

### KeyboardShortcutsTooltip

**File:** `src/components/toolbar/KeyboardShortcutsTooltip.tsx`

Popover tooltip displaying all available keyboard shortcuts.

**Shortcuts Listed:**

| Shortcut | Action |
|----------|--------|
| Double-click | Add new node |
| Enter | Edit selected node |
| Delete / Backspace | Delete selected |
| Escape | Stop editing / Deselect |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Right-click | Context menu |
| Shift+Click | Multi-select nodes |

---

## UI Primitives (`src/components/ui/`)

### Button

Versatile button component with variants and sizes.

**Variants:** `primary`, `secondary`, `ghost`, `danger`
**Sizes:** `sm`, `md` (default), `lg`

### Modal

Accessible modal dialog with backdrop, keyboard dismissal, and focus trapping.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls visibility |
| `onClose` | `() => void` | Close callback |
| `title` | `string` | Modal heading |
| `size` | `'sm' \| 'md' \| 'lg'` | Width preset |
| `showCloseButton` | `boolean` | Show/hide X button |
| `children` | `ReactNode` | Modal content |

### Input

Text input with label, error state, and consistent styling.

### Select

Native select element styled to match the design system.

### ColorPicker

Color selection with preset palette and custom color input.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Field label |
| `value` | `string` | Current color |
| `onChange` | `(color: string) => void` | Change callback |
| `presetColors` | `string[]` | Array of hex colors |

### Tooltip

Hover tooltip for additional information.

### Spinner

Loading spinner component.

### Icon

SVG icon component with named exports:

`PlusIcon`, `CloseIcon`, `ChevronRightIcon`, `ChevronDownIcon`, `SunIcon`, `MoonIcon`, `TrashIcon`, `CopyIcon`, `UndoIcon`, `RedoIcon`, `ZoomInIcon`, `ZoomOutIcon`, `KeyboardIcon`, `MenuIcon`, `InfoIcon`
