// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Node types
export interface BrainstormNode {
  id: string;
  projectId: string;
  text: string;
  color: string;
  shape: 'circle' | 'square' | 'rounded';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

// Edge types
export interface BrainstormEdge {
  id: string;
  projectId: string;
  source: string;
  target: string;
  label?: string;
  createdAt: Date;
  updatedAt: Date;
}

// App state types
export interface AppState {
  currentProjectId: string | null;
  projects: Project[];
  nodes: BrainstormNode[];
  edges: BrainstormEdge[];
}

// Action types
export type AppAction =
  | { type: 'CREATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'SWITCH_PROJECT'; payload: string }
  | { type: 'UPDATE_PROJECT'; payload: Partial<Project> & { id: string } }
  | { type: 'ADD_NODE'; payload: BrainstormNode }
  | { type: 'UPDATE_NODE'; payload: Partial<BrainstormNode> & { id: string } }
  | { type: 'DELETE_NODE'; payload: string }
  | { type: 'ADD_EDGE'; payload: BrainstormEdge }
  | { type: 'DELETE_EDGE'; payload: string }
  | { type: 'UPDATE_NODE_POSITION'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'LOAD_STATE'; payload: AppState };
