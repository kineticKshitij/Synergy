import { useState } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { User, Shield, Bell, Palette, Globe, Key } from 'lucide-react';

export function meta() {
    return [
        { title: 'Settings - SynergyOS' },
        { name: 'description', content: 'Manage your account settings' },
    ];
}

type TabType = 'profile' | 'security' | 'notifications' | 'preferences';

function SettingsContent() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('profile');

    const tabs = [
        { id: 'profile' as TabType, label: 'Profile', icon: User },
        { id: 'security' as TabType, label: 'Security', icon: Shield },
        { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
        { id: 'preferences' as TabType, label: 'Preferences', icon: Palette },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                        Settings
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                                            activeTab === tab.id
                                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            {activeTab === 'profile' && <ProfileSettings />}
                            {activeTab === 'security' && <SecuritySettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                            {activeTab === 'preferences' && <PreferencesSettings />}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ProfileSettings() {
    const { user } = useAuth();

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Profile Settings
            </h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Username
                    </label>
                    <input
                        type="text"
                        defaultValue={user?.username}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        defaultValue={user?.email}
                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            defaultValue={user?.first_name}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            defaultValue={user?.last_name}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function SecuritySettings() {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Security Settings
            </h2>

            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Two-Factor Authentication
                            </h3>
                            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                                Add an extra layer of security to your account
                            </p>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                                Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                        Change Password
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Current Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            Update Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function NotificationSettings() {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Notification Preferences
            </h2>

            <div className="space-y-6">
                <NotificationToggle
                    title="Email Notifications"
                    description="Receive email updates about your projects and tasks"
                />
                <NotificationToggle
                    title="Task Assignments"
                    description="Get notified when you're assigned to a new task"
                />
                <NotificationToggle
                    title="Mentions"
                    description="Get notified when someone mentions you in a comment"
                />
                <NotificationToggle
                    title="Project Updates"
                    description="Receive updates when projects you're part of change status"
                />
                <NotificationToggle
                    title="Deadline Reminders"
                    description="Get reminded about upcoming task deadlines"
                />
            </div>
        </div>
    );
}

function NotificationToggle({ title, description }: { title: string; description: string }) {
    const [enabled, setEnabled] = useState(true);

    return (
        <div className="flex items-start justify-between py-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-1">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

function PreferencesSettings() {
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                App Preferences
            </h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Theme
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>System</option>
                        <option>Light</option>
                        <option>Dark</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Timezone
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>UTC</option>
                        <option>America/New_York</option>
                        <option>America/Los_Angeles</option>
                        <option>Europe/London</option>
                        <option>Asia/Tokyo</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Language
                    </label>
                    <select className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Settings() {
    return (
        <ProtectedRoute>
            <SettingsContent />
        </ProtectedRoute>
    );
}
