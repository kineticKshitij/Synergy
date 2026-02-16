import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import {
    FileText,
    Plus,
    Search,
    Filter,
    Clock,
    CheckSquare,
    Target,
    FolderOpen,
    Loader2,
    Star,
} from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

interface ProjectTemplate {
    id: number;
    name: string;
    description: string;
    category: string;
    estimated_duration_days: number | null;
    is_public: boolean;
    created_by: {
        id: number;
        username: string;
    };
    task_templates: any[];
    milestone_templates: any[];
}

export function meta() {
    return [
        { title: 'Project Templates - SynergyOS' },
        { name: 'description', content: 'Browse and create project templates' },
    ];
}

function TemplatesContent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) return;

            const response = await fetch('/api/project-templates/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', 'Software Development', 'Marketing', 'Research', 'Design', 'Operations'];

    const filteredTemplates = templates.filter((template) => {
        const matchesSearch =
            template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
            selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                        Project Templates
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Start your projects faster with pre-configured templates
                    </p>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-slate-900 dark:text-slate-50"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/templates/new')}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Create Template
                    </button>
                </div>

                {/* Category Filter */}
                <div className="mb-6 flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                selectedCategory === category
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            {category === 'all' ? 'All Templates' : category}
                        </button>
                    ))}
                </div>

                {/* Templates Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-pulse"
                            />
                        ))}
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                            No templates found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search or filters'
                                : 'Create your first project template to get started'}
                        </p>
                        <button
                            onClick={() => navigate('/templates/new')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Create Template
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => navigate(`/templates/${template.id}`)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {template.name}
                                        </h3>
                                        {template.category && (
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {template.category}
                                            </span>
                                        )}
                                    </div>
                                    {template.is_public && (
                                        <Star className="w-5 h-5 text-amber-500" />
                                    )}
                                </div>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                                    {template.description || 'No description provided'}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    <div className="flex items-center gap-1">
                                        <CheckSquare className="w-4 h-4" />
                                        <span>{template.task_templates?.length || 0} tasks</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4" />
                                        <span>{template.milestone_templates?.length || 0} milestones</span>
                                    </div>
                                    {template.estimated_duration_days && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            <span>{template.estimated_duration_days} days</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        by {template.created_by.username}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/templates/${template.id}/use`);
                                        }}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors"
                                    >
                                        Use Template
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default function Templates() {
    return (
        <ProtectedRoute>
            <TemplatesContent />
        </ProtectedRoute>
    );
}
