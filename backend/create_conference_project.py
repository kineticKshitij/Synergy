"""
Script to create Conference Management Project with all tasks for KKKM
"""

from django.contrib.auth.models import User
from projects.models import Project, Task
from datetime import datetime, timedelta

# Get the KKKM user
try:
    manager = User.objects.get(username='KKKM')
    print(f"✓ Found manager: {manager.username} ({manager.email})")
except User.DoesNotExist:
    print("✗ Error: User 'KKKM' not found!")
    exit(1)

# Create the Conference Management Project
project = Project.objects.create(
    name="International Conference Management System",
    description="Complete management system for organizing international conferences including pre-conference planning, during-conference coordination, and post-conference activities. Includes paper submission, peer review, speaker coordination, and proceedings publication.",
    owner=manager,
    status='active',
    start_date=datetime.now().date(),
    end_date=(datetime.now() + timedelta(days=365)).date()
)

# Add KKKM as a team member with manager role
project.team_members.add(manager)

print(f"✓ Created project: {project.name} (ID: {project.id})")

# Pre-Conference Tasks
pre_conference_tasks = [
    {
        'title': 'Finalizing Conference Scope & Tracks',
        'description': 'Define the conference theme, scope, and technical tracks. Identify key topics and subtopics. Create track descriptions and ensure alignment with conference objectives.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=30)).date()
    },
    {
        'title': 'Forming Organizing & Technical Committees',
        'description': 'Identify and invite members for organizing committee, technical program committee, and advisory board. Send invitations and collect confirmations. Define roles and responsibilities.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=45)).date()
    },
    {
        'title': 'Setting Up Website and CMT Portal',
        'description': 'Design and launch conference website with all information. Set up Conference Management Toolkit (CMT) or EasyChair portal for paper submissions. Configure submission categories and templates.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=60)).date()
    },
    {
        'title': 'Releasing and Distributing Call for Papers (CFP)',
        'description': 'Draft and finalize Call for Papers document. Distribute CFP through mailing lists, social media, academic networks, and institutional channels. Track distribution metrics.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=75)).date()
    },
    {
        'title': 'Managing Paper Submissions',
        'description': 'Monitor paper submission portal. Provide technical support to authors. Track submission statistics. Send reminders before deadline. Extend deadline if needed.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=120)).date()
    },
    {
        'title': 'Coordinating Double-Blind Peer Review Process',
        'description': 'Assign papers to reviewers ensuring double-blind review process. Monitor review progress. Send reminders to reviewers. Collect and compile reviews. Handle conflicts and appeals.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=150)).date()
    },
    {
        'title': 'Sending Paper Acceptance/Rejection Notifications',
        'description': 'Compile review results and make acceptance decisions. Prepare acceptance and rejection notification emails. Send notifications to all authors. Provide reviewer feedback.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=165)).date()
    },
    {
        'title': 'Managing Author Registration & Payment Confirmation',
        'description': 'Set up registration portal with payment gateway. Send registration links to accepted authors. Track registration status. Send payment reminders. Confirm registrations and payments.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=195)).date()
    },
    {
        'title': 'Collecting Camera-Ready Paper Submissions',
        'description': 'Send camera-ready paper guidelines to authors. Set up submission portal for final papers. Review submissions for formatting compliance. Request revisions if needed. Track submission completion.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=210)).date()
    },
    {
        'title': 'Compiling Conference Proceedings',
        'description': 'Collect all camera-ready papers. Format papers according to publisher guidelines. Create table of contents and front matter. Add ISBN and copyright information. Prepare proceedings for publication.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=225)).date()
    },
    {
        'title': 'Securing Keynote and Invited Speakers',
        'description': 'Identify potential keynote and invited speakers. Send invitations with speaker benefits. Coordinate speaker agreements. Collect speaker bios and presentation requirements. Arrange travel and accommodation.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=180)).date()
    },
    {
        'title': 'Planning Conference Schedule & Sessions',
        'description': 'Create detailed conference schedule with parallel sessions. Assign papers to sessions and time slots. Identify session chairs. Prepare session-wise schedules. Publish final program.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=240)).date()
    }
]

# During Conference Tasks
during_conference_tasks = [
    {
        'title': 'On-Site/Virtual Platform Registration & Help Desk',
        'description': 'Set up registration desk at venue or virtual platform. Verify registrations and distribute conference kits/access credentials. Provide technical support and answer queries. Manage walk-in registrations.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=270)).date()
    },
    {
        'title': 'Managing Inaugural and Valedictory Ceremonies',
        'description': 'Coordinate inaugural ceremony with chief guests. Manage welcome speeches and lamp lighting. Organize valedictory ceremony with award distribution. Handle vote of thanks and closing remarks.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=270)).date()
    },
    {
        'title': 'Coordinating Parallel Session Schedules',
        'description': 'Ensure parallel sessions run according to schedule. Coordinate between different session venues/virtual rooms. Handle last-minute changes or cancellations. Manage transitions between sessions.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=271)).date()
    },
    {
        'title': 'Supporting Session Chairs and Presenters',
        'description': 'Brief session chairs on their responsibilities. Provide technical support to presenters. Ensure presentation equipment is working. Manage Q&A sessions. Handle timing and schedule adherence.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=271)).date()
    },
    {
        'title': 'Managing Technical Support for Hybrid/Virtual Components',
        'description': 'Ensure stable internet connectivity and platform access. Monitor virtual attendee experience. Handle technical issues promptly. Manage breakout rooms and recordings. Provide backup solutions.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=271)).date()
    },
    {
        'title': 'Facilitating Networking Sessions',
        'description': 'Organize coffee breaks and networking opportunities. Set up virtual networking rooms. Facilitate poster sessions and exhibitions. Coordinate social events and banquet. Enable meaningful interactions.',
        'priority': 'low',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=271)).date()
    },
    {
        'title': 'Collecting Feedback from Participants',
        'description': 'Distribute feedback forms to attendees. Set up online feedback portal. Encourage participation in surveys. Collect feedback on sessions, organization, and overall experience. Compile feedback reports.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=272)).date()
    }
]

# Post-Conference Tasks
post_conference_tasks = [
    {
        'title': 'Finalizing Proceedings for Publication',
        'description': 'Complete final review of conference proceedings. Make any necessary corrections or updates. Prepare copyright forms and permissions. Format according to publisher specifications. Submit for publication.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=300)).date()
    },
    {
        'title': 'Submitting Proceedings to Indexing Services (e.g., Scopus)',
        'description': 'Prepare documentation for Scopus/Web of Science indexing. Submit proceedings to relevant indexing services. Follow up on indexing status. Ensure compliance with indexing requirements. Track citation metrics.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=330)).date()
    },
    {
        'title': 'Processing Certificates for Participants, Authors, and Chairs',
        'description': 'Generate participation certificates for all attendees. Create special certificates for authors, reviewers, and session chairs. Add digital signatures and conference branding. Distribute certificates via email.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=285)).date()
    },
    {
        'title': 'Conducting Financial Reconciliation and Reporting',
        'description': 'Compile all income (registrations, sponsorships) and expenses (venue, catering, materials). Prepare detailed financial report. Audit financial records. Submit reports to organizing institution. Close accounts.',
        'priority': 'high',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=310)).date()
    },
    {
        'title': 'Sending Thank You Communications to Committees & Volunteers',
        'description': 'Draft personalized thank you emails to organizing committee, reviewers, session chairs, and volunteers. Acknowledge contributions. Share conference success metrics. Distribute appreciation certificates.',
        'priority': 'low',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=290)).date()
    },
    {
        'title': 'Planning for Future Iterations of the Conference',
        'description': 'Analyze conference feedback and lessons learned. Document best practices and areas for improvement. Plan tentative dates for next iteration. Form preliminary organizing committee. Initiate early planning activities.',
        'priority': 'medium',
        'status': 'todo',
        'due_date': (datetime.now() + timedelta(days=365)).date()
    }
]

# Create all tasks
task_count = 0

print("\n📋 Creating Pre-Conference Tasks...")
for task_data in pre_conference_tasks:
    task = Task.objects.create(
        project=project,
        assigned_to=manager,
        **task_data
    )
    task_count += 1
    print(f"  ✓ Created: {task.title}")

print("\n📋 Creating During Conference Tasks...")
for task_data in during_conference_tasks:
    task = Task.objects.create(
        project=project,
        assigned_to=manager,
        **task_data
    )
    task_count += 1
    print(f"  ✓ Created: {task.title}")

print("\n📋 Creating Post-Conference Tasks...")
for task_data in post_conference_tasks:
    task = Task.objects.create(
        project=project,
        assigned_to=manager,
        **task_data
    )
    task_count += 1
    print(f"  ✓ Created: {task.title}")

print(f"\n✅ SUCCESS!")
print(f"📊 Project: {project.name}")
print(f"👤 Manager: {manager.username}")
print(f"📝 Total Tasks Created: {task_count}")
print(f"   - Pre-Conference: {len(pre_conference_tasks)}")
print(f"   - During Conference: {len(during_conference_tasks)}")
print(f"   - Post-Conference: {len(post_conference_tasks)}")
print(f"\n🌐 Access at: http://172.16.20.99/projects/{project.id}")
