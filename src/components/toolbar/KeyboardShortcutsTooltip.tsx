import { useState, useEffect } from 'react';

interface KeyboardShortcut {
  keys: string;
  description: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  { keys: 'Double-click', description: 'Add new node' },
  { keys: 'Enter', description: 'Edit selected node' },
  { keys: 'Delete / Backspace', description: 'Delete selected' },
  { keys: 'Escape', description: 'Stop editing / Deselect' },
  { keys: 'Ctrl+Z', description: 'Undo' },
  { keys: 'Ctrl+Shift+Z', description: 'Redo' },
  { keys: 'Right-click', description: 'Context menu' },
  { keys: 'Shift+Click', description: 'Multi-select nodes' },
];

interface KeyboardShortcutsTooltipProps {
  children: React.ReactNode;
}

export default function KeyboardShortcutsTooltip({ children }: KeyboardShortcutsTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative inline-flex">
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 right-0 z-50 bg-white rounded-xl shadow-soft-lg border border-gray-100 p-4 w-[260px] animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900">Keyboard Shortcuts</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{shortcut.description}</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-[10px] border border-gray-200">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
