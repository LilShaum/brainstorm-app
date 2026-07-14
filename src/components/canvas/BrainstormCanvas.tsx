import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  ReactFlowProvider,
} from '@xyflow/react';
import type { NodeMouseHandler, ReactFlowInstance, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import IdeaNode from './IdeaNode';
import type { IdeaNodeType } from './IdeaNode';
import IdeaEdge from './IdeaEdge';
import type { IdeaEdgeType } from './IdeaEdge';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import CanvasToolbar from '@/components/toolbar/CanvasToolbar';
import AddNodeModal from '@/components/toolbar/AddNodeModal';
import EditNodeModal from '@/components/toolbar/EditNodeModal';
import { useCanvas } from '@/hooks/useCanvas';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useProjectStore } from '@/store/projectStore';
import type { BrainstormNode } from '@/types';

const nodeTypes: NodeTypes = {
  idea: IdeaNode,
};

const edgeTypes: EdgeTypes = {
  custom: IdeaEdge,
};

function BrainstormCanvasInner() {
  const {
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
    updateNodeText,
    updateNodeColor,
    selectedNodeIds,
    selectedEdgeIds,
  } = useCanvas();

  const { updateNode: storeUpdateNode } = useProjectStore();
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  // Add Node Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalPosition, setAddModalPosition] = useState<{ x: number; y: number } | null>(null);

  // Edit Node Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNode, setEditNode] = useState<BrainstormNode | null>(null);

  // Get brainstorm node from store by id
  const { nodes: brainstormNodes } = useProjectStore();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    editingNodeId,
    selectedNodeIds,
    selectedEdgeIds,
    deleteSelectedNodes,
    deleteSelectedEdges,
    startEditing,
    stopEditing,
  });

  // Node double-click handler
  const onNodeDoubleClick: NodeMouseHandler<IdeaNodeType> = useCallback(
    (_event, node) => {
      startEditing(node.id);
    },
    [startEditing]
  );

  // Node context menu (right-click)
  const onNodeContextMenu: NodeMouseHandler<IdeaNodeType> = useCallback(
    (event, node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id,
      });
    },
    []
  );

  // Canvas click to close context menu
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle Add Node from toolbar (opens modal at canvas center)
  const handleToolbarAddNode = useCallback(() => {
    if (!reactFlowInstance) return;
    setAddModalPosition({ x: window.innerWidth / 2 - 170, y: window.innerHeight / 3 });
    setShowAddModal(true);
  }, [reactFlowInstance]);

  // Handle canvas double-click to add node directly
  const handleCanvasDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance) return;
      const target = event.target as HTMLElement;
      if (target.closest('.react-flow__node')) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNode(position);
    },
    [reactFlowInstance, addNode]
  );

  // Add Node modal create handler
  const handleAddNodeCreate = useCallback(
    (text: string, color: string, shape: BrainstormNode['shape'], size: BrainstormNode['size']) => {
      if (!reactFlowInstance || !addModalPosition) return;
      const position = reactFlowInstance.screenToFlowPosition({
        x: addModalPosition.x + 170,
        y: addModalPosition.y + 150,
      });
      addNode(position);
      // The node was just added, so we need to update it with the custom properties
      const state = useProjectStore.getState();
      const currentNodeId = state.nodes[state.nodes.length - 1]?.id;
      if (currentNodeId) {
        storeUpdateNode(currentNodeId, { text, color, shape, size });
        // Force re-render by calling useCanvas's node update
        updateNodeText(currentNodeId, text);
        updateNodeColor(currentNodeId, color);
      }
    },
    [reactFlowInstance, addModalPosition, addNode, storeUpdateNode, updateNodeText, updateNodeColor]
  );

  // Edit Node modal update handler
  const handleEditNodeUpdate = useCallback(
    (id: string, updates: Partial<BrainstormNode>) => {
      if (updates.text !== undefined) updateNodeText(id, updates.text);
      if (updates.color !== undefined) updateNodeColor(id, updates.color);
      if (updates.shape !== undefined) storeUpdateNode(id, { shape: updates.shape });
      if (updates.size !== undefined) storeUpdateNode(id, { size: updates.size });
    },
    [updateNodeText, updateNodeColor, storeUpdateNode]
  );

  // Context menu items
  const getContextMenuItems = (nodeId: string): ContextMenuItem[] => [
    {
      label: 'Edit',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      ),
      onClick: () => {
        const node = brainstormNodes.find((n) => n.id === nodeId);
        if (node) {
          setEditNode(node);
          setShowEditModal(true);
        }
      },
    },
    {
      label: 'Duplicate',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
          <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
        </svg>
      ),
      onClick: () => {
        duplicateNode(nodeId);
      },
    },
    {
      label: 'Add Child',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
      onClick: () => {
        addChildNode(nodeId);
      },
    },
    {
      label: 'Delete',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
      onClick: () => {
        deleteNodeById(nodeId);
      },
      danger: true,
    },
  ];

  return (
    <div className="w-full h-screen" onDoubleClick={handleCanvasDoubleClick}>
      <ReactFlow
        nodes={nodes as IdeaNodeType[]}
        edges={edges as IdeaEdgeType[]}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        onInit={(instance) => setReactFlowInstance(instance as unknown as ReactFlowInstance)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={null}
        multiSelectionKeyCode="Shift"
        defaultEdgeOptions={{ type: 'custom', animated: false }}
        className="bg-canvas-bg dark:bg-canvas-dark"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={15}
          size={1}
          color="#d1d5db"
        />
        <Controls
          className="!shadow-soft !rounded-lg !border-gray-100"
          showInteractive={false}
        />
        <MiniMap
          className="!shadow-soft !rounded-lg !border-gray-100"
          nodeColor={(node: Record<string, unknown>) => {
            if (node.type === 'idea' && node.data && typeof node.data === 'object') {
              const d = node.data as Record<string, unknown>;
              const bn = d.brainstormNode as Record<string, unknown> | undefined;
              if (bn && typeof bn.color === 'string') return bn.color;
            }
            return '#94a3b8';
          }}
          maskColor="rgba(250, 250, 250, 0.7)"
          pannable
          zoomable
        />
        <CanvasToolbar onAddNodeClick={handleToolbarAddNode} />
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.nodeId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Add Node Modal */}
      <AddNodeModal
        isOpen={showAddModal}
        position={addModalPosition}
        onClose={() => {
          setShowAddModal(false);
          setAddModalPosition(null);
        }}
        onCreate={handleAddNodeCreate}
      />

      {/* Edit Node Modal */}
      <EditNodeModal
        isOpen={showEditModal}
        node={editNode}
        onClose={() => {
          setShowEditModal(false);
          setEditNode(null);
        }}
        onUpdate={handleEditNodeUpdate}
      />
    </div>
  );
}

export default function BrainstormCanvas() {
  return (
    <ReactFlowProvider>
      <BrainstormCanvasInner />
    </ReactFlowProvider>
  );
}
