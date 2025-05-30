import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const AdminBulkPublishPage = () => {
  console.log('🚀 AdminBulkPublishPage rendering');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
        
        // Notify parent window if it's a popup
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage('products-updated', '*');
        }
      } else {
        alert('Failed to update product status');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert(`Failed to update product: ${err.message}`);
    }
  };
  
  // Check for auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    console.log('Auth token found:', !!token);
    
    if (!token) {
      setError('No authentication token found. Please log in as admin.');
      setLoading(false);
    } else {
      // Token exists, fetch products
      apiService.setToken(token);
      fetchProducts();
    }
  }, []);
  
  // Show loading state
  if (loading) {
    return (
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center'
      }}>
        <h2>🚀 Loading...</h2>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div style={{
        padding: '20px',
        background: '#f8f9fa',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center'
      }}>
        <h2>🚀 Bulk Product Management</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }
  
  return (
    <div style={{
      padding: '20px',
      background: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1>🚀 Bulk Product Management</h1>
        <p>Manage all products including imported CSV products.</p>
        <p>Total products loaded: {products.length}</p>
        <p>Current time: {new Date().toLocaleString()}</p>
        
        {/* Products Table */}
        <div style={{ marginTop: '2rem' }}>
          {products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>SKU</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 10).map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>{product.name}</td>
                      <td style={{ padding: '12px' }}>{product.sku}</td>
                      <td style={{ padding: '12px' }}>{product.category}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: product.published ? '#28a745' : '#dc3545'
                        }} />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button 
                          onClick={() => togglePublish(product.id, product.published)}
                          style={{
                            padding: '4px 8px',
                            margin: '0 2px',
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title={product.published ? 'Unpublish' : 'Publish'}
                        >
                          {product.published ? '📤' : '📥'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length > 10 && (
                <p style={{ marginTop: '1rem', color: '#666' }}>
                  Showing first 10 of {products.length} products
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBulkPublishPage;