import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    due_date: string | null;
    status: string;
    priority: string;
}

interface Milestone {
    id: number;
    name: string;
    due_date: string;
    status: string;
    progress: number;
}

interface CalendarViewProps {
    tasks: Task[];
    milestones?: Milestone[];
    onTaskClick: (task: Task) => void;
    onMilestoneClick?: (milestone: Milestone) => void;
}

export default function CalendarView({ tasks, milestones = [], onTaskClick, onMilestoneClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDateKey = (year: number, month: number, day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getItemsForDate = (dateKey: string) => {
        const dayTasks = tasks.filter(task => task.due_date?.startsWith(dateKey));
        const dayMilestones = milestones.filter(milestone => milestone.due_date?.startsWith(dateKey));
        return { tasks: dayTasks, milestones: dayMilestones };
    };

    const isToday = (year: number, month: number, day: number) => {
        const today = new Date();
        return (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate()
        );
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);

        const days = [];
        const weeks = [];

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDateKey(year, month, day);
            const { tasks: dayTasks, milestones: dayMilestones } = getItemsForDate(dateKey);
            const todayClass = isToday(year, month, day) ? 'bg-blue-50 border-2 border-blue-400' : 'border border-gray-200';

            days.push(
                <div
                    key={day}
                    className={`min-h-[100px] p-2 ${todayClass} hover:bg-gray-50 transition-colors`}
                >
                    <div className="font-semibold text-sm text-gray-700 mb-1">{day}</div>
                    
                    <div className="space-y-1">
                        {dayMilestones.map(milestone => (
                            <div
                                key={`milestone-${milestone.id}`}
                                onClick={() => onMilestoneClick?.(milestone)}
                                className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded cursor-pointer truncate"
                                title={milestone.name}
                            >
                                🎯 {milestone.name}
                            </div>
                        ))}
                        
                        {dayTasks.map(task => {
                            const priorityColor = {
                                urgent: 'bg-red-100 hover:bg-red-200 text-red-800',
                                high: 'bg-orange-100 hover:bg-orange-200 text-orange-800',
                                medium: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
                                low: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
                            }[task.priority] || 'bg-gray-100 hover:bg-gray-200 text-gray-800';

                            return (
                                <div
                                    key={`task-${task.id}`}
                                    onClick={() => onTaskClick(task)}
                                    className={`text-xs px-2 py-1 ${priorityColor} rounded cursor-pointer truncate`}
                                    title={task.title}
                                >
                                    {task.status === 'done' ? '✓ ' : ''}
                                    {task.title}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Group into weeks
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(
                <div key={`week-${i}`} className="grid grid-cols-7 gap-px bg-gray-200">
                    {days.slice(i, i + 7)}
                </div>
            );
        }

        return weeks;
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 mb-px">
                {dayNames.map(day => (
                    <div
                        key={day}
                        className="bg-gray-50 text-center py-2 text-sm font-semibold text-gray-700"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="space-y-px">
                {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                    <span>Milestones</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                    <span>Urgent</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
                    <span>High</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                    <span>Medium</span>
                </div>
            </div>
        </div>
    );
}
