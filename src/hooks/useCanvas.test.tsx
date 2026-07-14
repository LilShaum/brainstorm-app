import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCanvas } from './useCanvas';
import { useProjectStore } from '@/store/projectStore';
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

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <ReactFlowProvider>{children}</ReactFlowProvider>;
  };
}

describe('useCanvas', () => {
  it('returns initial empty state when no project is selected', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(result.current.nodes).toEqual([]);
    expect(result.current.edges).toEqual([]);
    expect(result.current.editingNodeId).toBeNull();
    expect(result.current.selectedNodeIds.size).toBe(0);
    expect(result.current.selectedEdgeIds.size).toBe(0);
  });

  it('converts brainstorm nodes to React Flow nodes for current project', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    const node = makeNode({ id: 'n1', projectId: 'proj-1', text: 'Hello', position: { x: 50, y: 50 } });
    useProjectStore.getState().addNode(node);

    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('n1');
    expect(result.current.nodes[0].type).toBe('idea');
    expect(result.current.nodes[0].position).toEqual({ x: 50, y: 50 });
  });

  it('only shows nodes for the current project', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    useProjectStore.getState().addNode(makeNode({ id: 'n1', projectId: 'proj-1' }));
    useProjectStore.getState().addNode(makeNode({ id: 'n2', projectId: 'other-proj' }));

    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('n1');
  });

  it('converts brainstorm edges to React Flow edges', () => {
    const project = makeProject({ id: 'proj-1' });
    useProjectStore.getState().createProject(project);

    useProjectStore.getState().addNode(makeNode({ id: 'n1', projectId: 'proj-1' }));
    useProjectStore.getState().addNode(makeNode({ id: 'n2', projectId: 'proj-1' }));
    useProjectStore.getState().addEdge(makeEdge({ id: 'e1', projectId: 'proj-1', source: 'n1', target: 'n2' }));

    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(result.current.edges).toHaveLength(1);
    expect(result.current.edges[0].id).toBe('e1');
    expect(result.current.edges[0].type).toBe('custom');
    expect(result.current.edges[0].source).toBe('n1');
    expect(result.current.edges[0].target).toBe('n2');
  });

  it('has addNode function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.addNode).toBe('function');
  });

  it('has deleteNodeById function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.deleteNodeById).toBe('function');
  });

  it('has deleteEdgeById function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.deleteEdgeById).toBe('function');
  });

  it('has updateNodeText function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.updateNodeText).toBe('function');
  });

  it('has updateNodeColor function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.updateNodeColor).toBe('function');
  });

  it('has updateEdgeLabel function', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.updateEdgeLabel).toBe('function');
  });

  it('provides onNodesChange handler', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.onNodesChange).toBe('function');
  });

  it('provides onEdgesChange handler', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.onEdgesChange).toBe('function');
  });

  it('provides onConnect handler', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper: createWrapper() });

    expect(typeof result.current.onConnect).toBe('function');
  });
});
