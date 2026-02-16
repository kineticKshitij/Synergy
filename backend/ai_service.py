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
- priority: One of "low", "medium", "high", or "urgent"
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
    
    def generate_tasks_for_project(self, project_data: Dict[str, Any], existing_tasks: List[Dict[str, Any]], custom_description: str = None) -> List[Dict[str, Any]]:
        """
        Generate multiple tasks for a project based on project details or custom description
        
        Args:
            project_data: Dictionary containing project name, description, status, etc.
            existing_tasks: List of existing task titles to avoid duplicates
            custom_description: Optional custom description to override project context
        
        Returns:
            List of generated tasks with title, description, priority, estimated_hours, rationale
        """
        if not self.enabled:
            return self._get_fallback_task_generation(project_data, existing_tasks, custom_description)
        
        try:
            model = self._get_model()
            
            # Prepare existing task titles for duplicate detection
            existing_titles = [task.get('title', '') for task in existing_tasks]
            existing_titles_str = '\n'.join([f"- {title}" for title in existing_titles[:20]])  # Limit to 20
            
            # Determine what to use as the main directive
            if custom_description:
                directive = f"Custom Request: {custom_description}"
            else:
                directive = f"""
Project Name: {project_data.get('name', 'Untitled Project')}
Project Description: {project_data.get('description', 'No description provided')}
Project Status: {project_data.get('status', 'planning')}
Project Priority: {project_data.get('priority', 'medium')}
"""
            
            prompt = f"""
You are a project management AI assistant. Generate a comprehensive set of tasks for this project.

{directive}

Existing Tasks ({len(existing_tasks)} already created):
{existing_titles_str if existing_titles_str else 'None'}

Generate 3-10 NEW tasks that:
1. Are essential for completing this project
2. Are NOT duplicates or too similar to existing tasks
3. Cover different aspects (planning, implementation, testing, documentation, etc.)
4. Are specific and actionable (not vague)
5. Have realistic time estimates
6. Build on or complement existing tasks when appropriate

For each task, provide:
- title: Clear, actionable task title (max 100 chars)
- description: Detailed description of what needs to be done (2-4 sentences)
- priority: One of "low", "medium", "high", or "urgent"
- estimated_hours: Realistic time estimate as a number (be conservative)
- rationale: Brief explanation of why this task is important (1 sentence)

Avoid:
- Generic tasks like "Review project" or "Update documentation" unless very specific
- Tasks that duplicate or overlap significantly with existing tasks
- Tasks that are too broad (break them down into specific actions)

Return ONLY a JSON array of task objects, no other text:
[
  {{
    "title": "...",
    "description": "...",
    "priority": "...",
    "estimated_hours": ...,
    "rationale": "..."
  }}
]
"""
            
            response = model.generate_content(prompt)
            tasks = self._parse_json_response(response.text)
            
            # Validate and clean tasks
            return self._validate_generated_tasks(tasks)
            
        except Exception as e:
            print(f"Error generating tasks for project: {e}")
            return self._get_fallback_task_generation(project_data, existing_tasks, custom_description)
    
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
- priority: One of "low", "medium", "high", "urgent" (infer from urgency words)
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
                    'priority': task.get('priority', 'medium') if task.get('priority') in ['low', 'medium', 'high', 'urgent'] else 'medium',
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
            'priority': task_data.get('priority', 'medium') if task_data.get('priority') in ['low', 'medium', 'high', 'urgent'] else 'medium',
            'estimated_hours': int(task_data.get('estimated_hours', 2)) if isinstance(task_data.get('estimated_hours'), (int, float)) else 2,
            'tags': (task_data.get('tags', []) if isinstance(task_data.get('tags'), list) else [])[:5],
            'due_date_suggestion': str(task_data.get('due_date_suggestion', '')) if task_data.get('due_date_suggestion') else None
        }
    
    def _validate_generated_tasks(self, tasks: List) -> List[Dict[str, Any]]:
        """Validate and clean generated tasks"""
        if not isinstance(tasks, list):
            return []
        
        valid_tasks = []
        for task in tasks[:10]:  # Max 10 tasks
            if isinstance(task, dict) and 'title' in task:
                valid_tasks.append({
                    'title': str(task.get('title', ''))[:200],
                    'description': str(task.get('description', ''))[:1000],
                    'priority': task.get('priority', 'medium') if task.get('priority') in ['low', 'medium', 'high', 'urgent'] else 'medium',
                    'estimated_hours': float(task.get('estimated_hours', 2)) if isinstance(task.get('estimated_hours'), (int, float)) and task.get('estimated_hours') > 0 else 2.0,
                    'rationale': str(task.get('rationale', 'AI-generated task'))[:300]
                })
        
        return valid_tasks
    
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
    
    def _get_fallback_task_generation(self, project_data: Dict, existing_tasks: List, custom_description: str = None) -> List[Dict[str, Any]]:
        """Fallback task generation when AI is unavailable"""
        project_name = project_data.get('name', 'Project')
        project_status = project_data.get('status', 'planning')
        
        # Generate basic tasks based on project status
        fallback_tasks = []
        
        if project_status == 'planning' or len(existing_tasks) == 0:
            fallback_tasks = [
                {
                    'title': f'Define {project_name} requirements and scope',
                    'description': 'Document detailed requirements, success criteria, and project scope. Identify stakeholders and gather input.',
                    'priority': 'high',
                    'estimated_hours': 4.0,
                    'rationale': 'Clear requirements are essential for project success'
                },
                {
                    'title': f'Create technical architecture for {project_name}',
                    'description': 'Design system architecture, select technologies, and plan infrastructure. Document key technical decisions.',
                    'priority': 'high',
                    'estimated_hours': 6.0,
                    'rationale': 'Architecture guides all implementation work'
                },
                {
                    'title': f'Setup development environment and tools',
                    'description': 'Configure development environment, version control, CI/CD pipeline, and collaboration tools.',
                    'priority': 'high',
                    'estimated_hours': 3.0,
                    'rationale': 'Proper tooling enables efficient development'
                },
                {
                    'title': f'Create project timeline and milestones',
                    'description': 'Break down project into phases, set realistic milestones, and allocate resources.',
                    'priority': 'medium',
                    'estimated_hours': 2.0,
                    'rationale': 'Timeline keeps project on track'
                }
            ]
        else:
            fallback_tasks = [
                {
                    'title': f'Implement core functionality for {project_name}',
                    'description': 'Build the main features and components. Follow architecture and design specifications.',
                    'priority': 'high',
                    'estimated_hours': 8.0,
                    'rationale': 'Core functionality is the heart of the project'
                },
                {
                    'title': f'Write unit and integration tests',
                    'description': 'Create comprehensive test suite covering key functionality. Aim for high code coverage.',
                    'priority': 'high',
                    'estimated_hours': 4.0,
                    'rationale': 'Tests ensure quality and prevent regressions'
                },
                {
                    'title': f'Create user documentation and guides',
                    'description': 'Write user guides, API documentation, and setup instructions. Include examples and troubleshooting.',
                    'priority': 'medium',
                    'estimated_hours': 3.0,
                    'rationale': 'Documentation enables users to effectively use the project'
                },
                {
                    'title': f'Conduct code review and refactoring',
                    'description': 'Review code quality, refactor where needed, and ensure coding standards are followed.',
                    'priority': 'medium',
                    'estimated_hours': 4.0,
                    'rationale': 'Code quality impacts maintainability'
                },
                {
                    'title': f'Perform security audit and testing',
                    'description': 'Review security implications, test for vulnerabilities, and implement security best practices.',
                    'priority': 'high',
                    'estimated_hours': 5.0,
                    'rationale': 'Security is critical for production systems'
                }
            ]
        
        # If custom description provided, add a custom task
        if custom_description:
            fallback_tasks.insert(0, {
                'title': custom_description[:100] if len(custom_description) <= 100 else custom_description[:97] + '...',
                'description': custom_description,
                'priority': 'medium',
                'estimated_hours': 4.0,
                'rationale': 'Custom task requested by user'
            })
        
        # Filter out potential duplicates with existing tasks
        existing_titles_lower = [t.get('title', '').lower() for t in existing_tasks]
        filtered_tasks = []
        for task in fallback_tasks:
            title_lower = task['title'].lower()
            # Simple duplicate check: if any existing title is very similar
            is_duplicate = any(
                title_lower in existing or existing in title_lower 
                for existing in existing_titles_lower
            )
            if not is_duplicate:
                filtered_tasks.append(task)
        
        return filtered_tasks[:5]  # Return max 5 tasks in fallback mode
    
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
        
        priority_map = {'urgent': 4, 'high': 3, 'medium': 2, 'low': 1}
        
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
    
    def breakdown_task_into_subtasks(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Break down a complex task into smaller subtasks with estimates and dependencies
        
        Args:
            task_data: Dictionary with task title, description, context
        
        Returns:
            Dictionary with subtasks, dependencies, total estimate
        """
        if not self.enabled:
            return self._get_fallback_task_breakdown(task_data)
        
        try:
            model = self._get_model()
            
            prompt = f"""
You are a project management expert. Break down the following task into smaller, actionable subtasks.

Task Title: {task_data.get('title', 'Task')}
Task Description: {task_data.get('description', 'No description provided')}
Project Context: {task_data.get('project_context', 'General project')}

Analyze this task and create 3-7 subtasks that together accomplish the main task. For each subtask:
- title: Clear, actionable title (max 80 chars)
- description: What needs to be done (1-2 sentences)
- estimated_hours: Realistic time estimate
- priority: "low", "medium", "high", or "urgent"
- dependencies: Array of subtask indices this depends on (0-indexed, empty array if no dependencies)
- skills_required: Array of skills needed (e.g., ["frontend", "api", "testing"])

Also provide:
- total_estimated_hours: Sum of all subtask estimates
- complexity_score: 1-10 rating of overall task complexity
- recommended_sequence: Brief text explaining optimal order to tackle subtasks

Return ONLY a JSON object with this structure:
{{
  "subtasks": [...],
  "total_estimated_hours": number,
  "complexity_score": number,
  "recommended_sequence": "string"
}}
"""
            
            response = model.generate_content(prompt)
            breakdown = self._parse_json_response(response.text)
            
            # Validate structure
            if 'subtasks' not in breakdown:
                return self._get_fallback_task_breakdown(task_data)
            
            return breakdown
            
        except Exception as e:
            print(f"Error breaking down task: {e}")
            return self._get_fallback_task_breakdown(task_data)
    
    def suggest_due_date(self, task_data: Dict[str, Any], user_workload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest realistic due date based on task complexity and user's current workload
        
        Args:
            task_data: Task details including title, description, priority, estimated hours
            user_workload: Current workload info (active tasks, hours committed, availability)
        
        Returns:
            Dictionary with suggested date, reasoning, alternative dates
        """
        if not self.enabled:
            return self._get_fallback_due_date(task_data, user_workload)
        
        try:
            model = self._get_model()
            
            current_date = datetime.now().strftime('%Y-%m-%d')
            
            prompt = f"""
You are a project planning AI. Suggest a realistic due date for this task based on the user's workload.

Current Date: {current_date}

Task Details:
- Title: {task_data.get('title', 'Task')}
- Description: {task_data.get('description', 'No description')}
- Priority: {task_data.get('priority', 'medium')}
- Estimated Hours: {task_data.get('estimated_hours', 'not specified')}

User's Current Workload:
- Active Tasks: {user_workload.get('active_task_count', 0)}
- Hours Already Committed (next 7 days): {user_workload.get('committed_hours_week', 0)}
- Hours Available Per Day: {user_workload.get('available_hours_per_day', 6)}
- Upcoming Deadlines: {user_workload.get('upcoming_deadline_count', 0)}

Consider:
1. Task complexity and estimated hours
2. Current workload capacity
3. Task priority (critical tasks should be sooner)
4. Buffer time for unexpected issues
5. Reasonable work-life balance

Provide your response as a JSON object with:
- suggested_date: ISO date string (YYYY-MM-DD)
- confidence_level: "high", "medium", or "low"
- reasoning: Brief explanation (2-3 sentences)
- alternative_dates: Array of 2 other date options with brief rationale
- workload_warning: Boolean if user seems overloaded
- capacity_percentage: Estimated % of user's capacity this will consume

Return ONLY the JSON object.
"""
            
            response = model.generate_content(prompt)
            suggestion = self._parse_json_response(response.text)
            
            return suggestion
            
        except Exception as e:
            print(f"Error suggesting due date: {e}")
            return self._get_fallback_due_date(task_data, user_workload)
    
    def extract_tasks_from_meeting_notes(self, meeting_notes: str, project_context: str = "") -> Dict[str, Any]:
        """
        Extract action items and tasks from meeting notes
        
        Args:
            meeting_notes: Free-form text of meeting notes
            project_context: Optional project name/context
        
        Returns:
            Dictionary with extracted tasks, meeting summary, attendees mentioned
        """
        if not self.enabled:
            return self._get_fallback_meeting_extraction(meeting_notes)
        
        try:
            model = self._get_model()
            
            prompt = f"""
You are an AI assistant that extracts actionable tasks from meeting notes.

Project Context: {project_context or 'General meeting'}

Meeting Notes:
{meeting_notes}

Analyze these notes and extract:
1. Action items / tasks that need to be completed
2. Who is responsible (if mentioned)
3. Deadlines or timeframes (if mentioned)
4. Priority level based on discussion tone

For each task provide:
- title: Clear, actionable task title
- description: Context from the meeting (2-3 sentences)
- assignee: Person mentioned or "unassigned"
- priority: "low", "medium", "high", or "urgent" based on discussion
- estimated_hours: Your best guess based on task scope
- due_date_mentioned: Specific date if mentioned, or null
- relevant_context: Key quotes or context from meeting

Also provide:
- meeting_summary: 2-3 sentence overview of the meeting
- key_decisions: Array of major decisions made
- attendees_mentioned: Array of names detected in notes
- follow_up_needed: Boolean if more discussion is needed

Return ONLY a JSON object:
{{
  "extracted_tasks": [...],
  "meeting_summary": "string",
  "key_decisions": [...],
  "attendees_mentioned": [...],
  "follow_up_needed": boolean
}}
"""
            
            response = model.generate_content(prompt)
            extraction = self._parse_json_response(response.text)
            
            return extraction
            
        except Exception as e:
            print(f"Error extracting tasks from meeting notes: {e}")
            return self._get_fallback_meeting_extraction(meeting_notes)
    
    def _get_fallback_task_breakdown(self, task_data: Dict) -> Dict[str, Any]:
        """Fallback task breakdown when AI is unavailable"""
        estimated_hours = task_data.get('estimated_hours', 8)
        
        return {
            'subtasks': [
                {
                    'title': 'Plan and design approach',
                    'description': 'Define requirements and technical approach',
                    'estimated_hours': max(1, estimated_hours * 0.2),
                    'priority': 'high',
                    'dependencies': [],
                    'skills_required': ['planning']
                },
                {
                    'title': 'Implement core functionality',
                    'description': 'Build the main features and functionality',
                    'estimated_hours': max(2, estimated_hours * 0.5),
                    'priority': 'high',
                    'dependencies': [0],
                    'skills_required': ['development']
                },
                {
                    'title': 'Testing and refinement',
                    'description': 'Test thoroughly and fix any issues',
                    'estimated_hours': max(1, estimated_hours * 0.3),
                    'priority': 'medium',
                    'dependencies': [1],
                    'skills_required': ['testing']
                }
            ],
            'total_estimated_hours': estimated_hours,
            'complexity_score': 5,
            'recommended_sequence': 'Start with planning, implement core features, then test thoroughly'
        }
    
    def _get_fallback_due_date(self, task_data: Dict, user_workload: Dict) -> Dict[str, Any]:
        """Fallback due date suggestion"""
        priority = task_data.get('priority', 'medium')
        estimated_hours = task_data.get('estimated_hours', 4)
        
        # Simple calculation: urgent = 1 day, high priority = 2 days, medium = 5 days, low = 7 days
        days_map = {'urgent': 1, 'high': 2, 'medium': 5, 'low': 7}
        days_ahead = days_map.get(priority, 5)
        
        # Adjust for estimated hours
        if estimated_hours > 8:
            days_ahead += 2
        
        suggested_date = (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
        alternative_1 = (datetime.now() + timedelta(days=days_ahead-2)).strftime('%Y-%m-%d')
        alternative_2 = (datetime.now() + timedelta(days=days_ahead+3)).strftime('%Y-%m-%d')
        
        return {
            'suggested_date': suggested_date,
            'confidence_level': 'medium',
            'reasoning': f'Based on {priority} priority and estimated {estimated_hours} hours, allowing for current workload.',
            'alternative_dates': [
                {'date': alternative_1, 'rationale': 'Aggressive timeline if task is critical'},
                {'date': alternative_2, 'rationale': 'Conservative timeline with buffer'}
            ],
            'workload_warning': user_workload.get('active_task_count', 0) > 10,
            'capacity_percentage': min(100, (estimated_hours / 40) * 100)
        }
    
    def _get_fallback_meeting_extraction(self, meeting_notes: str) -> Dict[str, Any]:
        """Fallback meeting notes extraction"""
        # Simple extraction: look for action items, TODO, follow-up
        lines = meeting_notes.split('\n')
        tasks = []
        
        action_keywords = ['action item', 'todo', 'task', 'follow up', 'need to', 'should', 'will']
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in action_keywords):
                tasks.append({
                    'title': line.strip()[:100],
                    'description': line.strip(),
                    'assignee': 'unassigned',
                    'priority': 'medium',
                    'estimated_hours': 2,
                    'due_date_mentioned': None,
                    'relevant_context': line.strip()
                })
        
        # If no tasks found, create one generic task
        if not tasks:
            tasks.append({
                'title': 'Review meeting notes and create action items',
                'description': meeting_notes[:200],
                'assignee': 'unassigned',
                'priority': 'medium',
                'estimated_hours': 1,
                'due_date_mentioned': None,
                'relevant_context': 'Action items not clearly defined in meeting'
            })
        
        return {
            'extracted_tasks': tasks[:10],  # Limit to 10 tasks
            'meeting_summary': meeting_notes[:300] if len(meeting_notes) > 300 else meeting_notes,
            'key_decisions': ['Review meeting notes for specific decisions'],
            'attendees_mentioned': [],
            'follow_up_needed': len(tasks) == 0
        }


# Global AI service instance
ai_service = AIService()
