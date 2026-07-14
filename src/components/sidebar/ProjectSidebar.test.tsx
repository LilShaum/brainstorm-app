import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectSidebar from './ProjectSidebar';
import { useProjectStore } from '@/store/projectStore';
import type { Project, BrainstormNode } from '@/types';

// Reset the store before each test
beforeEach(() => {
  useProjectStore.setState({
    currentProjectId: null,
    projects: [],
    nodes: [],
    edges: [],
    undoStack: [],
    redoStack: [],
  });
});

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: `proj-${Date.now()}-${Math.random()}`,
    name: 'Test Project',
    description: 'A test project',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeNode(overrides: Partial<BrainstormNode> = {}): BrainstormNode {
  return {
    id: `node-${Date.now()}-${Math.random()}`,
    projectId: 'proj-1',
    text: 'Test Node',
    color: '#ef4444',
    shape: 'rounded',
    size: 'medium',
    position: { x: 100, y: 100 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function renderSidebar(props?: {
  isCollapsed?: boolean;
  isDarkMode?: boolean;
  onToggleCollapse?: () => void;
  onToggleDarkMode?: () => void;
}) {
  return render(
    <ProjectSidebar
      isCollapsed={props?.isCollapsed ?? false}
      onToggleCollapse={props?.onToggleCollapse ?? (() => {})}
      isDarkMode={props?.isDarkMode ?? false}
      onToggleDarkMode={props?.onToggleDarkMode ?? (() => {})}
    />
  );
}

describe('ProjectSidebar', () => {
  it('renders the Projects header', () => {
    renderSidebar();
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    renderSidebar();
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first project to get started')).toBeInTheDocument();
  });

  it('renders project list when projects exist', () => {
    const project = makeProject({ id: 'proj-1', name: 'My Project' });
    useProjectStore.getState().createProject(project);

    renderSidebar();

    expect(screen.getByText('My Project')).toBeInTheDocument();
    expect(screen.queryByText('No projects yet')).not.toBeInTheDocument();
  });

  it('shows correct node count for each project', () => {
    const project = makeProject({ id: 'proj-1', name: 'P1' });
    useProjectStore.getState().createProject(project);
    useProjectStore.getState().addNode(makeNode({ id: 'n1', projectId: 'proj-1' }));
    useProjectStore.getState().addNode(makeNode({ id: 'n2', projectId: 'proj-1' }));

    renderSidebar();

    expect(screen.getByText('2 nodes')).toBeInTheDocument();
  });

  it('shows singular "node" for project with 1 node', () => {
    const project = makeProject({ id: 'proj-1', name: 'P1' });
    useProjectStore.getState().createProject(project);
    useProjectStore.getState().addNode(makeNode({ id: 'n1', projectId: 'proj-1' }));

    renderSidebar();

    expect(screen.getByText('1 node')).toBeInTheDocument();
  });

  it('hides sidebar content when collapsed', () => {
    renderSidebar({ isCollapsed: true });

    expect(screen.queryByText('Projects')).not.toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    const onToggleCollapse = vi.fn();
    renderSidebar({ isCollapsed: true, onToggleCollapse });

    const expandBtn = screen.getByTitle('Expand sidebar');
    expect(expandBtn).toBeInTheDocument();
  });

  it('calls onToggleDarkMode when dark mode button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleDarkMode = vi.fn();
    renderSidebar({ onToggleDarkMode });

    const darkModeBtn = screen.getByText('Dark mode');
    await user.click(darkModeBtn);

    expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  it('shows "Light mode" label when isDarkMode is true', () => {
    renderSidebar({ isDarkMode: true });

    expect(screen.getByText('Light mode')).toBeInTheDocument();
    expect(screen.queryByText('Dark mode')).not.toBeInTheDocument();
  });

  it('shows search input when projects exist', () => {
    const project = makeProject({ id: 'proj-1', name: 'P1' });
    useProjectStore.getState().createProject(project);

    renderSidebar();

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
  });

  it('filters projects by search query', async () => {
    const user = userEvent.setup();
    const p1 = makeProject({ id: 'proj-1', name: 'React App' });
    const p2 = makeProject({ id: 'proj-2', name: 'Vue Tutorial' });
    useProjectStore.getState().createProject(p1);
    useProjectStore.getState().createProject(p2);

    renderSidebar();

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'React');

    expect(screen.getByText('React App')).toBeInTheDocument();
    expect(screen.queryByText('Vue Tutorial')).not.toBeInTheDocument();
  });
});
