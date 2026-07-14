import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project, BrainstormNode, BrainstormEdge, AppState } from '@/types';
import { generateId } from '@/utils';

interface UndoEntry {
  snapshot: AppState;
}

interface ProjectStore extends AppState {
  // Undo/Redo
  undoStack: UndoEntry[];
  redoStack: UndoEntry[];
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project actions
  createProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  switchProject: (id: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  duplicateProject: (id: string) => Project | null;

  // Node actions
  addNode: (node: BrainstormNode) => void;
  updateNode: (id: string, updates: Partial<BrainstormNode>) => void;
  deleteNode: (id: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;

  // Edge actions
  addEdge: (edge: BrainstormEdge) => void;
  updateEdge: (id: string, updates: Partial<BrainstormEdge>) => void;
  deleteEdge: (id: string) => void;

  // State management
  loadState: (state: AppState) => void;
  getCurrentNodes: () => BrainstormNode[];
  getCurrentEdges: () => BrainstormEdge[];
}

const MAX_UNDO = 50;

function cloneAppState(state: AppState): AppState {
  return {
    currentProjectId: state.currentProjectId,
    projects: state.projects.map((p) => ({ ...p })),
    nodes: state.nodes.map((n) => ({ ...n, position: { ...n.position } })),
    edges: state.edges.map((e) => ({ ...e })),
  };
}

export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    currentProjectId: null,
    projects: [],
    nodes: [],
    edges: [],
    undoStack: [] as UndoEntry[],
    redoStack: [] as UndoEntry[],

    pushUndo: () => {
      const state = get();
      const snapshot = cloneAppState({
        currentProjectId: state.currentProjectId,
        projects: state.projects,
        nodes: state.nodes,
        edges: state.edges,
      });
      set((draft) => {
        draft.undoStack.push({ snapshot });
        if (draft.undoStack.length > MAX_UNDO) draft.undoStack.shift();
        draft.redoStack = [];
      });
    },

    undo: () => {
      const state = get();
      if (state.undoStack.length === 0) return;
      const currentSnapshot = cloneAppState({
        currentProjectId: state.currentProjectId,
        projects: state.projects,
        nodes: state.nodes,
        edges: state.edges,
      });
      const entry = state.undoStack[state.undoStack.length - 1];
      set((draft) => {
        draft.undoStack.pop();
        draft.redoStack.push({ snapshot: currentSnapshot });
        draft.currentProjectId = entry.snapshot.currentProjectId;
        draft.projects = entry.snapshot.projects;
        draft.nodes = entry.snapshot.nodes;
        draft.edges = entry.snapshot.edges;
      });
    },

    redo: () => {
      const state = get();
      if (state.redoStack.length === 0) return;
      const currentSnapshot = cloneAppState({
        currentProjectId: state.currentProjectId,
        projects: state.projects,
        nodes: state.nodes,
        edges: state.edges,
      });
      const entry = state.redoStack[state.redoStack.length - 1];
      set((draft) => {
        draft.redoStack.pop();
        draft.undoStack.push({ snapshot: currentSnapshot });
        draft.currentProjectId = entry.snapshot.currentProjectId;
        draft.projects = entry.snapshot.projects;
        draft.nodes = entry.snapshot.nodes;
        draft.edges = entry.snapshot.edges;
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    createProject: (project) =>
      set((state) => {
        state.projects.push(project);
        state.currentProjectId = project.id;
      }),

    deleteProject: (id) =>
      set((state) => {
        state.projects = state.projects.filter((p) => p.id !== id);
        state.nodes = state.nodes.filter((n) => n.projectId !== id);
        state.edges = state.edges.filter((e) => e.projectId !== id);
        if (state.currentProjectId === id) {
          state.currentProjectId = state.projects[0]?.id ?? null;
        }
      }),

    switchProject: (id) =>
      set((state) => {
        state.currentProjectId = id;
      }),

    updateProject: (id, updates) =>
      set((state) => {
        const project = state.projects.find((p) => p.id === id);
        if (project) {
          Object.assign(project, updates, { updatedAt: new Date() });
        }
      }),

    duplicateProject: (id) => {
      const state = get();
      const sourceProject = state.projects.find((p) => p.id === id);
      if (!sourceProject) return null;

      const newProjectId = generateId();
      const now = new Date();
      const newProject: Project = {
        id: newProjectId,
        name: `${sourceProject.name} (copy)`,
        description: sourceProject.description,
        color: sourceProject.color,
        createdAt: now,
        updatedAt: now,
      };

      const idMap = new Map<string, string>();
      const newNodes: BrainstormNode[] = state.nodes
        .filter((n) => n.projectId === id)
        .map((n) => {
          const newId = generateId();
          idMap.set(n.id, newId);
          return {
            ...n,
            id: newId,
            projectId: newProjectId,
            createdAt: now,
            updatedAt: now,
          };
        });

      const newEdges: BrainstormEdge[] = state.edges
        .filter((e) => e.projectId === id)
        .map((e) => ({
          ...e,
          id: generateId(),
          projectId: newProjectId,
          source: idMap.get(e.source) ?? e.source,
          target: idMap.get(e.target) ?? e.target,
          createdAt: now,
          updatedAt: now,
        }));

      set((draft) => {
        draft.projects.push(newProject);
        draft.nodes.push(...newNodes);
        draft.edges.push(...newEdges);
        draft.currentProjectId = newProjectId;
      });

      return newProject;
    },

    addNode: (node) =>
      set((state) => {
        state.nodes.push(node);
      }),

    updateNode: (id, updates) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          Object.assign(node, updates, { updatedAt: new Date() });
        }
      }),

    deleteNode: (id) =>
      set((state) => {
        state.nodes = state.nodes.filter((n) => n.id !== id);
        state.edges = state.edges.filter((e) => e.source !== id && e.target !== id);
      }),

    updateNodePosition: (id, position) =>
      set((state) => {
        const node = state.nodes.find((n) => n.id === id);
        if (node) {
          node.position = position;
          node.updatedAt = new Date();
        }
      }),

    addEdge: (edge) =>
      set((state) => {
        state.edges.push(edge);
      }),

    updateEdge: (id, updates) =>
      set((state) => {
        const edge = state.edges.find((e) => e.id === id);
        if (edge) {
          Object.assign(edge, updates, { updatedAt: new Date() });
        }
      }),

    deleteEdge: (id) =>
      set((state) => {
        state.edges = state.edges.filter((e) => e.id !== id);
      }),

    loadState: (state) =>
      set((draft) => {
        draft.currentProjectId = state.currentProjectId;
        draft.projects = state.projects;
        draft.nodes = state.nodes;
        draft.edges = state.edges;
      }),

    getCurrentNodes: () => {
      const state = get();
      return state.nodes.filter((n) => n.projectId === state.currentProjectId);
    },

    getCurrentEdges: () => {
      const state = get();
      return state.edges.filter((e) => e.projectId === state.currentProjectId);
    },
  }))
);
