import { useState, useEffect } from 'react';
import apiService from '../../services/api.js';
import { Plus, Edit2, Power, Trash2, X, FolderTree, Package, Hash, FileText, DollarSign, Layers, SortAsc } from 'lucide-react';
import '../../styles/theme.css';
import '../../styles/category-modal.css';
import '../../styles/admin-category.css';

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
    shippingFee: 0,
    isActive: true,
    sortOrder: 0,
    parentId: null
  });
  const [parentCategories, setParentCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('🔄 Loading categories...');
      setLoading(true);
      const [categoriesResponse, hierarchyResponse] = await Promise.all([
        apiService.getCategories(true), // Include inactive, flat list
        apiService.getCategoriesHierarchy(true) // Include inactive, hierarchical
      ]);
      
      console.log('📋 Categories response:', categoriesResponse);
      console.log('🌳 Hierarchy response:', hierarchyResponse);
      
      if (categoriesResponse.success) {
        // Flatten hierarchical structure for display while preserving hierarchy info
        const flattenedCategories = flattenHierarchy(hierarchyResponse.categories);
        console.log('📊 Flattened categories count:', flattenedCategories.length);
        setCategories(flattenedCategories);
        setParentCategories(categoriesResponse.categories.filter(cat => !cat.parentId)); // Root categories for parent dropdown
        console.log('✅ Categories loaded successfully');
      } else {
        console.error('❌ Categories response not successful:', categoriesResponse);
      }
    } catch (error) {
      console.error('❌ Failed to load categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const flattenHierarchy = (categories, level = 0) => {
    let flattened = [];
    
    categories.forEach(category => {
      const categoryWithLevel = { ...category, level };
      flattened.push(categoryWithLevel);
      
      if (category.children && category.children.length > 0) {
        flattened = flattened.concat(flattenHierarchy(category.children, level + 1));
      }
    });
    
    return flattened;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;
    
    // Convert numeric fields to numbers
    if (name === 'parentId') {
      processedValue = value === '' ? null : parseInt(value);
    } else if (name === 'defaultMargin' || name === 'sortOrder') {
      processedValue = value === '' ? 0 : parseInt(value);
    } else if (name === 'shippingFee') {
      processedValue = value === '' ? 0 : parseFloat(value);
    }
    
    console.log('📝 Form input changed:', { name, originalValue: value, processedValue, type, checked });
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [name]: processedValue
      };
      console.log('📋 Updated form data:', newFormData);
      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Enhanced debugging
      console.log('=== CATEGORY UPDATE DEBUG ===');
      console.log('Form submitted with data:', formData);
      console.log('Editing category:', editingCategory);
      console.log('Editing category ID:', editingCategory?.id);
      console.log('Current user token:', localStorage.getItem('auth_token'));
      console.log('API service token:', apiService.token);
      
      let response;
      if (editingCategory) {
        console.log('Calling updateCategory with ID:', editingCategory.id, 'and data:', formData);
        response = await apiService.updateCategory(editingCategory.id, formData);
        console.log('Update response received:', response);
      } else {
        console.log('Calling createCategory with data:', formData);
        response = await apiService.createCategory(formData);
        console.log('Create response received:', response);
      }

      if (response && response.success) {
        console.log('✅ Category operation successful, reloading categories...');
        await loadCategories();
        setShowModal(false);
        resetForm();
        setError(null);
        console.log('✅ Modal closed and form reset');
        
        // Notify other pages that categories have been updated
        window.postMessage('categories-updated', '*');
        console.log('📡 Sent categories-updated message');
      } else {
        console.error('❌ API returned error response:', response);
        setError(response?.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('❌ Exception during category save:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setError(error.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    console.log('✏️ Editing category:', category);
    setEditingCategory(category);
    const formDataToSet = {
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      defaultMargin: parseInt(category.defaultMargin) || 20,
      shippingFee: parseFloat(category.shippingFee) || 0,
      isActive: category.isActive,
      sortOrder: parseInt(category.sortOrder) || 0,
      parentId: category.parentId || null
    };
    console.log('📝 Setting form data:', formDataToSet);
    setFormData(formDataToSet);
    setShowModal(true);
    console.log('🔓 Modal opened for editing');
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
      shippingFee: 0,
      isActive: true,
      sortOrder: 0,
      parentId: null
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
        <div className="dashboard-header" style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="dashboard-title">Category Management</h1>
          <p className="dashboard-subtitle">Loading categories...</p>
        </div>
        <div className="dashboard-content">
          <div className="card">
            <div className="table-loading">
              <span>Loading categories...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          gap: 'var(--space-4)'
        }}>
          <div style={{ flex: 1 }}>
            <h1 className="dashboard-title">Category Management</h1>
            <p className="dashboard-subtitle">Manage product categories and their settings</p>
          </div>
          <button
            onClick={openCreateModal}
            style={{ 
              padding: '10px 20px',
              backgroundColor: 'rgb(132, 169, 140)',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              marginTop: 'var(--space-2)',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-content">
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-4)' }}>
            {error}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Categories ({categories.length})</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}><Package size={16} /></th>
                    <th style={{ minWidth: '200px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FolderTree size={16} /> Name</span></th>
                    <th style={{ minWidth: '150px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={16} /> Parent</span></th>
                    <th style={{ minWidth: '250px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={16} /> Description</span></th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Margin %</th>
                    <th style={{ width: '120px', textAlign: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><DollarSign size={16} /> Shipping</span></th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '80px', textAlign: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}><SortAsc size={16} /></span></th>
                    <th style={{ width: '200px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="table-empty">
                        No categories found. Click "Add New Category" to create one.
                      </td>
                    </tr>
                  ) : (
                    categories.map(category => {
                      const parentCategory = categories.find(cat => cat.id === category.parentId);
                      const indentLevel = category.level || 0;
                    
                    return (
                      <tr key={category.id}>
                        <td style={{ textAlign: 'center', fontSize: '1.5rem' }}>{category.icon || '📦'}</td>
                        <td style={{ 
                          paddingLeft: `${indentLevel * 24 + 16}px`,
                          fontWeight: indentLevel === 0 ? '600' : '400'
                        }}>
                          {indentLevel > 0 && <span style={{ color: 'var(--text-secondary)' }}>└─ </span>}
                          {category.name}
                        </td>
                        <td style={{ color: parentCategory ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {parentCategory ? parentCategory.name : '-'}
                        </td>
                        <td style={{ color: category.description ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                          {category.description || '-'}
                        </td>
                        <td style={{ textAlign: 'center' }}>{category.defaultMargin}%</td>
                        <td style={{ textAlign: 'center' }}>£{category.shippingFee || 0}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: category.isActive ? '#4CAF50' : '#f44336'
                          }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>{category.sortOrder}</td>
                      <td>
                        <div style={{ 
                          display: 'flex', 
                          gap: 'var(--space-2)', 
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={() => handleEdit(category)}
                            className="btn btn-sm btn-outline"
                            title="Edit category"
                            style={{ padding: '6px 10px' }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(category.id)}
                            className={`btn btn-sm ${category.isActive ? 'btn-outline' : 'btn-secondary'}`}
                            title={category.isActive ? 'Deactivate category' : 'Activate category'}
                            style={{ padding: '6px 10px' }}
                          >
                            <Power size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="btn btn-sm btn-outline btn-error"
                            title="Delete category"
                            style={{ padding: '6px 10px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="category-modal">
            <button className="modal-close" onClick={() => setShowModal(false)}><X size={20} /></button>
            
            <div className="category-modal-header">
              <h2 className="category-modal-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="category-modal-subtitle">
                {editingCategory ? 'Update category information' : 'Create a new product category'}
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="category-modal-form">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="form-input"
                  placeholder="Brief description of the category"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="📱"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Default Margin (%)</label>
                  <input
                    type="number"
                    name="defaultMargin"
                    value={formData.defaultMargin}
                    onChange={handleInputChange}
                    min="0"
                    max="200"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Shipping Fee (£)</label>
                <input
                  type="number"
                  name="shippingFee"
                  value={formData.shippingFee}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parent Category</label>
                <select
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">None (Root Category)</option>
                  {parentCategories.filter(cat => !editingCategory || cat.id !== editingCategory.id).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleInputChange}
                    min="0"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-checkbox">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <span className="checkbox-label">Active Category</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCategoryManagementPage;