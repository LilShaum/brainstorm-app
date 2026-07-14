import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from './projectStore';
import type { Project, BrainstormNode, BrainstormEdge } from '@/types';

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

// ---- Factories ----

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

function makeNode(overrides: Partial<BrainstormNode> = {}): BrainstormNode {
  return {
    id: `node-${Date.now()}-${Math.random()}`,
    projectId: 'proj-1',
    text: 'Test Node',
    color: '#ef4444',
    shape: 'rounded',
    size: 'medium',
    position: { x: 100, y: 100 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeEdge(overrides: Partial<BrainstormEdge> = {}): BrainstormEdge {
  return {
    id: `edge-${Date.now()}-${Math.random()}`,
    projectId: 'proj-1',
    source: 'node-1',
    target: 'node-2',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ===========================================
// Project actions
// ===========================================

describe('Project Actions', () => {
  describe('createProject', () => {
    it('adds a project and sets it as current', () => {
      const project = makeProject({ id: 'proj-1' });
      useProjectStore.getState().createProject(project);

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBe('proj-1');
      expect(state.currentProjectId).toBe('proj-1');
    });

    it('can create multiple projects', () => {
      const p1 = makeProject({ id: 'proj-1', name: 'P1' });
      const p2 = makeProject({ id: 'proj-2', name: 'P2' });

      useProjectStore.getState().createProject(p1);
      useProjectStore.getState().createProject(p2);

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(2);
      // Last created is current
      expect(state.currentProjectId).toBe('proj-2');
    });
  });

  describe('deleteProject', () => {
    it('removes the project and its nodes/edges', () => {
      const project = makeProject({ id: 'proj-1' });
      useProjectStore.getState().createProject(project);

      const node = makeNode({ id: 'n1', projectId: 'proj-1' });
      useProjectStore.getState().addNode(node);

      const edge = makeEdge({ id: 'e1', projectId: 'proj-1', source: 'n1', target: 'n1' });
      useProjectStore.getState().addEdge(edge);

      useProjectStore.getState().deleteProject('proj-1');

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.nodes).toHaveLength(0);
      expect(state.edges).toHaveLength(0);
      expect(state.currentProjectId).toBeNull();
    });

    it('falls back to first remaining project when current is deleted', () => {
      const p1 = makeProject({ id: 'proj-1' });
      const p2 = makeProject({ id: 'proj-2' });
      useProjectStore.getState().createProject(p1);
      useProjectStore.getState().createProject(p2);

      useProjectStore.getState().deleteProject('proj-2');

      const state = useProjectStore.getState();
      expect(state.currentProjectId).toBe('proj-1');
    });
  });

  describe('switchProject', () => {
    it('switches currentProjectId', () => {
      const p1 = makeProject({ id: 'proj-1' });
      const p2 = makeProject({ id: 'proj-2' });
      useProjectStore.getState().createProject(p1);
      useProjectStore.getState().createProject(p2);

      useProjectStore.getState().switchProject('proj-1');
      expect(useProjectStore.getState().currentProjectId).toBe('proj-1');
    });
  });

  describe('updateProject', () => {
    it('updates project fields and updatedAt', () => {
      const project = makeProject({ id: 'proj-1', name: 'Old Name' });
      useProjectStore.getState().createProject(project);

      const before = useProjectStore.getState().projects[0].updatedAt;
      useProjectStore.getState().updateProject('proj-1', { name: 'New Name' });

      const updated = useProjectStore.getState().projects[0];
      expect(updated.name).toBe('New Name');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('does nothing if project not found', () => {
      useProjectStore.getState().updateProject('nonexistent', { name: 'X' });
      expect(useProjectStore.getState().projects).toHaveLength(0);
    });
  });

  describe('duplicateProject', () => {
    it('creates a copy with mapped nodes and edges', () => {
      const p1 = makeProject({ id: 'proj-1', name: 'Original' });
      useProjectStore.getState().createProject(p1);

      const n1 = makeNode({ id: 'n1', projectId: 'proj-1' });
      const n2 = makeNode({ id: 'n2', projectId: 'proj-1' });
      useProjectStore.getState().addNode(n1);
      useProjectStore.getState().addNode(n2);

      const e1 = makeEdge({ id: 'e1', projectId: 'proj-1', source: 'n1', target: 'n2' });
      useProjectStore.getState().addEdge(e1);

      const newProject = useProjectStore.getState().duplicateProject('proj-1');

      expect(newProject).not.toBeNull();
      expect(newProject!.name).toBe('Original (copy)');

      const state = useProjectStore.getState();
      expect(state.projects).toHaveLength(2);
      // Should have 4 nodes total (2 original + 2 duplicates)
      expect(state.nodes).toHaveLength(4);
      // Should have 2 edges total (1 original + 1 duplicate)
      expect(state.edges).toHaveLength(2);

      // New nodes should reference new project ID
      const newNodes = state.nodes.filter((n) => n.projectId === newProject!.id);
      expect(newNodes).toHaveLength(2);

      // New edges should reference new node IDs
      const newEdges = state.edges.filter((e) => e.projectId === newProject!.id);
      expect(newEdges).toHaveLength(1);
      expect(newEdges[0].source).not.toBe('n1');
      expect(newEdges[0].target).not.toBe('n2');
    });

    it('returns null if project not found', () => {
      const result = useProjectStore.getState().duplicateProject('nonexistent');
      expect(result).toBeNull();
    });
  });
});

// ===========================================
// Node actions
// ===========================================

describe('Node Actions', () => {
  describe('addNode', () => {
    it('adds a node to the store', () => {
      const node = makeNode({ id: 'n1' });
      useProjectStore.getState().addNode(node);

      expect(useProjectStore.getState().nodes).toHaveLength(1);
      expect(useProjectStore.getState().nodes[0].id).toBe('n1');
    });
  });

  describe('updateNode', () => {
    it('updates node fields and updatedAt', () => {
      const node = makeNode({ id: 'n1', text: 'Old' });
      useProjectStore.getState().addNode(node);

      const before = useProjectStore.getState().nodes[0].updatedAt;
      useProjectStore.getState().updateNode('n1', { text: 'New' });

      const updated = useProjectStore.getState().nodes[0];
      expect(updated.text).toBe('New');
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });

    it('does nothing if node not found', () => {
      useProjectStore.getState().updateNode('nonexistent', { text: 'X' });
      expect(useProjectStore.getState().nodes).toHaveLength(0);
    });
  });

  describe('deleteNode', () => {
    it('removes the node and associated edges', () => {
      const n1 = makeNode({ id: 'n1' });
      const n2 = makeNode({ id: 'n2' });
      useProjectStore.getState().addNode(n1);
      useProjectStore.getState().addNode(n2);

      const e1 = makeEdge({ id: 'e1', source: 'n1', target: 'n2' });
      const e2 = makeEdge({ id: 'e2', source: 'n2', target: 'n1' });
      useProjectStore.getState().addEdge(e1);
      useProjectStore.getState().addEdge(e2);

      useProjectStore.getState().deleteNode('n1');

      expect(useProjectStore.getState().nodes).toHaveLength(1);
      expect(useProjectStore.getState().nodes[0].id).toBe('n2');
      // Both edges reference n1 so both should be gone
      expect(useProjectStore.getState().edges).toHaveLength(0);
    });
  });

  describe('updateNodePosition', () => {
    it('updates only the position of a node', () => {
      const node = makeNode({ id: 'n1', position: { x: 0, y: 0 } });
      useProjectStore.getState().addNode(node);

      useProjectStore.getState().updateNodePosition('n1', { x: 200, y: 300 });

      const updated = useProjectStore.getState().nodes[0];
      expect(updated.position).toEqual({ x: 200, y: 300 });
      expect(updated.text).toBe('Test Node'); // unchanged
    });
  });
});

// ===========================================
// Edge actions
// ===========================================

describe('Edge Actions', () => {
  describe('addEdge', () => {
    it('adds an edge to the store', () => {
      const edge = makeEdge({ id: 'e1' });
      useProjectStore.getState().addEdge(edge);

      expect(useProjectStore.getState().edges).toHaveLength(1);
      expect(useProjectStore.getState().edges[0].id).toBe('e1');
    });
  });

  describe('deleteEdge', () => {
    it('removes only the specified edge', () => {
      const e1 = makeEdge({ id: 'e1' });
      const e2 = makeEdge({ id: 'e2' });
      useProjectStore.getState().addEdge(e1);
      useProjectStore.getState().addEdge(e2);

      useProjectStore.getState().deleteEdge('e1');

      expect(useProjectStore.getState().edges).toHaveLength(1);
      expect(useProjectStore.getState().edges[0].id).toBe('e2');
    });
  });
});

// ===========================================
// State queries
// ===========================================

describe('State Queries', () => {
  describe('getCurrentNodes', () => {
    it('returns only nodes belonging to the current project', () => {
      const p1 = makeProject({ id: 'proj-1' });
      const p2 = makeProject({ id: 'proj-2' });
      useProjectStore.getState().createProject(p1);
      useProjectStore.getState().createProject(p2);

      // After creating p2, current is p2; switch to p1
      useProjectStore.getState().switchProject('proj-1');

      useProjectStore.getState().addNode(makeNode({ id: 'n1', projectId: 'proj-1' }));
      useProjectStore.getState().addNode(makeNode({ id: 'n2', projectId: 'proj-2' }));
      useProjectStore.getState().addNode(makeNode({ id: 'n3', projectId: 'proj-1' }));

      const nodes = useProjectStore.getState().getCurrentNodes();
      expect(nodes).toHaveLength(2);
      expect(nodes.map((n) => n.id).sort()).toEqual(['n1', 'n3']);
    });
  });

  describe('getCurrentEdges', () => {
    it('returns only edges belonging to the current project', () => {
      const p1 = makeProject({ id: 'proj-1' });
      const p2 = makeProject({ id: 'proj-2' });
      useProjectStore.getState().createProject(p1);
      useProjectStore.getState().createProject(p2);

      // After creating p2, current is p2; switch to p1
      useProjectStore.getState().switchProject('proj-1');

      useProjectStore.getState().addEdge(makeEdge({ id: 'e1', projectId: 'proj-1' }));
      useProjectStore.getState().addEdge(makeEdge({ id: 'e2', projectId: 'proj-2' }));

      const edges = useProjectStore.getState().getCurrentEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].id).toBe('e1');
    });
  });
});

// ===========================================
// Undo / Redo
// ===========================================

describe('Undo/Redo', () => {
  it('undo restores the previous state', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    // Push undo before adding node
    useProjectStore.getState().pushUndo();
    useProjectStore.getState().addNode(makeNode({ id: 'n1' }));

    expect(useProjectStore.getState().nodes).toHaveLength(1);

    useProjectStore.getState().undo();

    expect(useProjectStore.getState().nodes).toHaveLength(0);
    expect(useProjectStore.getState().undoStack).toHaveLength(0);
    expect(useProjectStore.getState().redoStack).toHaveLength(1);
  });

  it('redo restores after undo', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    useProjectStore.getState().pushUndo();
    useProjectStore.getState().addNode(makeNode({ id: 'n1' }));

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().nodes).toHaveLength(0);

    useProjectStore.getState().redo();
    expect(useProjectStore.getState().nodes).toHaveLength(1);
  });

  it('canUndo and canRedo reflect stack state', () => {
    expect(useProjectStore.getState().canUndo()).toBe(false);
    expect(useProjectStore.getState().canRedo()).toBe(false);

    useProjectStore.getState().pushUndo();
    expect(useProjectStore.getState().canUndo()).toBe(true);
    expect(useProjectStore.getState().canRedo()).toBe(false);

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().canUndo()).toBe(false);
    expect(useProjectStore.getState().canRedo()).toBe(true);
  });
});

// ===========================================
// loadState
// ===========================================

describe('loadState', () => {
  it('replaces the entire store state', () => {
    const project = makeProject({ id: 'loaded-proj' });
    const node = makeNode({ id: 'loaded-node', projectId: 'loaded-proj' });
    const edge = makeEdge({ id: 'loaded-edge', projectId: 'loaded-proj', source: 'loaded-node', target: 'loaded-node' });

    useProjectStore.getState().loadState({
      currentProjectId: 'loaded-proj',
      projects: [project],
      nodes: [node],
      edges: [edge],
    });

    const state = useProjectStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].id).toBe('loaded-proj');
    expect(state.nodes).toHaveLength(1);
    expect(state.edges).toHaveLength(1);
    expect(state.currentProjectId).toBe('loaded-proj');
  });
});

// ===========================================
// Integration: Full workflow
// ===========================================

describe('Integration: Full Workflow', () => {
  it('create project -> add nodes -> connect -> save (loadState) -> reload (verify state)', () => {
    // Step 1: Create a project
    const project = makeProject({ id: 'proj-1', name: 'Brainstorm' });
    useProjectStore.getState().createProject(project);

    // Step 2: Add nodes
    const n1 = makeNode({ id: 'n1', projectId: 'proj-1', text: 'Idea 1', position: { x: 100, y: 100 } });
    const n2 = makeNode({ id: 'n2', projectId: 'proj-1', text: 'Idea 2', position: { x: 300, y: 100 } });
    const n3 = makeNode({ id: 'n3', projectId: 'proj-1', text: 'Idea 3', position: { x: 200, y: 300 } });
    useProjectStore.getState().addNode(n1);
    useProjectStore.getState().addNode(n2);
    useProjectStore.getState().addNode(n3);

    // Step 3: Connect nodes with edges
    const e1 = makeEdge({ id: 'e1', projectId: 'proj-1', source: 'n1', target: 'n2', label: 'relates to' });
    const e2 = makeEdge({ id: 'e2', projectId: 'proj-1', source: 'n2', target: 'n3' });
    useProjectStore.getState().addEdge(e1);
    useProjectStore.getState().addEdge(e2);

    // Verify intermediate state
    expect(useProjectStore.getState().getCurrentNodes()).toHaveLength(3);
    expect(useProjectStore.getState().getCurrentEdges()).toHaveLength(2);

    // Step 4: Simulate save (snapshot state, then loadState back)
    const snapshot = useProjectStore.getState();
    const savedState = {
      currentProjectId: snapshot.currentProjectId,
      projects: [...snapshot.projects],
      nodes: [...snapshot.nodes],
      edges: [...snapshot.edges],
    };

    // Step 5: Clear and reload (simulating page reload)
    useProjectStore.setState({
      currentProjectId: null,
      projects: [],
      nodes: [],
      edges: [],
      undoStack: [],
      redoStack: [],
    });

    expect(useProjectStore.getState().projects).toHaveLength(0);

    useProjectStore.getState().loadState(savedState);

    // Verify restored state
    const restored = useProjectStore.getState();
    expect(restored.projects).toHaveLength(1);
    expect(restored.projects[0].name).toBe('Brainstorm');
    expect(restored.currentProjectId).toBe('proj-1');
    expect(restored.getCurrentNodes()).toHaveLength(3);
    expect(restored.getCurrentEdges()).toHaveLength(2);
    expect(restored.edges[0].label).toBe('relates to');
  });

  it('create project -> add nodes -> connect -> switch project -> persist', () => {
    // Step 1: Create first project with nodes and edges
    const p1 = makeProject({ id: 'p1', name: 'Project A' });
    useProjectStore.getState().createProject(p1);
    useProjectStore.getState().addNode(makeNode({ id: 'a1', projectId: 'p1' }));
    useProjectStore.getState().addNode(makeNode({ id: 'a2', projectId: 'p1' }));
    useProjectStore.getState().addEdge(makeEdge({ id: 'ea', projectId: 'p1', source: 'a1', target: 'a2' }));

    // Step 2: Create second project with nodes
    const p2 = makeProject({ id: 'p2', name: 'Project B' });
    useProjectStore.getState().createProject(p2);
    useProjectStore.getState().addNode(makeNode({ id: 'b1', projectId: 'p2' }));

    // Step 3: Switch back to first project
    useProjectStore.getState().switchProject('p1');

    // Step 4: Verify first project data
    expect(useProjectStore.getState().currentProjectId).toBe('p1');
    expect(useProjectStore.getState().getCurrentNodes()).toHaveLength(2);
    expect(useProjectStore.getState().getCurrentEdges()).toHaveLength(1);

    // Step 5: Persist (snapshot) and reload
    const state = useProjectStore.getState();
    const persisted = {
      currentProjectId: state.currentProjectId,
      projects: [...state.projects],
      nodes: [...state.nodes],
      edges: [...state.edges],
    };

    // Clear and reload
    useProjectStore.getState().loadState(persisted);

    // Verify persisted state
    expect(useProjectStore.getState().currentProjectId).toBe('p1');
    expect(useProjectStore.getState().projects).toHaveLength(2);
    expect(useProjectStore.getState().getCurrentNodes()).toHaveLength(2);

    // Switch to second project and verify
    useProjectStore.getState().switchProject('p2');
    expect(useProjectStore.getState().getCurrentNodes()).toHaveLength(1);
    expect(useProjectStore.getState().getCurrentNodes()[0].id).toBe('b1');
  });
});
