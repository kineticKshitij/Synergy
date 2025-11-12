import axios from 'axios';

const API_URL = '/api/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export interface TeamMemberStats {
    total_projects: number;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    unread_messages: number;
    completion_rate: number;
}

export interface TeamMemberDashboard {
    projects: any[];
    assigned_tasks: any[];
    recent_messages: any[];
    stats: TeamMemberStats;
}

export interface ProjectMessage {
    id: number;
    project: number;
    sender: {
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
    };
    message: string;
    parent: number | null;
    mentions: any[];
    replies_count: number;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    is_edited: boolean;
}

export interface Task {
    id: number;
    project: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to: any;
    due_date: string | null;
    estimated_hours: number | null;
    actual_hours: number | null;
    impact: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
    comment_count: number;
}

export interface TaskAttachment {
    id: number;
    task: number;
    user: any;
    file: string;
    file_url: string;
    file_type: string;
    file_name: string;
    file_size: number;
    file_size_mb: number;
    description: string;
    is_proof_of_completion: boolean;
    created_at: string;
}

const teamMemberService = {
    // Get dashboard data
    async getDashboard(): Promise<TeamMemberDashboard> {
        const response = await api.get('team-dashboard/me/');
        return response.data;
    },

    // Get my tasks
    async getMyTasks(filters?: { status?: string; project_id?: number }): Promise<Task[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.project_id) params.append('project_id', filters.project_id.toString());
        
        const response = await api.get(`team-dashboard/my_tasks/?${params.toString()}`);
        return response.data;
    },

    // Get my projects
    async getMyProjects(): Promise<any[]> {
        const response = await api.get('team-dashboard/my_projects/');
        return response.data;
    },

    // Upload proof of completion (accepts FormData directly)
    async uploadProof(formData: FormData): Promise<TaskAttachment[]> {
        const response = await api.post('team-dashboard/upload_proof/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Messages
    async getProjectMessages(projectId: number): Promise<ProjectMessage[]> {
        const response = await api.get(`messages/by_project/?project_id=${projectId}`);
        return response.data;
    },

    async sendMessage(projectId: number, message: string, mentionIds?: number[], parentId?: number): Promise<ProjectMessage> {
        const response = await api.post('messages/', {
            project: projectId,
            message,
            mention_ids: mentionIds || [],
            parent: parentId || null,
        });
        return response.data;
    },

    async markMessageRead(messageId: number): Promise<void> {
        await api.post(`messages/${messageId}/mark_read/`);
    },

    async getUnreadMessages(): Promise<ProjectMessage[]> {
        const response = await api.get('messages/unread/');
        return response.data;
    },

    async getReplies(messageId: number): Promise<ProjectMessage[]> {
        const response = await api.get(`messages/${messageId}/replies/`);
        return response.data;
    },

    // Task operations
    async getTask(taskId: number): Promise<Task> {
        const response = await api.get(`tasks/${taskId}/`);
        return response.data;
    },

    async updateTaskStatus(taskId: number, status: string): Promise<Task> {
        const response = await api.patch(`tasks/${taskId}/`, { status });
        return response.data;
    },

    // Get task attachments
    async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
        const response = await api.get(`attachments/by_task/?task_id=${taskId}`);
        return response.data;
    },

    async getProofOfCompletion(taskId: number): Promise<TaskAttachment[]> {
        const response = await api.get(`attachments/proof_of_completion/?task_id=${taskId}`);
        return response.data;
    },
};

export default teamMemberService;
