import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useNavigate, useSearchParams } from 'react-router';
import { Columns3, Filter, Calendar, User, AlertCircle, ChevronDown, ArrowLeft } from 'lucide-react';
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
  todo: { title: 'To Do', color: 'bg-slate-100 border-slate-400', headerBg: 'bg-slate-200' },
  in_progress: { title: 'In Progress', color: 'bg-blue-100 border-blue-400', headerBg: 'bg-blue-200' },
  review: { title: 'In Review', color: 'bg-amber-100 border-amber-400', headerBg: 'bg-amber-200' },
  done: { title: 'Done', color: 'bg-emerald-100 border-emerald-400', headerBg: 'bg-emerald-200' }
} as const;

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-blue-100 text-blue-700 border-blue-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  urgent: 'bg-red-100 text-red-700 border-red-300'
};

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  // Initialize filter from URL params
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      const projectId = parseInt(projectParam);
      if (!isNaN(projectId)) {
        setSelectedProject(projectId);
        setShowFilters(true);
      }
    }
  }, [searchParams]);

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
      if (selectedProject && task.project.id !== selectedProject) {
        return false;
      }
      if (selectedAssignee === 'me' && task.assigned_to?.id !== user?.id) {
        return false;
      }
      if (selectedAssignee === 'unassigned' && task.assigned_to !== null) {
        return false;
      }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Columns3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-700 font-medium">Loading Kanban board...</p>
          <p className="text-gray-500 text-sm mt-1">Fetching your tasks</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/team-dashboard')}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 group-hover:text-gray-900" />
              </button>
              <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                <Columns3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kanban Board</h1>
                <p className="text-sm text-gray-600 mt-1">Drag tasks to update their status</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <span className="flex items-center gap-2">
                      📁 Project
                    </span>
                  </label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400 font-medium text-gray-700"
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4" /> Assignee
                    </span>
                  </label>
                  <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:border-gray-400 font-medium text-gray-700"
                  >
                    <option value="all">All Team Members</option>
                    <option value="me">Assigned to Me</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </div>
              </div>
              
              {/* Filter Status */}
              <div className="mt-4 pt-4 border-t-2 border-blue-200 flex items-center justify-between text-sm">
                <div className="text-gray-700">
                  <span className="font-semibold">Showing {getFilteredTasks().length}</span> of {tasks.length} tasks
                </div>
                {(selectedProject || selectedAssignee !== 'all') && (
                  <button
                    onClick={() => {
                      setSelectedProject(null);
                      setSelectedAssignee('all');
                    }}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3 shadow-md">
            <div className="flex-shrink-0 w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <p className="text-red-800 font-semibold">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(COLUMNS).map(([status, { title, color, headerBg }]) => {
              const columnTasks = getTasksByStatus(status as Task['status']);
              
              return (
                <div key={status} className="flex flex-col">
                  {/* Column Header */}
                  <div className={`${headerBg} border-2 ${color.split(' ')[1]} rounded-t-xl px-4 py-4 shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                      <span className="bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-800 shadow-sm border border-gray-300">
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
                        className={`flex-1 ${color} border-2 border-t-0 rounded-b-xl p-4 min-h-[500px] transition-all duration-200 ${
                          snapshot.isDraggingOver ? 'bg-blue-50 border-blue-400 shadow-inner' : ''
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
                                    className={`bg-white rounded-xl p-4 shadow-md border-2 border-gray-200 cursor-pointer hover:shadow-xl hover:border-blue-300 transition-all duration-200 ${
                                      snapshot.isDragging ? 'shadow-2xl ring-4 ring-blue-400 rotate-3 scale-105' : ''
                                    }`}
                                  >
                                    {/* Task Title */}
                                    <h4 className="font-bold text-gray-900 mb-2 line-clamp-2 text-base">
                                      {task.title}
                                    </h4>

                                    {/* Project Name */}
                                    <div className="flex items-center gap-1.5 mb-3">
                                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                        📁 {task.project.name}
                                      </span>
                                    </div>

                                    {/* Description Preview */}
                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Task Meta */}
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {/* Priority Badge */}
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${PRIORITY_COLORS[task.priority]}`}>
                                          {task.priority.toUpperCase()}
                                        </span>
                                        
                                        {/* Due Date */}
                                        {dueDate && (
                                          <span className={`flex items-center gap-1 text-xs font-semibold ${dueDate.class}`}>
                                            <Calendar className="w-3.5 h-3.5" />
                                            {dueDate.text}
                                          </span>
                                        )}
                                      </div>

                                      {/* Assignee Avatar */}
                                      {task.assigned_to ? (
                                        <div
                                          className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white"
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
                                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shadow-sm border-2 border-gray-300" title="Unassigned">
                                          <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Time Tracking */}
                                    {(task.estimated_hours || task.actual_hours) && (
                                      <div className="mt-4 pt-3 border-t-2 border-gray-100 text-xs font-medium text-gray-600">
                                        {task.estimated_hours && (
                                          <span className="bg-blue-50 px-2 py-1 rounded">Est: {task.estimated_hours}h</span>
                                        )}
                                        {task.estimated_hours && task.actual_hours && <span className="mx-1">•</span>}
                                        {task.actual_hours && (
                                          <span className="bg-green-50 px-2 py-1 rounded">Actual: {task.actual_hours}h</span>
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
                            <div className="text-center py-12 text-gray-400">
                              <div className="text-4xl mb-2">📋</div>
                              <p className="text-sm font-medium">No tasks</p>
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
