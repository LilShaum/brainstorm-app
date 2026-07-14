import { useState, useCallback, useEffect } from 'react';
import BrainstormCanvas from '@/components/canvas/BrainstormCanvas';
import ProjectSidebar from '@/components/sidebar/ProjectSidebar';
import { loadPersistedState } from '@/store/persistence';
import { useProjectStore } from '@/store/projectStore';
import { useDarkMode } from '@/hooks/useDarkMode';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Load persisted state from IndexedDB on mount
  const loadState = useProjectStore((s) => s.loadState);
  useEffect(() => {
    let cancelled = false;
    void loadPersistedState().then((persisted) => {
      if (!cancelled && persisted) {
        loadState(persisted);
      }
    });
    return () => { cancelled = true; };
  }, [loadState]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas-bg dark:bg-canvas-dark">
      <div className="relative">
        <ProjectSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </div>
      <div className="flex-1 min-w-0">
        <BrainstormCanvas />
      </div>
    </div>
  );
}

export default App;
