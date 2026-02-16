import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router';
import { Columns3, Filter, Calendar, User, AlertCircle, ChevronDown } from 'lucide-react';
import api from '~/services/api';
import { useAuth } from '~/contexts/AuthContext';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: {
    id: number;
    username: string;
    full_name: string;
  } | null;
  project: {
    id: number;
    name: string;
  };
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
}

interface Project {
  id: number;
  name: string;
}

const COLUMNS = {
  todo: { title: 'To Do', color: 'bg-gray-100 border-gray-300' },
  in_progress: { title: 'In Progress', color: 'bg-blue-50 border-blue-300' },
  review: { title: 'In Review', color: 'bg-yellow-50 border-yellow-300' },
  done: { title: 'Done', color: 'bg-green-50 border-green-300' }
} as const;

const PRIORITY_COLORS = {
  low: 'bg-gray-200 text-gray-700',
  medium: 'bg-blue-200 text-blue-700',
  high: 'bg-orange-200 text-orange-700',
  urgent: 'bg-red-200 text-red-700'
};

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        api.get('/tasks/'),
        api.get('/projects/')
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    // No change in position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId as Task['status'];

    // Optimistically update UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Update on backend
    try {
      await api.patch(`/tasks/${taskId}/`, { status: newStatus });
    } catch (err: any) {
      console.error('Failed to update task:', err);
      setError('Failed to update task status');
      // Revert on error
      fetchData();
    }
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (selectedProject && task.project.id !== selectedProject) return false;
      if (selectedAssignee === 'me' && task.assigned_to?.id !== user?.id) return false;
      if (selectedAssignee === 'unassigned' && task.assigned_to !== null) return false;
      return true;
    });
  };

  const getTasksByStatus = (status: Task['status']) => {
    return getFilteredTasks().filter(task => task.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, class: 'text-red-600' };
    if (diffDays === 0) return { text: 'Due today', class: 'text-orange-600' };
    if (diffDays === 1) return { text: 'Due tomorrow', class: 'text-yellow-600' };
    if (diffDays <= 7) return { text: `${diffDays}d left`, class: 'text-blue-600' };
    return { text: date.toLocaleDateString(), class: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Columns3 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
                <p className="text-sm text-gray-600">Drag tasks to update their status</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                <select
                  value={selectedProject || ''}
                  onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Team Members</option>
                  <option value="me">Assigned to Me</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(COLUMNS).map(([status, { title, color }]) => {
              const columnTasks = getTasksByStatus(status as Task['status']);
              
              return (
                <div key={status} className="flex flex-col">
                  {/* Column Header */}
                  <div className={`${color} border-2 rounded-t-lg px-4 py-3`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-700">
                        {columnTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Droppable Area */}
                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-gray-100 border-2 border-t-0 rounded-b-lg p-3 min-h-[500px] transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                        }`}
                      >
                        <div className="space-y-3">
                          {columnTasks.map((task, index) => {
                            const dueDate = formatDate(task.due_date);
                            
                            return (
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
                                    onClick={() => navigate(`/team-dashboard/task/${task.id}`)}
                                    className={`bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
                                      snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''
                                    }`}
                                  >
                                    {/* Task Title */}
                                    <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                                      {task.title}
                                    </h4>

                                    {/* Project Name */}
                                    <p className="text-xs text-gray-600 mb-2">
                                      📁 {task.project.name}
                                    </p>

                                    {/* Description Preview */}
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Task Meta */}
                                    <div className="flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        {/* Priority Badge */}
                                        <span className={`px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                          {task.priority}
                                        </span>
                                        
                                        {/* Due Date */}
                                        {dueDate && (
                                          <span className={`flex items-center gap-1 ${dueDate.class}`}>
                                            <Calendar className="w-3 h-3" />
                                            {dueDate.text}
                                          </span>
                                        )}
                                      </div>

                                      {/* Assignee Avatar */}
                                      {task.assigned_to ? (
                                        <div
                                          className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                                          title={task.assigned_to.full_name || task.assigned_to.username}
                                        >
                                          {(task.assigned_to.full_name || task.assigned_to.username)
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </div>
                                      ) : (
                                        <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center" title="Unassigned">
                                          <User className="w-4 h-4 text-gray-600" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Time Tracking */}
                                    {(task.estimated_hours || task.actual_hours) && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                                        {task.estimated_hours && (
                                          <span>Est: {task.estimated_hours}h</span>
                                        )}
                                        {task.estimated_hours && task.actual_hours && <span> • </span>}
                                        {task.actual_hours && (
                                          <span>Actual: {task.actual_hours}h</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          
                          {/* Empty State */}
                          {columnTasks.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                              <p className="text-sm">No tasks</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
