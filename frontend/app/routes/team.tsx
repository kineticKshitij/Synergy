import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ProtectedRoute } from '~/components/ProtectedRoute';
import { Navbar } from '~/components/Navbar';
import { LoadingScreen } from '~/components/LoadingScreen';
import { Search, Mail, Phone, MapPin, Briefcase, UserPlus, Filter } from 'lucide-react';

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
            const token = localStorage.getItem('access_token');
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

    if (isLoading) {
        return <LoadingScreen message="Loading team members" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Team Members
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage and view your team members
                    </p>
                </div>

                {/* Search and Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, department, or position..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Role Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            <span>Invite Member</span>
                        </button>
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchQuery || roleFilter !== 'all'
                                    ? 'No team members found matching your filters'
                                    : 'No team members yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Contact Information
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Job Position
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredMembers.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/profile`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                        {member.first_name?.[0]?.toUpperCase() || member.username[0].toUpperCase()}
                                                        {member.last_name?.[0]?.toUpperCase() || member.username[1]?.toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {member.first_name && member.last_name
                                                                ? `${member.first_name} ${member.last_name}`
                                                                : member.username}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            @{member.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <a href={`mailto:${member.email}`} className="hover:text-blue-600 dark:hover:text-blue-400" onClick={(e) => e.stopPropagation()}>
                                                            {member.email}
                                                        </a>
                                                    </div>
                                                    {member.phone && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <a href={`tel:${member.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400" onClick={(e) => e.stopPropagation()}>
                                                                {member.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {member.position && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                            <Briefcase className="w-4 h-4 text-gray-400" />
                                                            {member.position}
                                                        </div>
                                                    )}
                                                    {member.department && (
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {member.department}
                                                        </div>
                                                    )}
                                                    {!member.position && !member.department && (
                                                        <span className="text-sm text-gray-400">Not specified</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(member.role)}`}>
                                                    {member.role === 'team_member' ? 'Team Member' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(member.is_active)}`}>
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
                <div className="mt-6 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <p>
                        Showing {filteredMembers.length} of {teamMembers.length} team members
                    </p>
                    <p>
                        Active: {teamMembers.filter(m => m.is_active).length} | 
                        Inactive: {teamMembers.filter(m => !m.is_active).length}
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
