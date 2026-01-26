'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Flag,
  MessageSquare,
  BarChart3,
  Settings,
  Menu,
  X,
  Shield,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { logout } from '@/lib/auth';

const adminNavItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Content Moderation',
    href: '/admin/content',
    icon: MessageSquare,
  },
  {
    name: 'Support Groups',
    href: '/admin/support-groups',
    icon: Shield,
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: Flag,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <ProtectedRoute>
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
              <Link href="/admin/dashboard" className="flex items-center space-x-3">
                <div className="p-2 bg-gray-800 rounded-xl">
                  <Shield className="w-6 h-6 text-gray-100" />
                </div>
                <span className="text-xl font-bold text-gray-100 tracking-wide">Admin Panel</span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {adminNavItems.map((item) => {
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
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Administrator</p>
                  <p className="text-sm font-semibold text-gray-900">Admin User</p>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-gray-100" />
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
    </ProtectedRoute>
  );
}
