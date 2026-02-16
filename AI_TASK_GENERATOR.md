# AI Task Generator - Implementation Summary

## Overview
Added an AI-powered task generation tool that creates multiple tasks for a project based on project details or custom descriptions.

## Features
- **Two Input Modes**: 
  - Automatic: Uses project name, description, and status to generate relevant tasks
  - Custom: Accepts natural language description for specific task generation
- **Context-Aware**: Analyzes existing tasks to avoid duplicates and identify gaps
- **Batch Generation**: Creates 3-10 tasks per request based on project complexity
- **Preview Mode**: Review generated tasks before creating them (default)
- **Auto-Create Mode**: Optionally create tasks directly in the database
- **Owner-Only**: Only project owners can generate tasks (maintains permission model)

## API Endpoint

### POST `/api/ai/generate_tasks/`

**Authentication**: Required (JWT Bearer token)

**Request Body**:
```json
{
  "project_id": 123,
  "description": "optional custom description",
  "auto_create": false
}
```

**Parameters**:
- `project_id` (required): ID of the project to generate tasks for
- `description` (optional): Custom natural language description for specific task generation. If omitted, AI uses project details.
- `auto_create` (optional, default: false): If `true`, creates tasks immediately. If `false`, returns suggestions only.

**Response** (preview mode, `auto_create=false`):
```json
{
  "success": true,
  "project_id": 123,
  "suggestions": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high",
      "estimated_hours": 4.0,
      "rationale": "Why this task is important"
    }
  ],
  "enabled": true
}
```

**Response** (auto-create mode, `auto_create=true`):
```json
{
  "success": true,
  "project_id": 123,
  "suggestions": [...],
  "created_tasks": [
    {
      "id": 456,
      "title": "Task title",
      "description": "...",
      "priority": "high",
      "status": "todo",
      "estimated_hours": 4.0,
      "project": 123,
      "assigned_to": null,
      "created_at": "2026-02-15T10:30:00Z"
    }
  ],
  "created_count": 5,
  "enabled": true
}
```

## Implementation Details

### Backend Files Modified

1. **`backend/ai_service.py`**
   - Added `generate_tasks_for_project()` method
   - Added `_validate_generated_tasks()` validation method
   - Added `_get_fallback_task_generation()` fallback method for when AI is unavailable

2. **`backend/projects/views.py`**
   - Added `generate_tasks` action to `AIViewSet`
   - Handles permission checks (owner-only)
   - Creates tasks and logs activity when `auto_create=true`
   - Returns task suggestions for preview when `auto_create=false`

3. **`backend/projects/urls.py`**
   - No changes needed (AIViewSet already registered with router)

## Usage Examples

### Example 1: Generate Tasks from Project Details
```bash
curl -X POST http://localhost:8000/api/ai/generate_tasks/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 123,
    "auto_create": false
  }'
```

### Example 2: Generate Tasks from Custom Description
```bash
curl -X POST http://localhost:8000/api/ai/generate_tasks/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 123,
    "description": "Create a comprehensive authentication system with email verification, password reset, and 2FA support",
    "auto_create": false
  }'
```

### Example 3: Generate and Create Tasks Immediately
```bash
curl -X POST http://localhost:8000/api/ai/generate_tasks/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 123,
    "auto_create": true
  }'
```

## Testing

Use the provided test script:
```powershell
.\test_ai_task_generation.ps1
```

The script will:
1. Authenticate with the API
2. Fetch available projects
3. Test task generation in preview mode
4. Test task generation with custom description
5. Optionally create tasks in the database

## AI Model

- **Model**: Google Gemini 2.5 Flash
- **Configuration**: Set `GEMINI_API_KEY` environment variable
- **Fallback**: When AI is unavailable, provides template-based task suggestions

## Activity Logging

When tasks are created (auto_create=true), the system logs:
- Action: `'ai_task_created'`
- Metadata includes:
  - `ai_generated: true`
  - `rationale`: Why the task was generated
  - `custom_description`: Custom input if provided

## Error Handling

- **400 Bad Request**: Missing `project_id`
- **403 Forbidden**: User is not project owner
- **500 Internal Server Error**: AI service error or database error

## Permissions

- Only **project owners** can generate tasks
- Team members cannot use this endpoint (matches existing task creation permissions)

## Future Enhancements

Potential improvements:
1. Allow team members to generate task suggestions (without auto-create)
2. Add task dependency detection from descriptions
3. Support bulk editing/selection before creation
4. Add similarity detection to warn about potential duplicates
5. Integration with frontend AI assistant chat
6. Task template support (generate from templates)

## Notes

- Maximum 10 tasks generated per request
- Existing tasks are analyzed to avoid duplicates
- Tasks created with `status='todo'` and no default assignment
- Task titles limited to 200 characters
- Task descriptions limited to 1000 characters
- Rationale limited to 300 characters
