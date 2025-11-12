"""
AI Service Module for Synergy Project Management System
Uses Google's Gemini API for intelligent features
"""

import os
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import google.generativeai as genai
from django.conf import settings

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class AIService:
    """Main AI service class using Google Gemini"""
    
    def __init__(self):
        self.model_name = 'gemini-2.5-flash'
        self.enabled = bool(GEMINI_API_KEY)
    
    def _get_model(self):
        """Get Gemini model instance"""
        if not self.enabled:
            raise ValueError("Gemini API key not configured")
        return genai.GenerativeModel(self.model_name)
    
    def generate_task_suggestions(self, project_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Generate intelligent task suggestions based on project details
        
        Args:
            project_data: Dictionary containing project name, description, existing tasks
        
        Returns:
            List of suggested tasks with title, description, priority, estimated_hours
        """
        if not self.enabled:
            return self._get_fallback_suggestions(project_data)
        
        try:
            model = self._get_model()
            
            prompt = f"""
You are a project management AI assistant. Based on the following project details, suggest 5 relevant tasks that would help complete the project successfully.

Project Name: {project_data.get('name', 'Untitled Project')}
Project Description: {project_data.get('description', 'No description')}
Project Status: {project_data.get('status', 'planning')}
Existing Tasks: {len(project_data.get('existing_tasks', []))} tasks already created

Provide your response as a JSON array of tasks. Each task should have:
- title: Short, actionable task title (max 100 chars)
- description: Detailed description of what needs to be done (2-3 sentences)
- priority: One of "low", "medium", "high", or "critical"
- estimated_hours: Realistic time estimate as a number

Return ONLY the JSON array, no other text.
"""
            
            response = model.generate_content(prompt)
            suggestions = self._parse_json_response(response.text)
            
            # Validate and clean suggestions
            return self._validate_task_suggestions(suggestions)
            
        except Exception as e:
            print(f"Error generating task suggestions: {e}")
            return self._get_fallback_suggestions(project_data)
    
    def analyze_project_risks(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze project for potential risks and issues
        
        Args:
            project_data: Project details including tasks, team, deadlines
        
        Returns:
            Dictionary with risk analysis, score, and recommendations
        """
        if not self.enabled:
            return self._get_fallback_risk_analysis(project_data)
        
        try:
            model = self._get_model()
            
            tasks = project_data.get('tasks', [])
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t.get('status') == 'completed'])
            overdue_tasks = len([t for t in tasks if t.get('is_overdue', False)])
            
            prompt = f"""
You are a project risk analysis expert. Analyze the following project and identify potential risks.

Project: {project_data.get('name', 'Project')}
Total Tasks: {total_tasks}
Completed Tasks: {completed_tasks}
Overdue Tasks: {overdue_tasks}
Team Size: {project_data.get('team_size', 1)}
Project Priority: {project_data.get('priority', 'medium')}
Days Since Start: {project_data.get('days_since_start', 0)}

Provide a risk analysis as JSON with:
- risk_score: Number from 0-100 (0=no risk, 100=critical risk)
- risk_level: One of "low", "medium", "high", "critical"
- key_risks: Array of 3-5 specific risk descriptions
- recommendations: Array of 3-5 actionable recommendations to mitigate risks
- areas_of_concern: Array of specific areas that need attention

Return ONLY the JSON object, no other text.
"""
            
            response = model.generate_content(prompt)
            analysis = self._parse_json_response(response.text)
            
            return self._validate_risk_analysis(analysis)
            
        except Exception as e:
            print(f"Error analyzing project risks: {e}")
            return self._get_fallback_risk_analysis(project_data)
    
    def generate_insights(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized AI insights for user dashboard
        
        Args:
            user_data: User statistics, recent activity, projects
        
        Returns:
            Dictionary with insights, predictions, and automation suggestions
        """
        if not self.enabled:
            return self._get_fallback_insights(user_data)
        
        try:
            model = self._get_model()
            
            prompt = f"""
You are an AI productivity assistant. Analyze this user's work patterns and provide insights.

Total Projects: {user_data.get('total_projects', 0)}
Active Projects: {user_data.get('active_projects', 0)}
Completed Tasks This Week: {user_data.get('completed_tasks_week', 0)}
Overdue Tasks: {user_data.get('overdue_tasks', 0)}
Team Members: {user_data.get('team_members', 0)}
Average Task Completion Time: {user_data.get('avg_completion_time', 'N/A')}

Provide insights as JSON with:
- productivity_score: Number from 0-100
- trend: One of "improving", "stable", "declining"
- key_insights: Array of 3-4 insight strings
- predictions: Array of 2-3 predictions about upcoming work
- automation_suggestions: Array of 2-3 suggestions for workflow automation
- focus_areas: Array of 2-3 areas where user should focus attention

Return ONLY the JSON object, no other text.
"""
            
            response = model.generate_content(prompt)
            insights = self._parse_json_response(response.text)
            
            return self._validate_insights(insights)
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            return self._get_fallback_insights(user_data)
    
    def parse_natural_language_task(self, nl_input: str, project_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse natural language input into structured task data
        
        Args:
            nl_input: Natural language task description
            project_context: Context about the project
        
        Returns:
            Structured task dictionary with title, description, priority, etc.
        """
        if not self.enabled:
            return self._get_fallback_nl_task(nl_input)
        
        try:
            model = self._get_model()
            
            prompt = f"""
You are a task parsing AI. Convert the following natural language input into a structured task.

Project Context: {project_context.get('name', 'General Project')}
User Input: "{nl_input}"

Extract and structure this as JSON with:
- title: Clear, concise task title (max 100 chars)
- description: Detailed task description
- priority: One of "low", "medium", "high", "critical" (infer from urgency words)
- estimated_hours: Estimated time to complete (number, be realistic)
- tags: Array of 2-4 relevant tags/keywords
- due_date_suggestion: Suggested due date relative to today ("3 days", "1 week", "2 weeks", etc.) or null

Return ONLY the JSON object, no other text.
"""
            
            response = model.generate_content(prompt)
            task_data = self._parse_json_response(response.text)
            
            return self._validate_nl_task(task_data)
            
        except Exception as e:
            print(f"Error parsing natural language task: {e}")
            return self._get_fallback_nl_task(nl_input)
    
    def suggest_task_prioritization(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Suggest optimal task prioritization based on multiple factors
        
        Args:
            tasks: List of tasks with their current details
        
        Returns:
            Reordered list of tasks with priority suggestions
        """
        if not self.enabled or not tasks:
            return self._get_fallback_prioritization(tasks)
        
        try:
            model = self._get_model()
            
            # Prepare task summaries
            task_summaries = []
            for i, task in enumerate(tasks[:20]):  # Limit to 20 tasks
                task_summaries.append({
                    'index': i,
                    'title': task.get('title', ''),
                    'status': task.get('status', 'todo'),
                    'priority': task.get('priority', 'medium'),
                    'is_overdue': task.get('is_overdue', False),
                    'estimated_hours': task.get('estimated_hours', 0)
                })
            
            prompt = f"""
You are a task prioritization expert. Analyze these tasks and suggest optimal order.

Tasks: {json.dumps(task_summaries, indent=2)}

Consider:
- Current priority level
- Overdue status
- Task dependencies (infer from titles)
- Estimated effort
- Status (prioritize in-progress tasks)

Provide as JSON with:
- prioritized_indices: Array of task indices in optimal order
- reasoning: Brief explanation of prioritization strategy (1-2 sentences)

Return ONLY the JSON object, no other text.
"""
            
            response = model.generate_content(prompt)
            result = self._parse_json_response(response.text)
            
            # Reorder tasks based on AI suggestion
            prioritized_indices = result.get('prioritized_indices', list(range(len(tasks))))
            prioritized_tasks = []
            
            for idx in prioritized_indices:
                if 0 <= idx < len(tasks):
                    task_copy = tasks[idx].copy()
                    task_copy['ai_reasoning'] = result.get('reasoning', '')
                    prioritized_tasks.append(task_copy)
            
            # Add any remaining tasks not in the prioritized list
            included_indices = set(prioritized_indices)
            for i, task in enumerate(tasks):
                if i not in included_indices:
                    prioritized_tasks.append(task)
            
            return prioritized_tasks
            
        except Exception as e:
            print(f"Error suggesting prioritization: {e}")
            return self._get_fallback_prioritization(tasks)
    
    def generate_project_summary(self, project_data: Dict[str, Any]) -> str:
        """
        Generate an AI-powered project summary
        
        Args:
            project_data: Complete project data
        
        Returns:
            Human-readable project summary
        """
        if not self.enabled:
            return self._get_fallback_summary(project_data)
        
        try:
            model = self._get_model()
            
            tasks = project_data.get('tasks', [])
            
            prompt = f"""
Generate a concise project summary (3-4 sentences) for:

Project: {project_data.get('name', '')}
Description: {project_data.get('description', '')}
Status: {project_data.get('status', '')}
Total Tasks: {len(tasks)}
Completed: {len([t for t in tasks if t.get('status') == 'completed'])}
Team Size: {project_data.get('team_size', 1)}

Write a professional summary highlighting progress, key activities, and next steps.
"""
            
            response = model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating summary: {e}")
            return self._get_fallback_summary(project_data)
    
    # Helper methods for parsing and validation
    
    def _parse_json_response(self, text: str) -> Any:
        """Parse JSON from Gemini response, handling markdown code blocks"""
        text = text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith('```'):
            lines = text.split('\n')
            text = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])
            if text.startswith('json'):
                text = text[4:].strip()
        
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            # Try to find JSON in the text
            start_idx = text.find('{')
            end_idx = text.rfind('}')
            if start_idx != -1 and end_idx != -1:
                try:
                    return json.loads(text[start_idx:end_idx+1])
                except:
                    pass
            
            # Try array
            start_idx = text.find('[')
            end_idx = text.rfind(']')
            if start_idx != -1 and end_idx != -1:
                try:
                    return json.loads(text[start_idx:end_idx+1])
                except:
                    pass
            
            raise ValueError(f"Could not parse JSON from response: {text[:200]}")
    
    def _validate_task_suggestions(self, suggestions: List) -> List[Dict[str, str]]:
        """Validate and clean task suggestions"""
        if not isinstance(suggestions, list):
            return []
        
        valid_suggestions = []
        for task in suggestions[:10]:  # Max 10 suggestions
            if isinstance(task, dict) and 'title' in task:
                valid_suggestions.append({
                    'title': str(task.get('title', ''))[:100],
                    'description': str(task.get('description', ''))[:500],
                    'priority': task.get('priority', 'medium') if task.get('priority') in ['low', 'medium', 'high', 'critical'] else 'medium',
                    'estimated_hours': int(task.get('estimated_hours', 4)) if isinstance(task.get('estimated_hours'), (int, float)) else 4
                })
        
        return valid_suggestions
    
    def _validate_risk_analysis(self, analysis: Dict) -> Dict[str, Any]:
        """Validate risk analysis response"""
        return {
            'risk_score': min(100, max(0, int(analysis.get('risk_score', 50)))),
            'risk_level': analysis.get('risk_level', 'medium') if analysis.get('risk_level') in ['low', 'medium', 'high', 'critical'] else 'medium',
            'key_risks': (analysis.get('key_risks', []) if isinstance(analysis.get('key_risks'), list) else [])[:5],
            'recommendations': (analysis.get('recommendations', []) if isinstance(analysis.get('recommendations'), list) else [])[:5],
            'areas_of_concern': (analysis.get('areas_of_concern', []) if isinstance(analysis.get('areas_of_concern'), list) else [])[:5]
        }
    
    def _validate_insights(self, insights: Dict) -> Dict[str, Any]:
        """Validate insights response"""
        return {
            'productivity_score': min(100, max(0, int(insights.get('productivity_score', 70)))),
            'trend': insights.get('trend', 'stable') if insights.get('trend') in ['improving', 'stable', 'declining'] else 'stable',
            'key_insights': (insights.get('key_insights', []) if isinstance(insights.get('key_insights'), list) else [])[:5],
            'predictions': (insights.get('predictions', []) if isinstance(insights.get('predictions'), list) else [])[:3],
            'automation_suggestions': (insights.get('automation_suggestions', []) if isinstance(insights.get('automation_suggestions'), list) else [])[:3],
            'focus_areas': (insights.get('focus_areas', []) if isinstance(insights.get('focus_areas'), list) else [])[:3]
        }
    
    def _validate_nl_task(self, task_data: Dict) -> Dict[str, Any]:
        """Validate natural language task parsing"""
        return {
            'title': str(task_data.get('title', 'New Task'))[:100],
            'description': str(task_data.get('description', ''))[:500],
            'priority': task_data.get('priority', 'medium') if task_data.get('priority') in ['low', 'medium', 'high', 'critical'] else 'medium',
            'estimated_hours': int(task_data.get('estimated_hours', 2)) if isinstance(task_data.get('estimated_hours'), (int, float)) else 2,
            'tags': (task_data.get('tags', []) if isinstance(task_data.get('tags'), list) else [])[:5],
            'due_date_suggestion': str(task_data.get('due_date_suggestion', '')) if task_data.get('due_date_suggestion') else None
        }
    
    # Fallback methods when AI is not available
    
    def _get_fallback_suggestions(self, project_data: Dict) -> List[Dict[str, str]]:
        """Fallback task suggestions when AI is unavailable"""
        project_name = project_data.get('name', 'Project')
        return [
            {
                'title': f'Review {project_name} requirements',
                'description': 'Analyze and document project requirements and scope',
                'priority': 'high',
                'estimated_hours': 4
            },
            {
                'title': 'Create project documentation',
                'description': 'Set up documentation structure and initial pages',
                'priority': 'medium',
                'estimated_hours': 3
            },
            {
                'title': 'Setup development environment',
                'description': 'Configure tools, dependencies, and development workflow',
                'priority': 'high',
                'estimated_hours': 2
            }
        ]
    
    def _get_fallback_risk_analysis(self, project_data: Dict) -> Dict[str, Any]:
        """Fallback risk analysis"""
        tasks = project_data.get('tasks', [])
        total_tasks = len(tasks)
        completed = len([t for t in tasks if t.get('status') == 'completed'])
        overdue = len([t for t in tasks if t.get('is_overdue', False)])
        
        risk_score = 30
        if overdue > 0:
            risk_score += overdue * 10
        if total_tasks > 0 and completed / total_tasks < 0.3:
            risk_score += 20
        
        risk_score = min(100, risk_score)
        
        return {
            'risk_score': risk_score,
            'risk_level': 'high' if risk_score > 70 else 'medium' if risk_score > 40 else 'low',
            'key_risks': ['Task completion rate needs attention', 'Monitor project timeline'],
            'recommendations': ['Focus on high-priority tasks', 'Review and update task deadlines'],
            'areas_of_concern': ['Task progress tracking']
        }
    
    def _get_fallback_insights(self, user_data: Dict) -> Dict[str, Any]:
        """Fallback insights"""
        return {
            'productivity_score': 75,
            'trend': 'stable',
            'key_insights': [
                'You have active projects that need attention',
                'Consider prioritizing overdue tasks',
                'Regular updates help team collaboration'
            ],
            'predictions': ['Task completion may slow down without focus'],
            'automation_suggestions': ['Set up task reminders', 'Enable progress notifications'],
            'focus_areas': ['Complete overdue tasks', 'Update project status']
        }
    
    def _get_fallback_nl_task(self, nl_input: str) -> Dict[str, Any]:
        """Fallback natural language parsing"""
        return {
            'title': nl_input[:100] if len(nl_input) <= 100 else nl_input[:97] + '...',
            'description': nl_input,
            'priority': 'medium',
            'estimated_hours': 2,
            'tags': [],
            'due_date_suggestion': None
        }
    
    def _get_fallback_prioritization(self, tasks: List[Dict]) -> List[Dict]:
        """Fallback task prioritization"""
        # Simple prioritization: overdue > high priority > in-progress > rest
        if not tasks:
            return []
        
        priority_map = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        
        def task_score(task):
            score = 0
            if task.get('is_overdue'):
                score += 1000
            if task.get('status') == 'in_progress':
                score += 100
            score += priority_map.get(task.get('priority', 'medium'), 2) * 10
            return score
        
        return sorted(tasks, key=task_score, reverse=True)
    
    def _get_fallback_summary(self, project_data: Dict) -> str:
        """Fallback project summary"""
        name = project_data.get('name', 'Project')
        tasks = project_data.get('tasks', [])
        total = len(tasks)
        completed = len([t for t in tasks if t.get('status') == 'completed'])
        
        return f"{name} is currently {project_data.get('status', 'active')} with {completed} of {total} tasks completed. The team is making progress on key deliverables."


# Global AI service instance
ai_service = AIService()
