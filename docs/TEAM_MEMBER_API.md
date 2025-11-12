# Team Member Invitation & File Upload API Documentation

## Overview
This document describes the new team member invitation system and file upload features added to SynergyOS. Project managers can invite team members via email, who will receive custom Synergy email addresses and auto-generated secure passwords. Team members can then upload files (proof of completion, documents, etc.) to tasks.

## Features Implemented

### 1. **User Profile System**
- Extended user model with `UserProfile`
- Role-based access: `admin`, `manager`, `member`
- Custom Synergy email: `firstname.lastname.projectname@synergy.in`
- Track invitation status and inviter
- Avatar support with Pillow

### 2. **Team Member Invitation**
- Email-based invitation system
- Auto-generated 16-character secure passwords
- Custom Synergy email generation
- Automatic project team assignment
- Email notification with credentials

### 3. **File Upload System**
- Upload files to tasks (images, videos, documents)
- File size limit: 50MB
- Supported formats:
  - **Images**: jpg, jpeg, png, gif, bmp, webp, svg
  - **Videos**: mp4, avi, mov, wmv, flv, webm, mkv
  - **Documents**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
- Mark files as "proof of completion"
- Auto-detection of file types

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/invite/`
Invite a new team member to a project.

**Authentication**: Required (JWT Bearer token)  
**Permission**: Project owner or manager

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "member",
  "department": "Engineering",
  "position": "Developer",
  "project_id": 1
}
```

**Response** (201 Created):
```json
{
  "message": "Team member invited successfully",
  "user": {
    "id": 5,
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "date_joined": "2024-01-15T10:30:00Z",
    "profile": {
      "id": 5,
      "role": "member",
      "custom_email": "john.doe.projectalpha@synergy.in",
      "department": "Engineering",
      "position": "Developer",
      "is_invited": true,
      "invited_by": 1,
      "invitation_sent_at": "2024-01-15T10:30:00Z"
    }
  },
  "custom_email": "john.doe.projectalpha@synergy.in",
  "email_sent": true,
  "credentials_info": "Temporary password has been sent to the user's email"
}
```

**Errors**:
- `400`: Invalid data (missing fields, invalid email, user already exists)
- `403`: No permission to invite team members
- `404`: Project not found

---

#### GET `/api/auth/profile/extended/`
Get extended profile information for the authenticated user.

**Authentication**: Required  
**Response** (200 OK):
```json
{
  "id": 5,
  "user": 5,
  "username": "john.doe",
  "user_email": "john.doe@example.com",
  "full_name": "John Doe",
  "role": "member",
  "custom_email": "john.doe.projectalpha@synergy.in",
  "phone_number": "+1234567890",
  "department": "Engineering",
  "position": "Developer",
  "bio": "",
  "avatar": null,
  "is_invited": true,
  "invited_by": 1,
  "invitation_sent_at": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

#### GET `/api/auth/team-members/`
List all team members from projects where the user is a member.

**Authentication**: Required  
**Response** (200 OK):
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "Admin",
    "last_name": "User",
    "date_joined": "2024-01-01T00:00:00Z",
    "profile": {
      "role": "admin",
      "custom_email": "admin.user.main@synergy.in",
      "department": "Management",
      "position": "Project Manager"
    }
  },
  {
    "id": 5,
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "profile": {
      "role": "member",
      "custom_email": "john.doe.projectalpha@synergy.in",
      "department": "Engineering",
      "position": "Developer"
    }
  }
]
```

---

### File Upload Endpoints

#### POST `/api/attachments/`
Upload a file to a task.

**Authentication**: Required  
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: File to upload (required, max 50MB)
- `task`: Task ID (required)
- `description`: File description (optional)
- `is_proof_of_completion`: Boolean, mark as proof (optional, default: false)

**Example using cURL**:
```bash
curl -X POST http://localhost/api/attachments/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "task=1" \
  -F "description=Project completion proof" \
  -F "is_proof_of_completion=true"
```

**Response** (201 Created):
```json
{
  "id": 15,
  "task": 1,
  "user": {
    "id": 5,
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "file": "/media/task_attachments/2024/01/15/file.pdf",
  "file_url": "http://localhost/media/task_attachments/2024/01/15/file.pdf",
  "file_type": "document",
  "file_name": "file.pdf",
  "file_size": 1048576,
  "file_size_mb": 1.0,
  "description": "Project completion proof",
  "is_proof_of_completion": true,
  "created_at": "2024-01-15T14:20:00Z"
}
```

**Errors**:
- `400`: Invalid file type, file too large (>50MB), or missing required fields
- `403`: No access to this task

---

#### GET `/api/attachments/`
List all attachments the user has access to.

**Authentication**: Required  
**Response** (200 OK):
```json
[
  {
    "id": 15,
    "task": 1,
    "user": {...},
    "file_url": "http://localhost/media/task_attachments/2024/01/15/file.pdf",
    "file_type": "document",
    "file_name": "file.pdf",
    "file_size_mb": 1.0,
    "description": "Project completion proof",
    "is_proof_of_completion": true,
    "created_at": "2024-01-15T14:20:00Z"
  }
]
```

---

#### GET `/api/attachments/by_task/?task_id=1`
Get all attachments for a specific task.

**Authentication**: Required  
**Query Parameters**:
- `task_id`: Task ID (required)

**Response** (200 OK): Same format as list endpoint, filtered by task

---

#### GET `/api/attachments/proof_of_completion/?task_id=1`
Get all proof of completion files for a specific task.

**Authentication**: Required  
**Query Parameters**:
- `task_id`: Task ID (required)

**Response** (200 OK): Same format, only files marked as proof of completion

---

#### DELETE `/api/attachments/{id}/`
Delete an attachment.

**Authentication**: Required  
**Permission**: Only the uploader or project manager can delete

**Response** (204 No Content)

---

## Database Models

### UserProfile Model
```python
class UserProfile(models.Model):
    user = OneToOneField(User, related_name='profile')
    role = CharField(choices=['admin', 'manager', 'member'])
    custom_email = CharField(unique=True)  # e.g., john.doe.project@synergy.in
    phone_number = CharField(blank=True)
    department = CharField(blank=True)
    position = CharField(blank=True)
    bio = TextField(blank=True)
    avatar = ImageField(blank=True)
    is_invited = BooleanField(default=False)
    invited_by = ForeignKey(User, null=True, blank=True)
    invitation_sent_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### TaskAttachment Model
```python
class TaskAttachment(models.Model):
    task = ForeignKey(Task, related_name='attachments')
    user = ForeignKey(User)
    file = FileField(upload_to='task_attachments/%Y/%m/%d/')
    file_type = CharField(choices=['image', 'video', 'document', 'other'])
    file_name = CharField(max_length=255)
    file_size = BigIntegerField()  # bytes
    description = TextField(blank=True)
    is_proof_of_completion = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

---

## Utility Functions

### Password Generation
```python
def generate_secure_password(length=16):
    """
    Generates a 16-character password with:
    - Uppercase letters
    - Lowercase letters
    - Digits
    - Special characters
    """
```

### Custom Email Generation
```python
def generate_custom_email(first_name, last_name, project_name):
    """
    Format: firstname.lastname.projectname@synergy.in
    Auto-increments if email already exists
    """
```

### Email Invitation
```python
def send_invitation_email(user, custom_email, password, project_name, invited_by):
    """
    Sends invitation email with:
    - Custom Synergy email
    - Temporary password
    - Login URL
    - Project information
    """
```

---

## Frontend Integration Guide

### 1. **Invite Team Member Component**

```typescript
// services/team.service.ts
export const inviteTeamMember = async (data: InviteTeamMemberData) => {
  const response = await fetch('/api/auth/invite/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to invite team member');
  }
  
  return response.json();
};

interface InviteTeamMemberData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'manager';
  department?: string;
  position?: string;
  project_id: number;
}
```

### 2. **File Upload Component**

```typescript
// services/attachment.service.ts
export const uploadTaskAttachment = async (
  taskId: number,
  file: File,
  description: string = '',
  isProof: boolean = false
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('task', taskId.toString());
  formData.append('description', description);
  formData.append('is_proof_of_completion', isProof.toString());
  
  const response = await fetch('/api/attachments/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
    body: formData, // Don't set Content-Type, browser will set it with boundary
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload file');
  }
  
  return response.json();
};

export const getTaskAttachments = async (taskId: number) => {
  const response = await fetch(`/api/attachments/by_task/?task_id=${taskId}`, {
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
    },
  });
  
  return response.json();
};
```

### 3. **Example React Component**

```tsx
// components/FileUploadForm.tsx
import { useState } from 'react';
import { uploadTaskAttachment } from '../services/attachment.service';

export const FileUploadForm = ({ taskId }: { taskId: number }) => {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isProof, setIsProof] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await uploadTaskAttachment(taskId, file, description, isProof);
      console.log('Upload successful:', result);
      // Reset form or show success message
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
      />
      
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      
      <label>
        <input
          type="checkbox"
          checked={isProof}
          onChange={(e) => setIsProof(e.target.checked)}
        />
        Mark as proof of completion
      </label>
      
      <button type="submit" disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};
```

---

## Email Configuration

To enable email sending in production, update `.env`:

```env
# Email Settings (for sending invitations)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@synergy.in
FRONTEND_URL=http://yourdomain.com
```

**Note**: For Gmail, you need to generate an "App Password" in your Google Account security settings.

---

## Testing the APIs

### Test Team Member Invitation

```bash
# Login first to get JWT token
curl -X POST http://localhost/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "yourpassword"
  }'

# Invite team member
curl -X POST http://localhost/api/auth/invite/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "member",
    "project_id": 1
  }'
```

### Test File Upload

```bash
curl -X POST http://localhost/api/attachments/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@document.pdf" \
  -F "task=1" \
  -F "description=Project documentation" \
  -F "is_proof_of_completion=false"
```

---

## Security Considerations

1. **File Validation**:
   - File size limited to 50MB
   - File type validation based on extension
   - Uploaded files stored in isolated `/media` directory

2. **Access Control**:
   - Only project members can upload files to tasks
   - Only project owners/managers can invite team members
   - JWT authentication required for all endpoints

3. **Email Security**:
   - Passwords are 16-character secure random strings
   - Passwords hashed before storage (Django's default)
   - Email sent over TLS/SSL

4. **Custom Email**:
   - Custom Synergy emails are unique
   - Format: `firstname.lastname.projectname@synergy.in`
   - Auto-increments if duplicate exists

---

## Next Steps for Frontend Development

1. **Create Team Member Dashboard**:
   - View assigned tasks
   - Upload files for each task
   - Add comments
   - View proof of completion status

2. **Create Manager Dashboard**:
   - Invite team members form
   - View all team members
   - Review uploaded files
   - Approve/reject proof of completion

3. **File Gallery Component**:
   - Display uploaded files with previews
   - Filter by file type
   - Download files
   - Delete own files

4. **Notification System**:
   - Notify team members when assigned to tasks
   - Notify managers when files uploaded
   - Email notifications for invitations

---

## Support & Contact

For any issues or questions regarding the API:
- Check Django logs: `docker logs synergyos-backend`
- Check Nginx logs: `docker logs synergyos-nginx`
- Review security events: `GET /api/auth/security-events/`

**Database Migrations**:
```bash
docker exec synergyos-backend python manage.py migrate
```

**Create Superuser**:
```bash
docker exec -it synergyos-backend python manage.py createsuperuser
```
