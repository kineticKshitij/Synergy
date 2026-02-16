import { useState } from 'react';
import tokenStorage from '~/services/tokenStorage';

const API_URL = '/api';

interface ExtractedTask {
  title: string;
  description: string;
  assignee: string;
  priority: string;
  estimated_hours: number;
  due_date_mentioned: string | null;
  relevant_context: string;
}

interface MeetingExtraction {
  extracted_tasks: ExtractedTask[];
  meeting_summary: string;
  key_decisions: string[];
  attendees_mentioned: string[];
  follow_up_needed: boolean;
}

interface Props {
  projectId?: number;
  onTasksExtracted: (tasks: ExtractedTask[]) => void;
  onClose: () => void;
}

export function AIMeetingNotesExtractor({ projectId, onTasksExtracted, onClose }: Props) {
  const [meetingNotes, setMeetingNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [extraction, setExtraction] = useState<MeetingExtraction | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!meetingNotes.trim()) {
      setError('Please enter meeting notes');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = tokenStorage.getAccessToken();
      const response = await fetch(`${API_URL}/tasks/ai_extract_meeting_tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          meeting_notes: meetingNotes,
          project_id: projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract tasks');
      }

      const data = await response.json();
      setExtraction(data.extraction);
      
      // Select all by default
      const allIndices = new Set(data.extraction.extracted_tasks.map((_: any, idx: number) => idx));
      setSelectedTasks(allIndices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (index: number) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTasks(newSelected);
  };

  const handleCreateTasks = () => {
    if (!extraction) return;
    
    const selected = extraction.extracted_tasks.filter((_, idx) => selectedTasks.has(idx));
    onTasksExtracted(selected);
    onClose();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-300 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      low: 'bg-green-500/20 text-green-300 border-green-500/30',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-3xl">📝</span>
                Extract Tasks from Meeting Notes
              </h2>
              <p className="text-gray-400 text-sm">
                Paste your meeting notes and AI will extract action items automatically
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!extraction && (
            <div className="space-y-4">
              {/* Meeting Notes Input */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Meeting Notes
                </label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  placeholder="Paste your meeting notes here... Include attendees, decisions, and action items discussed."
                  className="w-full h-64 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: More detailed notes = better task extraction
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Extract Button */}
              <button
                onClick={handleExtract}
                disabled={loading || !meetingNotes.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analyzing Meeting Notes...
                  </span>
                ) : (
                  '🤖 Extract Action Items'
                )}
              </button>
            </div>
          )}

          {extraction && (
            <div className="space-y-6">
              {/* Meeting Summary */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <span>📋</span>
                  Meeting Summary
                </h3>
                <p className="text-sm text-gray-300">{extraction.meeting_summary}</p>
                
                {extraction.follow_up_needed && (
                  <div className="mt-3 pt-3 border-t border-blue-500/30">
                    <p className="text-xs text-yellow-400 flex items-center gap-2">
                      <span>⚠️</span>
                      Follow-up discussion needed - action items unclear
                    </p>
                  </div>
                )}
              </div>

              {/* Key Decisions */}
              {extraction.key_decisions.length > 0 && (
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Key Decisions</h3>
                  <ul className="space-y-2">
                    {extraction.key_decisions.map((decision, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 flex-shrink-0">✓</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attendees */}
              {extraction.attendees_mentioned.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2">Attendees Mentioned</h3>
                  <div className="flex flex-wrap gap-2">
                    {extraction.attendees_mentioned.map((attendee, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                        👤 {attendee}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Tasks */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Extracted Action Items ({extraction.extracted_tasks.length})
                </h3>
                <div className="space-y-3">
                  {extraction.extracted_tasks.map((task, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 transition-all cursor-pointer ${
                        selectedTasks.has(index)
                          ? 'bg-blue-500/10 border-blue-500/50'
                          : 'bg-gray-900/30 border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleTask(index)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(index)}
                            onChange={() => toggleTask(index)}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="font-semibold text-white">{task.title}</h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                                {task.estimated_hours}h
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-400">{task.description}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {task.assignee !== 'unassigned' && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                👤 {task.assignee}
                              </span>
                            )}
                            {task.due_date_mentioned && (
                              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                📅 {new Date(task.due_date_mentioned).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <div className="pt-2 border-t border-gray-700">
                            <p className="text-xs text-gray-500 italic">
                              Context: "{task.relevant_context}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setExtraction(null)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                >
                  ← Back to Notes
                </button>
                <button
                  onClick={handleCreateTasks}
                  disabled={selectedTasks.size === 0}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create {selectedTasks.size} Tasks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
