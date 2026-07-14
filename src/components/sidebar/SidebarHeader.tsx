interface SidebarHeaderProps {
  onToggleCollapse: () => void;
  onAddProject: () => void;
}

export default function SidebarHeader({ onToggleCollapse, onAddProject }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
        Projects
      </h2>
      <div className="flex items-center gap-1">
        <button
          onClick={onAddProject}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 
                     hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 
                     dark:hover:text-primary-400 transition-colors"
          title="New project"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 
                     hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 
                     dark:hover:text-gray-300 transition-colors"
          title="Collapse sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
