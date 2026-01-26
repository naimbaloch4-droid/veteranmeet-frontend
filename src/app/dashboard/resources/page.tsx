'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResourceStore } from '@/store/useResourceStore';
import ResourceCard from '@/components/ResourceCard';
import { getUser } from '@/lib/auth';

export default function ResourcesPage() {
  const {
    resources,
    categories,
    loading,
    fetchResources,
    fetchCategories,
    createResource,
    deleteResource
  } = useResourceStore();

  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | null>(null);
  const [showCreateResource, setShowCreateResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    url: '',
    category: 1,
    contact_info: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
    fetchResources();
    fetchCategories();
  }, [fetchResources, fetchCategories]);

  const handleCreateResource = async () => {
    setFormError('');
    
    if (!resourceForm.title || !resourceForm.description) {
      setFormError('Title and description are required');
      return;
    }

    try {
      await createResource(resourceForm);
      setResourceForm({
        title: '',
        description: '',
        url: '',
        category: 1,
        contact_info: ''
      });
      setShowCreateResource(false);
      fetchResources();
    } catch (error: any) {
      console.error('Failed to create resource:', error);
      setFormError(error.response?.data?.detail || 'Failed to create resource');
    }
  };

  const filteredResources = (Array.isArray(resources) ? resources : []).filter(resource => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === null || resource.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="admin-page-container page-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <BookOpen className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
              <p className="text-gray-600 mt-1">VA resources, guides, and helpful links</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCreateResource(true)}
            className="flex items-center px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit Resource
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <button
            onClick={() => fetchResources()}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {categories.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                filterCategory === null
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilterCategory(category.id)}
                className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
                  filterCategory === category.id
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resources Grid */}
      {loading && resources.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading resources...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              currentUserId={user?.id}
              onDelete={deleteResource}
              showActions={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No resources found</h2>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterCategory !== null 
              ? 'Try adjusting your filters' 
              : 'Be the first to submit a resource'}
          </p>
        </div>
      )}

      {/* Create Resource Modal */}
      <AnimatePresence>
        {showCreateResource && (
          <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Resource</h3>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="VA Home Loan Guide 2026"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Step-by-step PDF guide for first-time buyers..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL (Optional)</label>
                    <input
                      type="url"
                      value={resourceForm.url}
                      onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="https://va.gov/resources/..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={resourceForm.category}
                        onChange={(e) => setResourceForm({ ...resourceForm, category: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      >
                        {categories.length > 0 ? (
                          categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))
                        ) : (
                          <option value={1}>General</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info (Optional)</label>
                      <input
                        type="text"
                        value={resourceForm.contact_info}
                        onChange={(e) => setResourceForm({ ...resourceForm, contact_info: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="1-800-XXX-XXXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowCreateResource(false);
                      setFormError('');
                    }}
                    className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateResource}
                    className="px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-lg"
                  >
                    Submit Resource
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
