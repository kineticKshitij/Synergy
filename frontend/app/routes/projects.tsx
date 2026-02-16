import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { projectService } from '~/services/project.service';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { SearchBar } from '~/components/SearchBar';
import { EmptyState } from '~/components/EmptyState';
import { ProjectFilters } from '~/components/ProjectFilters';
import { BulkActionsBar } from '~/components/BulkActionsBar';
import { ProjectListItem } from '~/components/ProjectListItem';
import { ProjectTimelineView } from '~/components/ProjectTimelineView';
import { Plus, Grid, List, Calendar, Loader2 } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    description: string;
    status: string;
    priority: string;
    owner: {
        id: number;
        username: string;
        email: string;
    };
    team_members: any[];
    start_date: string | null;
    end_date: string | null;
    budget: string | null;
    progress: number;
    created_at: string;
    updated_at: string;
    task_count: number;
}

type ViewMode = 'grid' | 'list' | 'timeline';

function ProjectsContent() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [ownerFilter, setOwnerFilter] = useState('all');
    const [sortBy, setSortBy] = useState('created_desc');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await projectService.getProjects();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get unique owners for filter
    const owners = Array.from(new Set(projects.map((p) => p.owner)))
        .filter(Boolean)
        .map((owner) => ({ id: owner.id, username: owner.username }));

    // Filter projects
    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
        const matchesOwner =
            ownerFilter === 'all' || project.owner?.id.toString() === ownerFilter;
        return matchesSearch && matchesStatus && matchesPriority && matchesOwner;
    });

    // Sort projects
    const sortedProjects = [...filteredProjects].sort((a, b) => {
        switch (sortBy) {
            case 'created_desc':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            case 'created_asc':
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'progress_desc':
                return b.progress - a.progress;
            case 'progress_asc':
                return a.progress - b.progress;
            case 'priority_desc':
                const priorityOrder: Record<string, number> = {
                    urgent: 4,
                    high: 3,
                    medium: 2,
                    low: 1,
                };
                return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            default:
                return 0;
        }
    });

    const hasActiveFilters =
        searchQuery !== '' ||
        statusFilter !== 'all' ||
        priorityFilter !== 'all' ||
        ownerFilter !== 'all';

    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPriorityFilter('all');
        setOwnerFilter('all');
    };

    const handleToggleSelect = (projectId: number) => {
        const newSelection = new Set(selectedProjects);
        if (newSelection.has(projectId)) {
            newSelection.delete(projectId);
        } else {
            newSelection.add(projectId);
        }
        setSelectedProjects(newSelection);
    };

    const handleBulkDelete = async () => {
        if (
            !confirm(
                `Are you sure you want to delete ${selectedProjects.size} project(s)?`
            )
        )
            return;

        try {
            for (const projectId of Array.from(selectedProjects)) {
                await projectService.deleteProject(projectId);
            }
            setSelectedProjects(new Set());
            await loadProjects();
        } catch (error) {
            console.error('Failed to delete projects:', error);
            alert('Failed to delete some projects');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                            Projects
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400">
                            Manage and track your projects
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title="Grid view"
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title="List view"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('timeline')}
                                className={`p-2 rounded transition-all ${
                                    viewMode === 'timeline'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title="Timeline view"
                            >
                                <Calendar className="w-4 h-4" />
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/projects/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            New Project
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search projects by name or description..."
                    />
                </div>

                {/* Filters */}
                <div className="mb-6">
                    <ProjectFilters
                        statusFilter={statusFilter}
                        priorityFilter={priorityFilter}
                        ownerFilter={ownerFilter}
                        sortBy={sortBy}
                        onStatusChange={setStatusFilter}
                        onPriorityChange={setPriorityFilter}
                        onOwnerChange={setOwnerFilter}
                        onSortChange={setSortBy}
                        onClearFilters={handleClearFilters}
                        owners={owners}
                        hasActiveFilters={hasActiveFilters}
                    />
                </div>

                {/* Projects Display */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                ) : sortedProjects.length === 0 ? (
                    <EmptyState
                        icon={projects.length === 0 ? '📁' : '🔍'}
                        title={
                            projects.length === 0 ? 'No projects yet' : 'No projects found'
                        }
                        description={
                            projects.length === 0
                                ? 'Get started by creating your first project'
                                : 'Try adjusting your filters or search query'
                        }
                        action={
                            projects.length === 0
                                ? {
                                      label: 'Create Your First Project',
                                      onClick: () => navigate('/projects/new'),
                                  }
                                : undefined
                        }
                    />
                ) : viewMode === 'timeline' ? (
                    <ProjectTimelineView projects={sortedProjects} />
                ) : viewMode === 'list' ? (
                    <div className="space-y-3">
                        {sortedProjects.map((project) => (
                            <ProjectListItem
                                key={project.id}
                                project={project}
                                isSelected={selectedProjects.has(project.id)}
                                onToggleSelect={() => handleToggleSelect(project.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                isSelected={selectedProjects.has(project.id)}
                                onToggleSelect={() => handleToggleSelect(project.id)}
                                onClick={() => navigate(`/projects/${project.id}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {!loading && sortedProjects.length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Showing{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-50">
                                {sortedProjects.length}
                            </span>{' '}
                            of{' '}
                            <span className="font-semibold text-slate-900 dark:text-slate-50">
                                {projects.length}
                            </span>{' '}
                            projects
                        </p>
                    </div>
                )}

                {/* Bulk Actions */}
                <BulkActionsBar
                    selectedCount={selectedProjects.size}
                    onClearSelection={() => setSelectedProjects(new Set())}
                    onDelete={handleBulkDelete}
                />
            </main>
        </div>
    );
}

interface ProjectCardProps {
    project: Project;
    isSelected: boolean;
    onToggleSelect: () => void;
    onClick: () => void;
}

function ProjectCard({ project, isSelected, onToggleSelect, onClick }: ProjectCardProps) {
    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            planning: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
            active: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300',
            on_hold: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
            completed:
                'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300',
            cancelled: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300',
        };
        return colors[status] || colors.planning;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'border-green-500 text-green-600 dark:text-green-400',
            medium: 'border-amber-500 text-amber-600 dark:text-amber-400',
            high: 'border-orange-500 text-orange-600 dark:text-orange-400',
            urgent: 'border-red-500 text-red-600 dark:text-red-400',
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div
            className={`group bg-white dark:bg-slate-900 border rounded-xl p-5 hover:shadow-lg transition-all relative ${
                isSelected
                    ? 'border-blue-500 dark:border-blue-400 shadow-md'
                    : 'border-slate-200 dark:border-slate-800'
            }`}
        >
            {/* Checkbox */}
            <div className="absolute top-3 left-3 z-10">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect();
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
            </div>

            <div className="cursor-pointer ml-6" onClick={onClick}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                        {project.name}
                    </h3>
                    <div
                        className={`ml-2 w-3 h-3 rounded-full border-2 ${getPriorityColor(
                            project.priority
                        )}`}
                        title={`${project.priority} priority`}
                    />
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {project.description || 'No description provided'}
                </p>

                {/* Status */}
                <div className="mb-4">
                    <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            project.status
                        )}`}
                    >
                        {project.status.replace('_', ' ')}
                    </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500 dark:text-slate-400">Progress</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">
                            {project.progress}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-3">
                        <span title="Tasks">📋 {project.task_count || 0}</span>
                        <span title="Team">👥 {project.team_members.length + 1}</span>
                    </div>
                    {project.end_date && (
                        <span>{new Date(project.end_date).toLocaleDateString()}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Projects() {
    return (
        <ProtectedRoute>
            <ProjectsContent />
        </ProtectedRoute>
    );
}
