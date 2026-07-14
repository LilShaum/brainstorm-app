import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { Node, NodeProps } from '@xyflow/react';
import type { BrainstormNode } from '@/types';

export interface IdeaNodeData extends Record<string, unknown> {
  brainstormNode: BrainstormNode;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onDelete: () => void;
  onUpdateColor: (color: string) => void;
  onUpdateText: (text: string) => void;
  projectColor: string;
}

export type IdeaNodeType = Node<IdeaNodeData, 'idea'>;

const SIZE_CLASSES: Record<BrainstormNode['size'], string> = {
  small: 'min-w-[80px] min-h-[60px] px-2 py-1 text-xs',
  medium: 'min-w-[120px] min-h-[80px] px-3 py-2 text-sm',
  large: 'min-w-[180px] min-h-[120px] px-4 py-3 text-base',
};

const SHAPE_CLASSES: Record<BrainstormNode['shape'], string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-md',
};

function IdeaNode({ data, selected }: NodeProps<IdeaNodeType>) {
  const {
    brainstormNode,
    isEditing,
    onStartEdit,
    onStopEdit,
    onDelete,
    onUpdateColor,
    onUpdateText,
    projectColor,
  } = data;

  const [editText, setEditText] = useState(brainstormNode.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditText(brainstormNode.text);
  }, [brainstormNode.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    onStartEdit();
  }, [onStartEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (editText.trim()) {
          onUpdateText(editText.trim());
        }
        onStopEdit();
      } else if (e.key === 'Escape') {
        setEditText(brainstormNode.text);
        onStopEdit();
      }
    },
    [editText, brainstormNode.text, onUpdateText, onStopEdit]
  );

  const handleBlur = useCallback(() => {
    if (editText.trim() && editText !== brainstormNode.text) {
      onUpdateText(editText.trim());
    } else {
      setEditText(brainstormNode.text);
    }
    onStopEdit();
  }, [editText, brainstormNode.text, onUpdateText, onStopEdit]);

  const COLOR_PALETTE = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
    '#6b7280', '#1e293b',
  ];

  const contrastTextColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1e293b' : '#ffffff';
  };

  return (
    <div
      ref={nodeRef}
      className={`
        relative group
        ${SIZE_CLASSES[brainstormNode.size]}
        ${SHAPE_CLASSES[brainstormNode.shape]}
        transition-all duration-200
        ${selected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
        ${isHovered ? 'shadow-soft-lg' : 'shadow-soft'}
      `}
      style={{
        backgroundColor: brainstormNode.color,
        color: contrastTextColor(brainstormNode.color),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(false);
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-primary-400 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity"
      />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="nodrag w-full bg-transparent border-none outline-none resize-none text-center"
          style={{ color: contrastTextColor(brainstormNode.color) }}
          rows={2}
        />
      ) : (
        <p className="text-center break-words whitespace-pre-wrap pointer-events-none select-none">
          {brainstormNode.text}
        </p>
      )}

      {/* Controls - visible on hover */}
      {isHovered && !isEditing && (
        <div className="absolute -top-2 -right-2 flex gap-1 z-10">
          <button
            className="nodrag w-6 h-6 rounded-full bg-white shadow-soft flex items-center justify-center
                       text-gray-600 hover:text-primary-600 transition-colors text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker((prev) => !prev);
            }}
            title="Change color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="nodrag w-6 h-6 rounded-full bg-white shadow-soft flex items-center justify-center
                       text-gray-600 hover:text-red-500 transition-colors text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete node"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Color picker dropdown */}
      {showColorPicker && (
        <div
          className="absolute top-8 right-0 bg-white rounded-lg shadow-soft-lg p-2 z-20 nodrag animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-5 gap-1">
            {COLOR_PALETTE.map((color) => (
              <button
                key={color}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  brainstormNode.color === color ? 'border-gray-800' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onUpdateColor(color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <label className="flex items-center gap-1 text-xs text-gray-500">
              <span>Custom:</span>
              <input
                type="color"
                value={brainstormNode.color}
                onChange={(e) => {
                  onUpdateColor(e.target.value);
                  setShowColorPicker(false);
                }}
                className="w-5 h-5 cursor-pointer border-0 p-0"
              />
            </label>
          </div>
          {projectColor && (
            <button
              className="mt-1 w-full text-xs text-primary-600 hover:text-primary-700 text-left"
              onClick={() => {
                onUpdateColor(projectColor);
                setShowColorPicker(false);
              }}
            >
              Use project color
            </button>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-primary-400 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity"
      />
    </div>
  );
}

export default memo(IdeaNode);
