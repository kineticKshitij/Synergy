/**
 * Team Service
 * Handles team member invitation and management
 */

export interface InviteTeamMemberData {
  email: string;
  first_name: string;
  last_name: string;
  role: 'member' | 'manager';
  department?: string;
  position?: string;
  project_id: number;
}

export interface UserProfile {
  id: number;
  user: number;
  username: string;
  user_email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'member';
  custom_email: string;
  phone_number: string;
  department: string;
  position: string;
  bio: string;
  avatar: string | null;
  is_invited: boolean;
  invited_by: number | null;
  invitation_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  last_login: string | null;
  profile: UserProfile;
}

export interface InvitationResponse {
  message: string;
  user: TeamMember;
  custom_email: string;
  email_sent: boolean;
  credentials_info: string;
}

/**
 * Get auth token from localStorage
 */
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

/**
 * Invite a new team member to a project
 */
export const inviteTeamMember = async (
  data: InviteTeamMemberData
): Promise<InvitationResponse> => {
  const token = getAccessToken();
  
  const response = await fetch('/api/auth/invite/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite team member');
  }

  return response.json();
};

/**
 * Get extended user profile information
 */
export const getMyProfile = async (): Promise<UserProfile> => {
  const token = getAccessToken();

  const response = await fetch('/api/auth/profile/extended/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  return response.json();
};

/**
 * Get all team members from user's projects
 */
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const token = getAccessToken();

  const response = await fetch('/api/auth/team-members/', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch team members');
  }

  return response.json();
};

/**
 * Update user profile
 */
export const updateProfile = async (
  data: Partial<UserProfile>
): Promise<UserProfile> => {
  const token = getAccessToken();

  const response = await fetch('/api/auth/profile/extended/', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return response.json();
};
