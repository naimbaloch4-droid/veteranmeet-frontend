'use client';

import { useEffect, useState, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Search,
  Plus,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video,
  Image as ImageIcon,
  Paperclip,
  Check,
  CheckCheck,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { useChatStore, Message, ChatRoom } from '@/store/useChatStore';
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
    createDirectChat,
    markMessageAsRead
  } = useChatStore();

  const { following, fetchFollowing } = useConnectionStore();

  const [user, setUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchRooms();
    fetchFollowing();

    // Responsive check
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchRooms, fetchFollowing]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Auto-mark as read when viewing messages
    if (currentRoom && messages.length > 0 && user) {
      // Use double equals to handle number/string ID mismatches if any
      const unreadMessages = messages.filter(m => !m.is_read && m.sender.id != user.id);

      if (unreadMessages.length > 0) {
        // Mark messages as read, but maybe batch them or just be mindful of parallel requests
        unreadMessages.forEach(msg => {
          markMessageAsRead(msg.id);
        });
      }
    }
  }, [messages, currentRoom, user, markMessageAsRead]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentRoom) return;

    try {
      await sendMessage(currentRoom.id, messageText);
      setMessageText('');
    } catch (error: any) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartNewChat = async (userId: number) => {
    try {
      const room = await createDirectChat(userId);
      setCurrentRoom(room);
      setShowNewChat(false);
      await fetchRooms();
    } catch (error: any) {
      console.error('Failed to create chat:', error);
    }
  };

  const getOtherParticipant = (room: ChatRoom) => {
    if (!room.participants || room.participants.length === 0) return null;

    // If we have 2 participants, it's a direct chat regardless of the "type" string
    // This handles cases where backend labels might vary
    if (room.participants.length === 2 && user) {
      return room.participants.find((p: any) => p.id != user.id) || room.participants[1];
    }

    // Standard direct chat check
    const isDirect = room.type?.toLowerCase() === 'direct';
    if (isDirect && user) {
      return room.participants.find((p: any) => p.id != user.id) || room.participants[0];
    }

    return null;
  };

  const filteredRooms = (rooms || []).filter(room => {
    const other = getOtherParticipant(room);
    if (!other) return false;
    const fullName = `${other.first_name} ${other.last_name}`.toLowerCase();
    const username = other.username.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="admin-page-container bg-slate-50/50 min-h-[calc(100-72px)] page-fade-in relative">
      <div className="max-w-7xl mx-auto h-[780px] bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200/60 overflow-hidden flex">

        {/* Left Sidebar: Rooms List */}
        <aside className={`${isMobileView && currentRoom ? 'hidden' : 'flex'} w-full lg:w-[380px] flex-col border-r border-slate-100 bg-white z-10`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h1>
                <p className="text-slate-500 text-sm mt-0.5">Connect with fellow veterans</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChat(true)}
                className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4.5 h-4.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Rooms Scroll Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-60">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-400">Loading your chats...</p>
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="py-2 px-3 space-y-1">
                {filteredRooms.map((room) => {
                  const other = getOtherParticipant(room);
                  const isActive = currentRoom?.id === room.id;
                  if (!other) return null;

                  return (
                    <motion.button
                      key={room.id}
                      initial={false}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setCurrentRoom(room)}
                      className={`w-full p-4 rounded-2xl text-left transition-all relative ${isActive
                        ? 'bg-blue-50/80 shadow-sm border border-blue-100/50'
                        : 'hover:bg-slate-50 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-100'
                            }`}>
                            {getInitials(other.first_name, other.last_name, other.username)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h3 className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                              {other.first_name} {other.last_name}
                            </h3>
                            {room.last_message && (
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {formatTimeAgo(room.last_message.created_at)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <p className={`text-xs truncate max-w-[180px] ${isActive ? 'text-blue-600/80' : 'text-slate-500'
                              }`}>
                              {room.last_message ? room.last_message.content : 'No messages yet'}
                            </p>
                            {room.unread_count && room.unread_count > 0 && !isActive && (
                              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-blue-600 text-[10px] font-black text-white rounded-full">
                                {room.unread_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold mb-1">No chats found</h3>
                <p className="text-slate-500 text-xs">Try searching for someone else or start a new chat.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Right Section: Chat Window */}
        <main className={`${isMobileView && !currentRoom ? 'hidden' : 'flex'} flex-1 flex-col bg-white relative`}>
          {currentRoom ? (
            <>
              {/* Chat Header */}
              <header className="h-[88px] flex items-center justify-between px-6 border-b border-slate-50 shrink-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentRoom(null)}
                    className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {(() => {
                    const other = getOtherParticipant(currentRoom);

                    // Priority for name: Other person's name -> Room name -> Fallback
                    let displayName = 'Veteran Member';
                    if (other) {
                      displayName = `${other.first_name} ${other.last_name}`.trim() || other.username;
                    } else if (currentRoom.name && currentRoom.name !== 'Conversation') {
                      displayName = currentRoom.name;
                    }

                    // Priority for initials: Other person's initials -> derived from display name
                    const initials = other
                      ? getInitials(other.first_name, other.last_name, other.username)
                      : displayName.slice(0, 2).toUpperCase();

                    return (
                      <div className="flex items-center space-x-4">
                        <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-slate-100 font-bold shadow-sm whitespace-nowrap">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {displayName}
                          </h3>
                          <div className="flex items-center mt-0.5 space-x-1.5">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              {currentRoom.type?.toLowerCase() === 'direct' || (!currentRoom.name) ? 'Messaging' : 'Active Channel'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </header>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]">
                <div className="flex justify-center mb-8">
                  <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm">
                    Secured by VeteranMeet Shield
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {messages.map((message, idx) => {
                    const isOwn = message.sender.id === user?.id;
                    const showAvatar = idx === 0 || messages[idx - 1].sender.id !== message.sender.id;

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end space-x-2 group`}
                      >
                        {!isOwn && (
                          <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${showAvatar ? 'bg-slate-800 text-white' : 'opacity-0'
                            }`}>
                            {getInitials(message.sender.first_name, message.sender.last_name, message.sender.username)}
                          </div>
                        )}

                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                          <div
                            className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm relative group/msg transition-all ${isOwn
                              ? 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none hover:border-slate-200 shadow-slate-200/50'
                              }`}
                          >
                            <p className="leading-relaxed font-medium">{message.content}</p>
                            <div className={`absolute bottom-0 -right-8 opacity-0 group-hover/msg:opacity-100 transition-opacity`}>
                              <Smile className="w-4 h-4 text-slate-300 pointer-events-none" />
                            </div>
                          </div>

                          <div className="flex items-center mt-1.5 space-x-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatTimeAgo(message.created_at)}
                            </span>
                            {isOwn && (
                              message.is_read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-300" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Container */}
              <footer className="p-6 bg-white border-t border-slate-50">
                <div className="bg-slate-50 p-2 rounded-[24px] border border-slate-100/50 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-blue-500/5 focus-within:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-end space-x-2">
                    <button className="p-3 text-slate-400 hover:text-blue-600 rounded-full transition-colors">
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                      rows={1}
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 py-3 px-2 text-sm max-h-[120px] resize-none"
                    />

                    <div className="flex items-center space-x-1 pb-1 pr-1">
                      <button className="p-2.5 text-slate-400 hover:text-blue-600 rounded-full transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className={`p-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center ${messageText.trim()
                          ? 'bg-blue-600 text-white shadow-blue-200'
                          : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                          }`}
                      >
                        <Send className="w-5 h-5 fill-current" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 bg-slate-50/30 relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-1/4 -right-20 w-80 h-80 bg-blue-100/40 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-purple-100/40 rounded-full blur-[100px]" />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center relative z-10"
              >
                <div className="w-24 h-24 bg-white shadow-2xl shadow-blue-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <MessageCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your Conversations</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
                  Select a veteran from your list to start a secure conversation or browse your history.
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="px-8 py-4 bg-white text-blue-600 border border-blue-100 font-bold rounded-2xl shadow-xl shadow-blue-500/5 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1"
                >
                  Create New Message
                </button>
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-[100] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">New Conversation</h3>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <Plus className="w-6 h-6 text-slate-400 rotate-45" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                  {(following || []).length > 0 ? (
                    following.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleStartNewChat(person.id)}
                        className="w-full flex items-center space-x-4 p-4 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
                      >
                        <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 transition-colors">
                          {getInitials(person.first_name, person.last_name, person.username)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {person.first_name} {person.last_name}
                          </p>
                          <p className="text-xs font-medium text-slate-500">@{person.username}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase">
                          Start Chat
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-12 px-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-900 font-bold mb-1">No veterans found</p>
                      <p className="text-slate-500 text-sm">Follow other veterans from the connections tab to start chatting with them.</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex items-center space-x-4">
                  <div className="flex-1 flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    <span>End-to-end encrypted</span>
                  </div>
                  <button
                    onClick={() => setShowNewChat(false)}
                    className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
