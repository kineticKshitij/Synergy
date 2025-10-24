import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { projectService } from '~/services/project.service';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';

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
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Projects</h1>
                            <p className="text-gray-400 mt-2">Manage your projects and track progress</p>
                        </div>
                        <Link
                            to="/projects/new"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <span>✨</span>
                            New Project
                        </Link>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="md:col-span-1">
                        <input
                            type="text"
                            placeholder="🔍 Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="planning">📋 Planning</option>
                            <option value="active">🚀 Active</option>
                            <option value="on_hold">⏸️ On Hold</option>
                            <option value="completed">✅ Completed</option>
                            <option value="cancelled">❌ Cancelled</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
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

            {/* Projects Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-blue-500"></div>
                        <p className="mt-4 text-gray-400">Loading projects...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📁</div>
                        <h3 className="text-xl font-semibold mb-2">No projects found</h3>
                        <p className="text-gray-400 mb-6">
                            {projects.length === 0 ? "Get started by creating your first project" : "Try adjusting your filters"}
                        </p>
                        {projects.length === 0 && (
                            <Link
                                to="/projects/new"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
                            >
                                <span>✨</span>
                                Create Your First Project
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Link
                                key={project.id}
                                to={`/projects/${project.id}`}
                                className="block bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-blue-500/50 hover:bg-gray-800 transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-semibold group-hover:text-blue-400 transition-colors line-clamp-2">
                                        {project.name}
                                    </h3>
                                    {getPriorityBadge(project.priority)}
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
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all"
                                            style={{ width: `${project.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-700">
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-400" title="Tasks">
                                            📋 {project.task_count || 0}
                                        </span>
                                        <span className="text-gray-400" title="Team Members">
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
                        ))}
                    </div>
                )}

                {/* Results count */}
                {!loading && filteredProjects.length > 0 && (
                    <div className="mt-8 text-center text-gray-400 text-sm">
                        Showing {filteredProjects.length} of {projects.length} projects
                    </div>
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
