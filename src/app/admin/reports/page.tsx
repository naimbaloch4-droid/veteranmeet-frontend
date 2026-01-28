'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import {
  Flag,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  User,
  X
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import { useToastStore } from '@/store/useToastStore';

interface Report {
  id: number;
  reporter: {
    id: number;
    username: string;
    email: string;
  };
  reported_user?: {
    id: number;
    username: string;
    email: string;
  };
  reported_content_type?: string;
  reported_content_id?: number;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export default function Reports() {
  const { success, error: showError } = useToastStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const mockReports: Report[] = [
        {
          id: 1,
          reporter: { id: 2, username: 'john_veteran', email: 'john@example.com' },
          reported_user: { id: 5, username: 'spam_user', email: 'spam@example.com' },
          reported_content_type: 'post',
          reported_content_id: 123,
          reason: 'spam',
          description: 'This user is posting promotional content repeatedly',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          reporter: { id: 3, username: 'sarah_vet', email: 'sarah@example.com' },
          reported_user: { id: 6, username: 'offensive_user', email: 'offensive@example.com' },
          reported_content_type: 'comment',
          reported_content_id: 456,
          reason: 'harassment',
          description: 'Offensive language and personal attacks in comments',
          status: 'reviewed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          reporter: { id: 4, username: 'mike_vet', email: 'mike@example.com' },
          reported_user: { id: 7, username: 'fake_profile', email: 'fake@example.com' },
          reported_content_type: 'profile',
          reported_content_id: 789,
          reason: 'fake_account',
          description: 'Impersonating a veteran organization',
          status: 'resolved',
          created_at: new Date(Date.now() - 172800000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      
      setReports(mockReports);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReportStatus = async (reportId: number, newStatus: Report['status']) => {
    try {
      setReports(reports.map(report =>
        report.id === reportId ? { ...report, status: newStatus } : report
      ));
      setShowDetailModal(false);
      success('Report status updated successfully');
    } catch (err: any) {
      console.error('Failed to update report:', err);
      showError('Failed to update report status');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      setReports(reports.filter(r => r.id !== reportId));
      success('Report deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete report:', err);
      showError('Failed to delete report');
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.reporter.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'dismissed':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getReasonLabel = (reason: string) => {
    return reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-gray-800 rounded-xl shadow-lg">
            <Flag className="w-7 h-7 text-gray-100" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Moderation</h1>
            <p className="text-gray-600 mt-1">Review and manage user reports</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 section-spacing">
          <StatCard
            icon={AlertTriangle}
            label="Pending"
            value={reports.filter(r => r.status === 'pending').length}
            iconBgColor="bg-yellow-50"
            iconColor="text-yellow-600"
            borderColor="border-yellow-100"
          />
          <StatCard
            icon={Eye}
            label="Reviewed"
            value={reports.filter(r => r.status === 'reviewed').length}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
            borderColor="border-blue-100"
            delay={0.05}
          />
          <StatCard
            icon={CheckCircle}
            label="Resolved"
            value={reports.filter(r => r.status === 'resolved').length}
            iconBgColor="bg-green-50"
            iconColor="text-green-600"
            borderColor="border-green-100"
            delay={0.1}
          />
          <StatCard
            icon={Flag}
            label="Total"
            value={reports.length}
            iconBgColor="bg-gray-50"
            iconColor="text-gray-600"
            borderColor="border-gray-100"
            delay={0.15}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 section-spacing">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
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

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className={`badge ${getStatusColor(report.status)}`}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </span>
                  <span className="badge bg-red-50 text-red-700 border-red-200">
                    {getReasonLabel(report.reason)}
                  </span>
                  {report.reported_content_type && (
                    <span className="badge bg-purple-50 text-purple-700 border-purple-200">
                      {report.reported_content_type}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reporter</p>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">@{report.reporter.username}</span>
                    </div>
                  </div>
                  {report.reported_user && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reported User</p>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-red-400" />
                        <span className="text-sm font-medium text-gray-900">@{report.reported_user.username}</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-700 mb-3 leading-relaxed">{report.description}</p>

                <p className="text-sm text-gray-500">
                  Reported: {new Date(report.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedReport(report);
                    setShowDetailModal(true);
                  }}
                  className="icon-btn text-blue-600 hover:bg-blue-50"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteReport(report.id)}
                  className="icon-btn text-red-600 hover:bg-red-50"
                  title="Delete Report"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Flag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reports found</p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="icon-btn text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</h3>
                <span className={`badge ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reason</h3>
                <span className="badge bg-red-50 text-red-700 border-red-200">
                  {getReasonLabel(selectedReport.reason)}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-gray-900 leading-relaxed">{selectedReport.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reporter</h3>
                  <p className="text-gray-900 font-medium">@{selectedReport.reporter.username}</p>
                  <p className="text-sm text-gray-500">{selectedReport.reporter.email}</p>
                </div>
                {selectedReport.reported_user && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Reported User</h3>
                    <p className="text-gray-900 font-medium">@{selectedReport.reported_user.username}</p>
                    <p className="text-sm text-gray-500">{selectedReport.reported_user.email}</p>
                  </div>
                )}
              </div>

              {selectedReport.reported_content_type && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Content Type</h3>
                  <p className="text-gray-900">{selectedReport.reported_content_type} (ID: {selectedReport.reported_content_id})</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Created</h3>
                  <p className="text-gray-900">{new Date(selectedReport.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Updated</h3>
                  <p className="text-gray-900">{new Date(selectedReport.updated_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'reviewed')}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'resolved')}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-sm"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => handleUpdateReportStatus(selectedReport.id, 'dismissed')}
                    className="px-4 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all font-medium shadow-sm"
                  >
                    Dismiss Report
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
