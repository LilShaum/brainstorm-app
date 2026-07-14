import { useState, useEffect } from 'react';
import { Panel } from '@xyflow/react';
import { useProjectStore } from '@/store/projectStore';
import { formatDate } from '@/utils';

interface CanvasControlsProps {
  onAddNode: () => void;
  onFitView: () => void;
}

export default function CanvasControls({ onAddNode, onFitView }: CanvasControlsProps) {
  const { currentProjectId, projects } = useProjectStore();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  // Track saves in the current window by subscribing to node/edge count changes
  // and using a custom event dispatched by the persistence layer
  useEffect(() => {
    const handleSaveComplete = () => {
      setIsSaving(true);
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 1000);
    };

    window.addEventListener('app:save-complete', handleSaveComplete);
    // Also listen for storage events (from other tabs)
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

  return (
    <>
      {/* Top-left: Add node + Fit view buttons */}
      <Panel position="top-left" className="flex gap-2">
        <button
          className="btn-primary flex items-center gap-2 text-sm"
          onClick={onAddNode}
          title="Add new node (or double-click canvas)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Idea
        </button>
        <button
          className="btn-secondary flex items-center gap-2 text-sm"
          onClick={onFitView}
          title="Fit view to all nodes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zM9 12a1 1 0 010-2h4a1 1 0 010 2h-4a1 1 0 010 2zM12 8a1 1 0 01-1 1H9a1 1 0 110-2h2a1 1 0 011 1zM15 5a1 1 0 100 2v1.586l2.293-2.293a1 1 0 011.414 1.414L16.414 10H18a1 1 0 110 2h-1a1 1 0 01-1-1V6a1 1 0 00-1-1z" />
            <path d="M2 15a1 1 0 001 1h1.586l-2.293 2.293a1 1 0 001.414 1.414L6 17.414V19a1 1 0 102 0v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 10-2 0v-1z" />
          </svg>
          Fit View
        </button>
      </Panel>

      {/* Top-right: Auto-save indicator */}
      <Panel position="top-right">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-soft text-sm">
          {isSaving ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-gray-600">Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-500">
                Saved {formatDate(lastSaved)}
              </span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-400">Not saved</span>
            </>
          )}
        </div>
      </Panel>

      {/* Bottom-center: Project info */}
      {currentProject && (
        <Panel position="bottom-center">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-soft text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentProject.color }}
            />
            <span className="text-gray-600 font-medium">{currentProject.name}</span>
          </div>
        </Panel>
      )}
    </>
  );
}
