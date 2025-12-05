import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { Search, Mail, Phone, MapPin, Briefcase, UserPlus, Filter } from 'lucide-react';
import tokenStorage from '~/services/tokenStorage';

export function meta() {
    return [
        { title: 'Team - SynergyOS' },
        { name: 'description', content: 'Manage your team members' },
    ];
}

interface TeamMember {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    department?: string;
    position?: string;
    role: string;
    is_active: boolean;
    date_joined: string;
}

function TeamContent() {
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    useEffect(() => {
        filterMembers();
    }, [searchQuery, roleFilter, teamMembers]);

    const fetchTeamMembers = async () => {
        try {
            const token = tokenStorage.getAccessToken();
            if (!token) {
                return;
            }
            const response = await fetch('/api/users/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterMembers = () => {
        let filtered = teamMembers;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(member =>
                member.username.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query) ||
                `${member.first_name} ${member.last_name}`.toLowerCase().includes(query) ||
                member.department?.toLowerCase().includes(query) ||
                member.position?.toLowerCase().includes(query)
            );
        }

        // Apply role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter(member => member.role === roleFilter);
        }

        setFilteredMembers(filtered);
    };

    const getRoleBadge = (role: string) => {
        const badges = {
            admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            team_member: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        };
        return badges[role as keyof typeof badges] || badges.team_member;
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                        Team Members
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage and view your team members
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/70 dark:border-slate-800 p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-3">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, department, or position..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                                <option value="team_member">Team Member</option>
                            </select>
                        </div>

                        {/* Add Member Button */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Invite Member</span>
                        </button>
                    </div>
                </div>

                {/* Team Members Table - Excel Style */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-300 dark:border-slate-700 overflow-hidden">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                                {searchQuery || roleFilter !== 'all'
                                    ? 'No team members found matching your filters'
                                    : 'No team members yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Phone
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Position
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Department
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-r border-slate-300 dark:border-slate-700">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMembers.map((member, index) => (
                                        <tr
                                            key={member.id}
                                            className={`border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                                                index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'
                                            }`}
                                            onClick={() => navigate(`/profile`)}
                                        >
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 h-9 w-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                        {member.first_name?.[0]?.toUpperCase() || member.username[0].toUpperCase()}
                                                        {member.last_name?.[0]?.toUpperCase() || member.username[1]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {member.first_name && member.last_name
                                                                ? `${member.first_name} ${member.last_name}`
                                                                : member.username}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            @{member.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                <a 
                                                    href={`mailto:${member.email}`} 
                                                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {member.email}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                {member.phone ? (
                                                    <a 
                                                        href={`tel:${member.phone}`} 
                                                        className="text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {member.phone}
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-slate-400 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                <span className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                                                    {member.position || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                <span className="text-sm text-slate-900 dark:text-slate-100">
                                                    {member.department || <span className="text-slate-400 dark:text-slate-600">—</span>}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 border-r border-slate-200 dark:border-slate-800">
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${getRoleBadge(member.role)}`}>
                                                    {member.role === 'team_member' ? 'Member' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${getStatusBadge(member.is_active)}`}>
                                                    {member.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <p>
                        Showing {filteredMembers.length} of {teamMembers.length} team members
                    </p>
                    <p>
                        Active: <span className="text-green-600 dark:text-green-500 font-bold">{teamMembers.filter(m => m.is_active).length}</span> | 
                        Inactive: <span className="text-slate-500 dark:text-slate-400 font-bold">{teamMembers.filter(m => !m.is_active).length}</span>
                    </p>
                </div>
            </main>
        </div>
    );
}

export default function Team() {
    return (
        <ProtectedRoute>
            <TeamContent />
        </ProtectedRoute>
    );
}
