import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store/projectStore';
import SidebarHeader from './SidebarHeader';
import ProjectList from './ProjectList';
import CreateProjectModal from './CreateProjectModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { SunIcon, MoonIcon, ChevronRightIcon } from '@/components/ui/Icon';
import { createProject } from '@/utils';

interface ProjectSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function ProjectSidebar({
  isCollapsed,
  onToggleCollapse,
  isDarkMode,
  onToggleDarkMode,
}: ProjectSidebarProps) {
  const { projects, createProject: storeCreateProject, duplicateProject, deleteProject } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleCreateProject = useCallback(
    (name: string, description: string, color: string) => {
      const project = createProject(name, description, color);
      storeCreateProject(project);
    },
    [storeCreateProject]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateProject(id);
    },
    [duplicateProject]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteConfirmId(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmId) {
      deleteProject(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  }, [deleteConfirmId, deleteProject]);

  const deleteTarget = deleteConfirmId
    ? projects.find((p) => p.id === deleteConfirmId)
    : null;

  return (
    <>
      <div
        className={`h-full bg-white dark:bg-surface-dark border-r border-border dark:border-border-dark
                    flex flex-col overflow-hidden transition-all duration-300 ease-smooth flex-shrink-0
                    ${isCollapsed ? 'w-0' : 'w-[280px]'}`}
      >
        {!isCollapsed && (
          <div className="flex flex-col h-full w-[280px]">
            <SidebarHeader
              onToggleCollapse={onToggleCollapse}
              onAddProject={() => setShowCreateModal(true)}
            />

            <ProjectList
              onDeleteRequest={handleDeleteRequest}
              onDuplicateRequest={handleDuplicate}
            />

            {/* Sidebar footer: dark mode toggle */}
            <div className="px-3 py-3 border-t border-border dark:border-border-dark">
              <button
                onClick={onToggleDarkMode}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-soft text-sm
                           text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800
                           transition-colors duration-200"
              >
                {isDarkMode ? (
                  <SunIcon size="sm" />
                ) : (
                  <MoonIcon size="sm" />
                )}
                <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle button when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggleCollapse}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12
                     bg-white dark:bg-surface-dark
                     border border-l-0 border-border dark:border-border-dark rounded-r-lg
                     shadow-soft flex items-center justify-center text-gray-500
                     hover:text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800
                     transition-colors duration-200"
          title="Expand sidebar"
        >
          <ChevronRightIcon size="xs" />
        </button>
      )}

      {/* Create project modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateProject}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirmId && !!deleteTarget}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete project"
        size="sm"
        showCloseButton={false}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          This will also delete all nodes and connections in this project. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => setDeleteConfirmId(null)}
            variant="secondary"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="danger"
            size="sm"
          >
            Delete
          </Button>
        </div>
      </Modal>
    </>
  );
}
