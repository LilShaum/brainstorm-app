import { useCallback, useMemo, useState } from 'react';
import {
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge as rfAddEdge,
} from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect, Connection } from '@xyflow/react';
import { useProjectStore } from '@/store/projectStore';
import { scheduleSave } from '@/store/persistence';
import { createNode, createEdge } from '@/utils';
import type { BrainstormEdge } from '@/types';
import type { IdeaNodeData } from '@/components/canvas/IdeaNode';

export interface UseCanvasReturn {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  editingNodeId: string | null;
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;
  deleteSelectedNodes: () => void;
  deleteSelectedEdges: () => void;
  duplicateNode: (nodeId: string) => void;
  addChildNode: (parentId: string) => void;
  addNode: (position: { x: number; y: number }) => void;
  deleteNodeById: (nodeId: string) => void;
  deleteEdgeById: (edgeId: string) => void;
  updateNodeText: (nodeId: string, text: string) => void;
  updateNodeColor: (nodeId: string, color: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
}

export function useCanvas(): UseCanvasReturn {
  const { getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const {
    currentProjectId,
    nodes: brainstormNodes,
    edges: brainstormEdges,
    addNode: storeAddNode,
    updateNode: storeUpdateNode,
    deleteNode: storeDeleteNode,
    updateNodePosition: storeUpdateNodePosition,
    addEdge: storeAddEdge,
    updateEdge: storeUpdateEdge,
    deleteEdge: storeDeleteEdge,
    pushUndo,
    projects,
  } = useProjectStore();

  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<Set<string>>(new Set());

  const currentProject = useMemo(
    () => projects.find((p) => p.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const projectColor = useMemo(
    () => currentProject?.color ?? '#0ea5e9',
    [currentProject]
  );

  const triggerAutoSave = useCallback(() => {
    const state = useProjectStore.getState();
    scheduleSave({
      currentProjectId: state.currentProjectId,
      projects: state.projects,
      nodes: state.nodes,
      edges: state.edges,
    });
  }, []);

  // Convert brainstorm nodes to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    const currentNodes = brainstormNodes.filter((n) => n.projectId === currentProjectId);
    return currentNodes.map((bn) => ({
      id: bn.id,
      type: 'idea',
      position: bn.position,
      data: {
        brainstormNode: bn,
        isEditing: editingNodeId === bn.id,
        onStartEdit: () => setEditingNodeId(bn.id),
        onStopEdit: () => setEditingNodeId(null),
        onDelete: () => deleteNodeById(bn.id),
        onUpdateColor: (color: string) => updateNodeColor(bn.id, color),
        onUpdateText: (text: string) => updateNodeText(bn.id, text),
        projectColor,
      } satisfies IdeaNodeData,
      selected: selectedNodeIds.has(bn.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brainstormNodes, currentProjectId, editingNodeId, selectedNodeIds, projectColor]);

  // Convert brainstorm edges to React Flow edges
  const edges: Edge[] = useMemo(() => {
    const currentEdges = brainstormEdges.filter((e) => e.projectId === currentProjectId);
    return currentEdges.map((be) => ({
      id: be.id,
      type: 'custom',
      source: be.source,
      target: be.target,
      data: {
        label: be.label,
        onDelete: (edgeId: string) => deleteEdgeById(edgeId),
        onLabelChange: (edgeId: string, label: string) => updateEdgeLabel(edgeId, label),
      },
      selected: selectedEdgeIds.has(be.id),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brainstormEdges, currentProjectId, selectedEdgeIds]);

  // Delete node by ID
  const deleteNodeById = useCallback(
    (nodeId: string) => {
      pushUndo();
      storeDeleteNode(nodeId);
      setNodes(getNodes().filter((n) => n.id !== nodeId));
      setEdges(getEdges().filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (editingNodeId === nodeId) setEditingNodeId(null);
      triggerAutoSave();
    },
    [pushUndo, storeDeleteNode, setNodes, setEdges, getNodes, getEdges, editingNodeId, triggerAutoSave]
  );

  // Delete edge by ID
  const deleteEdgeById = useCallback(
    (edgeId: string) => {
      pushUndo();
      storeDeleteEdge(edgeId);
      setEdges(getEdges().filter((e) => e.id !== edgeId));
      triggerAutoSave();
    },
    [pushUndo, storeDeleteEdge, setEdges, getEdges, triggerAutoSave]
  );

  // Update node text
  const updateNodeText = useCallback(
    (nodeId: string, text: string) => {
      pushUndo();
      storeUpdateNode(nodeId, { text });
      setNodes(
        getNodes().map((n) => {
          if (n.id !== nodeId) return n;
          const oldData = n.data;
          const bn = oldData.brainstormNode as Record<string, unknown>;
          return {
            ...n,
            data: { ...oldData, brainstormNode: { ...bn, text } },
          };
        })
      );
      triggerAutoSave();
    },
    [pushUndo, storeUpdateNode, setNodes, getNodes, triggerAutoSave]
  );

  // Update node color
  const updateNodeColor = useCallback(
    (nodeId: string, color: string) => {
      pushUndo();
      storeUpdateNode(nodeId, { color });
      setNodes(
        getNodes().map((n) => {
          if (n.id !== nodeId) return n;
          const oldData = n.data;
          const bn = oldData.brainstormNode as Record<string, unknown>;
          return {
            ...n,
            data: { ...oldData, brainstormNode: { ...bn, color } },
          };
        })
      );
      triggerAutoSave();
    },
    [pushUndo, storeUpdateNode, setNodes, getNodes, triggerAutoSave]
  );

  // Update edge label
  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      pushUndo();
      storeUpdateEdge(edgeId, { label: label || undefined });
      setEdges(
        getEdges().map((e) => {
          if (e.id !== edgeId) return e;
          const oldData = e.data as Record<string, unknown>;
          return { ...e, data: { ...oldData, label: label || undefined } };
        })
      );
      triggerAutoSave();
    },
    [pushUndo, storeUpdateEdge, setEdges, getEdges, triggerAutoSave]
  );

  // Start editing a node
  const startEditing = useCallback((nodeId: string) => {
    setEditingNodeId(nodeId);
  }, []);

  // Stop editing
  const stopEditing = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  // Handle node changes (selection, position)
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, getNodes()));

      // Track selections
      const newSelected = new Set(selectedNodeIds);
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            newSelected.add(change.id);
          } else {
            newSelected.delete(change.id);
          }
        }
      }
      setSelectedNodeIds(newSelected);

      // Sync position changes to store
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          storeUpdateNodePosition(change.id, change.position);
          triggerAutoSave();
        }
      }
    },
    [getNodes, setNodes, storeUpdateNodePosition, selectedNodeIds, triggerAutoSave]
  );

  // Handle edge changes (selection, removal)
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, getEdges()));

      const newSelected = new Set(selectedEdgeIds);
      for (const change of changes) {
        if (change.type === 'select') {
          if (change.selected) {
            newSelected.add(change.id);
          } else {
            newSelected.delete(change.id);
          }
        }
      }
      setSelectedEdgeIds(newSelected);
    },
    [getEdges, setEdges, selectedEdgeIds]
  );

  // Handle new connections (edge creation)
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!currentProjectId || !connection.source || !connection.target) return;

      pushUndo();
      const edge: BrainstormEdge = createEdge(
        currentProjectId,
        connection.source,
        connection.target
      );
      storeAddEdge(edge);
      const newRfEdge: Edge = {
        id: edge.id,
        type: 'custom',
        source: edge.source,
        target: edge.target,
        data: { label: null, onDelete: deleteEdgeById, onLabelChange: updateEdgeLabel },
      };
      setEdges(rfAddEdge(newRfEdge, getEdges()));
      triggerAutoSave();
    },
    [currentProjectId, pushUndo, storeAddEdge, setEdges, getEdges, deleteEdgeById, updateEdgeLabel, triggerAutoSave]
  );

  // Delete all selected nodes
  const deleteSelectedNodes = useCallback(() => {
    for (const nodeId of selectedNodeIds) {
      deleteNodeById(nodeId);
    }
    setSelectedNodeIds(new Set());
  }, [selectedNodeIds, deleteNodeById]);

  // Delete all selected edges
  const deleteSelectedEdges = useCallback(() => {
    for (const edgeId of selectedEdgeIds) {
      deleteEdgeById(edgeId);
    }
    setSelectedEdgeIds(new Set());
  }, [selectedEdgeIds, deleteEdgeById]);

  // Duplicate a node
  const duplicateNode = useCallback(
    (nodeId: string) => {
      if (!currentProjectId) return;
      const sourceNode = brainstormNodes.find((n) => n.id === nodeId);
      if (!sourceNode) return;

      pushUndo();
      const newNode = createNode(
        currentProjectId,
        sourceNode.text + ' (copy)',
        sourceNode.color,
        { x: sourceNode.position.x + 50, y: sourceNode.position.y + 50 },
        sourceNode.shape,
        sourceNode.size
      );
      storeAddNode(newNode);
      const newNodes = [
        ...getNodes(),
        {
          id: newNode.id,
          type: 'idea',
          position: newNode.position,
          data: {
            brainstormNode: newNode,
            isEditing: false,
            onStartEdit: () => setEditingNodeId(newNode.id),
            onStopEdit: () => setEditingNodeId(null),
            onDelete: () => deleteNodeById(newNode.id),
            onUpdateColor: (color: string) => updateNodeColor(newNode.id, color),
            onUpdateText: (text: string) => updateNodeText(newNode.id, text),
            projectColor,
          } satisfies IdeaNodeData,
        },
      ];
      setNodes(newNodes);
      triggerAutoSave();
    },
    [currentProjectId, brainstormNodes, pushUndo, storeAddNode, setNodes, getNodes, deleteNodeById, updateNodeColor, updateNodeText, projectColor, triggerAutoSave]
  );

  // Add child node (connected to parent)
  const addChildNode = useCallback(
    (parentId: string) => {
      if (!currentProjectId) return;
      const parentNode = brainstormNodes.find((n) => n.id === parentId);
      if (!parentNode) return;

      pushUndo();
      const childNode = createNode(
        currentProjectId,
        'New idea',
        parentNode.color,
        { x: parentNode.position.x, y: parentNode.position.y + 150 },
        parentNode.shape,
        parentNode.size
      );
      storeAddNode(childNode);

      const edge = createEdge(currentProjectId, parentId, childNode.id);
      storeAddEdge(edge);

      const newNodes = [
        ...getNodes(),
        {
          id: childNode.id,
          type: 'idea',
          position: childNode.position,
          data: {
            brainstormNode: childNode,
            isEditing: false,
            onStartEdit: () => setEditingNodeId(childNode.id),
            onStopEdit: () => setEditingNodeId(null),
            onDelete: () => deleteNodeById(childNode.id),
            onUpdateColor: (color: string) => updateNodeColor(childNode.id, color),
            onUpdateText: (text: string) => updateNodeText(childNode.id, text),
            projectColor,
          } satisfies IdeaNodeData,
        },
      ];
      setNodes(newNodes);

      const newEdge: Edge = {
        id: edge.id,
        type: 'custom',
        source: edge.source,
        target: edge.target,
        data: { label: null, onDelete: deleteEdgeById, onLabelChange: updateEdgeLabel },
      };
      setEdges([...getEdges(), newEdge]);
      triggerAutoSave();
    },
    [currentProjectId, brainstormNodes, pushUndo, storeAddNode, storeAddEdge, setNodes, setEdges, getNodes, getEdges, deleteNodeById, updateNodeColor, updateNodeText, projectColor, deleteEdgeById, updateEdgeLabel, triggerAutoSave]
  );

  // Add a new node at position
  const addNode = useCallback(
    (position: { x: number; y: number }) => {
      if (!currentProjectId) return;

      pushUndo();
      const node = createNode(currentProjectId, 'New idea', projectColor, position);
      storeAddNode(node);
      const newNodes = [
        ...getNodes(),
        {
          id: node.id,
          type: 'idea',
          position: node.position,
          data: {
            brainstormNode: node,
            isEditing: true,
            onStartEdit: () => setEditingNodeId(node.id),
            onStopEdit: () => setEditingNodeId(null),
            onDelete: () => deleteNodeById(node.id),
            onUpdateColor: (color: string) => updateNodeColor(node.id, color),
            onUpdateText: (text: string) => updateNodeText(node.id, text),
            projectColor,
          } satisfies IdeaNodeData,
        },
      ];
      setNodes(newNodes);
      setEditingNodeId(node.id);
      triggerAutoSave();
    },
    [currentProjectId, pushUndo, projectColor, storeAddNode, setNodes, getNodes, deleteNodeById, updateNodeColor, updateNodeText, triggerAutoSave]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    editingNodeId,
    startEditing,
    stopEditing,
    deleteSelectedNodes,
    deleteSelectedEdges,
    duplicateNode,
    addChildNode,
    addNode,
    deleteNodeById,
    deleteEdgeById,
    updateNodeText,
    updateNodeColor,
    updateEdgeLabel,
    selectedNodeIds,
    selectedEdgeIds,
  };
}
