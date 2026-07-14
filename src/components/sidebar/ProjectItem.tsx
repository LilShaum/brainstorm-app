import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { formatDate } from '@/utils';

interface ProjectItemProps {
  projectId: string;
  name: string;
  color: string;
  updatedAt: Date;
  isActive: boolean;
  nodeCount: number;
  onSwitch: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export default function ProjectItem({
  projectId,
  name,
  color,
  updatedAt,
  isActive,
  nodeCount,
  onSwitch,
  onDelete,
  onDuplicate,
}: ProjectItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateProject = useProjectStore((s) => s.updateProject);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      updateProject(projectId, { name: trimmed });
    } else {
      setRenameValue(name);
    }
    setIsRenaming(false);
  };

  return (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer 
                   transition-all duration-150
                   ${isActive
                     ? 'bg-primary-50 dark:bg-primary-950/40 shadow-sm'
                     : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                   }`}
      onClick={() => {
        if (!isRenaming) onSwitch();
      }}
    >
      {/* Color indicator */}
      <div
        className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-transparent 
                   group-hover:ring-gray-200 dark:group-hover:ring-gray-700 transition-all"
        style={{ backgroundColor: color }}
      />

      {/* Project info */}
      <div className="flex-1 min-w-0">
        {isRenaming ? (
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') {
                setRenameValue(name);
                setIsRenaming(false);
              }
            }}
            onBlur={handleRenameSubmit}
            className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-primary-300 
                       dark:border-primary-600 rounded px-1 py-0.5 outline-none text-gray-900 dark:text-gray-100"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
          </span>
          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(updatedAt)}
          </span>
        </div>
      </div>

      {/* Actions menu */}
      <div className="relative" ref={menuRef}>
        <button
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 
                     hover:text-gray-600 hover:bg-gray-200/50 dark:hover:text-gray-300 
                     dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-all"
          aria-label={`Actions for ${name}`}
          aria-haspopup="true"
          aria-expanded={showMenu}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg 
                          shadow-soft-lg border border-gray-100 dark:border-gray-700 py-1 min-w-[140px] z-50 animate-scale-in">
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 
                         hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              aria-label={`Rename ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                setIsRenaming(true);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Rename
            </button>
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 
                         hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
              aria-label={`Duplicate ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDuplicate();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              Duplicate
            </button>
            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            <button
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 
                         hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2"
              aria-label={`Delete ${name}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
                onDelete();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
