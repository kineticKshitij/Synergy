import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import authService from '~/services/auth.service';
import type { User, RegisterData } from '~/services/auth.service';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<User>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated on mount
        const initializeAuth = async () => {
            try {
                let hasValidToken = authService.isAuthenticated();

                if (!hasValidToken) {
                    try {
                        await authService.refreshAccessToken();
                        hasValidToken = authService.isAuthenticated();
                    } catch (refreshError) {
                        hasValidToken = false;
                    }
                }

                if (hasValidToken) {
                    const userData = await authService.getProfile();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Failed to initialize auth:', error);
                await authService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const login = async (username: string, password: string) => {
        await authService.login(username, password);
        const userData = await authService.getProfile();
        setUser(userData);
    };

    const register = async (data: RegisterData) => {
        const response = await authService.register(data);
        setUser(response.user);
        return response.user;
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
