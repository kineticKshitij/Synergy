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
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fadeIn">
            <div className="text-6xl md:text-8xl mb-6 animate-float">{icon}</div>
            <h3 className="text-2xl md:text-3xl font-bold text-white dark:text-white mb-3 gradient-text">{title}</h3>
            <p className="text-gray-400 dark:text-gray-400 text-lg mb-8 max-w-md">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="btn-primary animate-bounceIn"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
