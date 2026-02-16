import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { projectService, type Project } from '~/services/project.service';

export function ProjectHealthGrid() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await projectService.getProjects();
                setProjects(data);
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const getProjectHealth = (project: Project) => {
        const progress = project.progress || 0;
        const now = new Date();
        const endDate = project.end_date ? new Date(project.end_date) : null;

        // Calculate expected progress based on timeline
        if (project.start_date && endDate) {
            const startDate = new Date(project.start_date);
            const totalDuration = endDate.getTime() - startDate.getTime();
            const elapsed = now.getTime() - startDate.getTime();
            const expectedProgress = (elapsed / totalDuration) * 100;

            if (progress >= expectedProgress * 0.9) {
                return { status: 'on-track', icon: CheckCircle, color: 'green' };
            } else if (progress >= expectedProgress * 0.7) {
                return { status: 'at-risk', icon: Clock, color: 'amber' };
            } else {
                return { status: 'delayed', icon: AlertCircle, color: 'red' };
            }
        }

        // Fallback based on progress
        if (progress >= 75) {
            return { status: 'on-track', icon: TrendingUp, color: 'green' };
        } else if (progress >= 40) {
            return { status: 'progressing', icon: Clock, color: 'blue' };
        } else {
            return { status: 'starting', icon: Clock, color: 'slate' };
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-28 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    No projects yet
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {projects.map((project) => {
                const health = getProjectHealth(project);
                const IconComponent = health.icon;

                return (
                    <div
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="group cursor-pointer rounded-lg bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 p-3 hover:shadow-md transition-all hover:scale-105"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div
                                className={`p-1.5 rounded ${
                                    health.color === 'green'
                                        ? 'bg-green-100 dark:bg-green-950/40'
                                        : health.color === 'amber'
                                        ? 'bg-amber-100 dark:bg-amber-950/40'
                                        : health.color === 'red'
                                        ? 'bg-red-100 dark:bg-red-950/40'
                                        : health.color === 'blue'
                                        ? 'bg-blue-100 dark:bg-blue-950/40'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                }`}
                            >
                                <IconComponent
                                    className={`w-3.5 h-3.5 ${
                                        health.color === 'green'
                                            ? 'text-green-600 dark:text-green-300'
                                            : health.color === 'amber'
                                            ? 'text-amber-600 dark:text-amber-300'
                                            : health.color === 'red'
                                            ? 'text-red-600 dark:text-red-300'
                                            : health.color === 'blue'
                                            ? 'text-blue-600 dark:text-blue-300'
                                            : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                />
                            </div>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                    project.priority === 'urgent' || project.priority === 'high'
                                        ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                                        : project.priority === 'medium'
                                        ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                }`}
                            >
                                {project.priority}
                            </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {project.name}
                        </h4>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {health.status}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                                {project.progress}%
                            </span>
                        </div>
                        <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-1.5 rounded-full transition-all ${
                                    health.color === 'green'
                                        ? 'bg-green-500'
                                        : health.color === 'amber'
                                        ? 'bg-amber-500'
                                        : health.color === 'red'
                                        ? 'bg-red-500'
                                        : 'bg-blue-500'
                                }`}
                                style={{ width: `${project.progress}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
