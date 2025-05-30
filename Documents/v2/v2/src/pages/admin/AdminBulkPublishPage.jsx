import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { X, Package, Check, AlertCircle } from 'lucide-react';

const AdminBulkPublishPage = ({ onClose, onComplete }) => {
  console.log('🚀 AdminBulkPublishPage rendering');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  // Initialize with cached value or fallback
  const getCachedConversionRate = () => {
    try {
      const cached = localStorage.getItem('conversionRate');
      return cached ? parseFloat(cached) : 400;
    } catch {
      return 400;
    }
  };
  
  const [conversionRate, setConversionRate] = useState(getCachedConversionRate());
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all'
  });
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  
  const itemsPerPage = 50;

  // Fetch categories and conversion rate
  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        // Create a map of category name to category object for easy lookup
        const categoryMap = {};
        response.categories.forEach(cat => {
          categoryMap[cat.name] = cat;
        });
        setCategories(categoryMap);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchConversionRate = async () => {
    try {
      console.log('🔄 AdminBulkPublishPage: Loading conversion rate...');
      const response = await apiService.getConversionRate();
      console.log('💱 AdminBulkPublishPage: Conversion rate response:', response);
      if (response.success && response.conversionRate) {
        setConversionRate(response.conversionRate);
        // Cache in localStorage for faster loading
        localStorage.setItem('conversionRate', response.conversionRate.toString());
        console.log('✅ AdminBulkPublishPage: Conversion rate set to:', response.conversionRate);
      } else {
        // Fallback to database default
        console.log('⚠️ AdminBulkPublishPage: No conversion rate in response, using fallback');
        setConversionRate(400);
      }
    } catch (err) {
      console.error('❌ AdminBulkPublishPage: Error fetching conversion rate:', err);
      // Fallback to database default
      setConversionRate(400);
    }
  };

  // Calculate admin price using the formula: ((base price × margin) + shipping fee) × conversion rate
  const calculateAdminPrice = (basePrice, categoryName) => {
    if (!conversionRate || conversionRate === 0) return '⏳'; // Return loading if conversion rate not loaded
    
    const category = categories[categoryName];
    if (category) {
      const margin = parseFloat(category.defaultMargin || 0) / 100;
      const shippingFee = parseFloat(category.shippingFee || 0);
      const adminPrice = ((basePrice * (1 + margin)) + shippingFee) * conversionRate;
      return adminPrice.toFixed(2);
    }
    // Default calculation with 20% margin if category not found
    return ((basePrice * 1.2) * conversionRate).toFixed(2);
  };

  // Calculate selling price based on category margin (for display purposes)
  const calculateSellingPrice = (adminPrice, categoryName) => {
    const category = categories[categoryName];
    if (category && category.defaultMargin) {
      const margin = parseFloat(category.defaultMargin) / 100;
      return (adminPrice * (1 + margin)).toFixed(2);
    }
    // Default 20% margin if category not found
    return (adminPrice * 1.2).toFixed(2);
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await apiService.getProducts();
      if (response.success) {
        setProducts(response.products || []);
        console.log(`Fetched ${response.products?.length || 0} products`);
      } else {
        setError('Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(`Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle product publish status
  const togglePublish = async (productId, currentStatus) => {
    try {
      const response = await apiService.updateProduct(productId, { 
        published: !currentStatus 
      });
      
      if (response.success) {
        // Update local state
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, published: !currentStatus } : p
        ));
        
        // Notify parent component
        if (onComplete) {
          onComplete();
        }
      }
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  // Delete product
  const deleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiService.deleteProduct(productId);
        
        if (response.success) {
          setProducts(prev => prev.filter(p => p.id !== productId));
          
          // Notify parent component
          if (onComplete) {
            onComplete();
          }
        } else {
          alert('Failed to delete product');
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product');
      }
    }
  };

  // Toggle individual product selection
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Toggle select all on current page
  const toggleSelectAll = () => {
    const currentPageProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
    );
    
    const currentPageIds = currentPageProducts.map(p => p.id);
    const allCurrentSelected = currentPageIds.every(id => selectedProducts.includes(id));
    
    if (allCurrentSelected) {
      setSelectedProducts(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedProducts(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  // Handle bulk publish/unpublish
  const handleBulkAction = async (publishStatus) => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      setProcessing(true);
      let successCount = 0;
      let errorCount = 0;

      for (const productId of selectedProducts) {
        try {
          const response = await apiService.updateProduct(productId, { 
            published: publishStatus 
          });
          
          if (response.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`Error updating product ${productId}:`, err);
          errorCount++;
        }
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        selectedProducts.includes(p.id) ? { ...p, published: publishStatus } : p
      ));
      
      setResults({
        total: selectedProducts.length,
        success: successCount,
        errors: errorCount,
        action: publishStatus ? 'published' : 'unpublished'
      });

      setSelectedProducts([]);
      
      // Notify parent component
      if (onComplete) {
        onComplete();
      }

    } catch (err) {
      console.error('Bulk action error:', err);
      setError('Failed to update products');
    } finally {
      setProcessing(false);
    }
  };

  // Close modal
  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchConversionRate();
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.status === 'published' && !product.published) return false;
    if (filters.status === 'draft' && product.published) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const categoryOptions = Object.keys(categories);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <AlertCircle size={48} style={{ margin: '0 auto 16px', color: '#dc2626' }} />
          <h2 style={{ color: '#dc2626', marginBottom: '16px' }}>Error Loading Products</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '95%',
        maxWidth: '1400px',
        height: '95%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px 12px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#111827', fontSize: '24px', fontWeight: '700' }}>
              🚀 Bulk Product Management
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Manage product publishing status and pricing with automatic calculations
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', marginBottom: '16px' }}>
            {/* Filters */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Category Filter
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Categories</option>
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Status Filter
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'end' }}>
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Total: {filteredProducts.length} products
              </div>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1d4ed8' }}>
                {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleBulkAction(true)}
                  disabled={processing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: processing ? '#6c757d' : '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {processing ? 'Publishing...' : `📥 Publish (${selectedProducts.length})`}
                </button>
                <button
                  onClick={() => handleBulkAction(false)}
                  disabled={processing}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: processing ? '#6c757d' : '#d97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {processing ? 'Unpublishing...' : `📤 Unpublish (${selectedProducts.length})`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '40px' }}>
                    <input 
                      type="checkbox"
                      onChange={toggleSelectAll}
                      checked={paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProducts.includes(p.id))}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '60px' }}>Image</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Product</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Brand</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Base Price</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Admin Price</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map(product => (
                  <tr 
                    key={product.id} 
                    style={{ 
                      backgroundColor: selectedProducts.includes(product.id) ? '#e3f2fd' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                      <input 
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            objectFit: 'contain',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb'
                          }} 
                        />
                      ) : (
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          backgroundColor: '#f3f4f6',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Package size={20} style={{ color: '#9ca3af' }} />
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                      <div style={{ fontWeight: 'bold', color: '#111827' }}>{product.name}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Stock: {product.stock || 0}</div>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.category}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{product.brand || 'N/A'}</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'right' }}>
                      £{(product.basePrice || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                      LKR {calculateAdminPrice(product.basePrice || 0, product.category)}
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: product.published ? '#d1fae5' : '#fef3c7',
                        color: product.published ? '#065f46' : '#92400e'
                      }}>
                        {product.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePublish(product.id, product.published);
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            backgroundColor: product.published ? '#fef3c7' : '#d1fae5',
                            color: product.published ? '#92400e' : '#065f46',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {product.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProduct(product.id);
                          }}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '12px'
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{
                padding: '8px 12px',
                border: '1px solid #2563eb',
                borderRadius: '6px',
                backgroundColor: '#2563eb',
                color: 'white'
              }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f8f9fa',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {results ? (
            <div style={{ color: '#059669', fontSize: '14px', fontWeight: '500' }}>
              ✅ {results.action} {results.success} of {results.total} products
              {results.errors > 0 && ` (${results.errors} errors)`}
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBulkPublishPage;