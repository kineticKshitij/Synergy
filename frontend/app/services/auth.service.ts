import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import tokenStorage from './tokenStorage';

// Use relative URL to go through nginx proxy
const API_URL = '/api/auth/';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add a request interceptor to add the token to all requests
api.interceptors.request.use(
    (config) => {
        const token = tokenStorage.getAccessToken();
        if (token) {
            config.headers = config.headers ?? {};
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
                const response = await axios.post(
                    `${API_URL}token/refresh/`,
                    {},
                    {
                        withCredentials: true,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    },
                );

                const { access } = response.data;
                if (access) {
                    tokenStorage.setAccessToken(access);
                    originalRequest.headers = originalRequest.headers ?? {};
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }

                throw new Error('Unable to refresh access token');
            } catch (refreshError) {
                tokenStorage.clear();
                // Refresh token is invalid, logout user
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
    refresh?: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: 'manager' | 'member';
}

export interface RegisterResponse {
    user: User;
    tokens: {
        access: string;
        refresh?: string;
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
            tokenStorage.setAccessToken(response.data.access);
        }

        return response.data;
    },

    async register(data: RegisterData): Promise<RegisterResponse> {
        const response = await api.post<RegisterResponse>('register/', data);

        if (response.data.tokens) {
            tokenStorage.setAccessToken(response.data.tokens.access);
        }

        return response.data;
    },

    async logout(): Promise<void> {
        try {
            await api.post('logout/', {});
        } catch (error) {
            console.error('Logout error:', error);
        }

        tokenStorage.clear();
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
        const token = tokenStorage.getAccessToken();
        if (!token) {
            return null;
        }

        try {
            const decoded: any = jwtDecode(token);
            return decoded.user || null;
        } catch {
            return null;
        }
    },

    isAuthenticated(): boolean {
        return tokenStorage.hasValidToken();
    },

    async sendOTP(username: string, password: string): Promise<{ message: string; email: string }> {
        const response = await api.post('send-otp/', {
            username,
            password,
        });
        return response.data;
    },

    async verifyOTP(username: string, otp: string): Promise<LoginResponse & { user: User }> {
        const response = await api.post('verify-otp/', {
            username,
            otp,
        });

        const accessToken = response.data.tokens?.access;
        if (accessToken) {
            tokenStorage.setAccessToken(accessToken);
        }

        return response.data;
    },

    async refreshAccessToken(): Promise<boolean> {
        try {
            const response = await axios.post<LoginResponse>(
                `${API_URL}token/refresh/`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (response.data.access) {
                tokenStorage.setAccessToken(response.data.access);
                return true;
            }

            tokenStorage.clear();
            return false;
        } catch (error) {
            tokenStorage.clear();
            throw error;
        }
    },
};

export default authService;
