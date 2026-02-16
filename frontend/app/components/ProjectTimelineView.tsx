import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Calendar } from 'lucide-react';

interface ProjectTimelineViewProps {
    projects: any[];
}

export function ProjectTimelineView({ projects }: ProjectTimelineViewProps) {
    const navigate = useNavigate();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Filter projects with dates
    const projectsWithDates = projects.filter((p) => p.start_date && p.end_date);

    if (projectsWithDates.length === 0) {
        return (
            <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    No timeline available
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                    Projects need start and end dates to appear in timeline view
                </p>
            </div>
        );
    }

    // Calculate timeline range
    const allDates = projectsWithDates.flatMap((p) => [
        new Date(p.start_date),
        new Date(p.end_date),
    ]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Generate months between min and max
    const months: Date[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (current <= maxDate) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
    }

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayWidth = 4; // pixels per day
    const timelineWidth = totalDays * dayWidth;

    const getPositionAndWidth = (project: any) => {
        const start = new Date(project.start_date);
        const end = new Date(project.end_date);
        const startOffset = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        return {
            left: startOffset * dayWidth,
            width: Math.max(duration * dayWidth, 80), // Minimum 80px width
        };
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: 'bg-green-500',
            medium: 'bg-blue-500',
            high: 'bg-orange-500',
            urgent: 'bg-red-500',
        };
        return colors[priority] || colors.medium;
    };

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                    Timeline View
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Visualize project schedules and durations
                </p>
            </div>

            <div className="overflow-x-auto" ref={scrollRef}>
                {/* Timeline Header - Months */}
                <div
                    className="relative mb-4 border-b border-slate-200 dark:border-slate-800 pb-2"
                    style={{ width: timelineWidth }}
                >
                    {months.map((month, idx) => {
                        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
                        const daysInMonth = monthEnd.getDate();
                        const offset = Math.ceil(
                            (monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
                        );

                        return (
                            <div
                                key={idx}
                                className="absolute top-0"
                                style={{
                                    left: offset * dayWidth,
                                    width: daysInMonth * dayWidth,
                                }}
                            >
                                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {month.toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric',
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Projects Timeline */}
                <div className="relative" style={{ width: timelineWidth, minHeight: '400px' }}>
                    {/* Today line */}
                    {(() => {
                        const today = new Date();
                        if (today >= minDate && today <= maxDate) {
                            const todayOffset = Math.ceil(
                                (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                    style={{ left: todayOffset * dayWidth }}
                                >
                                    <div className="absolute -top-1 -left-8 text-xs font-semibold text-red-500">
                                        Today
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    {/* Project bars */}
                    {projectsWithDates.map((project, idx) => {
                        const { left, width } = getPositionAndWidth(project);
                        const color = getPriorityColor(project.priority);

                        return (
                            <div
                                key={project.id}
                                className="absolute hover:z-20 transition-all"
                                style={{
                                    top: idx * 60,
                                    left,
                                    width,
                                }}
                            >
                                <div
                                    onClick={() => navigate(`/projects/${project.id}`)}
                                    className={`h-10 ${color} rounded-lg cursor-pointer hover:shadow-lg transition-all flex items-center px-3 relative group`}
                                >
                                    <span className="text-xs font-medium text-white truncate">
                                        {project.name}
                                    </span>

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg min-w-48">
                                            <div className="font-semibold mb-1">{project.name}</div>
                                            <div className="text-slate-300">
                                                {new Date(project.start_date).toLocaleDateString()} -{' '}
                                                {new Date(project.end_date).toLocaleDateString()}
                                            </div>
                                            <div className="mt-1 text-slate-300">
                                                Progress: {project.progress}%
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress indicator */}
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-white/50 rounded-full"
                                        style={{ width: `${project.progress}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
