import { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import CsvImporter from '../../components/CsvImporter';
import '../../styles/theme.css';

const AdminProductManagementPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stock: 'all'
  });
  
  // CSV Import state
  const [showCsvImporter, setShowCsvImporter] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getProducts();
      if (response.success) {
        // Transform products to match the component's expected format
        const transformedProducts = response.products.map(product => ({
          ...product,
          basePrice: product.adminPrice,
          finalPrice: product.adminPrice * 1.5, // Default markup
          status: product.published ? 'published' : 'draft'
        }));
        setProducts(transformedProducts);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await apiService.getActiveCategories();
      if (response.success) {
        setCategories(response.categories.map(cat => cat.name));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Categories are now fetched from API

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.stock === 'in-stock' && product.stock === 0) return false;
    if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
    return true;
  });

  const handleToggleStatus = async (productId) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newPublishedStatus = product.status !== 'published';
      
      const response = await apiService.updateProduct(productId, {
        published: newPublishedStatus
      });

      if (response.success) {
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, status: newPublishedStatus ? 'published' : 'draft', published: newPublishedStatus }
            : p
        ));
      } else {
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert(`Failed to update product status: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await apiService.deleteProduct(productId);
        
        if (response.success) {
          setProducts(prev => prev.filter(product => product.id !== productId));
        } else {
          throw new Error(response.message || 'Failed to delete product');
        }
      } catch (err) {
        console.error('Error deleting product:', err);
        alert(`Failed to delete product: ${err.message}`);
      }
    }
  };

  // CSV Import functionality
  const handleCsvImportComplete = (result) => {
    // Refresh products list after successful import
    fetchProducts();
    setShowCsvImporter(false);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary-medium)' }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
        <div style={{ fontSize: '2rem', color }}>{icon}</div>
      </div>
    </div>
  );

  const TabButton = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={isActive ? 'btn btn-primary' : 'btn btn-outline'}
      style={{ marginRight: 'var(--space-2)' }}
    >
      {children}
    </button>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Product Management</h1>
          <p className="dashboard-subtitle">Manage your product catalog, pricing, and inventory</p>
        </div>
      </div>

      <div style={{ padding: '0 var(--space-6)' }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--space-6)', 
          marginBottom: 'var(--space-6)' 
        }}>
          <StatCard
            title="Total Products"
            value={products.length}
            subtitle={`${products.filter(p => p.status === 'published').length} published`}
            icon="📦"
          />
          <StatCard
            title="Low Stock"
            value={products.filter(p => p.stock > 0 && p.stock <= 20).length}
            subtitle="Need restocking"
            icon="⚠️"
            color="var(--warning)"
          />
          <StatCard
            title="Out of Stock"
            value={products.filter(p => p.stock === 0).length}
            subtitle="Requires attention"
            icon="❌"
            color="var(--error)"
          />
          <StatCard
            title="Categories"
            value={categories.length}
            subtitle="Active categories"
            icon="📂"
          />
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <TabButton 
            isActive={activeTab === 'products'} 
            onClick={() => setActiveTab('products')}
          >
            📦 Product Catalog
          </TabButton>
          <TabButton 
            isActive={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')}
          >
            📂 Categories
          </TabButton>
          <TabButton 
            isActive={activeTab === 'pricing'} 
            onClick={() => setActiveTab('pricing')}
          >
            💰 Pricing Rules
          </TabButton>
          <TabButton 
            isActive={activeTab === 'bulk'} 
            onClick={() => setActiveTab('bulk')}
          >
            📊 Bulk Actions
          </TabButton>
        </div>

        {/* Product Catalog Tab */}
        {activeTab === 'products' && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Product Catalog</h3>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="btn btn-outline"
                    style={{ cursor: 'pointer', minWidth: '140px' }}
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="btn btn-outline"
                    style={{ cursor: 'pointer', minWidth: '120px' }}
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <select
                    value={filters.stock}
                    onChange={(e) => setFilters(prev => ({ ...prev, stock: e.target.value }))}
                    className="btn btn-outline"
                    style={{ cursor: 'pointer', minWidth: '120px' }}
                  >
                    <option value="all">All Stock</option>
                    <option value="in-stock">In Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Loading products...</p>
                </div>
              ) : error ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--error)' }}>{error}</p>
                  <button 
                    onClick={() => fetchProducts()}
                    className="btn btn-primary"
                    style={{ marginTop: 'var(--space-4)', cursor: 'pointer' }}
                  >
                    Retry
                  </button>
                </div>
              ) : (
              <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id}>
                      <td>
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            SKU: {product.sku} • {product.brand}
                          </div>
                          <div className="text-sm" style={{ color: 'var(--text-light)' }}>
                            {product.weight}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{product.category}</span>
                      </td>
                      <td>
                        <div>
                          <div className="font-semibold">${product.finalPrice.toFixed(2)}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Base: ${product.basePrice.toFixed(2)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          product.stock === 0 ? 'badge-error' :
                          product.stock <= 20 ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          product.status === 'published' ? 'badge-success' : 'badge-warning'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              console.log('Edit product coming soon');
                              alert('Edit Product feature coming soon!');
                            }}
                            className="btn btn-outline"
                            style={{
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 'var(--space-1) var(--space-3)'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product.id)}
                            className="btn btn-secondary"
                            style={{
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 'var(--space-1) var(--space-3)',
                              backgroundColor: product.status === 'published' ? 'var(--warning)' : 'var(--success)'
                            }}
                          >
                            {product.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="btn btn-secondary"
                            style={{
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: 'var(--space-1) var(--space-3)',
                              backgroundColor: 'var(--error)'
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

              {filteredProducts.length === 0 && (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No products found matching the current filters.
                </div>
              )}
              </>
              )}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Product Categories</h3>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Add category coming soon');
                    alert('Add Category feature coming soon!');
                  }}
                  className="btn btn-primary"
                  style={{ cursor: 'pointer' }}
                >
                  ➕ Add Category
                </button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
                {categories.map(category => {
                  const productCount = products.filter(p => p.category === category).length;
                  return (
                    <div key={category} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                          <h4 className="font-semibold">{category}</h4>
                          <span className="badge badge-info">{productCount}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                          {productCount} product{productCount !== 1 ? 's' : ''} in this category
                        </p>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Manage category coming soon');
                            alert('Manage Category feature coming soon!');
                          }}
                          className="btn btn-outline"
                          style={{ cursor: 'pointer', width: '100%' }}
                        >
                          Manage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Rules Tab */}
        {activeTab === 'pricing' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pricing Rules Configuration</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Configure default pricing rules for different product categories. These rules will be applied automatically to new products.
                </p>
              </div>
              
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Default Margin (%)</th>
                    <th>Default Tax (%)</th>
                    <th>Default Shipping ($)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.slice(0, 5).map(category => (
                    <tr key={category}>
                      <td className="font-semibold">{category}</td>
                      <td>25%</td>
                      <td>2%</td>
                      <td>$3.00</td>
                      <td>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Configure pricing coming soon');
                            alert('Configure Pricing feature coming soon!');
                          }}
                          className="btn btn-outline"
                          style={{
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: 'var(--space-1) var(--space-3)'
                          }}
                        >
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Actions Tab */}
        {activeTab === 'bulk' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Bulk Operations</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Import/Export</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                    
                    <button 
                      onClick={() => setShowCsvImporter(true)}
                      className="btn btn-primary"
                      style={{ cursor: 'pointer' }}
                    >
                      📊 Import Products from CSV
                    </button>
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          // Create a download link for the CSV
                          const token = localStorage.getItem('auth_token');
                          const response = await fetch('http://localhost:5001/api/products/export/csv', {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) {
                            throw new Error('Failed to export CSV');
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'products-export.csv';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (err) {
                          console.error('Error exporting CSV:', err);
                          alert('Failed to export CSV: ' + err.message);
                        }
                      }}
                      className="btn btn-outline"
                      style={{ cursor: 'pointer' }}
                    >
                      📋 Export Products to CSV
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Web scraping coming soon');
                        alert('Web Scraping feature coming soon!');
                      }}
                      className="btn btn-secondary"
                      style={{ cursor: 'pointer' }}
                    >
                      🕷️ Web Scraping Tool
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Bulk Actions</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Bulk update pricing coming soon');
                        alert('Bulk Update Pricing feature coming soon!');
                      }}
                      className="btn btn-outline"
                      style={{ cursor: 'pointer' }}
                    >
                      💰 Bulk Update Pricing
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Bulk update stock coming soon');
                        alert('Bulk Update Stock feature coming soon!');
                      }}
                      className="btn btn-outline"
                      style={{ cursor: 'pointer' }}
                    >
                      📦 Bulk Update Stock
                    </button>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Bulk publish coming soon');
                        alert('Bulk Publish/Unpublish feature coming soon!');
                      }}
                      className="btn btn-outline"
                      style={{ cursor: 'pointer' }}
                    >
                      🚀 Bulk Publish/Unpublish
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV Importer Modal */}
      {showCsvImporter && (
        <CsvImporter
          onImportComplete={handleCsvImportComplete}
          onClose={() => setShowCsvImporter(false)}
        />
      )}
    </div>
  );
};

export default AdminProductManagementPage;