'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  Users,
  Search,
  Eye,
  MessageCircle,
  Shield,
  Lock,
  Unlock,
  X
} from 'lucide-react';

interface SupportGroup {
  id: number;
  name: string;
  description: string;
  is_private: boolean;
  created_at: string;
  members_count: number;
  creator: {
    username: string;
    email: string;
  };
}

interface GroupMember {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    is_veteran: boolean;
  };
  role: string;
  joined_at: string;
}

interface ChatMessage {
  id: number;
  sender: {
    username: string;
  };
  content: string;
  timestamp: string;
}

export default function SupportGroupsManagement() {
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SupportGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/api/support-groups/groups/');
      setGroups(response.data.results || response.data);
    } catch (err: any) {
      console.error('Failed to fetch groups:', err);
      setError('Failed to load support groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const response = await api.get(`/api/support-groups/groups/${groupId}/members/`);
      setMembers(response.data.results || response.data);
      setShowMembersModal(true);
    } catch (err: any) {
      console.error('Failed to fetch members:', err);
      alert('Failed to load group members');
    }
  };

  const fetchChatMessages = async (roomId: number) => {
    try {
      const response = await api.get(`/api/chat/messages/?room_id=${roomId}`);
      setChatMessages(response.data.results || response.data);
      setShowChatModal(true);
    } catch (err: any) {
      console.error('Failed to fetch chat messages:', err);
      alert('Failed to load chat messages');
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading support groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4 mb-2">
          <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
            <Shield className="w-7 h-7 text-gray-100" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Support Groups</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all support groups</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 section-spacing">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl section-spacing font-medium shadow-sm">
          {error}
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover-elevate"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                  {group.is_private ? (
                    <span title="Private Group">
                      <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    </span>
                  ) : (
                    <span title="Public Group">
                      <Unlock className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{group.description}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm mb-5 pb-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Members:</span>
                <span className="font-semibold text-gray-900">{group.members_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Creator:</span>
                <span className="font-semibold text-gray-900">@{group.creator.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-700">{new Date(group.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedGroup(group);
                  fetchGroupMembers(group.id);
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-medium"
              >
                <Users className="w-4 h-4" />
                <span className="text-sm">Members</span>
              </button>
              <button
                onClick={() => {
                  setSelectedGroup(group);
                  fetchChatMessages(group.id);
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-all font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Chat</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No support groups found</p>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedGroup.name} - Members
                </h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-sm font-bold text-gray-100">
                          {member.user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">@{member.user.username}</p>
                        <p className="text-sm text-gray-500">{member.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {member.user.is_veteran && (
                        <span className="badge bg-blue-50 text-blue-700 border-blue-200">
                          Veteran
                        </span>
                      )}
                      <span className="badge bg-gray-50 text-gray-700 border-gray-200">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-center text-gray-500 py-12">No members yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedGroup && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedGroup.name} - Chat Log
                </h2>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        @{message.sender.username}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{message.content}</p>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-center text-gray-500 py-12">No messages yet</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
