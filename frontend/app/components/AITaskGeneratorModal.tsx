import { useState } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface AITaskGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  onTasksGenerated: () => void;
}

interface GeneratedTask {
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  rationale: string;
  selected?: boolean;
}

export function AITaskGeneratorModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  onTasksGenerated
}: AITaskGeneratorModalProps) {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!isOpen) return null;

  const generateTasks = async () => {
    setGenerating(true);
    setError('');
    setGeneratedTasks([]);
    setShowResults(false);

    try {
      const token = tokenStorage.getAccessToken();
      
      if (!token) {
        setError('You must be logged in to generate tasks');
        setGenerating(false);
        return;
      }
      
      const response = await fetch('/api/ai/generate_tasks/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          description: customDescription.trim() || undefined,
          auto_create: false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate tasks');
      }

      if (!data.enabled) {
        setError('AI features are not enabled. Please configure GEMINI_API_KEY.');
        return;
      }

      const tasksWithSelection = data.suggestions.map((task: any) => ({
        ...task,
        selected: true // Select all by default
      }));

      setGeneratedTasks(tasksWithSelection);
      setShowResults(true);
    } catch (err: any) {
      setError(err.message || 'Failed to generate tasks');
      console.error('Error generating tasks:', err);
    } finally {
      setGenerating(false);
    }
  };

  const toggleTaskSelection = (index: number) => {
    setGeneratedTasks(prev =>
      prev.map((task, i) =>
        i === index ? { ...task, selected: !task.selected } : task
      )
    );
  };

  const createSelectedTasks = async () => {
    const selectedTasks = generatedTasks.filter(t => t.selected);
    
    if (selectedTasks.length === 0) {
      setError('Please select at least one task to create');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const token = tokenStorage.getAccessToken();
      
      if (!token) {
        setError('You must be logged in to create tasks');
        setCreating(false);
        return;
      }
      
      // Create each selected task individually
      const createPromises = selectedTasks.map(task =>
        fetch('/api/tasks/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project: projectId,
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimated_hours: task.estimated_hours,
            status: 'todo'
          })
        })
      );

      await Promise.all(createPromises);

      onTasksGenerated();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create tasks');
      console.error('Error creating tasks:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setCustomDescription('');
    setGeneratedTasks([]);
    setShowResults(false);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h2 className="text-2xl font-bold">AI Task Generator</h2>
              <p className="text-sm text-gray-200">Generate tasks for: {projectName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showResults ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="E.g., Create tasks for implementing user authentication with email verification and password reset..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-sm text-gray-400 mt-2">
                  Leave empty to generate tasks based on project name and description.
                </p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  How it works
                </h3>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                  <li>AI analyzes your project and existing tasks</li>
                  <li>Generates 3-10 relevant tasks with descriptions</li>
                  <li>Provides priority levels and time estimates</li>
                  <li>Avoids duplicates with existing tasks</li>
                  <li>You can review and select which tasks to create</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Generated {generatedTasks.length} Tasks
                </h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  ← Generate Again
                </button>
              </div>

              {generatedTasks.map((task, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    task.selected
                      ? 'bg-blue-900/20 border-blue-500'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                  onClick={() => toggleTaskSelection(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          task.selected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-600'
                        }`}
                      >
                        {task.selected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <div className="flex items-center gap-2 ml-4">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              task.priority === 'critical'
                                ? 'bg-red-500/20 text-red-300'
                                : task.priority === 'high'
                                ? 'bg-orange-500/20 text-orange-300'
                                : task.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}
                          >
                            {task.priority.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-400">
                            ⏱️ {task.estimated_hours}h
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">
                        {task.description}
                      </p>
                      <p className="text-xs text-purple-400 italic">
                        💡 {task.rationale}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-300">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-between items-center bg-gray-800/50">
          <div className="text-sm text-gray-400">
            {showResults && (
              <span>
                {generatedTasks.filter(t => t.selected).length} of{' '}
                {generatedTasks.length} tasks selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={generating || creating}
            >
              Cancel
            </button>
            {!showResults ? (
              <button
                onClick={generateTasks}
                disabled={generating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Tasks
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={createSelectedTasks}
                disabled={creating || generatedTasks.filter(t => t.selected).length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Selected Tasks
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
