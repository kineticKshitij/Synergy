import { useState, useEffect } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import authService from '~/services/auth.service';
import {
    User,
    Mail,
    Lock,
    Save,
    AlertCircle,
    CheckCircle2,
    Camera,
    ArrowLeft,
    Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router';

export function meta() {
    return [
        { title: 'Profile - SynergyOS' },
        { name: 'description', content: 'Manage your profile' },
    ];
}

interface ProfileData {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
}

interface PasswordData {
    old_password: string;
    new_password: string;
    confirm_password: string;
}

function ProfileContent() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'security'>('profile');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Profile form state
    const [profileData, setProfileData] = useState<ProfileData>({
        username: user?.username || '',
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
    });

    // Password form state
    const [passwordData, setPasswordData] = useState<PasswordData>({
        old_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [passwordErrors, setPasswordErrors] = useState<any>({});

    useEffect(() => {
        if (user) {
            setProfileData({
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
            });
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));

        // Clear errors for this field
        if (passwordErrors[name]) {
            setPasswordErrors((prev: any) => ({ ...prev, [name]: '' }));
        }
    };

    const validatePasswordForm = () => {
        const errors: any = {};

        if (!passwordData.old_password) {
            errors.old_password = 'Current password is required';
        }

        if (!passwordData.new_password) {
            errors.new_password = 'New password is required';
        } else if (passwordData.new_password.length < 8) {
            errors.new_password = 'Password must be at least 8 characters';
        }

        if (!passwordData.confirm_password) {
            errors.confirm_password = 'Please confirm your new password';
        } else if (passwordData.new_password !== passwordData.confirm_password) {
            errors.confirm_password = 'Passwords do not match';
        }

        if (passwordData.old_password === passwordData.new_password) {
            errors.new_password = 'New password must be different from current password';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await authService.updateProfile(profileData);
            setSuccessMessage('Profile updated successfully!');

            // Clear message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            setErrorMessage(error.response?.data?.message || 'Failed to update profile');
            setTimeout(() => setErrorMessage(''), 5000);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validatePasswordForm()) return;

        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await authService.changePassword({
                old_password: passwordData.old_password,
                new_password: passwordData.new_password,
            });

            setSuccessMessage('Password changed successfully!');
            setPasswordData({
                old_password: '',
                new_password: '',
                confirm_password: '',
            });

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error: any) {
            const apiError = error.response?.data;
            if (apiError?.old_password) {
                setPasswordErrors({ old_password: apiError.old_password[0] });
            } else {
                setErrorMessage(apiError?.message || 'Failed to change password');
                setTimeout(() => setErrorMessage(''), 5000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Profile Settings
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Success/Error Messages */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                            <nav className="space-y-2">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'profile'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Profile</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('password')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'password'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Lock className="w-5 h-5" />
                                    <span className="font-medium">Password</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'security'
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <Shield className="w-5 h-5" />
                                    <span className="font-medium">Security</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                        Profile Information
                                    </h2>

                                    {/* Avatar Section */}
                                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                                {user?.first_name?.[0]?.toUpperCase()}{user?.last_name?.[0]?.toUpperCase()}
                                            </div>
                                            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border-2 border-white dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {user?.first_name} {user?.last_name}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                                            <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                                Change Avatar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Profile Form */}
                                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    First Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="first_name"
                                                    value={profileData.first_name}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                                    disabled={isLoading}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="last_name"
                                                    value={profileData.last_name}
                                                    onChange={handleProfileChange}
                                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="username"
                                                    value={profileData.username}
                                                    onChange={handleProfileChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={profileData.email}
                                                    onChange={handleProfileChange}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Save className="w-5 h-5" />
                                                {isLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Password Tab */}
                            {activeTab === 'password' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                        Change Password
                                    </h2>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Current Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    name="old_password"
                                                    value={passwordData.old_password}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${passwordErrors.old_password
                                                            ? 'border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            {passwordErrors.old_password && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {passwordErrors.old_password}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    name="new_password"
                                                    value={passwordData.new_password}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${passwordErrors.new_password
                                                            ? 'border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            {passwordErrors.new_password && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {passwordErrors.new_password}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                Password must be at least 8 characters long
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Confirm New Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                                <input
                                                    type="password"
                                                    name="confirm_password"
                                                    value={passwordData.confirm_password}
                                                    onChange={handlePasswordChange}
                                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${passwordErrors.confirm_password
                                                            ? 'border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    disabled={isLoading}
                                                />
                                                {passwordData.confirm_password &&
                                                    passwordData.new_password === passwordData.confirm_password && (
                                                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                                                    )}
                                            </div>
                                            {passwordErrors.confirm_password && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {passwordErrors.confirm_password}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-end pt-4">
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Lock className="w-5 h-5" />
                                                {isLoading ? 'Changing...' : 'Change Password'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                                        Security Settings
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Two-Factor Authentication */}
                                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                                        Two-Factor Authentication
                                                    </h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Add an extra layer of security to your account
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                                                    Disabled
                                                </span>
                                            </div>
                                            <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium">
                                                Enable 2FA
                                            </button>
                                        </div>

                                        {/* Active Sessions */}
                                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                                                Active Sessions
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            Current Session
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            Windows • Chrome • {new Date().toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Account Deletion */}
                                        <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                                            <h3 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                                                Delete Account
                                            </h3>
                                            <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                                                Permanently delete your account and all associated data
                                            </p>
                                            <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium">
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function Profile() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    );
}
