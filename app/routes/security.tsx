import { useState, useEffect } from 'react';
import type { Route } from './+types/security';
import { Navigate } from 'react-router';

interface SecurityEvent {
  id: number;
  event_type: string;
  username: string;
  ip_address: string;
  description: string;
  metadata: any;
  created_at: string;
}

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Security Events - SynergyOS' },
    { name: 'description', content: 'Security audit log' },
  ];
}

export default function Security() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/auth/security-events/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch security events');
      }

      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
        return '✓';
      case 'login_failed':
        return '✗';
      case 'logout':
        return '👋';
      case 'password_change':
        return '🔑';
      case 'password_reset_request':
        return '📧';
      case 'password_reset':
        return '🔒';
      case 'registration':
        return '📝';
      case 'rate_limit':
        return '⚠️';
      default:
        return '•';
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'login_success':
      case 'registration':
        return 'text-green-600';
      case 'login_failed':
      case 'rate_limit':
        return 'text-red-600';
      case 'logout':
        return 'text-gray-600';
      case 'password_change':
      case 'password_reset':
      case 'password_reset_request':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getEventTypeLabel = (eventType: string) => {
    return eventType.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Security Events</h1>
          <p className="text-gray-600">Audit log of security-related activities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Total Events</div>
            <div className="text-2xl font-bold text-gray-800">{events.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Failed Logins</div>
            <div className="text-2xl font-bold text-red-600">
              {events.filter(e => e.event_type === 'login_failed').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Successful Logins</div>
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.event_type === 'login_success').length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">Password Changes</div>
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.event_type === 'password_change').length}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading events...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No security events recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {events.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`text-2xl ${getEventColor(event.event_type)}`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className={`font-semibold ${getEventColor(event.event_type)}`}>
                            {getEventTypeLabel(event.event_type)}
                          </h3>
                          {event.username && (
                            <span className="text-sm text-gray-600">
                              by <span className="font-medium">{event.username}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {event.ip_address && (
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                              </svg>
                              {event.ip_address}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(event.created_at)}
                          </span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a
            href="/dashboard"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
