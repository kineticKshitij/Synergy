import { useState } from 'react';
import { MessageSquare, Send, Sparkles, X, Loader2, Brain } from 'lucide-react';
import { aiService } from '~/services/ai.service';

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
}

interface AIAssistantProps {
    projectId?: number;
}

export function AIAssistant({ projectId }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            type: 'ai',
            content: "Hi! I'm your AI assistant. I can help you create tasks, analyze risks, and provide project insights. What would you like to do?",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || isProcessing) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsProcessing(true);

        try {
            // Determine intent and call appropriate AI service
            const lowerInput = input.toLowerCase();

            let aiResponse = '';

            if (lowerInput.includes('create task') || lowerInput.includes('new task') || lowerInput.includes('add task')) {
                // Parse natural language task
                const result = await aiService.parseNaturalLanguageTask(input, projectId);
                if (result.enabled) {
                    const task = result.task_data;
                    aiResponse = `I've parsed your task:\n\n**Title:** ${task.title}\n**Description:** ${task.description}\n**Priority:** ${task.priority}\n**Estimated Time:** ${task.estimated_hours} hours\n**Tags:** ${task.tags.join(', ')}\n\nWould you like me to create this task in your project?`;
                } else {
                    aiResponse = "AI features are not currently enabled. Please configure GEMINI_API_KEY to use AI-powered task parsing.";
                }
            } else if (lowerInput.includes('risk') || lowerInput.includes('analyze') || lowerInput.includes('problems')) {
                // Analyze project risks
                if (projectId) {
                    const result = await aiService.analyzeProjectRisks(projectId);
                    if (result.enabled) {
                        const analysis = result.analysis;
                        aiResponse = `**Risk Analysis:**\n\nRisk Level: ${analysis.risk_level.toUpperCase()} (Score: ${analysis.risk_score}/100)\n\n**Key Risks:**\n${analysis.key_risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**Recommendations:**\n${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
                    } else {
                        aiResponse = "AI risk analysis is not currently enabled.";
                    }
                } else {
                    aiResponse = "Please select a project first to analyze risks.";
                }
            } else if (lowerInput.includes('suggest') || lowerInput.includes('ideas') || lowerInput.includes('what should')) {
                // Generate task suggestions
                if (projectId) {
                    const result = await aiService.generateTaskSuggestions(projectId);
                    if (result.enabled) {
                        aiResponse = `**Task Suggestions:**\n\n${result.suggestions.map((s, i) => 
                            `${i + 1}. **${s.title}** (${s.priority} priority, ~${s.estimated_hours}h)\n   ${s.description}`
                        ).join('\n\n')}`;
                    } else {
                        aiResponse = "AI task suggestions are not currently enabled.";
                    }
                } else {
                    aiResponse = "Please select a project first to get task suggestions.";
                }
            } else if (lowerInput.includes('prioritize') || lowerInput.includes('priority')) {
                // Suggest task prioritization
                if (projectId) {
                    const result = await aiService.suggestTaskPrioritization(projectId);
                    if (result.enabled) {
                        aiResponse = `**Prioritization Suggestions:**\n\n${result.prioritized_tasks.slice(0, 5).map((t, i) => 
                            `${i + 1}. Task #${t.task_id}: ${t.priority} priority\n   Reasoning: ${t.reasoning}\n   Urgency Score: ${t.urgency_score}/100`
                        ).join('\n\n')}`;
                    } else {
                        aiResponse = "AI prioritization is not currently enabled.";
                    }
                } else {
                    aiResponse = "Please select a project first to prioritize tasks.";
                }
            } else if (lowerInput.includes('insights') || lowerInput.includes('productivity') || lowerInput.includes('how am i doing')) {
                // Generate insights
                const result = await aiService.generateInsights();
                if (result.enabled) {
                    const insights = result.insights;
                    aiResponse = `**Your Productivity Insights:**\n\nScore: ${insights.productivity_score}/100 (${insights.trend})\n\n**Key Insights:**\n${insights.key_insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}\n\n**Automation Suggestions:**\n${insights.automation_suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}`;
                } else {
                    aiResponse = "AI insights are not currently enabled.";
                }
            } else {
                // Default response with available commands
                aiResponse = `I can help you with:\n\n• **Create Tasks** - Say "create task: [description]"\n• **Risk Analysis** - Ask "analyze risks for this project"\n• **Task Suggestions** - Say "suggest tasks for this project"\n• **Prioritization** - Ask "prioritize my tasks"\n• **Insights** - Ask "show my productivity insights"\n\nWhat would you like to do?`;
            }

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Assistant error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                type: 'ai',
                content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 z-50 group"
                title="Open AI Assistant"
            >
                <Brain className="w-6 h-6" />
                <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            AI Assistant
                            <Sparkles className="w-4 h-4" />
                        </h3>
                        <p className="text-xs text-purple-100">Powered by Gemini</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-3 ${
                                message.type === 'user'
                                    ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-br-sm'
                                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'
                            }`}
                        >
                            {message.type === 'ai' && (
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-purple-500" />
                                    <span className="text-xs font-medium text-slate-500">AI Assistant</span>
                                </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap text-black">{message.content}</p>
                            <p className={`text-xs mt-1 ${message.type === 'user' ? 'text-purple-100' : 'text-slate-400'}`}>
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-bl-sm shadow-sm p-3">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                <span className="text-sm">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isProcessing}
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-400 text-slate-900"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
