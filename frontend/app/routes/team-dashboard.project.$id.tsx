import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import teamMemberService, { type TeamMemberDashboard } from '~/services/team-member.service';
import type { Route } from './+types/team-dashboard.project.$id';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Project Details - Team Dashboard - SynergyOS' },
        { name: 'description', content: 'View project details and assigned tasks' },
    ];
}

interface Project {
    id: number;
    title: string;
    description: string;
    priority: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    owner_name: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    due_date: string | null;
    assigned_to: number | null;
    assigned_to_name: string | null;
}

export default function TeamProjectView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const dashboardData = await teamMemberService.getDashboard();
            const foundProject = dashboardData.projects.find(
                (p: Project) => p.id === Number(id)
            );
            
            if (!foundProject) {
                setError('Project not found or you are not a team member');
                setLoading(false);
                return;
            }
            
            setProject(foundProject);

            // Fetch tasks for this project
            const allTasks = await teamMemberService.getMyTasks();
            const projectTasks = allTasks.filter(
                (t: any) => t.project === Number(id)
            );
            setTasks(projectTasks);
            
            setLoading(false);
        } catch (err: any) {
            console.error('Error fetching project:', err);
            setError(err.response?.data?.error || 'Failed to load project');
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'review': return 'bg-yellow-100 text-yellow-800';
            case 'done': return 'bg-green-100 text-green-800';
            case 'planning': return 'bg-purple-100 text-purple-800';
            case 'active': return 'bg-blue-100 text-blue-800';
            case 'on_hold': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'high': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading project...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <div className="text-xl text-red-600 mb-4">{error}</div>
                <button
                    onClick={() => navigate('/team-dashboard')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!project) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        to="/team-dashboard"
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {project.title}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Project Manager: {project.owner_name}
                        </p>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-900">{project.description || 'No description provided'}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(project.status)}`}>
                                    {project.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeClass(project.priority)}`}>
                                    {project.priority.toUpperCase()}
                                </span>
                            </div>
                            {project.start_date && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">Start Date</h3>
                                    <p className="text-gray-900">
                                        {new Date(project.start_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                            {project.end_date && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 mb-2">End Date</h3>
                                    <p className="text-gray-900">
                                        {new Date(project.end_date).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tasks Section */}
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-900">
                            My Tasks in this Project
                        </h2>
                    </div>

                    <div className="px-6 py-5">
                        {tasks.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No tasks assigned to you in this project</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/team-dashboard/task/${task.id}`)}
                                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {task.title}
                                            </h3>
                                            <div className="flex gap-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-gray-600 text-sm mb-3">
                                            {task.description || 'No description'}
                                        </p>

                                        <div className="flex justify-between items-center text-sm text-gray-500">
                                            <div>
                                                {task.assigned_to_name && (
                                                    <span>Assigned to: {task.assigned_to_name}</span>
                                                )}
                                            </div>
                                            {task.due_date && (
                                                <span>
                                                    Due: {new Date(task.due_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
