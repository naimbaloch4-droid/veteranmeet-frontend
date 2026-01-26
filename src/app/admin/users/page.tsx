'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  Edit,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Trash2,
  X,
  Star,
  Trophy,
  Award,
  Gem,
  Crown,
  ChevronRight,
  Info,
  Clock as ClockIcon,
  Award as AwardIcon
} from 'lucide-react';
import StatCard from '@/components/StatCard';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_veteran: boolean;
  is_active: boolean;
  is_superuser?: boolean;
  is_staff?: boolean;
  date_joined?: string | null;
  last_login?: string;
  star_rating?: number;
  veteran_category?: string;
  profile?: {
    avatar?: string;
    bio?: string;
  };
}

interface UserStar {
  id: number;
  quantity: number;
  created_at: string;
  receiver: number;
  giver?: number;
  giver_name?: string;
  event?: number;
  event_title?: string;
}

// Veteran Category Helper (Uses central formatter now)
const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Eternal Sage': 'bg-purple-50 text-purple-700 border-purple-200',
    'Platinum Veteran': 'bg-gray-50 text-gray-700 border-gray-300',
    'Sapphire Veteran': 'bg-blue-50 text-blue-700 border-blue-200',
    'Diamond Veteran': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Golden Veteran': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'Ruby Veteran': 'bg-red-50 text-red-700 border-red-200',
    'Silver Veteran': 'bg-gray-50 text-gray-600 border-gray-200',
    'Bronze Veteran': 'bg-orange-50 text-orange-700 border-orange-200'
  };
  return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Eternal Sage':
      return <Crown className="w-3 h-3" />;
    case 'Platinum Veteran':
    case 'Diamond Veteran':
      return <Gem className="w-3 h-3" />;
    case 'Golden Veteran':
    case 'Ruby Veteran':
      return <Trophy className="w-3 h-3" />;
    default:
      return <Award className="w-3 h-3" />;
  }
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVeteran, setFilterVeteran] = useState<'all' | 'veteran' | 'non-veteran'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [addUserForm, setAddUserForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    is_veteran: false,
    is_superuser: false
  });
  const [editUserForm, setEditUserForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    is_veteran: false,
    is_active: true,
    is_superuser: false
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [selectedUserStars, setSelectedUserStars] = useState<UserStar[]>([]);
  const [loadingStars, setLoadingStars] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users/');
      console.log('Raw user data from backend:', response.data[0]); // Log first user to see what fields we get
      const normalizedUsers = response.data.map((user: any) => ({
        ...user,
        is_active: Boolean(user.is_active),
        is_veteran: Boolean(user.is_veteran),
        is_superuser: Boolean(user.is_superuser),
        is_staff: Boolean(user.is_staff),
        star_rating: user.star_rating || 0,
        veteran_category: (user.is_veteran && !user.is_superuser) ? getVeteranCategoryFromStars(user.star_rating || 0) : undefined,
        // Ensure date_joined is properly passed through
        date_joined: user.date_joined || user.created_at || null
      }));
      setUsers(normalizedUsers);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);

    const matchesVeteran = filterVeteran === 'all' ||
      (filterVeteran === 'veteran' && user.is_veteran) ||
      (filterVeteran === 'non-veteran' && !user.is_veteran);

    return matchesSearch && matchesStatus && matchesVeteran;
  });

  const handleUserAction = async (userId: number, action: string) => {
    try {
      let response;
      switch (action) {
        case 'deactivate':
          response = await api.patch(`/api/auth/users/${userId}/`, { is_active: false });
          break;
        case 'activate':
          response = await api.patch(`/api/auth/users/${userId}/`, { is_active: true });
          break;
        default:
          return;
      }

      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: Boolean(response.data.is_active) } : user
      ));
    } catch (err: any) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setEditUserForm({
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      is_veteran: user.is_veteran,
      is_active: user.is_active,
      is_superuser: user.is_superuser || false
    });
    setSelectedUser(user);
    setShowEditUserModal(true);
    setFormErrors([]);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setFormErrors([]);

    const errors: string[] = [];
    if (!editUserForm.email) errors.push('Email is required');
    if (!editUserForm.username) errors.push('Username is required');
    if (!editUserForm.first_name) errors.push('First name is required');
    if (!editUserForm.last_name) errors.push('Last name is required');

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await api.patch(`/api/auth/users/${selectedUser.id}/`, editUserForm);

      setUsers(users.map(user =>
        user.id === selectedUser.id ? {
          ...user,
          ...response.data,
          is_active: Boolean(response.data.is_active),
          is_veteran: Boolean(response.data.is_veteran),
          is_superuser: Boolean(response.data.is_superuser),
          is_staff: Boolean(response.data.is_staff),
          star_rating: response.data.star_rating || user.star_rating,
          // Only calculate veteran category for veterans who are NOT admins
          veteran_category: (response.data.is_veteran && !response.data.is_superuser) ? getVeteranCategoryFromStars(response.data.star_rating || user.star_rating || 0) : undefined
        } : user
      ));

      setShowEditUserModal(false);
      setSelectedUser(null);
      setError('');
    } catch (err: any) {
      console.error('Failed to update user:', err);
      if (err.response?.data) {
        const apiErrors: string[] = [];
        Object.keys(err.response.data).forEach(key => {
          if (Array.isArray(err.response.data[key])) {
            apiErrors.push(...err.response.data[key]);
          } else {
            apiErrors.push(err.response.data[key]);
          }
        });
        setFormErrors(apiErrors);
      } else {
        setFormErrors(['Failed to update user. Please try again.']);
      }
    }
  };

  const handleAddUser = async () => {
    setFormErrors([]);

    const errors: string[] = [];
    if (!addUserForm.email) errors.push('Email is required');
    if (!addUserForm.username) errors.push('Username is required');
    if (!addUserForm.first_name) errors.push('First name is required');
    if (!addUserForm.last_name) errors.push('Last name is required');
    if (!addUserForm.password) errors.push('Password is required');
    if (addUserForm.password !== addUserForm.password_confirm) {
      errors.push('Passwords do not match');
    }

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const response = await api.post('/api/auth/users/', addUserForm);

      setUsers([...users, {
        ...response.data,
        is_active: Boolean(response.data.is_active),
        is_veteran: Boolean(response.data.is_veteran),
        is_superuser: Boolean(response.data.is_superuser),
        is_staff: Boolean(response.data.is_staff),
        star_rating: 0,
        // Only set veteran category for veterans who are NOT admins
        veteran_category: (response.data.is_veteran && !response.data.is_superuser) ? 'Bronze Veteran' : undefined
      }]);

      setAddUserForm({
        email: '',
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        password_confirm: '',
        is_veteran: false,
        is_superuser: false
      });
      setShowAddUserModal(false);
      setError('');
    } catch (err: any) {
      console.error('Failed to create user:', err);
      if (err.response?.data) {
        const apiErrors: string[] = [];
        Object.keys(err.response.data).forEach(key => {
          if (Array.isArray(err.response.data[key])) {
            apiErrors.push(...err.response.data[key]);
          } else {
            apiErrors.push(err.response.data[key]);
          }
        });
        setFormErrors(apiErrors);
      } else {
        setFormErrors(['Failed to create user. Please try again.']);
      }
    }
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/api/auth/users/${userToDelete.id}/`);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
      setError('');
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
      setShowDeleteModal(false);
    }
  };

  const viewUserStars = async (user: User) => {
    setSelectedUser(user);
    setShowStarsModal(true);
    setLoadingStars(true);

    try {
      const response = await api.get(`/api/auth/users/${user.id}/stars/`);
      setSelectedUserStars(response.data);
    } catch (err: any) {
      console.error('Failed to fetch user stars:', err);
      setError('Failed to load user stars');
      setSelectedUserStars([]);
    } finally {
      setLoadingStars(false);
    }
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) {
      console.warn('Date field is missing or empty:', dateString);
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
              <Shield className="w-7 h-7 text-gray-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor platform users</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center px-6 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 hover:shadow-xl transition-all font-medium shadow-lg btn-hover"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add User
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 section-spacing">
          <StatCard
            icon={Users}
            label="Total Users"
            value={users.length}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-100"
          />
          <StatCard
            icon={CheckCircle}
            label="Active"
            value={users.filter(u => u.is_active).length}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-100"
            delay={0.05}
          />
          <StatCard
            icon={ShieldCheck}
            label="Veterans"
            value={users.filter(u => u.is_veteran).length}
            iconBgColor="bg-purple-50"
            iconColor="text-purple-600"
            borderColor="border-purple-100"
            delay={0.1}
          />
          <StatCard
            icon={Shield}
            label="Admins"
            value={users.filter(u => u.is_superuser).length}
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
            borderColor="border-indigo-100"
            delay={0.15}
          />
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 section-spacing">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
            >
              <option value="all">All Accounts</option>
              <option value="active">Enabled Accounts</option>
              <option value="inactive">Disabled Accounts</option>
            </select>
          </div>

          {/* Veteran Filter */}
          <div className="w-full md:w-48">
            <select
              value={filterVeteran}
              onChange={(e) => setFilterVeteran(e.target.value as any)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
            >
              <option value="all">All Users</option>
              <option value="veteran">Veterans</option>
              <option value="non-veteran">Non-Veterans</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl section-spacing font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Account Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Stars & Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-11 w-11">
                        <div className="h-11 w-11 rounded-xl bg-gray-800 flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-gray-100">
                            {user.first_name?.[0] || 'U'}{user.last_name?.[0] || 'N'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${user.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {user.is_active ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Enabled</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Disabled</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${user.is_superuser
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : user.is_veteran
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                      {user.is_superuser ? (
                        <><Shield className="w-3 h-3 mr-1" /> Admin</>
                      ) : user.is_veteran ? (
                        <><ShieldCheck className="w-3 h-3 mr-1" /> Veteran</>
                      ) : (
                        <><Users className="w-3 h-3 mr-1" /> Regular</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Only show stars and category for veterans who are NOT admins */}
                    {user.is_veteran && !user.is_superuser ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-yellow-600">
                            <Star className="w-4 h-4 fill-current mr-1" />
                            <span className="text-sm font-medium">{user.star_rating || 0}</span>
                          </div>
                          <button
                            onClick={() => viewUserStars(user)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View
                          </button>
                        </div>
                        {user.veteran_category && (
                          <span className={`badge text-xs ${getCategoryColor(user.veteran_category)}`}>
                            {getCategoryIcon(user.veteran_category)}
                            <span className="ml-1">{user.veteran_category}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">
                        -
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.date_joined)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openUserModal(user)}
                        className="icon-btn text-blue-600 hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(user)}
                        className="icon-btn text-purple-600 hover:bg-purple-50"
                        title="Edit User"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => handleUserAction(user.id, 'deactivate')}
                          className="icon-btn text-orange-600 hover:bg-orange-50"
                          title="Disable Account"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="icon-btn text-green-600 hover:bg-green-50"
                          title="Enable Account"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => confirmDeleteUser(user)}
                        className="icon-btn text-red-600 hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gray-800 rounded-xl shadow-lg">
                    <UserPlus className="w-6 h-6 text-gray-100" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Add New User</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setFormErrors([]);
                    setAddUserForm({
                      email: '',
                      username: '',
                      first_name: '',
                      last_name: '',
                      password: '',
                      password_confirm: '',
                      is_veteran: false,
                      is_superuser: false
                    });
                  }}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={addUserForm.first_name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={addUserForm.last_name}
                      onChange={(e) => setAddUserForm({ ...addUserForm, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={addUserForm.username}
                    onChange={(e) => setAddUserForm({ ...addUserForm, username: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={addUserForm.password}
                      onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      value={addUserForm.password_confirm}
                      onChange={(e) => setAddUserForm({ ...addUserForm, password_confirm: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addUserForm.is_veteran}
                      onChange={(e) => setAddUserForm({ ...addUserForm, is_veteran: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Veteran User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addUserForm.is_superuser}
                      onChange={(e) => setAddUserForm({ ...addUserForm, is_superuser: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Admin User (Superuser)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowAddUserModal(false);
                    setFormErrors([]);
                    setAddUserForm({
                      email: '',
                      username: '',
                      first_name: '',
                      last_name: '',
                      password: '',
                      password_confirm: '',
                      is_veteran: false,
                      is_superuser: false
                    });
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="btn-gradient-primary px-6 py-2.5 text-white rounded-xl font-medium"
                >
                  Create User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Edit className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
                </div>
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setFormErrors([]);
                    setSelectedUser(null);
                  }}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {formErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={editUserForm.first_name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={editUserForm.last_name}
                      onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="johndoe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editUserForm.is_active}
                      onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Account Enabled</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editUserForm.is_veteran}
                      onChange={(e) => setEditUserForm({ ...editUserForm, is_veteran: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Veteran User</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editUserForm.is_superuser}
                      onChange={(e) => setEditUserForm({ ...editUserForm, is_superuser: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Admin User (Superuser)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setFormErrors([]);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditUser}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-xl transition-all font-medium shadow-lg shadow-purple-500/30"
                >
                  Update User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 bg-red-50 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Delete User
              </h3>
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                Are you sure you want to delete <strong className="text-gray-900">{userToDelete.first_name} {userToDelete.last_name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-xl transition-all font-medium shadow-lg shadow-red-500/30"
                >
                  Delete User
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Stars Modal - View Only */}
      {showStarsModal && selectedUser && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Stars for {selectedUser.first_name} {selectedUser.last_name}
                  </h3>
                  <div className="flex items-center mt-3 space-x-4">
                    <div className="flex items-center text-yellow-600">
                      <Star className="w-5 h-5 fill-current mr-2" />
                      <span className="text-sm font-semibold">Total: {selectedUser.star_rating || 0} stars</span>
                    </div>
                    <span className={`badge ${getCategoryColor(selectedUser.veteran_category || 'Bronze Veteran')}`}>
                      {getCategoryIcon(selectedUser.veteran_category || 'Bronze Veteran')}
                      <span className="ml-1">{selectedUser.veteran_category}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowStarsModal(false);
                    setSelectedUserStars([]);
                  }}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Info about star system */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">How Stars are Earned:</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>Event Participation:</strong> Automatically awarded when joining events</li>
                  <li>• <strong>Peer Recognition:</strong> Direct endorsements from other users</li>
                </ul>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingStars ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : selectedUserStars.length > 0 ? (
                <div className="space-y-3">
                  {selectedUserStars.map((star) => (
                    <div key={star.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${star.event ? 'bg-blue-100' : 'bg-purple-100'
                          }`}>
                          {star.event ? (
                            <Trophy className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Award className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-600 fill-current" />
                            <p className="text-sm font-semibold text-gray-900">
                              {star.quantity} {star.quantity === 1 ? 'Star' : 'Stars'}
                            </p>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {star.event
                              ? `Event Participation${star.event_title ? `: ${star.event_title}` : ` #${star.event}`}`
                              : `Peer Recognition${star.giver_name ? ` from ${star.giver_name}` : ''}`
                            }
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(star.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No stars received yet</p>
                  <p className="text-xs text-gray-400 mt-1">Stars are earned through event participation and peer recognition</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-800 flex items-center justify-center shadow-md">
                    <span className="text-xl font-bold text-gray-100">
                      {selectedUser.first_name?.[0] || 'U'}{selectedUser.last_name?.[0] || 'N'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h4>
                    <p className="text-gray-500">@{selectedUser.username}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                    <span className={`badge ${selectedUser.is_active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                      {selectedUser.is_active ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Type</p>
                    <span className={`badge ${selectedUser.is_superuser
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : selectedUser.is_veteran
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                      {selectedUser.is_superuser ? 'Admin' : selectedUser.is_veteran ? 'Veteran' : 'Regular'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedUser.date_joined)}
                    </p>
                  </div>
                </div>

                {/* Only show stars and category for veterans who are NOT admins */}
                {selectedUser.is_veteran && !selectedUser.is_superuser && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Stars</p>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-600 fill-current mr-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {selectedUser.star_rating || 0} stars
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Veteran Category</p>
                      <span className={`badge ${getCategoryColor(selectedUser.veteran_category || 'Bronze Veteran')}`}>
                        {getCategoryIcon(selectedUser.veteran_category || 'Bronze Veteran')}
                        <span className="ml-1">{selectedUser.veteran_category || 'Bronze Veteran'}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
