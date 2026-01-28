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
  Smile,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useChatStore, Message, ChatRoom } from '@/store/useChatStore';
import { useConnectionStore } from '@/store/useConnectionStore';
import { getUser } from '@/lib/auth';
import { formatTimeAgo, getInitials } from '@/utils/veteranFormatters';
import { motion, AnimatePresence } from 'framer-motion';
import OnlineStatusIndicator from '@/components/OnlineStatusIndicator';
import MessageStatusIcon from '@/components/MessageStatusIcon';
import TypingIndicator from '@/components/TypingIndicator';
import MessageNotification from '@/components/MessageNotification';

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
    markMessageAsRead,
    retryMessage,
    onlineUsers,
    typingUsers,
    fetchOnlineUsers
  } = useChatStore();

  const { following, fetchFollowing } = useConnectionStore();

  const [user, setUser] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    senderName: string;
    messagePreview: string;
    roomId?: number;
  }>({ show: false, senderName: '', messagePreview: '' });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesCountRef = useRef(messages.length);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchRooms();
    fetchFollowing();
    fetchOnlineUsers(); // Initial fetch of online users

    // Responsive check
    const checkMobile = () => setIsMobileView(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // SMART POLLING: Check for new messages/rooms every 4 seconds
    const pollInterval = setInterval(() => {
      fetchRooms();
      fetchOnlineUsers(); // Poll online status

      if (currentRoom) {
        fetchMessages(currentRoom.id);
      }
    }, 4000);

    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(pollInterval);
    };
  }, [fetchRooms, fetchFollowing, fetchOnlineUsers, currentRoom?.id, fetchMessages]);

  // Detect new messages in OTHER rooms and show notification
  useEffect(() => {
    if (!user) return;

    // Check for new messages in rooms OTHER than the currently open one
    rooms.forEach(room => {
      // Only show notification for rooms with unread messages that are NOT currently open
      if (room.unread_count && room.unread_count > 0 && room.id !== currentRoom?.id) {
        const other = getOtherParticipant(room);
        if (other && room.last_message && room.last_message.sender.id !== user.id) {
          const senderName = `${other.first_name} ${other.last_name}`.trim() || other.username;
          
          // Only show if we haven't shown this message before
          const notificationKey = `${room.id}-${room.last_message.id}`;
          const lastShownNotification = sessionStorage.getItem('lastNotification');
          
          if (lastShownNotification !== notificationKey) {
            setNewMessageNotification({
              show: true,
              senderName,
              messagePreview: room.last_message.content,
              roomId: room.id
            });

            sessionStorage.setItem('lastNotification', notificationKey);

            // Auto-hide after 5 seconds
            setTimeout(() => {
              setNewMessageNotification((prev) => ({ ...prev, show: false }));
            }, 5000);
          }
          
          // Only show one notification at a time
          return;
        }
      }
    });
  }, [rooms, user, currentRoom]);

  // Scroll to bottom when room changes OR when messages load
  useEffect(() => {
    if (currentRoom && messages.length > 0 && messagesEndRef.current) {
      // Force immediate scroll to bottom to show latest messages
      // Use multiple attempts to ensure it works even if content is still loading
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 50);
      
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
      }, 150);
      
      setIsUserScrolling(false);
      
      // Clear notification if viewing the room from the notification
      if (newMessageNotification.roomId === currentRoom.id) {
        setNewMessageNotification((prev) => ({ ...prev, show: false }));
      }
    }
  }, [currentRoom?.id, messages.length, newMessageNotification.roomId]);

  // Check if user is near bottom of scroll
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 150; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Handle scroll detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // User is scrolling manually
      setIsUserScrolling(true);

      // Reset after user stops scrolling for 1 second
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is not manually scrolling
    // 2. User is near the bottom already
    if (messagesEndRef.current && !isUserScrolling && isNearBottom()) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    // Auto-mark as read when viewing messages
    if (currentRoom && messages.length > 0 && user) {
      const unreadMessages = messages.filter(m => !m.is_read && m.sender.id != user.id);

      if (unreadMessages.length > 0) {
        // Mark individual messages as read
        unreadMessages.forEach(msg => {
          markMessageAsRead(msg.id);
        });
        
        // Also mark the room as read to clear unread count
        if (currentRoom.unread_count && currentRoom.unread_count > 0) {
          useChatStore.getState().markAsRead(currentRoom.id);
        }
      }
    }
  }, [messages, currentRoom, user, markMessageAsRead, isUserScrolling]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentRoom) return;

    const textToSend = messageText;
    setMessageText('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage(currentRoom.id, textToSend);
    } catch (error: any) {
      console.error('Failed to send message:', error);
    }
  };

  const handleRetryMessage = async (message: Message) => {
    if (!currentRoom) return;
    try {
      await retryMessage(message.id, currentRoom.id, message.content);
    } catch (error) {
      console.error('Retry failed:', error);
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

    if (room.participants.length === 2 && user) {
      return room.participants.find((p: any) => p.id != user.id) || room.participants[1];
    }

    const isDirect = room.type?.toLowerCase() === 'direct';
    if (isDirect && user) {
      return room.participants.find((p: any) => p.id != user.id) || room.participants[0];
    }

    return null;
  };

  const isUserOnline = (userId: number) => {
    return onlineUsers.has(userId);
  };

  const filteredRooms = (rooms || []).filter(room => {
    const other = getOtherParticipant(room);
    if (!other) return false;
    const fullName = `${other.first_name} ${other.last_name}`.toLowerCase();
    const username = other.username.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  const currentTypingUser = currentRoom ? typingUsers.get(currentRoom.id) : null;

  return (
    <div className="h-[calc(100vh-80px)] bg-slate-50/50 page-fade-in overflow-hidden">
      {/* Message Notification */}
      <MessageNotification
        show={newMessageNotification.show}
        senderName={newMessageNotification.senderName}
        messagePreview={newMessageNotification.messagePreview}
        onClose={() => setNewMessageNotification((prev) => ({ ...prev, show: false }))}
        onClick={() => {
          // Find and open the room for this notification
          if (newMessageNotification.roomId) {
            const room = rooms.find(r => r.id === newMessageNotification.roomId);
            if (room) {
              setCurrentRoom(room);
            }
          }
          setNewMessageNotification((prev) => ({ ...prev, show: false }));
        }}
      />

      <div className="h-full w-full bg-white rounded-2xl shadow-xl shadow-blue-900/5 overflow-hidden flex border border-slate-200/60">

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
                  const isOnline = other ? isUserOnline(other.id) : false;
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
                          <div className="absolute -bottom-1 -right-1">
                            <OnlineStatusIndicator isOnline={isOnline} size="md" />
                          </div>
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
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-blue-600 text-[10px] font-black text-white rounded-full"
                              >
                                {room.unread_count}
                              </motion.span>
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
              <header className="h-[88px] flex items-center justify-between px-6 border-b border-slate-50 bg-white shrink-0">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentRoom(null)}
                    className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {(() => {
                    const other = getOtherParticipant(currentRoom);
                    const isOnline = other ? isUserOnline(other.id) : false;

                    let displayName = 'Veteran Member';
                    if (other) {
                      displayName = `${other.first_name} ${other.last_name}`.trim() || other.username;
                    } else if (currentRoom.name && currentRoom.name !== 'Conversation') {
                      displayName = currentRoom.name;
                    }

                    const initials = other
                      ? getInitials(other.first_name, other.last_name, other.username)
                      : displayName.slice(0, 2).toUpperCase();

                    return (
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-slate-100 font-bold shadow-sm whitespace-nowrap">
                            {initials}
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineStatusIndicator isOnline={isOnline} size="sm" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight">
                            {displayName}
                          </h3>
                          <div className="flex items-center mt-0.5">
                            <OnlineStatusIndicator isOnline={isOnline} size="sm" showLabel />
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
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-[0.98]"
              >
                <div className="flex justify-center mb-8">
                  <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] shadow-sm">
                    <ShieldCheck className="w-3 h-3 inline mr-1.5" />
                    Secured Chat
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {messages.map((message, idx) => {
                    const isOwn = message.sender.id === user?.id;
                    const showAvatar = idx === 0 || messages[idx - 1].sender.id !== message.sender.id;
                    const isFailed = message.status === 'failed';

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
                              ? isFailed
                                ? 'bg-red-50 border border-red-200 text-red-900 rounded-br-none'
                                : 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700 hover:shadow-md'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none hover:border-slate-200 shadow-slate-200/50 hover:shadow-md'
                              }`}
                          >
                            <p className="leading-relaxed font-medium break-words">{message.content}</p>
                            
                            {/* Retry button for failed messages */}
                            {isFailed && isOwn && (
                              <button
                                onClick={() => handleRetryMessage(message)}
                                className="mt-2 flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 font-semibold"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Retry</span>
                              </button>
                            )}

                            <div className={`absolute bottom-0 -right-8 opacity-0 group-hover/msg:opacity-100 transition-opacity pointer-events-none`}>
                              <Smile className="w-4 h-4 text-slate-300" />
                            </div>
                          </div>

                          <div className="flex items-center mt-1.5 space-x-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {formatTimeAgo(message.created_at)}
                            </span>
                            {isOwn && message.status && (
                              <MessageStatusIcon status={message.status} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing Indicator */}
                {currentTypingUser && (
                  <TypingIndicator username={currentTypingUser} className="ml-12" />
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Container */}
              <footer className="p-6 bg-white border-t border-slate-50 shrink-0">
                <div className="bg-slate-50 p-2 rounded-[24px] border border-slate-100/50 focus-within:bg-white focus-within:shadow-2xl focus-within:shadow-blue-500/5 focus-within:border-blue-500/30 transition-all duration-300">
                  <div className="flex items-end space-x-2">
                    <button className="p-3 text-slate-400 hover:text-blue-600 rounded-full transition-colors hover:bg-blue-50">
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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
                      <button className="p-2.5 text-slate-400 hover:text-blue-600 rounded-full transition-colors hover:bg-blue-50">
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className={`p-3.5 rounded-2xl shadow-lg transition-all flex items-center justify-center ${messageText.trim()
                          ? 'bg-blue-600 text-white shadow-blue-200 hover:shadow-blue-300'
                          : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                          }`}
                      >
                        <Send className="w-5 h-5" />
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
                    following.map((person) => {
                      const isOnline = isUserOnline(person.id);
                      return (
                        <button
                          key={person.id}
                          onClick={() => handleStartNewChat(person.id)}
                          className="w-full flex items-center space-x-4 p-4 hover:bg-blue-50/50 rounded-2xl transition-all border border-transparent hover:border-blue-100 group"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-slate-800 text-white rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 transition-colors">
                              {getInitials(person.first_name, person.last_name, person.username)}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5">
                              <OnlineStatusIndicator isOnline={isOnline} size="sm" />
                            </div>
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
                      );
                    })
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
