import db, {
  projectToRow,
  projectFromRow,
  nodeToRow,
  nodeFromRow,
  edgeToRow,
  edgeFromRow,
} from './db';
import type { AppState, Project } from '@/types';

// ---- Auto-save (1 s debounce) ----

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const scheduleSave = (state: AppState): void => {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    void persistState(state);
  }, 1000);
};

/** Immediately persist the full state to IndexedDB. */
export const persistState = async (state: AppState): Promise<void> => {
  try {
    await db.transaction('rw', [db.projects, db.nodes, db.edges, db.meta], async () => {
      // Projects
      const incomingProjectIds = new Set(state.projects.map((p) => p.id));
      await db.projects
        .where('id')
        .noneOf([...incomingProjectIds])
        .delete();
      await db.projects.bulkPut(state.projects.map(projectToRow));

      // Nodes
      const incomingNodeIds = new Set(state.nodes.map((n) => n.id));
      await db.nodes
        .where('id')
        .noneOf([...incomingNodeIds])
        .delete();
      await db.nodes.bulkPut(state.nodes.map(nodeToRow));

      // Edges
      const incomingEdgeIds = new Set(state.edges.map((e) => e.id));
      await db.edges
        .where('id')
        .noneOf([...incomingEdgeIds])
        .delete();
      await db.edges.bulkPut(state.edges.map(edgeToRow));

      // Persist the last active project ID
      await db.meta.put({ key: 'currentProjectId', value: state.currentProjectId });
    });

    // Notify the UI that a save completed in the current window
    window.dispatchEvent(new Event('app:save-complete'));
  } catch (error) {
    console.error('Failed to persist state to IndexedDB:', error);
  }
};

/** Load the full state from IndexedDB. */
export const loadPersistedState = async (): Promise<AppState | null> => {
  try {
    const [projectRows, nodeRows, edgeRows, metaRow] = await Promise.all([
      db.projects.toArray(),
      db.nodes.toArray(),
      db.edges.toArray(),
      db.meta.get('currentProjectId'),
    ]);

    if (projectRows.length === 0 && nodeRows.length === 0 && edgeRows.length === 0) {
      return null;
    }

    // Restore last active project ID, falling back to first project
    let currentProjectId: string | null = metaRow?.value as string | null ?? null;
    if (currentProjectId && !projectRows.some((p) => p.id === currentProjectId)) {
      currentProjectId = projectRows.length > 0 ? projectRows[0].id : null;
    } else if (!currentProjectId && projectRows.length > 0) {
      currentProjectId = projectRows[0].id;
    }

    return {
      currentProjectId,
      projects: projectRows.map(projectFromRow),
      nodes: nodeRows.map(nodeFromRow),
      edges: edgeRows.map(edgeFromRow),
    };
  } catch (error) {
    console.error('Failed to load state from IndexedDB:', error);
    return null;
  }
};

/** Clear all persisted data. */
export const clearPersistedState = async (): Promise<void> => {
  try {
    await db.delete();
  } catch (error) {
    console.error('Failed to clear persisted state:', error);
  }
};

// ---- Project metadata (node / edge counts) ----

export interface ProjectMetadata {
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  nodeCount: number;
  edgeCount: number;
}

/** Return metadata (including live node/edge counts) for every project. */
export const getProjectMetadata = async (): Promise<ProjectMetadata[]> => {
  const projects = await db.projects.toArray();
  const allNodes = await db.nodes.toArray();
  const allEdges = await db.edges.toArray();

  const nodeCounts = new Map<string, number>();
  for (const n of allNodes) {
    nodeCounts.set(n.projectId, (nodeCounts.get(n.projectId) ?? 0) + 1);
  }

  const edgeCounts = new Map<string, number>();
  for (const e of allEdges) {
    edgeCounts.set(e.projectId, (edgeCounts.get(e.projectId) ?? 0) + 1);
  }

  return projects.map((p) => ({
    projectId: p.id,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
    nodeCount: nodeCounts.get(p.id) ?? 0,
    edgeCount: edgeCounts.get(p.id) ?? 0,
  }));
};

// ---- Export / Import as JSON ----

export interface ExportedProject {
  version: number;
  exportedAt: string;
  project: Project;
  nodes: AppState['nodes'];
  edges: AppState['edges'];
}

/** Export a single project (with its nodes and edges) as a JSON-serialisable object. */
export const exportProject = async (projectId: string): Promise<ExportedProject | null> => {
  try {
    const projectRow = await db.projects.get(projectId);
    if (!projectRow) return null;

    const nodeRows = await db.nodes.where('projectId').equals(projectId).toArray();
    const edgeRows = await db.edges.where('projectId').equals(projectId).toArray();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      project: projectFromRow(projectRow),
      nodes: nodeRows.map(nodeFromRow),
      edges: edgeRows.map(edgeFromRow),
    };
  } catch (error) {
    console.error('Failed to export project:', error);
    return null;
  }
};

/** Import a previously exported project into the database. Returns the imported AppState. */
export const importProject = async (data: ExportedProject): Promise<AppState | null> => {
  try {
    // Insert the project
    await db.projects.put(projectToRow(data.project));

    // Insert nodes and edges
    if (data.nodes.length > 0) {
      await db.nodes.bulkPut(data.nodes.map(nodeToRow));
    }
    if (data.edges.length > 0) {
      await db.edges.bulkPut(data.edges.map(edgeToRow));
    }

    // Return full state so the caller can loadState
    const state = await loadPersistedState();
    return state;
  } catch (error) {
    console.error('Failed to import project:', error);
    return null;
  }
};

/** Export all projects as a single JSON-serialisable bundle. */
export const exportAll = async (): Promise<{
  version: number;
  exportedAt: string;
  projects: AppState;
}> => {
  const state = await loadPersistedState();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: state ?? { currentProjectId: null, projects: [], nodes: [], edges: [] },
  };
};

/** Import an entire bundle, replacing all existing data. */
export const importAll = async (bundle: {
  version: number;
  projects: AppState;
}): Promise<AppState | null> => {
  try {
    // Clear existing data then insert everything
    await db.delete();
    // Recreate the DB after delete
    await db.open();

    const state = bundle.projects;
    await db.transaction('rw', [db.projects, db.nodes, db.edges], async () => {
      if (state.projects.length > 0) {
        await db.projects.bulkPut(state.projects.map(projectToRow));
      }
      if (state.nodes.length > 0) {
        await db.nodes.bulkPut(state.nodes.map(nodeToRow));
      }
      if (state.edges.length > 0) {
        await db.edges.bulkPut(state.edges.map(edgeToRow));
      }
    });

    return loadPersistedState();
  } catch (error) {
    console.error('Failed to import all projects:', error);
    return null;
  }
};

// ---- Schema version helper ----

/** Return the current database schema version. */
export const getSchemaVersion = (): number => {
  return 1;
};
