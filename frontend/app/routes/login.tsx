import { useState } from 'react';
import { Form, useNavigate, Link } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import authService from '~/services/auth.service';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import type { Route } from './+types/login';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Login - SynergyOS' },
        { name: 'description', content: 'Login to your SynergyOS account' },
    ];
}

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [use2FA, setUse2FA] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // If 2FA is enabled and OTP not sent yet, request OTP
            if (use2FA && !otpSent) {
                await authService.sendOTP(username, password);
                setOtpSent(true);
                setError('');
                alert('OTP sent to your registered email/phone');
                setIsLoading(false);
                return;
            }

            // If 2FA is enabled and OTP is sent, verify OTP
            if (use2FA && otpSent) {
                await authService.verifyOTP(username, otp);
            } else {
                // Normal login without 2FA
                await login(username, password);
            }
            
            // Get user profile to determine redirect
            const userProfile = await authService.getProfile();
            
            // Redirect based on user role
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        SynergyOS
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Intelligent Business Management Platform
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username Field */}
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Username or Email
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your username or email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter your password"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* 2FA Toggle */}
                        <div className="flex items-center justify-between py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
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
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* OTP Field - Show only when 2FA is enabled and OTP is sent */}
                        {use2FA && otpSent && (
                            <div className="animate-slideInDown">
                                <label
                                    htmlFor="otp"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Enter OTP
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                    disabled={isLoading}
                                />
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Check your email/phone for the OTP code
                                </p>
                            </div>
                        )}

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    Remember me
                                </span>
                            </label>
                            <Link
                                to="/forgot-password"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {use2FA && !otpSent ? 'Sending OTP...' : use2FA && otpSent ? 'Verifying...' : 'Signing in...'}
                                </>
                            ) : (
                                use2FA && !otpSent ? 'Send OTP' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <a
                                href="/register"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                            >
                                Create one
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        Secured with enterprise-grade encryption
                    </p>
                </div>
            </div>
        </div>
    );
}
