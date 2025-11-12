import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getMyProfile, type UserProfile } from '../services/team.service';
import { getProjects, getTasks, type Project, type Task } from '../services/project.service';
import FileUpload from '../components/FileUpload';

export default function TeamMemberDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [profileData, projectsData, tasksData] = await Promise.all([
        getMyProfile(),
        getProjects(),
        getTasks(),
      ]);

      setProfile(profileData);
      setProjects(projectsData);
      
      // Filter tasks assigned to current user
      const myTasks = tasksData.filter(
        (task) => task.assigned_to && profileData.user === task.assigned_to.id
      );
      setTasks(myTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#10b981';
      case 'in_progress':
        return '#3b82f6';
      case 'todo':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'done':
        return '✓ Completed';
      case 'in_progress':
        return '⏳ In Progress';
      case 'todo':
        return '📋 To Do';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-box">
          <h2>⚠️ Error</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Profile Section */}
      {profile && (
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt={profile.full_name} />
              ) : (
                <div className="avatar-placeholder">
                  {profile.full_name.split(' ').map((n) => n[0]).join('')}
                </div>
              )}
            </div>
            <div className="profile-info">
              <h1>{profile.full_name}</h1>
              <p className="profile-role">
                <span className="role-badge">{profile.role.toUpperCase()}</span>
              </p>
              <p className="profile-email">
                📧 {profile.custom_email || profile.user_email}
              </p>
              {profile.department && (
                <p className="profile-department">🏢 {profile.department}</p>
              )}
              {profile.position && (
                <p className="profile-position">💼 {profile.position}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{tasks.length}</div>
            <div className="stat-label">Assigned Tasks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-value">
              {tasks.filter((t) => t.status === 'done').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">
              {tasks.filter((t) => t.status === 'in_progress').length}
            </div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <h2>📋 My Assigned Tasks</h2>
        
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks assigned to you yet.</p>
            <Link to="/projects" className="btn-primary">
              Browse Projects
            </Link>
          </div>
        ) : (
          <div className="tasks-grid">
            {tasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span
                    className="task-status"
                    style={{ backgroundColor: getTaskStatusColor(task.status) }}
                  >
                    {getTaskStatusLabel(task.status)}
                  </span>
                </div>

                <p className="task-description">{task.description}</p>

                <div className="task-meta">
                  <span
                    className="task-priority"
                    style={{ color: getPriorityColor(task.priority) }}
                  >
                    ⚡ {task.priority.toUpperCase()}
                  </span>
                  {task.due_date && (
                    <span className="task-due">
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {task.impact && (
                    <span className="task-impact">
                      💡 Impact: {task.impact}%
                    </span>
                  )}
                </div>

                <div className="task-project">
                  <Link to={`/projects/${task.project}`}>
                    View Project →
                  </Link>
                </div>

                <button
                  className="btn-upload"
                  onClick={() => setSelectedTask(task)}
                >
                  📎 Upload Files
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Upload Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button
                className="close-button"
                onClick={() => setSelectedTask(null)}
              >
                ✕
              </button>
            </div>
            <FileUpload
              taskId={selectedTask.id}
              taskTitle={selectedTask.title}
              onUploadSuccess={() => {
                // Optionally reload tasks or show success message
                console.log('File uploaded successfully');
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .loading,
        .error-box {
          text-align: center;
          padding: 48px 24px;
        }

        .error-box h2 {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .profile-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .profile-avatar {
          flex-shrink: 0;
        }

        .profile-avatar img,
        .avatar-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid rgba(255, 255, 255, 0.3);
        }

        .avatar-placeholder {
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 600;
        }

        .profile-info h1 {
          margin: 0 0 8px 0;
          font-size: 2rem;
        }

        .profile-info p {
          margin: 6px 0;
          opacity: 0.9;
        }

        .role-badge {
          background-color: rgba(255, 255, 255, 0.3);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .tasks-section h2 {
          margin-bottom: 20px;
          color: #1f2937;
        }

        .no-tasks {
          text-align: center;
          padding: 48px 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .no-tasks p {
          color: #6b7280;
          margin-bottom: 16px;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .task-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .task-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }

        .task-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.1rem;
          flex: 1;
        }

        .task-status {
          padding: 4px 12px;
          border-radius: 12px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .task-description {
          color: #4b5563;
          margin-bottom: 16px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .task-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
          font-size: 0.85rem;
        }

        .task-priority,
        .task-due,
        .task-impact {
          font-weight: 500;
        }

        .task-project {
          margin: 16px 0;
        }

        .task-project a {
          color: #3b82f6;
          text-decoration: none;
          font-size: 0.9rem;
        }

        .task-project a:hover {
          text-decoration: underline;
        }

        .btn-upload {
          width: 100%;
          padding: 10px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-upload:hover {
          background-color: #2563eb;
        }

        .btn-primary {
          padding: 10px 24px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary:hover {
          background-color: #2563eb;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          color: #1f2937;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background-color: #f3f4f6;
          color: #1f2937;
        }

        @media (max-width: 768px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .tasks-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
