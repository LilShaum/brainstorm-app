import type { Project, BrainstormNode, BrainstormEdge } from '@/types';

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createProject = (name: string, description: string, color: string): Project => ({
  id: generateId(),
  name,
  description,
  color,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createNode = (
  projectId: string,
  text: string,
  color: string,
  position: { x: number; y: number },
  shape: BrainstormNode['shape'] = 'rounded',
  size: BrainstormNode['size'] = 'medium'
): BrainstormNode => ({
  id: generateId(),
  projectId,
  text,
  color,
  shape,
  size,
  position,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createEdge = (
  projectId: string,
  source: string,
  target: string,
  label?: string
): BrainstormEdge => ({
  id: generateId(),
  projectId,
  source,
  target,
  label,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
