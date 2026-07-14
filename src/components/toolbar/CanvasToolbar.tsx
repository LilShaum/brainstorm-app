import { useState, useEffect, useCallback } from 'react';
import { Panel, useReactFlow, useOnViewportChange } from '@xyflow/react';
import { useProjectStore } from '@/store/projectStore';
import { formatDate } from '@/utils';
import KeyboardShortcutsTooltip from './KeyboardShortcutsTooltip';

interface CanvasToolbarProps {
  onAddNodeClick: () => void;
}

export default function CanvasToolbar({ onAddNodeClick }: CanvasToolbarProps) {
  const { currentProjectId, projects } = useProjectStore();
  const { undo, redo, canUndo, canRedo } = useProjectStore();
  const { zoomIn, zoomOut } = useReactFlow();

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(100);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Track zoom level via viewport changes instead of polling
  useOnViewportChange({
    onChange: useCallback(
      ({ zoom }: { x: number; y: number; zoom: number }) => {
        setCurrentZoom(Math.round(zoom * 100));
      },
      []
    ),
  });

  // Listen for save events in current window and storage events from other tabs
  useEffect(() => {
    const handleSaveComplete = () => {
      setIsSaving(true);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    };
    window.addEventListener('app:save-complete', handleSaveComplete);
    window.addEventListener('storage', handleSaveComplete);
    return () => {
      window.removeEventListener('app:save-complete', handleSaveComplete);
      window.removeEventListener('storage', handleSaveComplete);
    };
  }, []);

  // Set initial save time
  useEffect(() => {
    setLastSaved(new Date());
  }, [currentProjectId]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleZoomIn = useCallback(() => {
    void zoomIn();
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    void zoomOut();
  }, [zoomOut]);

  return (
    <Panel position="top-center" className="!m-0 pointer-events-none">
      <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-soft-lg border border-gray-100 px-4 py-2 pointer-events-auto animate-fade-in">
        {/* Project name */}
        {currentProject && (
          <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentProject.color }}
            />
            <span className="text-sm font-medium text-gray-900 max-w-[140px] truncate">
              {currentProject.name}
            </span>
          </div>
        )}

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleUndo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={handleRedo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a5 5 0 00-5 5v2a1 1 0 11-2 0v-2a7 7 0 017-7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={handleZoomOut}
            title="Zoom out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-xs text-gray-500 font-mono w-10 text-center">{currentZoom}%</span>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={handleZoomIn}
            title="Zoom in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Add node button */}
        <button
          className="btn-primary flex items-center gap-1.5 text-sm !px-3 !py-1.5"
          onClick={onAddNodeClick}
          title="Add new node"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Node
        </button>

        {/* Keyboard shortcuts */}
        <div className="pl-2 border-l border-gray-200">
          <KeyboardShortcutsTooltip>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Keyboard shortcuts"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2 1a1 1 0 000 2h10a1 1 0 100-2H5zm0 4a1 1 0 100 2h4a1 1 0 100-2H5z" clipRule="evenodd" />
              </svg>
            </button>
          </KeyboardShortcutsTooltip>
        </div>

        {/* Save indicator */}
        <div className="pl-2 border-l border-gray-200">
          <div className="flex items-center gap-1.5 text-xs">
            {isSaving ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                <span className="text-gray-500">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-gray-400">{formatDate(lastSaved)}</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-gray-400">Not saved</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
