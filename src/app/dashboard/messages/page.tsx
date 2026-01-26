'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, Search, Plus, ArrowLeft } from 'lucide-react';
import { useChatStore } from '@/store/useChatStore';
import { useConnectionStore } from '@/store/useConnectionStore';
import { getUser } from '@/lib/auth';
import { formatTimeAgo, getInitials } from '@/utils/veteranFormatters';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessagesPage() {
  const { 
    rooms, 
    currentRoom, 
    messages, 
    loading, 
    fetchRooms, 
    fetchMessages, 
    sendMessage, 
    setCurrentRoom,
    createDirectChat
  } = useChatStore();
  
  const { following, fetchFollowing } = useConnectionStore();
  
  const [user, setUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchRooms();
    fetchFollowing();
  }, [fetchRooms, fetchFollowing]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentRoom) return;

    try {
      await sendMessage(currentRoom.id, messageText);
      setMessageText('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.detail || 'Failed to send message');
    }
  };

  const handleStartNewChat = async (userId: number) => {
    try {
      const room = await createDirectChat(userId);
      setCurrentRoom(room);
      setShowNewChat(false);
      await fetchRooms(); // Refresh rooms list
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      alert(error.response?.data?.detail || 'Failed to start chat');
    }
  };

  const getOtherParticipant = (room: any) => {
    if (room.type === 'direct' && user) {
      return room.participants.find((p: any) => p.id !== user.id);
    }
    return null;
  };

  const filteredRooms = (rooms || []).filter(room => {
    const other = getOtherParticipant(room);
    if (!other) return false;
    const fullName = `${other.first_name} ${other.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <MessageCircle className="w-7 h-7 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
            <p className="text-gray-600 mt-1">Direct messages with other veterans</p>
          </div>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[600px]">
            {loading && (rooms || []).length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredRooms.map((room) => {
                  const other = getOtherParticipant(room);
                  if (!other) return null;
                  
                  return (
                    <button
                      key={room.id}
                      onClick={() => setCurrentRoom(room)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        currentRoom?.id === room.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-gray-100">
                            {getInitials(other.first_name, other.last_name, other.username)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {other.first_name} {other.last_name}
                            </p>
                            {room.last_message && (
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(room.last_message.created_at)}
                              </span>
                            )}
                          </div>
                          {room.last_message && (
                            <p className="text-xs text-gray-600 truncate">
                              {room.last_message.content}
                            </p>
                          )}
                          {room.unread_count && room.unread_count > 0 && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                              {room.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 flex items-center space-x-3">
                <button
                  onClick={() => setCurrentRoom(null)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {(() => {
                  const other = getOtherParticipant(currentRoom);
                  if (!other) return null;
                  
                  return (
                    <>
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-100">
                          {getInitials(other.first_name, other.last_name, other.username)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {other.first_name} {other.last_name}
                        </h3>
                        <p className="text-xs text-gray-500">@{other.username}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
                {(messages || []).map((message) => {
                  const isOwn = message.sender.id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-xl ${
                            isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTimeAgo(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div>
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600 text-sm">
                  Choose a chat from the list or start a new conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[600px] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">New Conversation</h3>
                
                <div className="space-y-3">
                  {(following || []).length > 0 ? (
                    (following || []).map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleStartNewChat(person.id)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-100">
                            {getInitials(person.first_name, person.last_name, person.username)}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-gray-900">
                            {person.first_name} {person.last_name}
                          </p>
                          <p className="text-xs text-gray-500">@{person.username}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      Follow someone first to start chatting
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setShowNewChat(false)}
                  className="w-full mt-6 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
