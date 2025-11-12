import { useState } from 'react';
import {
  uploadTaskAttachment,
  getTaskAttachments,
  deleteAttachment,
  getFileTypeIcon,
  formatFileSize,
  type TaskAttachment,
} from '../services/attachment.service';

interface FileUploadProps {
  taskId: number;
  taskTitle: string;
  onUploadSuccess?: () => void;
}

export default function FileUpload({ taskId, taskTitle, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isProof, setIsProof] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const loadAttachments = async () => {
    setLoading(true);
    try {
      const data = await getTaskAttachments(taskId);
      setAttachments(data);
      setShowAttachments(true);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);

    // Validate file size
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setError(`File size must not exceed 50MB. Your file is ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB.`);
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await uploadTaskAttachment(taskId, file, description, isProof);
      
      // Reset form
      setFile(null);
      setDescription('');
      setIsProof(false);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload attachments if they're showing
      if (showAttachments) {
        await loadAttachments();
      }

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await deleteAttachment(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      alert('Failed to delete attachment');
    }
  };

  const getAcceptedFormats = () => {
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/x-msvideo',
      'video/quicktime',
      'video/x-ms-wmv',
      'video/x-flv',
      'video/webm',
      'video/x-matroska',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ].join(',');
  };

  return (
    <div className="file-upload-container">
      <h3>📎 Upload Files to {taskTitle}</h3>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="file-input" className="file-label">
            {file ? (
              <span className="file-selected">
                {getFileTypeIcon(file.name)} {file.name} ({formatFileSize(file.size)})
              </span>
            ) : (
              <span className="file-placeholder">
                📁 Click to select file (Max 50MB)
              </span>
            )}
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept={getAcceptedFormats()}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </div>

        {file && (
          <>
            <div className="form-group">
              <label htmlFor="description">Description (Optional)</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this file..."
                rows={3}
                disabled={uploading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isProof}
                  onChange={(e) => setIsProof(e.target.checked)}
                  disabled={uploading}
                />
                <span>Mark as proof of task completion</span>
              </label>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setFile(null);
                  setDescription('');
                  setIsProof(false);
                  setError(null);
                  const fileInput = document.getElementById('file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? '⏳ Uploading...' : '✓ Upload File'}
              </button>
            </div>
          </>
        )}
      </form>

      <div className="attachments-section">
        <button
          className="btn-view-attachments"
          onClick={loadAttachments}
          disabled={loading}
        >
          {loading ? 'Loading...' : showAttachments ? 'Refresh Attachments' : 'View All Attachments'}
        </button>

        {showAttachments && (
          <div className="attachments-list">
            {attachments.length === 0 ? (
              <p className="no-attachments">No attachments yet.</p>
            ) : (
              attachments.map((attachment) => (
                <div key={attachment.id} className="attachment-item">
                  <div className="attachment-icon">
                    {getFileTypeIcon(attachment.file_name)}
                  </div>
                  <div className="attachment-info">
                    <div className="attachment-name">
                      {attachment.file_name}
                      {attachment.is_proof_of_completion && (
                        <span className="proof-badge">✓ Proof</span>
                      )}
                    </div>
                    <div className="attachment-meta">
                      Uploaded by {attachment.user.first_name} {attachment.user.last_name} •{' '}
                      {attachment.file_size_mb} MB •{' '}
                      {new Date(attachment.created_at).toLocaleDateString()}
                    </div>
                    {attachment.description && (
                      <div className="attachment-description">
                        {attachment.description}
                      </div>
                    )}
                  </div>
                  <div className="attachment-actions">
                    <a
                      href={attachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-download"
                      title="Download"
                    >
                      ⬇
                    </a>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(attachment.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .file-upload-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 1.25rem;
        }

        .upload-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 6px;
          color: #374151;
          font-size: 0.9rem;
        }

        .file-label {
          display: block;
          padding: 40px 20px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f9fafb;
        }

        .file-label:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .file-placeholder {
          color: #6b7280;
          font-size: 1rem;
        }

        .file-selected {
          color: #1f2937;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.95rem;
          font-family: inherit;
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .checkbox-group {
          margin: 16px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .checkbox-label input[type='checkbox'] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-primary,
        .btn-secondary {
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.95rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .attachments-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }

        .btn-view-attachments {
          width: 100%;
          padding: 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-view-attachments:hover:not(:disabled) {
          background-color: #e5e7eb;
        }

        .btn-view-attachments:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .attachments-list {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .no-attachments {
          text-align: center;
          color: #6b7280;
          padding: 24px;
          font-style: italic;
        }

        .attachment-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .attachment-item:hover {
          background-color: #f3f4f6;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .attachment-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .attachment-info {
          flex: 1;
          min-width: 0;
        }

        .attachment-name {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .proof-badge {
          background-color: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .attachment-meta {
          font-size: 0.85rem;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .attachment-description {
          font-size: 0.9rem;
          color: #4b5563;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .attachment-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-download,
        .btn-delete {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          font-size: 1.2rem;
        }

        .btn-download:hover {
          background-color: #dbeafe;
          border-color: #3b82f6;
        }

        .btn-delete:hover {
          background-color: #fee2e2;
          border-color: #ef4444;
        }
      `}</style>
    </div>
  );
}
