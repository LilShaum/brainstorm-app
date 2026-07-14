import { useEffect, useCallback } from 'react';
import type { UseCanvasReturn } from './useCanvas';

interface UseKeyboardShortcutsProps {
  editingNodeId: string | null;
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  deleteSelectedNodes: UseCanvasReturn['deleteSelectedNodes'];
  deleteSelectedEdges: UseCanvasReturn['deleteSelectedEdges'];
  startEditing: UseCanvasReturn['startEditing'];
  stopEditing: UseCanvasReturn['stopEditing'];
}

export function useKeyboardShortcuts({
  editingNodeId,
  selectedNodeIds,
  selectedEdgeIds,
  deleteSelectedNodes,
  deleteSelectedEdges,
  startEditing,
  stopEditing,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape' && editingNodeId) {
          stopEditing();
        }
        return;
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          if (selectedNodeIds.size > 0) {
            deleteSelectedNodes();
          } else if (selectedEdgeIds.size > 0) {
            deleteSelectedEdges();
          }
          break;
        }
        case 'Enter': {
          if (selectedNodeIds.size === 1 && !editingNodeId) {
            e.preventDefault();
            const nodeId = Array.from(selectedNodeIds)[0];
            startEditing(nodeId);
          }
          break;
        }
        case 'Escape': {
          if (editingNodeId) {
            stopEditing();
          }
          break;
        }
      }
    },
    [editingNodeId, selectedNodeIds, selectedEdgeIds, deleteSelectedNodes, deleteSelectedEdges, startEditing, stopEditing]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
