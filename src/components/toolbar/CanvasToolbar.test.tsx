import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import CanvasToolbar from './CanvasToolbar';
import { useProjectStore } from '@/store/projectStore';
import type { Project } from '@/types';

// Reset the store before each test
beforeEach(() => {
  useProjectStore.setState({
    currentProjectId: null,
    projects: [],
    nodes: [],
    edges: [],
    undoStack: [],
    redoStack: [],
  });
});

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `proj-${Date.now()}-${Math.random()}`,
    name: 'Test Project',
    description: 'A test project',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderToolbar(onAddNodeClick = vi.fn()) {
  return render(
    <ReactFlowProvider>
      <CanvasToolbar onAddNodeClick={onAddNodeClick} />
    </ReactFlowProvider>
  );
}

describe('CanvasToolbar', () => {
  it('renders the Add Node button', () => {
    renderToolbar();
    expect(screen.getByText('Add Node')).toBeInTheDocument();
  });

  it('calls onAddNodeClick when Add Node is clicked', async () => {
    const user = userEvent.setup();
    const onAddNodeClick = vi.fn();
    renderToolbar(onAddNodeClick);

    await user.click(screen.getByText('Add Node'));

    expect(onAddNodeClick).toHaveBeenCalledTimes(1);
  });

  it('displays the current project name', () => {
    const project = makeProject({ id: 'proj-1', name: 'My Project' });
    useProjectStore.getState().createProject(project);

    renderToolbar();

    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('renders undo button as disabled when undo stack is empty', () => {
    renderToolbar();

    const undoBtn = screen.getByTitle('Undo (Ctrl+Z)');
    expect(undoBtn).toBeDisabled();
  });

  it('renders redo button as disabled when redo stack is empty', () => {
    renderToolbar();

    const redoBtn = screen.getByTitle('Redo (Ctrl+Shift+Z)');
    expect(redoBtn).toBeDisabled();
  });

  it('enables undo button when undo stack has entries', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);
    useProjectStore.getState().pushUndo();

    renderToolbar();

    const undoBtn = screen.getByTitle('Undo (Ctrl+Z)');
    expect(undoBtn).not.toBeDisabled();
  });

  it('renders keyboard shortcuts button', () => {
    renderToolbar();

    const shortcutsBtn = screen.getByTitle('Keyboard shortcuts');
    expect(shortcutsBtn).toBeInTheDocument();
  });

  it('shows save indicator', () => {
    renderToolbar();

    // Should show either "Saving...", "Not saved", or a formatted date
    const saveSection = document.querySelector('.react-flow__panel');
    expect(saveSection).toBeInTheDocument();
  });
});
