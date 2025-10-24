import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export function meta() {
    return [
        { title: 'Reset Password - SynergyOS' },
        { name: 'description', content: 'Set your new password' },
    ];
}

export default function ResetPassword() {
    const { uid, token } = useParams<{ uid: string; token: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        new_password: '',
        confirm_password: '',
    });

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0);

    const checkPasswordStrength = (password: string) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;
        return strength;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (name === 'new_password') {
            setPasswordStrength(checkPasswordStrength(value));
        }

        // Clear errors
        if (errors[name]) {
            setErrors((prev: any) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.new_password) {
            newErrors.new_password = 'Password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            const response = await axios.post('http://localhost:8000/api/auth/password-reset-confirm/', {
                uid,
                token,
                new_password: formData.new_password,
            });

            setSuccessMessage(response.data.message);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: any) {
            const apiError = error.response?.data;
            if (apiError?.new_password) {
                setErrors({ new_password: apiError.new_password.join(', ') });
            } else {
                setErrorMessage(apiError?.error || 'Failed to reset password. The link may be invalid or expired.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength <= 1) return 'bg-red-500';
        if (passwordStrength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength <= 1) return 'Weak';
        if (passwordStrength <= 3) return 'Medium';
        return 'Strong';
    };

    if (successMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
                <div className="max-w-md w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>

                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                            Password Reset Successful!
                        </h2>

                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Your password has been reset successfully. You can now log in with your new password.
                        </p>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                Redirecting to login page in 3 seconds...
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Go to Login Now
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-8">
            <div className="max-w-md w-full">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        SynergyOS
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Set your new password</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                        Reset Your Password
                    </h2>

                    {errorMessage && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${errors.new_password
                                            ? 'border-red-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="Enter new password"
                                    disabled={isLoading}
                                />
                            </div>

                            {formData.new_password && (
                                <div className="mt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${getPasswordStrengthColor()}`}
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">
                                            {getPasswordStrengthText()}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {errors.new_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.new_password}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Must be at least 8 characters long
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${errors.confirm_password
                                            ? 'border-red-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="Confirm new password"
                                    disabled={isLoading}
                                />
                                {formData.confirm_password &&
                                    formData.new_password === formData.confirm_password && (
                                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                    )}
                            </div>
                            {errors.confirm_password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {errors.confirm_password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
