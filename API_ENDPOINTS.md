# SynergyOS Project Management System - API Documentation

**Total Endpoints: 118**  
**Base URL**: `http://localhost/api`  
**Authentication**: Bearer Token (JWT)

---

## 🔐 AUTHENTICATION (16 endpoints)

### User Registration & Login
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/register/` | Register new user | `{username, email, password, first_name, last_name}` |
| POST | `/auth/login/` | Login user | `{username, password}` |
| POST | `/auth/logout/` | Logout current user | - |
| POST | `/auth/token/refresh/` | Refresh access token | `{refresh}` |

### Profile Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PUT | `/auth/profile/` | Get/update user profile |
| GET | `/auth/profile/extended/` | Get extended profile with stats |

### Password Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/password-reset/` | Request password reset | `{email}` |
| POST | `/auth/password-reset-confirm/` | Confirm password reset | `{uid, token, new_password}` |
| POST | `/auth/change-password/` | Change password | `{old_password, new_password}` |

### Two-Factor Authentication
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/auth/send-otp/` | Send OTP to email | - |
| POST | `/auth/verify-otp/` | Verify OTP code | `{otp}` |

### Team Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/auth/team-members/` | List all team members | - |
| POST | `/auth/invite/` | Invite team member | `{email, role}` |
| POST | `/auth/remove-member/` | Remove team member | `{member_id}` |

### Security
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/security-events/` | Get security event logs |
| GET | `/auth/dashboard/` | Get dashboard statistics |

---

## 📁 PROJECTS (17 endpoints)

### Project CRUD
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/projects/` | List all projects | Query: `?status=active&priority=high` |
| POST | `/projects/` | Create new project | `{name, description, status, priority, start_date, end_date}` |
| GET | `/projects/{id}/` | Get project details | - |
| PUT/PATCH | `/projects/{id}/` | Update project | `{name, description, status, priority}` |
| DELETE | `/projects/{id}/` | Delete project | - |

### Project Team Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/projects/{id}/add_member/` | Add team member to project | `{user_id}` |
| POST | `/projects/{id}/remove_member/` | Remove team member | `{user_id}` |

### Project Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/stats/` | Get project statistics (tasks, progress, team) |

### Project Messages
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/messages/by_project/` | Get messages by project | Query: `?project={id}` |

---

## ✅ TASKS (26 endpoints)

### Task CRUD
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/tasks/` | List all tasks | Query: `?project={id}&status=todo&assigned_to={user_id}` |
| POST | `/tasks/` | Create new task | `{title, description, project, status, priority, due_date, estimated_hours, assigned_to_id}` |
| GET | `/tasks/{id}/` | Get task details | - |
| PUT/PATCH | `/tasks/{id}/` | Update task | `{title, status, priority, due_date}` |
| DELETE | `/tasks/{id}/` | Delete task | - |

### Task Operations
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/tasks/{id}/add_comment/` | Add comment to task | `{comment}` |
| POST | `/tasks/bulk_update/` | Update multiple tasks | `{task_ids: [], updates: {status, priority}}` |

### 🤖 AI-Powered Task Features (NEW)
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/tasks/ai_breakdown_task/` | ✨ Break down task into subtasks | `{task_id}` | `{breakdown: {subtasks[], total_hours, complexity_score}}` |
| POST | `/tasks/ai_suggest_due_date/` | 📅 Get AI due date suggestion | `{title, description, priority, estimated_hours}` | `{suggestion: {recommended_date, confidence, reasoning, alternatives[]}}` |
| POST | `/tasks/ai_extract_meeting_tasks/` | 📝 Extract tasks from meeting notes | `{meeting_notes, project_id}` | `{extraction: {extracted_tasks[], summary, key_decisions, attendees[]}}` |

### Task Attachments
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/attachments/by_task/` | Get task attachments | Query: `?task={id}` |

---

## 👥 TEAM DASHBOARD (6 endpoints)

### Team Member Views
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/team-dashboard/me/` | Get current user info |
| GET | `/team-dashboard/my_tasks/` | Get tasks assigned to me |
| GET | `/team-dashboard/my_projects/` | Get projects I'm part of |

### Proof of Completion
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/team-dashboard/upload_proof/` | Upload proof of completion | `{task_id, file}` (multipart/form-data) |

---

## 🤖 AI FEATURES (8 endpoints)

### AI Insights & Analysis
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/ai/task_suggestions/` | Get AI task suggestions | - | `{suggestions: [{title, description, priority, estimated_hours}]}` |
| GET | `/ai/risk_analysis/` | Get project risk analysis | - | `{risk_score, risk_level, key_risks[], recommendations[]}` |
| GET | `/ai/generate_insights/` | Generate AI insights | - | `{productivity_score, trend, key_insights[], predictions[]}` |
| POST | `/ai/parse_nl_task/` | Parse natural language to task | `{text}` | `{title, description, priority, due_date}` |
| POST | `/ai/prioritize_tasks/` | AI task prioritization | `{task_ids: []}` | `{prioritized_tasks: []}` |
| POST | `/ai/project_summary/` | Generate project summary | `{project_id}` | `{summary, highlights, concerns}` |

---

## 📎 ATTACHMENTS (7 endpoints)

### File Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/attachments/` | List all attachments | Query: `?task={id}&is_proof_of_completion=true` |
| POST | `/attachments/` | Upload attachment | `{task, file, is_proof_of_completion}` (multipart/form-data) |
| GET | `/attachments/{id}/` | Get attachment details | - |
| DELETE | `/attachments/{id}/` | Delete attachment | - |

### Proof of Completion
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/attachments/proof_of_completion/` | List all proof files |
| GET | `/attachments/by_task/` | Get attachments by task |

---

## 📊 ACTIVITIES (4 endpoints)

### Activity Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activities/` | List all activities | Query: `?project={id}&action=task_created` |
| GET | `/activities/{id}/` | Get activity details |

---

## 💬 MESSAGES (11 endpoints)

### Project Messages
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/messages/` | List all messages | Query: `?project={id}` |
| POST | `/messages/` | Send message | `{project, content, parent}` |
| GET | `/messages/{id}/` | Get message details | - |
| PUT/PATCH | `/messages/{id}/` | Edit message | `{content}` |
| DELETE | `/messages/{id}/` | Delete message | - |

### Message Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages/{id}/mark_read/` | Mark message as read |
| GET | `/messages/{id}/replies/` | Get message replies |
| GET | `/messages/unread/` | Get unread messages |
| GET | `/messages/by_project/` | Filter by project |

---

## 🔗 WEBHOOKS (4 endpoints)

### Webhook Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/webhooks/` | List webhooks | - |
| POST | `/webhooks/` | Create webhook | `{url, events: [], secret}` |
| GET | `/webhooks/{id}/` | Get webhook details | - |
| DELETE | `/webhooks/{id}/` | Delete webhook | - |

### Webhook Deliveries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/webhook-deliveries/` | List webhook deliveries |
| GET | `/webhook-deliveries/{id}/` | Get delivery details |

---

## 🎯 MILESTONES (10 endpoints)

### Milestone Management
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/milestones/` | List milestones | Query: `?project={id}` |
| POST | `/milestones/` | Create milestone | `{project, name, description, due_date, tasks: []}` |
| GET | `/milestones/{id}/` | Get milestone details | - |
| PUT/PATCH | `/milestones/{id}/` | Update milestone | `{name, due_date, status}` |
| DELETE | `/milestones/{id}/` | Delete milestone | - |

### Milestone Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/milestones/{id}/refresh_progress/` | Recalculate milestone progress |

---

## ⏱️ TIME TRACKING (8 endpoints)

### Time Logging
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| POST | `/time-tracking/start_timer/` | Start timer for task | `{task_id}` |
| POST | `/time-tracking/stop_timer/` | Stop active timer | `{task_id}` |
| POST | `/time-tracking/log_time/` | Manually log time | `{task_id, hours, date, description}` |
| GET | `/time-tracking/get_logs/` | Get time logs | Query: `?task={id}&user={id}&start_date=YYYY-MM-DD` |

---

## 📋 TEMPLATES (14 endpoints)

### Project Templates
| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/project-templates/` | List project templates | - |
| POST | `/project-templates/` | Create template | `{name, description, is_public}` |
| GET | `/project-templates/{id}/` | Get template details | - |
| POST | `/project-templates/{id}/create_project/` | Create project from template | `{name, description, start_date}` |

### Task Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/task-templates/` | List task templates |
| POST | `/task-templates/` | Create task template |
| GET | `/task-templates/{id}/` | Get task template |

### Milestone Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/milestone-templates/` | List milestone templates |
| POST | `/milestone-templates/` | Create milestone template |
| GET | `/milestone-templates/{id}/` | Get milestone template |

---

## 🔑 API Usage Examples

### Example 1: Login and Get Token
```bash
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com"
  }
}
```

### Example 2: Create Project
```bash
curl -X POST http://localhost/api/projects/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Website",
    "description": "Build responsive website",
    "status": "active",
    "priority": "high",
    "start_date": "2025-12-05",
    "end_date": "2025-12-31"
  }'
```

### Example 3: AI Task Breakdown
```bash
curl -X POST http://localhost/api/tasks/ai_breakdown_task/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": 15
  }'

# Response:
{
  "success": true,
  "breakdown": {
    "subtasks": [
      {
        "title": "Design UI mockups",
        "description": "Create wireframes and mockups",
        "estimated_hours": 4,
        "priority": "high",
        "skills_required": ["UI/UX Design"],
        "depends_on": []
      },
      ...
    ],
    "total_hours": 24,
    "complexity_score": 7.5,
    "recommended_sequence": [0, 1, 2, ...]
  }
}
```

### Example 4: AI Due Date Suggestion
```bash
curl -X POST http://localhost/api/tasks/ai_suggest_due_date/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement user authentication",
    "description": "Add JWT-based auth system",
    "priority": "high",
    "estimated_hours": 8
  }'

# Response:
{
  "success": true,
  "suggestion": {
    "recommended_date": "2025-12-08",
    "confidence_level": "high",
    "reasoning": "Based on 8 hours estimated and current workload...",
    "alternative_dates": [
      {"date": "2025-12-07", "risk": "tight"},
      {"date": "2025-12-09", "risk": "safe"}
    ],
    "capacity_impact": "moderate"
  },
  "current_workload": {
    "active_task_count": 5,
    "committed_hours_week": 18
  }
}
```

### Example 5: Extract Tasks from Meeting Notes
```bash
curl -X POST http://localhost/api/tasks/ai_extract_meeting_tasks/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meeting_notes": "Team meeting 12/5: John will update the documentation. Sarah needs to fix the login bug by Friday. We should schedule a code review next week.",
    "project_id": 7
  }'

# Response:
{
  "success": true,
  "extraction": {
    "extracted_tasks": [
      {
        "title": "Update documentation",
        "description": "From meeting 12/5",
        "assignee": "John",
        "priority": "medium",
        "estimated_hours": 2
      },
      {
        "title": "Fix login bug",
        "description": "Critical issue to fix",
        "assignee": "Sarah",
        "priority": "high",
        "estimated_hours": 4,
        "due_date_mentioned": "Friday"
      }
    ],
    "meeting_summary": "Team sync covering documentation and bug fixes",
    "key_decisions": ["Schedule code review next week"],
    "attendees": ["John", "Sarah"]
  }
}
```

---

## 📌 Query Parameters

### Common Filters
- `?status=active` - Filter by status
- `?priority=high` - Filter by priority
- `?project={id}` - Filter by project
- `?assigned_to={user_id}` - Filter by assignee
- `?search={query}` - Search by text
- `?ordering=-created_at` - Sort by field (- for descending)
- `?page=1&page_size=20` - Pagination

---

## ⚡ Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful deletion) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🎨 New AI Features Summary

### ✅ Working AI Endpoints:
1. **Task Breakdown** - `/tasks/ai_breakdown_task/` ✓
2. **Due Date Suggestion** - `/tasks/ai_suggest_due_date/` ✓
3. **Meeting Notes Extractor** - `/tasks/ai_extract_meeting_tasks/` ✓
4. **Task Suggestions** - `/ai/task_suggestions/` ✓
5. **Risk Analysis** - `/ai/risk_analysis/` ✓
6. **Insights Generator** - `/ai/generate_insights/` ✓
7. **NL Task Parser** - `/ai/parse_nl_task/` ✓
8. **Task Prioritizer** - `/ai/prioritize_tasks/` ✓
9. **Project Summary** - `/ai/project_summary/` ✓

---

**Generated**: December 5, 2025  
**System**: SynergyOS v2.0  
**Total Working Endpoints**: 118
