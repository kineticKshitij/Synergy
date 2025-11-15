import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onClose(id), 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />
    };

    const colors = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg transition-all duration-300 backdrop-blur-sm ${colors[type]} ${
                isExiting ? 'opacity-0 translate-x-full scale-95' : 'opacity-100 translate-x-0 scale-100'
            } animate-slideInRight`}
        >
            <div className="flex-shrink-0">
                {icons[type]}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onClose(id), 300);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors focus-ring rounded p-1"
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, onClose }: { toasts: Array<Omit<ToastProps, 'onClose'>>; onClose: (id: string) => void }) {
    return (
        <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
}
