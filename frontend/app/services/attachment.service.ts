import tokenStorage from './tokenStorage';

/**
 * Attachment Service
 * Handles file uploads for tasks
 */

export interface TaskAttachment {
  id: number;
  task: number;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  file: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document' | 'other';
  file_name: string;
  file_size: number;
  file_size_mb: number;
  description: string;
  is_proof_of_completion: boolean;
  created_at: string;
}

/**
 * Get auth token from the secure storage helper
 */
const getAccessToken = (): string | null => {
  return tokenStorage.getAccessToken();
};

/**
 * Upload a file to a task
 */
export const uploadTaskAttachment = async (
  taskId: number,
  file: File,
  description: string = '',
  isProof: boolean = false
): Promise<TaskAttachment> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }
  
  // Validate file size (50MB max)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    throw new Error(`File size must not exceed 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task', taskId.toString());
  formData.append('description', description);
  formData.append('is_proof_of_completion', isProof.toString());

  const response = await fetch('/api/attachments/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type, browser will set it with boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.file?.[0] || 'Failed to upload file');
  }

  return response.json();
};

/**
 * Get all attachments for a specific task
 */
export const getTaskAttachments = async (taskId: number): Promise<TaskAttachment[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch(`/api/attachments/by_task/?task_id=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }

  return response.json();
};

/**
 * Get all proof of completion files for a specific task
 */
export const getTaskProofFiles = async (taskId: number): Promise<TaskAttachment[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch(`/api/attachments/proof_of_completion/?task_id=${taskId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch proof files');
  }

  return response.json();
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (attachmentId: number): Promise<void> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch(`/api/attachments/${attachmentId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete attachment');
  }
};

/**
 * Get all attachments (for current user's projects)
 */
export const getAllAttachments = async (): Promise<TaskAttachment[]> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Missing access token');
  }

  const response = await fetch('/api/attachments/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch attachments');
  }

  return response.json();
};

/**
 * Get file type icon based on file extension
 */
export const getFileTypeIcon = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
    return '🖼️';
  }
  
  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
    return '🎥';
  }
  
  // PDFs
  if (ext === 'pdf') {
    return '📄';
  }
  
  // Documents
  if (['doc', 'docx'].includes(ext)) {
    return '📝';
  }
  
  // Spreadsheets
  if (['xls', 'xlsx'].includes(ext)) {
    return '📊';
  }
  
  // Presentations
  if (['ppt', 'pptx'].includes(ext)) {
    return '📽️';
  }
  
  // Text
  if (ext === 'txt') {
    return '📃';
  }
  
  return '📎';
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};
