# Generated migration for enhanced project management features

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0005_task_assigned_to_multiple'),
    ]

    operations = [
        # Add task dependencies
        migrations.AddField(
            model_name='task',
            name='depends_on',
            field=models.ManyToManyField(
                blank=True,
                help_text='Tasks that must be completed before this task can start',
                related_name='blocking_tasks',
                to='projects.task'
            ),
        ),
        
        # Add time tracking fields
        migrations.AddField(
            model_name='task',
            name='time_logs',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Array of time log entries {user_id, start_time, end_time, duration_minutes, note}'
            ),
        ),
        migrations.AddField(
            model_name='task',
            name='active_timer',
            field=models.JSONField(
                blank=True,
                help_text='Currently running timer {user_id, start_time}',
                null=True
            ),
        ),
        
        # Create Milestone model
        migrations.CreateModel(
            name='Milestone',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('due_date', models.DateField()),
                ('status', models.CharField(
                    choices=[
                        ('pending', 'Pending'),
                        ('in_progress', 'In Progress'),
                        ('completed', 'Completed'),
                        ('missed', 'Missed')
                    ],
                    default='pending',
                    max_length=20
                )),
                ('progress', models.IntegerField(default=0, help_text='Progress percentage (0-100)')),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('project', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='milestones',
                    to='projects.project'
                )),
                ('tasks', models.ManyToManyField(
                    blank=True,
                    related_name='milestones',
                    to='projects.task'
                )),
            ],
            options={
                'ordering': ['due_date'],
            },
        ),
        
        # Create ProjectTemplate model
        migrations.CreateModel(
            name='ProjectTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('category', models.CharField(
                    blank=True,
                    help_text='Template category (e.g., Software Development, Marketing, Research)',
                    max_length=100
                )),
                ('default_priority', models.CharField(
                    choices=[
                        ('low', 'Low'),
                        ('medium', 'Medium'),
                        ('high', 'High'),
                        ('urgent', 'Urgent')
                    ],
                    default='medium',
                    max_length=20
                )),
                ('estimated_duration_days', models.IntegerField(
                    blank=True,
                    help_text='Estimated project duration in days',
                    null=True
                )),
                ('is_public', models.BooleanField(default=False, help_text='Available to all users')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='created_templates',
                    to=settings.AUTH_USER_MODEL
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Create TaskTemplate model
        migrations.CreateModel(
            name='TaskTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('priority', models.CharField(
                    choices=[
                        ('low', 'Low'),
                        ('medium', 'Medium'),
                        ('high', 'High'),
                        ('urgent', 'Urgent')
                    ],
                    default='medium',
                    max_length=20
                )),
                ('estimated_hours', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    max_digits=6,
                    null=True
                )),
                ('impact', models.DecimalField(
                    decimal_places=2,
                    default=0.0,
                    help_text='Impact on project progress (0-100%)',
                    max_digits=5
                )),
                ('order', models.IntegerField(default=0, help_text='Order in which tasks should be created')),
                ('depends_on_order', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='List of order numbers this task depends on'
                )),
                ('start_offset_days', models.IntegerField(
                    default=0,
                    help_text='Days after project start when this task should begin'
                )),
                ('duration_days', models.IntegerField(
                    blank=True,
                    help_text='Expected duration for this task',
                    null=True
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project_template', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='task_templates',
                    to='projects.projecttemplate'
                )),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        
        # Create MilestoneTemplate model
        migrations.CreateModel(
            name='MilestoneTemplate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('due_offset_days', models.IntegerField(
                    help_text='Days after project start when milestone is due'
                )),
                ('task_orders', models.JSONField(
                    blank=True,
                    default=list,
                    help_text='List of task order numbers associated with this milestone'
                )),
                ('order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project_template', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='milestone_templates',
                    to='projects.projecttemplate'
                )),
            ],
            options={
                'ordering': ['order'],
            },
        ),
    ]
