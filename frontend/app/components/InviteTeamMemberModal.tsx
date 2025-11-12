import { useState } from 'react';
import { inviteTeamMember, type InviteTeamMemberData } from '../services/team.service';

interface InviteTeamMemberModalProps {
  projectId: number;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteTeamMemberModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: InviteTeamMemberModalProps) {
  const [formData, setFormData] = useState<InviteTeamMemberData>({
    email: '',
    first_name: '',
    last_name: '',
    role: 'member',
    department: '',
    position: '',
    project_id: projectId,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    customEmail: string;
    username: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await inviteTeamMember(formData);
      setSuccess({
        customEmail: response.custom_email,
        username: response.user.username,
      });
      
      // Reset form after 3 seconds and close
      setTimeout(() => {
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          role: 'member',
          department: '',
          position: '',
          project_id: projectId,
        });
        setSuccess(null);
        onSuccess?.();
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite team member');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'member',
        department: '',
        position: '',
        project_id: projectId,
      });
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite Team Member to {projectName}</h2>
          <button className="close-button" onClick={handleClose} disabled={loading}>
            ✕
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Team Member Invited Successfully!</h3>
            <p>
              Custom Synergy Email: <strong>{success.customEmail}</strong>
            </p>
            <p>
              Username: <strong>{success.username}</strong>
            </p>
            <p className="info-text">
              An email has been sent with login credentials.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="member@example.com"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">
                  Role <span className="required">*</span>
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="member">Team Member</option>
                  <option value="manager">Project Manager</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="first_name">
                  First Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="John"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="last_name">
                  Last Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Engineering"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input
                  type="text"
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Software Developer"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span> {error}
              </div>
            )}

            <div className="info-box">
              <strong>ℹ️ What happens next:</strong>
              <ul>
                <li>A custom Synergy email will be generated (firstname.lastname.{projectName.toLowerCase()}@synergy.in)</li>
                <li>A secure 16-character password will be auto-generated</li>
                <li>An invitation email will be sent with login credentials</li>
                <li>The team member will be added to this project</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Inviting...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}

        <style jsx>{`
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
            max-width: 600px;
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
            font-size: 1.5rem;
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

          .close-button:hover:not(:disabled) {
            background-color: #f3f4f6;
            color: #1f2937;
          }

          .close-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          form {
            padding: 24px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
          }

          .form-group label {
            font-weight: 500;
            margin-bottom: 6px;
            color: #374151;
            font-size: 0.9rem;
          }

          .required {
            color: #ef4444;
          }

          .form-group input,
          .form-group select {
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.95rem;
            transition: all 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .form-group input:disabled,
          .form-group select:disabled {
            background-color: #f3f4f6;
            cursor: not-allowed;
          }

          .error-message {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .error-icon {
            font-size: 1.2rem;
          }

          .success-message {
            padding: 32px 24px;
            text-align: center;
          }

          .success-icon {
            width: 64px;
            height: 64px;
            background-color: #10b981;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin: 0 auto 20px;
          }

          .success-message h3 {
            color: #065f46;
            margin-bottom: 16px;
          }

          .success-message p {
            margin: 8px 0;
            color: #374151;
          }

          .info-text {
            color: #6b7280;
            font-size: 0.9rem;
            margin-top: 16px !important;
          }

          .info-box {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 24px;
          }

          .info-box strong {
            color: #1e40af;
            display: block;
            margin-bottom: 8px;
          }

          .info-box ul {
            margin: 0;
            padding-left: 20px;
            color: #1e3a8a;
          }

          .info-box li {
            margin: 4px 0;
            font-size: 0.9rem;
          }

          .modal-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
          }

          .btn-primary,
          .btn-secondary {
            padding: 10px 24px;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-size: 0.95rem;
          }

          .btn-primary {
            background-color: #3b82f6;
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            background-color: #2563eb;
          }

          .btn-primary:disabled {
            background-color: #93c5fd;
            cursor: not-allowed;
          }

          .btn-secondary {
            background-color: #f3f4f6;
            color: #374151;
          }

          .btn-secondary:hover:not(:disabled) {
            background-color: #e5e7eb;
          }

          .btn-secondary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          @media (max-width: 640px) {
            .form-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
