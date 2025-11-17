import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: {
        id: number;
        username: string;
    } | null;
    due_date: string | null;
    has_attachments?: boolean;
}

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: number, newStatus: string) => Promise<void>;
}

const STATUS_COLUMNS = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100 border-gray-300' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100 border-blue-300' },
    { id: 'review', title: 'In Review', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'done', title: 'Done', color: 'bg-green-100 border-green-300' },
];

const PRIORITY_COLORS = {
    low: 'bg-gray-500',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
};

export default function KanbanBoard({ tasks, onTaskClick, onStatusChange }: KanbanBoardProps) {
    const [isDragging, setIsDragging] = useState(false);

    const tasksByStatus = STATUS_COLUMNS.reduce((acc, column) => {
        acc[column.id] = tasks.filter(task => task.status === column.id);
        return acc;
    }, {} as Record<string, Task[]>);

    const handleDragStart = () => {
        setIsDragging(true);
    };

    const handleDragEnd = async (result: DropResult) => {
        setIsDragging(false);

        const { destination, source, draggableId } = result;

        // Dropped outside the list
        if (!destination) {
            return;
        }

        // No change in position
        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Update task status
        const taskId = parseInt(draggableId);
        const newStatus = destination.droppableId;

        try {
            await onStatusChange(taskId, newStatus);
        } catch (error) {
            console.error('Failed to update task status:', error);
        }
    };

    const getPriorityBadge = (priority: string) => {
        const color = PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'bg-gray-500';
        return (
            <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={priority}></span>
        );
    };

    return (
        <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {STATUS_COLUMNS.map(column => (
                    <div key={column.id} className="flex-shrink-0 w-80">
                        <div className={`rounded-lg border-2 ${column.color} p-3`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                                <span className="bg-white text-gray-700 rounded-full px-2 py-1 text-xs font-medium">
                                    {tasksByStatus[column.id]?.length || 0}
                                </span>
                            </div>

                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`space-y-2 min-h-[200px] ${
                                            snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg' : ''
                                        }`}
                                    >
                                        {tasksByStatus[column.id]?.map((task, index) => (
                                            <Draggable
                                                key={task.id}
                                                draggableId={task.id.toString()}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        onClick={() => !isDragging && onTaskClick(task)}
                                                        className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                                                            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                                        }`}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-medium text-gray-900 text-sm flex-1 pr-2">
                                                                {task.title}
                                                            </h4>
                                                            {getPriorityBadge(task.priority)}
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                {task.assigned_to && (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-medium">
                                                                            {task.assigned_to.username.charAt(0).toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {task.has_attachments && (
                                                                    <span title="Has attachments">📎</span>
                                                                )}
                                                            </div>

                                                            {task.due_date && (
                                                                <span className="text-xs">
                                                                    {new Date(task.due_date).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                    })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
