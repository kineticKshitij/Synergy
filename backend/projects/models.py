from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Project(models.Model):
    """Project model for managing projects"""
    
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    team_members = models.ManyToManyField(User, related_name='projects', blank=True)
    
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    progress = models.IntegerField(default=0, help_text="Progress percentage (0-100)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Task(models.Model):
    """Task model for project tasks"""
    
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('review', 'In Review'),
        ('done', 'Done'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    assigned_to_multiple = models.ManyToManyField(User, related_name='multi_assigned_tasks', blank=True, help_text="Multiple team members assigned to this task")
    
    # Task Dependencies
    depends_on = models.ManyToManyField('self', symmetrical=False, related_name='blocking_tasks', blank=True, 
                                        help_text="Tasks that must be completed before this task can start")
    
    # Impact on project progress (percentage contribution)
    impact = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        help_text="Impact on project progress when completed (0-100%)"
    )
    
    due_date = models.DateField(null=True, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    # Time tracking
    time_logs = models.JSONField(default=list, blank=True, 
                                 help_text="Array of time log entries {user_id, start_time, end_time, duration_minutes, note}")
    active_timer = models.JSONField(null=True, blank=True, 
                                    help_text="Currently running timer {user_id, start_time}")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Override save to update project progress when task status changes"""
        # Check if this is an update (not a new task)
        if self.pk:
            old_task = Task.objects.get(pk=self.pk)
            old_status = old_task.status
            new_status = self.status
            
            # If task is being marked as done and wasn't done before
            if new_status == 'done' and old_status != 'done':
                self.completed_at = timezone.now()
            # If task is being unmarked from done
            elif old_status == 'done' and new_status != 'done':
                self.completed_at = None
        
        super().save(*args, **kwargs)
        
        # Update project progress after saving the task
        self.update_project_progress()
    
    def update_project_progress(self):
        """Calculate and update project progress based on completed tasks' impact"""
        project = self.project
        tasks = project.tasks.all()
        
        # Calculate total impact of all tasks
        total_impact = sum(task.impact for task in tasks)
        
        if total_impact > 0:
            # Calculate impact of completed tasks
            completed_impact = sum(
                task.impact for task in tasks if task.status == 'done'
            )
            
            # Calculate progress percentage
            progress = min(100, int((completed_impact / total_impact) * 100))
        else:
            # If no tasks have impact assigned, fall back to simple count
            total_tasks = tasks.count()
            completed_tasks = tasks.filter(status='done').count()
            progress = int((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0
        
        # Update project progress
        project.progress = progress
        project.save(update_fields=['progress'])
    
    def get_blocked_by(self):
        """Get tasks that are blocking this task (dependencies not completed)"""
        return self.depends_on.exclude(status='done')
    
    def get_blocking_tasks(self):
        """Get tasks that this task is blocking"""
        return self.blocking_tasks.all()
    
    def can_start(self):
        """Check if all dependencies are completed"""
        return not self.get_blocked_by().exists()
    
    def get_total_time_logged(self):
        """Calculate total time logged in hours"""
        if not self.time_logs:
            return 0
        total_minutes = sum(entry.get('duration_minutes', 0) for entry in self.time_logs)
        return round(total_minutes / 60, 2)
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"


class Comment(models.Model):
    """Comment model for task discussions"""
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.task.title}"


class TaskAttachment(models.Model):
    """File attachments for tasks (proof of completion, documents, etc.)"""
    
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('document', 'Document'),
        ('other', 'Other'),
    ]
    
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, help_text="User who uploaded the file")
    file = models.FileField(upload_to='task_attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES, default='other')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    description = models.TextField(blank=True, help_text="Optional description of the attachment")
    is_proof_of_completion = models.BooleanField(default=False, 
                                                  help_text="Mark as proof of task completion")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.task.title}"
    
    def save(self, *args, **kwargs):
        """Auto-detect file type based on extension"""
        if not self.file_type or self.file_type == 'other':
            ext = self.file_name.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg']:
                self.file_type = 'image'
            elif ext in ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv']:
                self.file_type = 'video'
            elif ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']:
                self.file_type = 'document'
        super().save(*args, **kwargs)


class ProjectActivity(models.Model):
    """Activity log for project actions"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    description = models.TextField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Project activities'
    
    def __str__(self):
        return f"{self.project.name} - {self.action}"


class ProjectMessage(models.Model):
    """Messages for project team communication"""
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message = models.TextField()
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                               related_name='replies', help_text="Parent message for threaded replies")
    
    # Optional: mention specific users
    mentions = models.ManyToManyField(User, related_name='mentioned_in_messages', blank=True)
    
    # Read status tracking
    read_by = models.ManyToManyField(User, related_name='read_messages', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_edited = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username} in {self.project.name}: {self.message[:50]}"


class Milestone(models.Model):
    """Project milestones to track key deliverables"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('missed', 'Missed'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Tasks associated with this milestone
    tasks = models.ManyToManyField(Task, related_name='milestones', blank=True)
    
    # Progress tracking
    progress = models.IntegerField(default=0, help_text="Progress percentage (0-100)")
    
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.project.name} - {self.name}"
    
    def update_progress(self):
        """Calculate milestone progress based on associated tasks"""
        tasks = self.tasks.all()
        if tasks.count() == 0:
            return
        
        completed_tasks = tasks.filter(status='done').count()
        self.progress = int((completed_tasks / tasks.count()) * 100)
        
        # Auto-update status
        if self.progress == 100:
            self.status = 'completed'
            if not self.completed_at:
                self.completed_at = timezone.now()
        elif self.progress > 0:
            self.status = 'in_progress'
        
        # Check if missed
        if self.due_date < timezone.now().date() and self.status != 'completed':
            self.status = 'missed'
        
        self.save(update_fields=['progress', 'status', 'completed_at'])


class ProjectTemplate(models.Model):
    """Templates for creating new projects with predefined structure"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True, 
                                help_text="Template category (e.g., Software Development, Marketing, Research)")
    
    # Template settings
    default_priority = models.CharField(max_length=20, choices=Project.PRIORITY_CHOICES, default='medium')
    estimated_duration_days = models.IntegerField(null=True, blank=True, 
                                                   help_text="Estimated project duration in days")
    
    # Creator and visibility
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_templates')
    is_public = models.BooleanField(default=False, help_text="Available to all users")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class TaskTemplate(models.Model):
    """Template tasks that are part of a project template"""
    
    project_template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, 
                                         related_name='task_templates')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=20, choices=Task.PRIORITY_CHOICES, default='medium')
    
    # Time estimates
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    impact = models.DecimalField(max_digits=5, decimal_places=2, default=0.00,
                                 help_text="Impact on project progress (0-100%)")
    
    # Ordering and dependencies
    order = models.IntegerField(default=0, help_text="Order in which tasks should be created")
    depends_on_order = models.JSONField(default=list, blank=True, 
                                        help_text="List of order numbers this task depends on")
    
    # Offset from project start date
    start_offset_days = models.IntegerField(default=0, 
                                            help_text="Days after project start when this task should begin")
    duration_days = models.IntegerField(null=True, blank=True, 
                                        help_text="Expected duration for this task")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.project_template.name} - {self.title}"


class MilestoneTemplate(models.Model):
    """Template milestones for project templates"""
    
    project_template = models.ForeignKey(ProjectTemplate, on_delete=models.CASCADE, 
                                         related_name='milestone_templates')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Offset from project start date
    due_offset_days = models.IntegerField(help_text="Days after project start when milestone is due")
    
    # Associated task templates (by order number)
    task_orders = models.JSONField(default=list, blank=True, 
                                   help_text="List of task order numbers associated with this milestone")
    
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.project_template.name} - {self.name}"


class RecurringTask(models.Model):
    """Recurring task template that auto-creates tasks on schedule"""
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
    ]
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='recurring_tasks')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    priority = models.CharField(max_length=20, choices=Task.PRIORITY_CHOICES, default='medium')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='recurring_tasks')
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    impact = models.IntegerField(default=1, help_text="Impact on project progress (1-10)")
    
    is_active = models.BooleanField(default=True)
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True, help_text="Optional end date for recurring task")
    last_created = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_recurring_tasks')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.frequency})"
    
    def should_create_task(self):
        """Check if it's time to create a new task instance"""
        if not self.is_active:
            return False
        
        # Check if end date has passed
        if self.end_date and timezone.now().date() > self.end_date:
            return False
        
        # If never created, create now
        if not self.last_created:
            return True
        
        # Calculate next due date based on frequency
        from datetime import timedelta
        last_date = self.last_created.date()
        today = timezone.now().date()
        
        if self.frequency == 'daily':
            return (today - last_date).days >= 1
        elif self.frequency == 'weekly':
            return (today - last_date).days >= 7
        elif self.frequency == 'biweekly':
            return (today - last_date).days >= 14
        elif self.frequency == 'monthly':
            return (today - last_date).days >= 30
        elif self.frequency == 'quarterly':
            return (today - last_date).days >= 90
        
        return False
    
    def create_task_instance(self):
        """Create a new task instance from this recurring task"""
        task = Task.objects.create(
            project=self.project,
            title=self.title,
            description=self.description,
            status='pending',
            priority=self.priority,
            assigned_to=self.assigned_to,
            estimated_hours=self.estimated_hours,
            impact=self.impact,
            due_date=timezone.now().date() + timedelta(days=7)  # Default 7 days from creation
        )
        
        self.last_created = timezone.now()
        self.save()
        
        return task
