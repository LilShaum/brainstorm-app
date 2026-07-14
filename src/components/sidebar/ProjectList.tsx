import { useState, useMemo } from 'react';
import { useProjectStore } from '@/store/projectStore';
import ProjectItem from './ProjectItem';

interface ProjectListProps {
  onDeleteRequest: (id: string) => void;
  onDuplicateRequest: (id: string) => void;
}

export default function ProjectList({ onDeleteRequest, onDuplicateRequest }: ProjectListProps) {
  const { projects, currentProjectId, nodes, switchProject } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const getNodeCount = (projectId: string): number => {
    return nodes.filter((n) => n.projectId === projectId).length;
  };

  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {/* Empty state illustration */}
        <div className="w-20 h-20 mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-10 h-10 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859a1.5 1.5 0 001.5-1.5v-4.125a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v4.125a1.5 1.5 0 001.5 1.5z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2.25V12m0 0l3-3m-3 3l-3-3"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
          No projects yet
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Create your first project to get started
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 
                       dark:border-gray-700 rounded-md text-gray-900 dark:text-gray-100 
                       placeholder-gray-400 dark:placeholder-gray-500 outline-none 
                       focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          />
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto py-1">
        {filteredProjects.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No projects match your search
            </p>
          </div>
        ) : (
          filteredProjects.map((project) => (
            <ProjectItem
              key={project.id}
              projectId={project.id}
              name={project.name}
              color={project.color}
              updatedAt={project.updatedAt}
              isActive={project.id === currentProjectId}
              nodeCount={getNodeCount(project.id)}
              onSwitch={() => switchProject(project.id)}
              onDelete={() => onDeleteRequest(project.id)}
              onDuplicate={() => onDuplicateRequest(project.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
