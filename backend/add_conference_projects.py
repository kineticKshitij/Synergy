"""
Script to add conference management projects and tasks to the database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'SynergyOS.settings')
django.setup()

from django.contrib.auth.models import User
from projects.models import Project, Task
from datetime import datetime, timedelta

# Get the project owner (assuming the first user or a specific user)
try:
    owner = User.objects.filter(profile__role='manager').first()
    if not owner:
        owner = User.objects.first()
    
    if not owner:
        print("Error: No users found in the database. Please create a user first.")
        exit(1)
    
    print(f"Using owner: {owner.username} (Role: {owner.profile.role if hasattr(owner, 'profile') else 'N/A'})")
except Exception as e:
    print(f"Error getting user: {e}")
    exit(1)

# Conference Projects Data
projects_data = [
    {
        "name": "Pre-Conference",
        "description": "Managing all pre-conference activities including paper submissions, reviews, and registration",
        "status": "planning",
        "priority": "high",
        "tasks": [
            {
                "title": "Finalizing Conference Scope & Tracks",
                "description": "Define conference themes, tracks, and submission categories",
                "priority": "urgent",
                "estimated_hours": 40
            },
            {
                "title": "Forming Organizing & Technical Committees",
                "description": "Recruit and assign roles to organizing and technical committee members",
                "priority": "urgent",
                "estimated_hours": 30
            },
            {
                "title": "Setting Up Website and CMT Portal",
                "description": "Develop and deploy conference website and paper management system",
                "priority": "high",
                "estimated_hours": 60
            },
            {
                "title": "Releasing and Distributing Call for Papers (CFP)",
                "description": "Create and distribute CFP through various channels",
                "priority": "high",
                "estimated_hours": 20
            },
            {
                "title": "Managing Paper Submissions",
                "description": "Monitor and manage incoming paper submissions through the portal",
                "priority": "high",
                "estimated_hours": 50
            },
            {
                "title": "Coordinating Double-Blind Peer Review Process",
                "description": "Assign reviewers and manage the peer review workflow",
                "priority": "urgent",
                "estimated_hours": 80
            },
            {
                "title": "Sending Paper Acceptance/Rejection Notifications",
                "description": "Prepare and send decision notifications to all authors",
                "priority": "high",
                "estimated_hours": 15
            },
            {
                "title": "Managing Author Registration & Payment Confirmation",
                "description": "Handle author registrations and verify payment confirmations",
                "priority": "high",
                "estimated_hours": 40
            },
            {
                "title": "Collecting Camera-Ready Paper Submissions",
                "description": "Collect and verify final camera-ready versions of accepted papers",
                "priority": "high",
                "estimated_hours": 30
            },
            {
                "title": "Compiling Conference Proceedings",
                "description": "Compile all accepted papers into conference proceedings",
                "priority": "high",
                "estimated_hours": 50
            },
            {
                "title": "Securing Keynote and Invited Speakers",
                "description": "Invite and confirm keynote and invited speakers",
                "priority": "high",
                "estimated_hours": 35
            },
            {
                "title": "Planning Conference Schedule & Sessions",
                "description": "Create detailed conference schedule with all sessions",
                "priority": "high",
                "estimated_hours": 45
            }
        ]
    },
    {
        "name": "During Conference",
        "description": "Managing real-time conference operations and participant support",
        "status": "planning",
        "priority": "urgent",
        "tasks": [
            {
                "title": "On-Site/Virtual Platform Registration & Help Desk",
                "description": "Manage registration desk and provide technical support",
                "priority": "urgent",
                "estimated_hours": 25
            },
            {
                "title": "Managing Inaugural and Valedictory Ceremonies",
                "description": "Coordinate opening and closing ceremonies",
                "priority": "high",
                "estimated_hours": 20
            },
            {
                "title": "Coordinating Parallel Session Schedules",
                "description": "Manage multiple parallel sessions and ensure smooth transitions",
                "priority": "urgent",
                "estimated_hours": 30
            },
            {
                "title": "Supporting Session Chairs and Presenters",
                "description": "Provide support to session chairs and paper presenters",
                "priority": "high",
                "estimated_hours": 35
            },
            {
                "title": "Managing Technical Support for Hybrid/Virtual Components",
                "description": "Handle all technical aspects of hybrid/virtual conference delivery",
                "priority": "urgent",
                "estimated_hours": 40
            },
            {
                "title": "Facilitating Networking Sessions",
                "description": "Organize and facilitate networking opportunities for participants",
                "priority": "medium",
                "estimated_hours": 15
            },
            {
                "title": "Collecting Feedback from Participants",
                "description": "Gather feedback from attendees through surveys and forms",
                "priority": "medium",
                "estimated_hours": 10
            }
        ]
    },
    {
        "name": "Post-Conference",
        "description": "Handling post-conference activities including proceedings publication and reporting",
        "status": "planning",
        "priority": "high",
        "tasks": [
            {
                "title": "Finalizing Proceedings for Publication",
                "description": "Final editing and formatting of conference proceedings",
                "priority": "high",
                "estimated_hours": 45
            },
            {
                "title": "Submitting Proceedings to Indexing Services (e.g., Scopus)",
                "description": "Submit proceedings to Scopus and other indexing databases",
                "priority": "high",
                "estimated_hours": 25
            },
            {
                "title": "Processing Certificates for Participants, Authors, and Chairs",
                "description": "Generate and distribute certificates to all relevant parties",
                "priority": "medium",
                "estimated_hours": 30
            },
            {
                "title": "Conducting Financial Reconciliation and Reporting",
                "description": "Complete financial accounting and generate financial reports",
                "priority": "high",
                "estimated_hours": 35
            },
            {
                "title": "Sending Thank You Communications to Committees & Volunteers",
                "description": "Send appreciation messages to all committee members and volunteers",
                "priority": "medium",
                "estimated_hours": 10
            },
            {
                "title": "Planning for Future Iterations of the Conference",
                "description": "Document lessons learned and plan for next year's conference",
                "priority": "medium",
                "estimated_hours": 40
            }
        ]
    }
]

# Create projects and tasks
created_projects = []
created_tasks = []

for project_data in projects_data:
    try:
        # Extract tasks data
        tasks_data = project_data.pop('tasks')
        
        # Create project
        project = Project.objects.create(
            owner=owner,
            **project_data
        )
        created_projects.append(project)
        print(f"\n✓ Created project: {project.name}")
        
        # Create tasks for this project
        base_date = datetime.now()
        for i, task_data in enumerate(tasks_data):
            task = Task.objects.create(
                project=project,
                status='todo',
                due_date=(base_date + timedelta(days=(i+1)*7)).date(),  # Stagger due dates
                **task_data
            )
            created_tasks.append(task)
            print(f"  ✓ Created task: {task.title}")
    
    except Exception as e:
        print(f"\n✗ Error creating project {project_data.get('name', 'Unknown')}: {e}")

print(f"\n{'='*60}")
print(f"Summary:")
print(f"  Projects created: {len(created_projects)}")
print(f"  Tasks created: {len(created_tasks)}")
print(f"{'='*60}")
print("\nConference projects and tasks have been successfully added to the database!")
