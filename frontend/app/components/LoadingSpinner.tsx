export function LoadingSpinner({ size = 'md', message = '', fullScreen = false }: { size?: 'sm' | 'md' | 'lg', message?: string, fullScreen?: boolean }) {
    const sizes = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-16 h-16 border-4'
    };

    const containerClass = fullScreen 
        ? 'min-h-screen flex flex-col items-center justify-center'
        : 'flex flex-col items-center justify-center p-8';

    return (
        <div className={containerClass}>
            <div className="relative">
                <div className={`${sizes[size]} border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}></div>
                {size === 'lg' && (
                    <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-900 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                )}
            </div>
            {message && (
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-center animate-pulse font-medium">
                    {message}
                </p>
            )}
        </div>
    );
}
