import { Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '~/contexts/AuthContext';
import { NotificationCenter } from '~/components/NotificationCenter';
import { ThemeToggle } from '~/components/ThemeToggle';
import { GlobalSearch } from '~/components/GlobalSearch';
import tokenStorage from '~/services/tokenStorage';
import { Menu, X, User, Settings, LogOut, Search, Plus, BarChart3, FileText, Bell } from 'lucide-react';

export function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch unread notification count
    useEffect(() => {
        if (user) {
            fetchUnreadCount();
            // Poll every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchUnreadCount = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            const response = await fetch('http://localhost/api/notifications/unread_count/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.unread_count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    // Global keyboard shortcut for search (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img 
                            src="/synergy-logo.svg" 
                            alt="SynergyOS Logo" 
                            className="w-10 h-10 transform group-hover:scale-110 transition-transform"
                        />
                        <div>
                            <h1 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                                SynergyOS
                            </h1>
                            <p className="text-xs text-gray-400">AI-Powered Platform</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {!user ? (
                            <>
                                <Link
                                    to="/"
                                    className={`text-sm font-medium transition-colors ${isActive('/')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Home
                                </Link>
                                <a
                                    href="#features"
                                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    Features
                                </a>
                                <a
                                    href="#how-it-works"
                                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    How It Works
                                </a>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all transform hover:scale-105"
                                >
                                    Get Started
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to={user.role === 'manager' || user.role === 'admin' ? '/dashboard' : '/team-dashboard'}
                                    className={`text-sm font-medium transition-colors ${(isActive('/dashboard') || isActive('/team-dashboard'))
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/projects"
                                    className={`text-sm font-medium transition-colors ${isActive('/projects')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Projects
                                </Link>
                                <Link
                                    to="/team"
                                    className={`text-sm font-medium transition-colors ${isActive('/team')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Team
                                </Link>
                                <Link
                                    to="/kanban"
                                    className={`text-sm font-medium transition-colors ${isActive('/kanban')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Kanban
                                </Link>
                                <Link
                                    to="/templates"
                                    className={`text-sm font-medium transition-colors ${isActive('/templates')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Templates
                                </Link>
                                <Link
                                    to="/reports"
                                    className={`text-sm font-medium transition-colors ${isActive('/reports')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Reports
                                </Link>

                                {/* Search Button */}
                                <button
                                    onClick={() => setSearchOpen(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-all text-gray-400 hover:text-white group"
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="text-xs hidden lg:inline">Search</span>
                                    <kbd className="hidden lg:inline px-1.5 py-0.5 text-xs bg-gray-700 rounded border border-gray-600">
                                        ⌘K
                                    </kbd>
                                </button>

                                {/* Notification Bell */}
                                <button
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                                >
                                    <Bell className="w-5 h-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {/* Theme Toggle */}
                                <ThemeToggle />

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all group"
                                    >
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-semibold">
                                                {user.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-white">
                                            {user.username}
                                        </span>
                                    </button>

                                    {/* User Dropdown */}
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 animate-slideInDown">
                                            <div className="p-4 border-b border-gray-700">
                                                <p className="text-sm font-semibold text-white">{user.username}</p>
                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            </div>
                                            <div className="py-2">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                >
                                                    <User className="w-4 h-4" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    to="/settings"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                                >
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </Link>
                                            </div>
                                            <div className="border-t border-gray-700 py-2">
                                                <button
                                                    onClick={() => {
                                                        setUserMenuOpen(false);
                                                        logout();
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors w-full"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        {user && <NotificationCenter />}
                        <button
                            className="text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6" />
                            ) : (
                                <Menu className="w-6 h-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-gray-800">
                        <div className="flex flex-col gap-4 mt-4">
                            {!user ? (
                                <>
                                    <Link
                                        to="/"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Home
                                    </Link>
                                    <a
                                        href="#features"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Features
                                    </a>
                                    <a
                                        href="#how-it-works"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        How It Works
                                    </a>
                                    <Link
                                        to="/login"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium text-center"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to={user.role === 'manager' || user.role === 'admin' ? '/dashboard' : '/team-dashboard'}
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/projects"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Projects
                                    </Link>
                                    {(user.role === 'manager' || user.role === 'admin') && (
                                        <Link
                                            to="/team"
                                            className="text-gray-300 hover:text-white transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Team
                                        </Link>
                                    )}
                                    <Link
                                        to="/kanban"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Kanban
                                    </Link>
                                    <Link
                                        to="/profile"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/settings"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium text-center"
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Global Search */}
            <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
            
            {/* Notification Center */}
            <NotificationCenter isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
        </nav>
    );
}