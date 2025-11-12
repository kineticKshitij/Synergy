from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


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
