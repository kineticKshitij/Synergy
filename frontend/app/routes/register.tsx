import { useState, useEffect } from 'react';
import { Form, useNavigate, Link } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import authService from '~/services/auth.service';
import { User, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Sparkles, Shield, UserCog } from 'lucide-react';
import type { Route } from './+types/register';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Register - SynergyOS' },
        { name: 'description', content: 'Create your SynergyOS account' },
    ];
}

export default function Register() {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [termsAccepted, setTermsAccepted] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [authLoading, isAuthenticated, navigate]);

    // Calculate password strength
    useEffect(() => {
        const password = formData.password;
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        setPasswordStrength(strength);
    }, [formData.password]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!termsAccepted) {
            setError('You must accept the terms and conditions');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setIsLoading(true);

        try {
            await authService.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                first_name: formData.firstName,
                last_name: formData.lastName,
            });
            
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err: any) {
            const errorData = err.response?.data;
            let errorMessage = 'Registration failed. Please try again.';
            
            if (errorData) {
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.username) {
                    errorMessage = `Username: ${errorData.username[0]}`;
                } else if (errorData.email) {
                    errorMessage = `Email: ${errorData.email[0]}`;
                } else if (errorData.password) {
                    errorMessage = `Password: ${errorData.password[0]}`;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            }
            
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength === 0) return 'from-gray-500 to-gray-600';
        if (passwordStrength === 1) return 'from-red-500 to-red-600';
        if (passwordStrength === 2) return 'from-orange-500 to-orange-600';
        if (passwordStrength === 3) return 'from-yellow-500 to-yellow-600';
        return 'from-green-500 to-green-600';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength === 0) return 'Very Weak';
        if (passwordStrength === 1) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        return 'Strong';
    };

    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

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

            <div className="max-w-2xl w-full relative z-10">
                {/* Logo/Brand */}
                <div className="text-center mb-8 animate-slideInDown">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/50">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-3">
                        Join SynergyOS
                    </h1>
                    <p className="text-blue-200 text-lg">
                        Start managing your projects intelligently
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20 animate-slideInUp">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        Create Account
                    </h2>
                    <p className="text-blue-200 text-sm mb-8">Fill in your details to get started</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 backdrop-blur-sm border border-red-400/50 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-200 font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative group">
                                <User className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                    placeholder="First name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="relative group">
                                <User className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                    placeholder="Last name"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Username Field */}
                        <div className="relative group">
                            <UserCog className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                placeholder="Choose a username"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Email Field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                placeholder="Your email address"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                    placeholder="Create a strong password"
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-blue-300 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            
                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="space-y-2 animate-slideInDown">
                                    <div className="flex gap-1">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 flex-1 rounded-full transition-all ${
                                                    i < passwordStrength
                                                        ? `bg-gradient-to-r ${getPasswordStrengthColor()}`
                                                        : 'bg-white/20'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-blue-200 flex items-center gap-2">
                                        <Shield className="w-3 h-3" />
                                        Password strength: <span className="font-bold text-white">{getPasswordStrengthText()}</span>
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-4 w-5 h-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-12 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/30 transition-all outline-none"
                                placeholder="Confirm your password"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-4 text-blue-300 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                            {passwordsMatch && (
                                <div className="absolute right-14 top-4">
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                </div>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-3 py-4 px-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/15 transition-all">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="w-5 h-5 text-blue-500 bg-white/10 border-white/30 rounded focus:ring-blue-500 focus:ring-offset-0 cursor-pointer mt-0.5"
                                required
                            />
                            <label htmlFor="terms" className="text-sm text-blue-100 cursor-pointer">
                                I accept the{' '}
                                <a href="/terms" className="text-white font-bold hover:underline">
                                    Terms and Conditions
                                </a>
                                {' '}and{' '}
                                <a href="/privacy" className="text-white font-bold hover:underline">
                                    Privacy Policy
                                </a>
                            </label>
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
                                    <span>Creating account...</span>
                                </div>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-blue-100">
                            Already have an account?{' '}
                            <a
                                href="/login"
                                className="text-white font-bold hover:underline transition-all"
                            >
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>

                {/* Security Badge */}
                <div className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full">
                        <Shield className="w-4 h-4 text-blue-300" />
                        <p className="text-sm text-blue-100 font-medium">
                            Your data is protected with end-to-end encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
