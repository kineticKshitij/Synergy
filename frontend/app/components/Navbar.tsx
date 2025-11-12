import { Link, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '~/contexts/AuthContext';

export function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
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
                                <a
                                    href="#security"
                                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                >
                                    Security
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
                                    to="/dashboard"
                                    className={`text-sm font-medium transition-colors ${isActive('/dashboard')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/projects"
                                    className={`text-sm font-medium transition-colors ${isActive('/projects') || location.pathname.startsWith('/projects')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Projects
                                </Link>
                                <Link
                                    to="/team-dashboard"
                                    className={`text-sm font-medium transition-colors ${isActive('/team-dashboard')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Team
                                </Link>
                                <Link
                                    to="/profile"
                                    className={`text-sm font-medium transition-colors ${isActive('/profile')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Profile
                                </Link>
                                <Link
                                    to="/security"
                                    className={`text-sm font-medium transition-colors ${isActive('/security')
                                            ? 'text-blue-400'
                                            : 'text-gray-300 hover:text-white'
                                        }`}
                                >
                                    Security
                                </Link>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm font-medium transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
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
                                    <a
                                        href="#security"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Security
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
                                        to="/dashboard"
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
                                    <Link
                                        to="/profile"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/security"
                                        className="text-gray-300 hover:text-white transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Security
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
        </nav>
    );
}
