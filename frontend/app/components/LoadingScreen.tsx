import { useEffect, useState } from 'react';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
            <div className="text-center">
                {/* Animated Logo */}
                <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center transform animate-pulse">
                        <span className="text-white font-bold text-4xl">S</span>
                    </div>
                    {/* Spinning Ring */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="text-3xl font-bold text-white mb-2 animate-fadeIn">
                    SynergyOS
                </h1>
                <p className="text-blue-300 text-sm mb-6 animate-fadeIn">
                    AI-Powered Platform
                </p>

                {/* Loading Message */}
                <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <p className="text-gray-300 mt-4 text-sm">
                    {message}
                    <span className="inline-block w-8 text-left">{dots}</span>
                </p>
            </div>
        </div>
    );
}
