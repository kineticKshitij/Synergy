import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }

        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`bg-gray-800 border border-gray-700 rounded-xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-hidden animate-scaleIn glass-effect`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800/50 to-gray-800/30">
                    <h2 className="text-2xl font-bold text-white gradient-text">{title}</h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all focus-ring"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
