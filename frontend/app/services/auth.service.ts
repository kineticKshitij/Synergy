import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Use relative URL to go through nginx proxy
const API_URL = '/api/auth/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the token to all requests
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

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                const response = await axios.post(`${API_URL}token/refresh/`, {
                    refresh: refreshToken,
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);

                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh token is invalid, logout user
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'manager' | 'member' | 'admin';
}

export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
}

export interface RegisterResponse {
    user: User;
    tokens: {
        access: string;
        refresh: string;
    };
    message: string;
}

export interface DashboardStats {
    user: {
        id: number;
        username: string;
        email: string;
        full_name: string;
        member_since: string;
    };
    stats: {
        total_projects: number;
        active_tasks: number;
        completed_tasks: number;
        team_members: number;
        pending_approvals?: number;
        overdue_tasks?: number;
    };
    recent_activity: any[];
    ai_insights: {
        enabled: boolean;
        productivity_score?: number;
        trend?: 'improving' | 'stable' | 'declining';
        key_insights?: string[];
        predictions?: string[];
        automation_suggestions?: string[];
        focus_areas?: string[];
    };
    security: {
        mfa_enabled: boolean;
        last_login: string | null;
        failed_login_attempts: number;
    };
}

const authService = {
    async login(username: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('login/', {
            username,
            password,
        });

        if (response.data.access) {
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
        }

        return response.data;
    },

    async register(data: RegisterData): Promise<RegisterResponse> {
        const response = await api.post<RegisterResponse>('register/', data);

        if (response.data.tokens) {
            localStorage.setItem('access_token', response.data.tokens.access);
            localStorage.setItem('refresh_token', response.data.tokens.refresh);
        }

        return response.data;
    },

    async logout(): Promise<void> {
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
            try {
                await api.post('logout/', { refresh: refreshToken });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    async getProfile(): Promise<User> {
        const response = await api.get<User>('profile/');
        return response.data;
    },

    async updateProfile(data: Partial<User>): Promise<User> {
        const response = await api.patch<User>('profile/', data);
        return response.data;
    },

    async changePassword(data: { old_password: string; new_password: string }): Promise<void> {
        await api.post('change-password/', data);
    },

    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get<DashboardStats>('dashboard/');
        return response.data;
    },

    getCurrentUser(): User | null {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                return decoded.user || null;
            } catch {
                return null;
            }
        }
        return null;
    },

    isAuthenticated(): boolean {
        const token = localStorage.getItem('access_token');
        if (!token) return false;

        try {
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },
};

export default authService;
