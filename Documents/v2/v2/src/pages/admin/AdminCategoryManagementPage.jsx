import { useState, useEffect } from 'react';
import apiService from '../../services/api.js';
import '../../styles/theme.css';

const AdminCategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    defaultMargin: 20,
    isActive: true,
    sortOrder: 0
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories(true); // Include inactive
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingCategory) {
        response = await apiService.updateCategory(editingCategory.id, formData);
      } else {
        response = await apiService.createCategory(formData);
      }

      if (response.success) {
        await loadCategories();
        setShowModal(false);
        resetForm();
      } else {
        setError(response.message);
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      setError('Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      defaultMargin: category.defaultMargin,
      isActive: category.isActive,
      sortOrder: category.sortOrder
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (categoryId) => {
    try {
      const response = await apiService.toggleCategoryStatus(categoryId);
      if (response.success) {
        await loadCategories();
      }
    } catch (error) {
      console.error('Failed to toggle category status:', error);
      setError('Failed to update category status');
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const response = await apiService.deleteCategory(categoryId);
        if (response.success) {
          await loadCategories();
        }
      } catch (error) {
        console.error('Failed to delete category:', error);
        setError('Failed to delete category');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      defaultMargin: 20,
      isActive: true,
      sortOrder: 0
    });
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Category Management</h1>
          <p className="dashboard-subtitle">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="dashboard-title">Category Management</h1>
            <p className="dashboard-subtitle">Manage product categories and their settings</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            Add New Category
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0 var(--space-6)', marginBottom: 'var(--space-4)' }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            color: 'var(--error)'
          }}>
            {error}
          </div>
        </div>
      )}

      <div style={{ padding: '0 var(--space-6)' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Categories ({categories.length})</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Default Margin</th>
                    <th>Status</th>
                    <th>Sort Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td style={{ fontSize: '1.5rem' }}>{category.icon || '📦'}</td>
                      <td className="font-medium">{category.name}</td>
                      <td>{category.description || '-'}</td>
                      <td>{category.defaultMargin}%</td>
                      <td>
                        <span className={`badge ${category.isActive ? 'badge-success' : 'badge-error'}`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{category.sortOrder}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={() => handleEdit(category)}
                            className="btn btn-outline"
                            style={{ fontSize: '0.75rem', padding: 'var(--space-2) var(--space-3)' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(category.id)}
                            className={`btn ${category.isActive ? 'btn-outline' : 'btn-secondary'}`}
                            style={{ fontSize: '0.75rem', padding: 'var(--space-2) var(--space-3)' }}
                          >
                            {category.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="btn btn-outline"
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: 'var(--space-2) var(--space-3)',
                              color: 'var(--error)',
                              borderColor: 'var(--error)'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the category"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Icon (Emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="📱"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Default Margin (%)</label>
                  <input
                    type="number"
                    name="defaultMargin"
                    value={formData.defaultMargin}
                    onChange={handleInputChange}
                    min="0"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryManagementPage;