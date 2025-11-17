import { useState, useEffect } from 'react';
import { Clock, Play, Square, Plus } from 'lucide-react';

interface TimeLog {
    user_id: number;
    username: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number;
    note: string;
    logged_at: string;
    manual_entry?: boolean;
}

interface ActiveTimer {
    user_id: number;
    start_time: string;
}

interface TimeTrackerProps {
    taskId: number;
    taskTitle: string;
    timeLogs: TimeLog[];
    activeTimer: ActiveTimer | null;
    onStartTimer: () => Promise<void>;
    onStopTimer: (note: string) => Promise<void>;
    onLogTime: (hours: number, note: string) => Promise<void>;
}

export default function TimeTracker({
    taskId,
    taskTitle,
    timeLogs,
    activeTimer,
    onStartTimer,
    onStopTimer,
    onLogTime,
}: TimeTrackerProps) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualHours, setManualHours] = useState('');
    const [note, setNote] = useState('');
    const [stopNote, setStopNote] = useState('');

    useEffect(() => {
        if (!activeTimer) {
            setElapsedTime(0);
            return;
        }

        const startTime = new Date(activeTimer.start_time).getTime();
        
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = Math.floor((now - startTime) / 1000);
            setElapsedTime(elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [activeTimer]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const getTotalTime = () => {
        const total = timeLogs.reduce((sum, log) => sum + log.duration_minutes, 0);
        return formatDuration(total);
    };

    const handleStartTimer = async () => {
        try {
            await onStartTimer();
        } catch (error) {
            console.error('Failed to start timer:', error);
        }
    };

    const handleStopTimer = async () => {
        try {
            await onStopTimer(stopNote);
            setStopNote('');
        } catch (error) {
            console.error('Failed to stop timer:', error);
        }
    };

    const handleManualLog = async (e: React.FormEvent) => {
        e.preventDefault();
        const hours = parseFloat(manualHours);
        
        if (isNaN(hours) || hours <= 0) {
            alert('Please enter a valid number of hours');
            return;
        }

        try {
            await onLogTime(hours, note);
            setManualHours('');
            setNote('');
            setShowManualEntry(false);
        } catch (error) {
            console.error('Failed to log time:', error);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Tracking
                </h3>
                <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold">{getTotalTime()}</span>
                </div>
            </div>

            {/* Active Timer */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                {activeTimer ? (
                    <div className="space-y-3">
                        <div className="text-center">
                            <div className="text-3xl font-mono font-bold text-blue-600">
                                {formatTime(elapsedTime)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Timer running</div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Note (optional)
                            </label>
                            <input
                                type="text"
                                value={stopNote}
                                onChange={(e) => setStopNote(e.target.value)}
                                placeholder="What did you work on?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        <button
                            onClick={handleStopTimer}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Square className="w-4 h-4" />
                            Stop Timer
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={handleStartTimer}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Start Timer
                        </button>

                        <button
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Log Time Manually
                        </button>
                    </div>
                )}
            </div>

            {/* Manual Time Entry */}
            {showManualEntry && !activeTimer && (
                <form onSubmit={handleManualLog} className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-gray-900 mb-3">Manual Time Entry</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hours
                            </label>
                            <input
                                type="number"
                                step="0.25"
                                min="0.25"
                                value={manualHours}
                                onChange={(e) => setManualHours(e.target.value)}
                                placeholder="e.g., 2.5"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Note (optional)
                            </label>
                            <input
                                type="text"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="What did you work on?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Log Time
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowManualEntry(false)}
                                className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Time Log History */}
            {timeLogs.length > 0 && (
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">Time Log History</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {timeLogs.slice().reverse().map((log, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3 text-sm"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-gray-900">
                                        {log.username}
                                    </span>
                                    <span className="text-blue-600 font-semibold">
                                        {formatDuration(log.duration_minutes)}
                                    </span>
                                </div>
                                
                                {log.note && (
                                    <p className="text-gray-600 mb-1">{log.note}</p>
                                )}
                                
                                <div className="text-xs text-gray-500 flex items-center justify-between">
                                    <span>
                                        {new Date(log.logged_at).toLocaleString()}
                                    </span>
                                    {log.manual_entry && (
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                            Manual
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
