'use client';

import { useEffect, useState } from 'react';
import { UserCircle, Edit2, Save, X, Star, Shield, Calendar, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUser } from '@/lib/auth';
import { getVeteranCategoryFromStars, getVeteranCategoryColor, getInitials, formatDate } from '@/utils/veteranFormatters';
import api from '@/lib/api';
import { useToastStore } from '@/store/useToastStore';

interface Profile {
  bio?: string;
  military_branch?: string;
  service_years?: string;
  location?: string;
  profile_picture?: string;
}

export default function ProfilePage() {
  const { success, error: showError } = useToastStore();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<Profile>({});

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const userData = getUser();
      setUser(userData);

      // Fetch profile details
      const profileRes = await api.get('/api/auth/user/profile/');
      setProfile(profileRes.data);
      setEditForm(profileRes.data);

      // Fetch user stats
      const statsRes = await api.get('/api/hub/stats/');
      setStats(statsRes.data);
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await api.put('/api/auth/user/profile/', editForm);
      setProfile(editForm);
      setIsEditing(false);
      success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container page-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-gray-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  const veteranCategory = stats?.veteran_category || getVeteranCategoryFromStars(stats?.star_rating || 0);

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-800 rounded-xl">
              <UserCircle className="w-7 h-7 text-gray-100" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account and settings</p>
            </div>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center px-4 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-medium shadow-lg"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditForm(profile || {});
                  setIsEditing(false);
                }}
                className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            {/* Profile Picture */}
            <div className="text-center mb-6">
              <div className="w-32 h-32 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-4xl font-medium text-gray-100">
                  {getInitials(user?.first_name, user?.last_name, user?.username)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h2>
              <p className="text-gray-500 mb-3">@{user?.username}</p>
              
              {user?.is_veteran && (
                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg">
                    Veteran Member
                  </span>
                  {veteranCategory && (
                    <div className={`text-sm font-semibold ${getVeteranCategoryColor(veteranCategory)}`}>
                      {veteranCategory}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            {stats && (
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Stars</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-600 fill-current" />
                    <span className="font-semibold text-gray-900">{stats.star_rating?.toLocaleString() || 0}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Posts</span>
                  <span className="font-semibold text-gray-900">{stats.posts_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Events Joined</span>
                  <span className="font-semibold text-gray-900">{stats.events_joined || 0}</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Profile Details */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Profile Information</h3>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {user?.is_veteran && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Military Branch</label>
                        <select
                          value={editForm.military_branch || ''}
                          onChange={(e) => setEditForm({ ...editForm, military_branch: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Branch</option>
                          <option value="Army">Army</option>
                          <option value="Navy">Navy</option>
                          <option value="Air Force">Air Force</option>
                          <option value="Marines">Marines</option>
                          <option value="Coast Guard">Coast Guard</option>
                          <option value="Space Force">Space Force</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Years of Service</label>
                        <input
                          type="text"
                          value={editForm.service_years || ''}
                          onChange={(e) => setEditForm({ ...editForm, service_years: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="2015-2020"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, State"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bio */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Bio</h4>
                  <p className="text-gray-900 leading-relaxed">
                    {profile?.bio || 'No bio added yet.'}
                  </p>
                </div>

                {/* Military Service */}
                {user?.is_veteran && (
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-blue-600" />
                      Military Service
                    </h4>
                    <div className="space-y-3">
                      {profile?.military_branch && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <span className="text-sm font-medium">Branch:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                            {profile.military_branch}
                          </span>
                        </div>
                      )}
                      {profile?.service_years && (
                        <div className="flex items-center space-x-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Service Years: {profile.service_years}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location */}
                {profile?.location && (
                  <div className="pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{profile.location}</span>
                    </div>
                  </div>
                )}

                {/* Account Info */}
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {user?.email || 'Not provided'}
                    </div>
                    <div>
                      <span className="font-medium">Member since:</span> {user?.date_joined ? formatDate(user.date_joined) : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
