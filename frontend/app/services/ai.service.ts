/**
 * AI Service for Synergy Project Management
 * Provides AI-powered features including task suggestions, risk analysis, and insights
 */

// Use relative URL to go through nginx proxy
const API_URL = '/api';

export interface AITaskSuggestion {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_hours: number;
}

export interface AIRiskAnalysis {
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    key_risks: string[];
    recommendations: string[];
    areas_of_concern: string[];
}

export interface AIInsights {
    productivity_score: number;
    trend: 'improving' | 'stable' | 'declining';
    key_insights: string[];
    predictions: string[];
    automation_suggestions: string[];
    focus_areas: string[];
}

export interface ParsedTask {
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimated_hours: number;
    tags: string[];
    due_date_suggestion: string | null;
}

export interface PrioritizedTask {
    id: number;
    title: string;
    status: string;
    priority: string;
    is_overdue: boolean;
    estimated_hours: number;
    ai_reasoning?: string;
}

class AIService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('access_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    /**
     * Generate AI-powered task suggestions for a project
     */
    async generateTaskSuggestions(projectId: number): Promise<{
        suggestions: AITaskSuggestion[];
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/task_suggestions/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate task suggestions');
        }

        return response.json();
    }

    /**
     * Analyze project risks using AI
     */
    async analyzeProjectRisks(projectId: number): Promise<{
        analysis: AIRiskAnalysis;
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/risk_analysis/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to analyze project risks');
        }

        return response.json();
    }

    /**
     * Parse natural language task description
     */
    async parseNaturalLanguageTask(
        description: string,
        projectId?: number
    ): Promise<{
        parsed_task: ParsedTask;
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/parse_nl_task/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                description,
                project_id: projectId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to parse task description');
        }

        return response.json();
    }

    /**
     * Get AI-powered task prioritization
     */
    async prioritizeTasks(
        projectId: number,
        taskIds?: number[]
    ): Promise<{
        prioritized_tasks: PrioritizedTask[];
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/prioritize_tasks/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                project_id: projectId,
                task_ids: taskIds,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to prioritize tasks');
        }

        return response.json();
    }

    /**
     * Generate personalized AI insights for user
     */
    async generateInsights(): Promise<{
        insights: AIInsights;
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/generate_insights/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate insights');
        }

        return response.json();
    }

    /**
     * Generate AI-powered project summary
     */
    async generateProjectSummary(projectId: number): Promise<{
        summary: string;
        enabled: boolean;
    }> {
        const response = await fetch(`${API_URL}/ai/project_summary/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ project_id: projectId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate project summary');
        }

        return response.json();
    }

    /**
     * Check if AI features are enabled
     */
    async checkAIStatus(): Promise<boolean> {
        try {
            const response = await this.generateInsights();
            return response.enabled;
        } catch {
            return false;
        }
    }
}

export const aiService = new AIService();
export default aiService;
