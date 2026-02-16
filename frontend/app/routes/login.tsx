import { useEffect, useState } from 'react';
import { Form, useNavigate, Link } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import authService from '~/services/auth.service';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Sparkles, Shield } from 'lucide-react';
import type { Route } from './+types/login';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Login - SynergyOS' },
        { name: 'description', content: 'Login to your SynergyOS account' },
    ];
}

export default function Login() {
    const navigate = useNavigate();
    const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [use2FA, setUse2FA] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            const role = user?.role;
            if (role === 'manager' || role === 'admin') {
                navigate('/dashboard', { replace: true });
            } else {
                navigate('/team-dashboard', { replace: true });
            }
        }
    }, [authLoading, isAuthenticated, user, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (use2FA && !otpSent) {
                await authService.sendOTP(username, password);
                setOtpSent(true);
                setError('');
                alert('OTP sent to your registered email/phone');
                setIsLoading(false);
                return;
            }

            if (use2FA && otpSent) {
                await authService.verifyOTP(username, otp);
            } else {
                await login(username, password);
            }
            
            const userProfile = await authService.getProfile();
            
            if (userProfile.role === 'manager' || userProfile.role === 'admin') {
                navigate('/dashboard');
            } else {
                navigate('/team-dashboard');
            }
        } catch (err: any) {
            const detail = err.response?.data?.detail || err.response?.data?.error;
            setError(detail || err.message || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-200/30 border-t-blue-400 rounded-full animate-spin" />
                    <p className="text-white/70 text-sm font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4 py-12 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-slideInDown">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/50">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-3">
                        SynergyOS
                    </h1>
                    <p className="text-blue-200 text-lg">
                        Intelligent Business Management Platform
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 animate-slideInUp">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-blue-200 text-sm mb-8">Sign in to access your workspace</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username Field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                placeholder="Enter your username or email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4 text-blue-300 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* 2FA Toggle */}
                        <div className="flex items-center justify-between py-4 px-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/30 rounded-lg">
                                    <Shield className="w-4 h-4 text-blue-200" />
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    Use 2-Factor Authentication (OTP)
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={use2FA}
                                    onChange={(e) => {
                                        setUse2FA(e.target.checked);
                                        setOtpSent(false);
                                        setOtp('');
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>

                        {/* OTP Field */}
                        {use2FA && otpSent && (
                            <div className="animate-slideInDown space-y-2">
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all text-center text-2xl tracking-[0.5em] font-bold outline-none"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-blue-200 text-center flex items-center justify-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Check your email/phone for the OTP code
                                </p>
                            </div>
                        )}

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-500 bg-white/10 border-white/30 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="ml-2 text-sm text-blue-100 group-hover:text-white transition-colors">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-300 hover:text-white transition-colors font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>{use2FA && !otpSent ? 'Sending OTP...' : use2FA && otpSent ? 'Verifying...' : 'Signing in...'}</span>
                                </div>
                            ) : (
                                use2FA && !otpSent ? 'Send OTP' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-blue-100">
                            Don't have an account?{' '}
                            <a
                                href="/register"
                                className="text-white font-bold hover:underline transition-all"
                            >
                                Create one
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                        <Lock className="w-4 h-4 text-blue-300" />
                        <p className="text-sm text-blue-100 font-medium">
                            Secured with enterprise-grade encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
