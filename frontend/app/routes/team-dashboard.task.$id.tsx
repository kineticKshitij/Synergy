import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import teamMemberService, { type Task, type TaskAttachment } from '~/services/team-member.service';
import type { Route } from './+types/team-dashboard.task.$id';

export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Task Details - Team Dashboard - SynergyOS' },
        { name: 'description', content: 'View task details and upload proof of completion' },
    ];
}

export default function TeamTaskView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [task, setTask] = useState<any>(null);
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [uploadNotes, setUploadNotes] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTaskDetails();
        fetchAttachments();
    }, [id]);

    const fetchTaskDetails = async () => {
        try {
            const tasks = await teamMemberService.getMyTasks();
            const foundTask = tasks.find((t: any) => t.id === Number(id));
            
            if (!foundTask) {
                setError('Task not found or not assigned to you');
                setLoading(false);
                return;
            }
            
            setTask(foundTask);
            setLoading(false);
        } catch (err: any) {
            console.error('Error fetching task:', err);
            setError(err.response?.data?.error || 'Failed to load task');
            setLoading(false);
        }
    };

    const fetchAttachments = async () => {
        try {
            const data = await teamMemberService.getTaskAttachments(Number(id));
            setAttachments(data);
        } catch (err) {
            console.error('Error fetching attachments:', err);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(e.target.files);
        }
    };

    const handleUploadProof = async () => {
        if (!selectedFiles || selectedFiles.length === 0) {
            alert('Please select at least one file');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('files', selectedFiles[i]);
        }
        
        formData.append('task_id', id!);
        formData.append('description', uploadNotes);

        try {
            await teamMemberService.uploadProof(formData);
            alert('Files uploaded successfully!');
            setShowUploadModal(false);
            setSelectedFiles(null);
            setUploadNotes('');
            fetchAttachments();
        } catch (err: any) {
            console.error('Error uploading files:', err);
            alert(err.response?.data?.error || 'Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'todo': return 'bg-gray-100 text-gray-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'review': return 'bg-yellow-100 text-yellow-800';
            case 'done': return 'bg-green-100 text-green-800';
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

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image')) return '🖼️';
        if (fileType.startsWith('video')) return '🎥';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
        return '📎';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Loading task...</div>
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

    if (!task) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <Link
                        to="/team-dashboard"
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                    {task.title}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Project: {task.project_name}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                📎 Upload Proof
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-5 space-y-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                            <p className="text-gray-900">{task.description || 'No description provided'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                                    {task.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                                    {task.priority.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {task.due_date && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                                <p className="text-gray-900">
                                    {new Date(task.due_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Project</h3>
                            <p className="text-gray-900">{task.project_name || task.project}</p>
                        </div>

                        {attachments.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 mb-3">
                                    Proof of Completion ({attachments.length})
                                </h3>
                                <div className="space-y-2">
                                    {attachments.map((attachment) => (
                                        <div
                                            key={attachment.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">
                                                    {getFileIcon(attachment.file_type)}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {attachment.file_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Uploaded {new Date(attachment.uploaded_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={attachment.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Upload Proof of Completion
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Files
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Images, videos, or documents (max 50MB per file)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={uploadNotes}
                                    onChange={(e) => setUploadNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Add any notes about the completion..."
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFiles(null);
                                    setUploadNotes('');
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUploadProof}
                                disabled={uploading || !selectedFiles}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
