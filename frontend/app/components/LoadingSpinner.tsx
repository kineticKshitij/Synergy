export function LoadingSpinner({ size = 'md', message = '' }: { size?: 'sm' | 'md' | 'lg', message?: string }) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <div className={`${sizes[size]} border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}></div>
            {message && <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>}
        </div>
    );
}
