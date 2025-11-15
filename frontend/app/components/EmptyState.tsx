interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-6xl md:text-8xl mb-6 animate-bounce">{icon}</div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 text-lg mb-8 max-w-md">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition-all transform hover:scale-105 shadow-lg"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
