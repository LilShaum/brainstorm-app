import Dexie, { type EntityTable } from 'dexie';
import type { Project, BrainstormNode, BrainstormEdge } from '@/types';

/**
 * IndexedDB database for persistent project storage.
 *
 * Migration strategy: each schema change increments the version number.
 * Dexie auto-migrates between versions. Old fields are kept, new ones added.
 */

// ---- Database row types (match our app types but with Date serialised as number) ----

export interface ProjectRow extends Omit<Project, 'createdAt' | 'updatedAt'> {
  createdAt: number;
  updatedAt: number;
}

export interface NodeRow extends Omit<BrainstormNode, 'createdAt' | 'updatedAt' | 'position'> {
  createdAt: number;
  updatedAt: number;
  positionX: number;
  positionY: number;
}

export interface EdgeRow extends Omit<BrainstormEdge, 'createdAt' | 'updatedAt'> {
  createdAt: number;
  updatedAt: number;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

// ---- Database ----

const DB_NAME = 'brainstorm-app';
const CURRENT_DB_VERSION = 1;

const db = new Dexie(DB_NAME) as Dexie & {
  projects: EntityTable<ProjectRow, 'id'>;
  nodes: EntityTable<NodeRow, 'id'>;
  edges: EntityTable<EdgeRow, 'id'>;
  meta: EntityTable<MetaRow, 'key'>;
};

// Version 1 — initial schema
db.version(CURRENT_DB_VERSION).stores({
  projects: 'id, name, createdAt, updatedAt',
  nodes: 'id, projectId, createdAt, updatedAt',
  edges: 'id, projectId, source, target, createdAt, updatedAt',
  meta: 'key',
});

// ---- Serialisation helpers (Date ↔ number) ----

export function projectToRow(p: Project): ProjectRow {
  return {
    ...p,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
  };
}

export function projectFromRow(r: ProjectRow): Project {
  return {
    ...r,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export function nodeToRow(n: BrainstormNode): NodeRow {
  return {
    id: n.id,
    projectId: n.projectId,
    text: n.text,
    color: n.color,
    shape: n.shape,
    size: n.size,
    positionX: n.position.x,
    positionY: n.position.y,
    createdAt: n.createdAt.getTime(),
    updatedAt: n.updatedAt.getTime(),
  };
}

export function nodeFromRow(r: NodeRow): BrainstormNode {
  return {
    id: r.id,
    projectId: r.projectId,
    text: r.text,
    color: r.color,
    shape: r.shape,
    size: r.size,
    position: { x: r.positionX, y: r.positionY },
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export function edgeToRow(e: BrainstormEdge): EdgeRow {
  return {
    id: e.id,
    projectId: e.projectId,
    source: e.source,
    target: e.target,
    label: e.label,
    createdAt: e.createdAt.getTime(),
    updatedAt: e.updatedAt.getTime(),
  };
}

export function edgeFromRow(r: EdgeRow): BrainstormEdge {
  return {
    id: r.id,
    projectId: r.projectId,
    source: r.source,
    target: r.target,
    label: r.label,
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  };
}

export default db;
