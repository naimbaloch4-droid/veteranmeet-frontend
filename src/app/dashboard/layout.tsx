'use client';

import { useState, useEffect } from 'react';
import './notifications.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Users,
  Shield,
  BookOpen,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  Star,
  UserCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout, getUser } from '@/lib/auth';
import ToastContainer from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import NotificationSettings from '@/components/NotificationSettings';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useHeartbeat } from '@/hooks/useHeartbeat';
import { useChatStore } from '@/store/useChatStore';
import { useMessageNotifications } from '@/hooks/useMessageNotifications';
import MessageNotification from '@/components/MessageNotification';

const veteranNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Community Feed',
    href: '/dashboard/feed',
    icon: MessageSquare,
  },
  {
    name: 'Events',
    href: '/dashboard/events',
    icon: Calendar,
  },
  {
    name: 'Support Groups',
    href: '/dashboard/groups',
    icon: Shield,
  },
  {
    name: 'Connections',
    href: '/dashboard/connections',
    icon: Users,
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: Bell,
  },
  {
    name: 'Resources',
    href: '/dashboard/resources',
    icon: BookOpen,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const pathname = usePathname();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const { confirm } = useConfirmStore();
  const { rooms, fetchRooms, setCurrentRoom } = useChatStore();
  const [newMessageNotification, setNewMessageNotification] = useState<{
    show: boolean;
    senderName: string;
    messagePreview: string;
    roomId?: number;
  }>({ show: false, senderName: '', messagePreview: '' });

  // Keep user's online status active by sending periodic heartbeats
  // This updates the last_activity field on the backend every 2 minutes
  useHeartbeat();

  // Fetch chat rooms to get unread counts
  useEffect(() => {
    if (user) {
      fetchRooms();
      // Poll for updates every 10 seconds to keep unread count fresh
      const interval = setInterval(() => {
        fetchRooms();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Only re-run when user ID changes (login/logout), not on every store update

  // Calculate total unread messages
  const totalUnreadMessages = rooms.reduce((total, room) => total + (room.unread_count || 0), 0);

  // Enable comprehensive notifications (tab title, sound, desktop)
  useMessageNotifications(totalUnreadMessages, {
    enableSound: true,
    enableDesktopNotifications: true,
    enableTabTitleNotifications: true,
  });

  // Show toast notification for new messages when NOT on messages page
  useEffect(() => {
    if (!user || pathname === '/dashboard/messages') return;

    // Check for new messages in any room
    rooms.forEach(room => {
      if (room.unread_count && room.unread_count > 0 && room.last_message) {
        // Get the other participant
        const other = room.participants?.find((p: any) => p.id !== user.id);
        
        // Only show notification for messages not sent by current user
        if (other && room.last_message.sender.id !== user.id) {
          const senderName = `${other.first_name} ${other.last_name}`.trim() || other.username;
          
          // Create unique key for this notification
          const notificationKey = `${room.id}-${room.last_message.id}`;
          const lastShownNotification = sessionStorage.getItem('lastGlobalNotification');
          
          // Only show if we haven't shown this message before
          if (lastShownNotification !== notificationKey) {
            setNewMessageNotification({
              show: true,
              senderName,
              messagePreview: room.last_message.content,
              roomId: room.id
            });

            sessionStorage.setItem('lastGlobalNotification', notificationKey);

            // Auto-hide after 6 seconds
            setTimeout(() => {
              setNewMessageNotification((prev) => ({ ...prev, show: false }));
            }, 6000);
            
            // Only show one notification at a time
            return;
          }
        }
      }
    });
  }, [rooms, user, pathname]);

  const handleLogout = () => {
    confirm({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout? You will need to sign in again to access your account.',
      confirmText: 'Logout',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: () => {
        logout();
      }
    });
  };

  return (
    <ProtectedRoute>
      <>
        <ToastContainer />
        <ConfirmDialog />
        <NotificationSettings 
          isOpen={notificationSettingsOpen}
          onClose={() => setNotificationSettingsOpen(false)}
        />
        
        {/* Global Message Notification - shows on all dashboard pages except messages page */}
        {pathname !== '/dashboard/messages' && (
          <MessageNotification
            show={newMessageNotification.show}
            senderName={newMessageNotification.senderName}
            messagePreview={newMessageNotification.messagePreview}
            onClose={() => setNewMessageNotification((prev) => ({ ...prev, show: false }))}
            onClick={() => {
              // Navigate to messages page and open the specific room
              if (newMessageNotification.roomId) {
                const room = rooms.find(r => r.id === newMessageNotification.roomId);
                if (room) {
                  setCurrentRoom(room);
                }
                window.location.href = '/dashboard/messages';
              }
              setNewMessageNotification((prev) => ({ ...prev, show: false }));
            }}
          />
        )}
        
        <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
          </div>
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 shadow-2xl transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
          <div className="flex flex-col h-screen">
            {/* Logo */}
            <div className="flex items-center justify-center h-20 px-4 bg-gray-950 border-b border-gray-800">
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-xl">
                  <Shield className="w-6 h-6 text-gray-100" />
                </div>
                <span className="text-xl font-bold text-gray-100 tracking-wide">Veteran Hub</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {veteranNavItems.map((item) => {
                const isActive = pathname === item.href;
                const isMessages = item.href === '/dashboard/messages';
                const showBadge = isMessages && totalUnreadMessages > 0;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gray-800 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`p-1.5 rounded-lg relative ${
                      isActive ? 'bg-gray-700' : 'bg-gray-800 group-hover:bg-gray-700'
                    }`}>
                      <item.icon className="w-4 h-4" />
                      {showBadge && (
                        <>
                          {/* Pulsing ring effect for emphasis */}
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500/30 rounded-full animate-ping"></span>
                          {/* Solid dot */}
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900 shadow-lg shadow-red-500/50"></span>
                        </>
                      )}
                    </div>
                    <span className={`ml-3 flex-1 ${showBadge ? 'font-extrabold' : ''}`}>
                      {item.name}
                      {showBadge && (
                        <span className="block text-[10px] font-bold text-red-400 mt-0.5">
                          {totalUnreadMessages} unread
                        </span>
                      )}
                    </span>
                    {showBadge && (
                      <motion.span
                        key={totalUnreadMessages}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center justify-center min-w-[22px] h-[22px] px-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-[11px] font-black rounded-full shadow-lg shadow-red-500/40 ring-2 ring-red-400/30"
                      >
                        {totalUnreadMessages > 99 ? '99+' : totalUnreadMessages}
                      </motion.span>
                    )}
                    {/* Glow effect when active and has unread */}
                    {showBadge && !isActive && (
                      <div className="absolute inset-0 bg-red-500/5 rounded-xl pointer-events-none" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Notification Settings & Logout */}
            <div className="p-3 border-t border-gray-800 space-y-1">
              <button
                onClick={() => setNotificationSettingsOpen(true)}
                className="flex items-center w-full px-4 py-3.5 text-sm font-medium text-gray-400 rounded-xl hover:bg-gray-800/50 hover:text-gray-100 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-lg bg-gray-800 group-hover:bg-gray-700">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="ml-3">Notifications</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3.5 text-sm font-medium text-gray-400 rounded-xl hover:bg-red-900/20 hover:text-red-400 transition-all duration-200 group"
              >
                <div className="p-1.5 rounded-lg bg-gray-800 group-hover:bg-red-900/30">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="ml-3">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col lg:ml-64">
          {/* Top bar */}
          <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-4 ml-auto">
                <Link href="/dashboard/messages" className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all group">
                  <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  {totalUnreadMessages > 0 && (
                    <>
                      {/* Animated ring for attention */}
                      <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500/40 rounded-full animate-ping"></span>
                      {/* Badge with enhanced styling */}
                      <motion.span
                        key={totalUnreadMessages}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/50 ring-2 ring-white"
                      >
                        {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                      </motion.span>
                    </>
                  )}
                </Link>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {user?.is_veteran ? 'Veteran' : 'Member'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-sm font-medium text-gray-100">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
      </>
    </ProtectedRoute>
  );
}
