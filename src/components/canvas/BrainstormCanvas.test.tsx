import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import BrainstormCanvas from './BrainstormCanvas';
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

function renderCanvas() {
  return render(
    <ReactFlowProvider>
      <BrainstormCanvas />
    </ReactFlowProvider>
  );
}

describe('BrainstormCanvas', () => {
  it('renders the ReactFlow canvas', () => {
    renderCanvas();
    // ReactFlow renders a div.react-flow element
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  });

  it('renders without crashing when no project is selected', () => {
    renderCanvas();
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  });

  it('renders with project data loaded in store', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    renderCanvas();
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  });

  it('renders minimap and controls', () => {
    renderCanvas();
    // ReactFlow renders minimap and controls as child components
    const minimap = document.querySelector('.react-flow__minimap');
    const controls = document.querySelector('.react-flow__controls');
    expect(minimap).toBeInTheDocument();
    expect(controls).toBeInTheDocument();
  });

  it('renders the background dots', () => {
    renderCanvas();
    const background = document.querySelector('.react-flow__background');
    expect(background).toBeInTheDocument();
  });
});
