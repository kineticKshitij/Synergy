const API_URL = 'http://localhost:8000/api';

interface Project {
  id?: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: string | number | null;
  progress: number;
}

interface Task {
  id?: number;
  project: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to_id?: number | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
}

export const projectService = {
  // Get auth token from localStorage
  getAuthToken() {
    return localStorage.getItem('access_token');
  },

  // Get all projects
  async getProjects(params?: any) {
    const token = this.getAuthToken();
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    
    const response = await fetch(`${API_URL}/projects/${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }

    return response.json();
  },

  // Get single project
  async getProject(id: number) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${id}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return response.json();
  },

  // Create project
  async createProject(data: Project) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw { response: { data: error } };
    }

    return response.json();
  },

  // Update project
  async updateProject(id: number, data: Partial<Project>) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update project');
    }

    return response.json();
  },

  // Delete project
  async deleteProject(id: number) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${id}/`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete project');
    }

    return true;
  },

  // Get project statistics
  async getProjectStats(id: number) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${id}/stats/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch project stats');
    }

    return response.json();
  },

  // Add team member
  async addTeamMember(projectId: number, userId: number) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${projectId}/add_member/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to add team member');
    }

    return response.json();
  },

  // Remove team member
  async removeTeamMember(projectId: number, userId: number) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/projects/${projectId}/remove_member/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to remove team member');
    }

    return response.json();
  },

  // Get tasks
  async getTasks(params?: any) {
    const token = this.getAuthToken();
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    
    const response = await fetch(`${API_URL}/tasks/${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    return response.json();
  },

  // Create task
  async createTask(data: Task) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/tasks/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    return response.json();
  },

  // Update task
  async updateTask(id: number, data: Partial<Task>) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/tasks/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    return response.json();
  },

  // Add comment to task
  async addComment(taskId: number, content: string) {
    const token = this.getAuthToken();
    
    const response = await fetch(`${API_URL}/tasks/${taskId}/add_comment/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    return response.json();
  },

  // Get project activities
  async getActivities(params?: any) {
    const token = this.getAuthToken();
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    
    const response = await fetch(`${API_URL}/activities/${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch activities');
    }

    return response.json();
  },
};
