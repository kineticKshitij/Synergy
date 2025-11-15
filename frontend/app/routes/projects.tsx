import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { projectService } from '~/services/project.service';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { SearchBar } from '~/components/SearchBar';
import { EmptyState } from '~/components/EmptyState';
import { LoadingSpinner } from '~/components/LoadingSpinner';
import { Plus, Filter, Grid, List } from 'lucide-react';

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

function ProjectsContent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const getStatusBadge = (status: string) => {
        const badges = {
            planning: { icon: '📋', label: 'Planning', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            active: { icon: '🚀', label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            on_hold: { icon: '⏸️', label: 'On Hold', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            completed: { icon: '✅', label: 'Completed', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            cancelled: { icon: '❌', label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
        };
        const badge = badges[status as keyof typeof badges] || badges.planning;
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <span>{badge.icon}</span>
                {badge.label}
            </span>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const badges = {
            low: { icon: '🟢', label: 'Low', color: 'text-green-400' },
            medium: { icon: '🟡', label: 'Medium', color: 'text-yellow-400' },
            high: { icon: '🟠', label: 'High', color: 'text-orange-400' },
            urgent: { icon: '🔴', label: 'Urgent', color: 'text-red-400' },
        };
        const badge = badges[priority as keyof typeof badges] || badges.medium;
        return (
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${badge.color}`}>
                <span>{badge.icon}</span>
                {badge.label}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />

            {/* Header */}
            <div className="border-b border-gray-800 pt-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Projects
                            </h1>
                            <p className="text-gray-400 mt-2">Manage your projects and track progress</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded transition-all ${
                                        viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="Grid view"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded transition-all ${
                                        viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="List view"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>

                            <Link
                                to="/projects/new"
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <Plus className="w-5 h-5" />
                                New Project
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="🔍 Search projects by name or description..."
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none text-white"
                                >
                                    <option value="all">All Status</option>
                                    <option value="planning">📋 Planning</option>
                                    <option value="active">🚀 Active</option>
                                    <option value="on_hold">⏸️ On Hold</option>
                                    <option value="completed">✅ Completed</option>
                                    <option value="cancelled">❌ Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div>
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none text-white"
                                >
                                    <option value="all">All Priority</option>
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🟠 High</option>
                                    <option value="urgent">🔴 Urgent</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchQuery || statusFilter !== 'all' || priorityFilter !== 'all') && (
                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                            <span className="text-sm text-gray-400">Active filters:</span>
                            {searchQuery && (
                                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm flex items-center gap-2">
                                    Search: "{searchQuery}"
                                    <button onClick={() => setSearchQuery('')} className="hover:text-blue-300">×</button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm flex items-center gap-2">
                                    Status: {statusFilter}
                                    <button onClick={() => setStatusFilter('all')} className="hover:text-green-300">×</button>
                                </span>
                            )}
                            {priorityFilter !== 'all' && (
                                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm flex items-center gap-2">
                                    Priority: {priorityFilter}
                                    <button onClick={() => setPriorityFilter('all')} className="hover:text-purple-300">×</button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setPriorityFilter('all');
                                }}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {loading ? (
                    <LoadingSpinner size="lg" message="Loading projects..." />
                ) : filteredProjects.length === 0 ? (
                    <EmptyState
                        icon={projects.length === 0 ? "📁" : "🔍"}
                        title={projects.length === 0 ? "No projects yet" : "No projects found"}
                        description={
                            projects.length === 0
                                ? "Get started by creating your first project"
                                : "Try adjusting your filters or search query"
                        }
                        action={
                            projects.length === 0
                                ? {
                                    label: "Create Your First Project",
                                    onClick: () => window.location.href = '/projects/new'
                                }
                                : undefined
                        }
                    />
                ) : (
                    <>
                        <div className={
                            viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "space-y-4"
                        }>
                            {filteredProjects.map((project) => (
                                viewMode === 'grid' ? (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="block bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800 transition-all group card-hover"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors line-clamp-2 flex-1">
                                                {project.name}
                                            </h3>
                                            <div className="ml-2">
                                                {getPriorityBadge(project.priority)}
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                            {project.description || 'No description provided'}
                                        </p>

                                        {/* Status Badge */}
                                        <div className="mb-4">
                                            {getStatusBadge(project.status)}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-xs mb-2">
                                                <span className="text-gray-400">Progress</span>
                                                <span className="text-blue-400 font-semibold">{project.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${project.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-700">
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-400 flex items-center gap-1" title="Tasks">
                                                    📋 {project.task_count || 0}
                                                </span>
                                                <span className="text-gray-400 flex items-center gap-1" title="Team Members">
                                                    👥 {project.team_members.length + 1}
                                                </span>
                                            </div>
                                            {project.budget && (
                                                <span className="text-green-400 font-medium">
                                                    ${parseFloat(project.budget).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Dates */}
                                        {(project.start_date || project.end_date) && (
                                            <div className="mt-3 text-xs text-gray-500">
                                                {project.start_date && (
                                                    <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                                                )}
                                                {project.start_date && project.end_date && <span className="mx-2">•</span>}
                                                {project.end_date && (
                                                    <span>Due: {new Date(project.end_date).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                ) : (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="block bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 hover:bg-gray-800 transition-all group"
                                    >
                                        <div className="flex items-center gap-6">
                                            {/* Project Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors truncate">
                                                        {project.name}
                                                    </h3>
                                                    {getStatusBadge(project.status)}
                                                    {getPriorityBadge(project.priority)}
                                                </div>
                                                <p className="text-gray-400 line-clamp-1 mb-3">
                                                    {project.description || 'No description'}
                                                </p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-gray-400">📋 {project.task_count || 0} tasks</span>
                                                    <span className="text-gray-400">👥 {project.team_members.length + 1} members</span>
                                                    {project.budget && (
                                                        <span className="text-green-400 font-medium">
                                                            ${parseFloat(project.budget).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="w-32 flex-shrink-0">
                                                <div className="text-center mb-2">
                                                    <span className="text-2xl font-bold text-blue-400">{project.progress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${project.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            ))}
                        </div>

                        {/* Results count */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-400 text-sm">
                                Showing <span className="font-semibold text-white">{filteredProjects.length}</span> of{' '}
                                <span className="font-semibold text-white">{projects.length}</span> projects
                            </p>
                        </div>
                    </>
                )}
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
