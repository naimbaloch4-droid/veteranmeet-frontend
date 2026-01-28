'use client';

import { useState } from 'react';
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
import { useConfirmStore } from '@/store/useConfirmStore';

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
  const pathname = usePathname();
  const user = typeof window !== 'undefined' ? getUser() : null;
  const { confirm } = useConfirmStore();

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
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-gray-800 text-white shadow-lg'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      isActive ? 'bg-gray-700' : 'bg-gray-800 group-hover:bg-gray-700'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-800">
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
                <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
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
