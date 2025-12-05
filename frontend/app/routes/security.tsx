import { useState, useEffect } from 'react';
import type { Route } from './+types/security';
import { Navigate } from 'react-router';
import tokenStorage from '~/services/tokenStorage';
import { Navbar } from '~/components/Navbar';

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
      const token = tokenStorage.getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch('/api/auth/security-events/', {
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
        return 'text-green-600 dark:text-green-500';
      case 'login_failed':
      case 'rate_limit':
        return 'text-red-600 dark:text-red-500';
      case 'logout':
        return 'text-slate-600 dark:text-slate-400';
      case 'password_change':
      case 'password_reset':
      case 'password_reset_request':
        return 'text-indigo-600 dark:text-indigo-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8 animate-slideInDown">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Security Events</h1>
          <p className="text-slate-600 dark:text-slate-400">Audit log of security-related activities</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">Total Events</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{events.length}</div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">Failed Logins</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-500">
              {events.filter(e => e.event_type === 'login_failed').length}
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.3s' }}>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">Successful Logins</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {events.filter(e => e.event_type === 'login_success').length}
            </div>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-medium">Password Changes</div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {events.filter(e => e.event_type === 'password_change').length}
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/70 dark:border-slate-800 animate-slideInUp" style={{ animationDelay: '0.5s' }}>
          <div className="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Recent Activity</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-600 dark:border-t-indigo-400 mx-auto"></div>
              <p className="text-slate-600 dark:text-slate-400 mt-4 font-medium">Loading events...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600 dark:text-red-500 font-medium">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-4 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400 font-medium">
              No security events recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {events.map((event) => (
                <div key={event.id} className="px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200">
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
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              by <span className="font-medium text-slate-900 dark:text-slate-200">{event.username}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-500">
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
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                              View metadata
                            </summary>
                            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 p-3 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-700">
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
        <div className="mt-8 text-center animate-slideInUp" style={{ animationDelay: '0.6s' }}>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/70 dark:border-slate-800 font-medium"
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
