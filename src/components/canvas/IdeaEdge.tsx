import { memo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { Edge, EdgeProps } from '@xyflow/react';

export interface IdeaEdgeData extends Record<string, unknown> {
  label?: string;
  onDelete: (id: string) => void;
  onLabelChange: (id: string, label: string) => void;
}

export type IdeaEdgeType = Edge<IdeaEdgeData, 'custom'>;

function IdeaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<IdeaEdgeType>) {
  const edgeData = data as IdeaEdgeData;
  const [isHovered, setIsHovered] = useState(false);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelText, setLabelText] = useState(edgeData?.label ?? '');

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleLabelSubmit = () => {
    if (edgeData?.onLabelChange) {
      edgeData.onLabelChange(id, labelText);
    }
    setIsEditingLabel(false);
  };

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <BaseEdge
        path={edgePath}
        style={{
          stroke: selected ? '#0ea5e9' : '#94a3b8',
          strokeWidth: selected ? 3 : 2,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
        interactionWidth={20}
      />

      {/* Delete button on hover */}
      {isHovered && (
        <foreignObject
          x={labelX - 14}
          y={labelY - 14}
          width={28}
          height={28}
        >
          <button
            aria-label="Delete edge"
            onClick={() => edgeData?.onDelete?.(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                edgeData?.onDelete?.(id);
              }
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              padding: 0,
            }}
          >
            <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 'bold', lineHeight: 1 }}>
              ×
            </span>
          </button>
        </foreignObject>
      )}

      <EdgeLabelRenderer>
        {/* Existing label */}
        {edgeData?.label && !isEditingLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <span
              className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-600 shadow-soft
                         border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
              onDoubleClick={() => {
                setLabelText(edgeData.label ?? '');
                setIsEditingLabel(true);
              }}
            >
              {edgeData.label}
            </span>
          </div>
        )}

        {/* Editing label */}
        {isEditingLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLabelSubmit();
                if (e.key === 'Escape') setIsEditingLabel(false);
              }}
              onBlur={handleLabelSubmit}
              className="px-2 py-0.5 bg-white rounded-full text-xs text-gray-600 shadow-soft
                        border border-primary-300 outline-none text-center min-w-[60px]"
              autoFocus
            />
          </div>
        )}

        {/* Add label button on hover (if no label) */}
        {isHovered && !edgeData?.label && !isEditingLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <button
              className="w-5 h-5 rounded-full bg-white shadow-soft flex items-center justify-center
                        text-gray-400 hover:text-primary-500 transition-colors text-xs border border-gray-200"
              onClick={() => {
                setLabelText('');
                setIsEditingLabel(true);
              }}
              title="Add label"
            >
              +
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </g>
  );
}

export default memo(IdeaEdge);
