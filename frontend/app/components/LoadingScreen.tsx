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
                {/* Custom Loading GIF */}
                <div className="mb-8">
                    <img 
                        src="/loading.gif" 
                        alt="Loading" 
                        className="w-64 h-64 mx-auto"
                    />
                </div>

                {/* Brand Name */}
                <h1 className="text-3xl font-bold text-white mb-2 animate-fadeIn">
                    SynergyOS
                </h1>
                <p className="text-blue-300 text-sm mb-6 animate-fadeIn">
                    AI-Powered Platform
                </p>

                {/* Loading Message */}
                <p className="text-gray-300 mt-4 text-lg font-medium">
                    {message}
                    <span className="inline-block w-8 text-left">{dots}</span>
                </p>
            </div>
        </div>
    );
}
