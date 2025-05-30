import { useState, useEffect, useRef } from 'react';
import apiService from '../../services/api';
import CsvImporter from '../../components/CsvImporter';
import BulkPricingModal from '../../components/BulkPricingModal';
import BulkStockModal from '../../components/BulkStockModal';
import AdminBulkPublishPage from './AdminBulkPublishPage';
import ProductEditModal from '../../components/modals/ProductEditModal';
import '../../styles/theme.css';

const AdminProductManagementPage = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesWithPricing, setCategoriesWithPricing] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stock: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('name'); // 'name', 'category', 'price-low', 'price-high', 'stock-high', 'stock-low'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  // CSV Import state
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  
  // Bulk publish state
  const [showBulkPublish, setShowBulkPublish] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [unpublishedProducts, setUnpublishedProducts] = useState([]);
  
  // Bulk pricing state
  const [showBulkPricing, setShowBulkPricing] = useState(false);
  
  // Bulk stock state
  const [showBulkStock, setShowBulkStock] = useState(false);
  
  // Price recalculation state
  const [isRecalculatingPrices, setIsRecalculatingPrices] = useState(false);
  
  // Product edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Calculate final price based on category margin
  const calculateFinalPrice = (adminPrice, categoryName, categoriesWithPricingParam) => {
    // Use the parameter if provided, otherwise use the state
    const categoriesToUse = categoriesWithPricingParam || categoriesWithPricing;
    
    if (!adminPrice || !categoryName || !categoriesToUse?.length) {
      return adminPrice * 1.5; // Fallback to 50% markup
    }
    
    const category = categoriesToUse.find(cat => cat.name === categoryName);
    
    if (!category) {
      return adminPrice * 1.5; // Fallback to 50% markup
    }
    
    const margin = category.defaultMargin || 20; // Default to 20% if not set
    const shippingFee = category.shippingFee || 0;
    const finalPrice = (adminPrice * (1 + margin / 100)) + shippingFee;
    
    return finalPrice;
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📦 Fetching products from API...');
      const response = await apiService.getProducts();
      console.log('📦 API response:', response);
      if (response.success) {
        // Transform products to match the component's expected format
        const transformedProducts = response.products.map(product => {
          const calculatedFinalPrice = calculateFinalPrice(product.adminPrice, product.category, categoriesWithPricing);
          return {
            ...product,
            basePrice: product.adminPrice,
            finalPrice: calculatedFinalPrice,
            status: product.published ? 'published' : 'draft'
          };
        });
        
        setProducts(transformedProducts);
        
        // Force recalculation after products are set, in case categories were loaded after
        if (categoriesWithPricing.length > 0) {
          console.log('🔄 Force recalculating prices after products loaded...');
          setTimeout(() => {
            recalculateProductPrices();
          }, 100);
        } else {
          // If categories haven't loaded yet, try again in a moment
          setTimeout(() => {
            if (categoriesWithPricing.length > 0) {
              console.log('🔄 Delayed recalculation after categories loaded...');
              recalculateProductPrices();
            }
          }, 500);
        }
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
      console.log('📂 Fetching categories...');
      const response = await apiService.getActiveCategories();
      if (response.success) {
        console.log('📋 Categories fetched:', response.categories.length);
        console.log('🏷️ Sample categories with pricing:', response.categories.slice(0, 3).map(cat => ({
          name: cat.name,
          defaultMargin: cat.defaultMargin,
          shippingFee: cat.shippingFee
        })));
        
        setCategories(response.categories.map(cat => cat.name));
        setCategoriesWithPricing(response.categories); // Store full category data with pricing
        console.log('✅ Categories state updated');
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);
    }
  };

  // Recalculate all product prices when categories change
  const recalculateProductPrices = () => {
    console.log('🔄 recalculateProductPrices called:', {
      productsCount: products.length,
      categoriesCount: categoriesWithPricing.length
    });
    
    if (products.length > 0 && categoriesWithPricing.length > 0) {
      setIsRecalculatingPrices(true);
      console.log('📊 Recalculating prices for all products...');
      
      const updatedProducts = products.map(product => {
        const newFinalPrice = calculateFinalPrice(product.adminPrice, product.category, categoriesWithPricing);
        console.log(`📦 Product: ${product.name} | Old: £${product.finalPrice?.toFixed(2)} | New: £${newFinalPrice?.toFixed(2)}`);
        return {
          ...product,
          finalPrice: newFinalPrice
        };
      });
      
      // Force a completely fresh state update
      setProducts([]);
      setTimeout(() => {
        setProducts(updatedProducts);
        console.log('✅ Price recalculation completed with fresh state');
        console.log('📊 Updated products state with new prices:', updatedProducts.slice(0, 2).map(p => ({
          name: p.name,
          category: p.category,
          adminPrice: p.adminPrice,
          finalPrice: p.finalPrice
        })));
        
        // Add small delay to show the loading state, then clear it
        setTimeout(() => {
          setIsRecalculatingPrices(false);
        }, 500);
      }, 100);
    } else {
      console.log('⚠️ Skipping recalculation: missing products or categories');
    }
  };

  // Recalculate prices when categories change (but not when products change to avoid loops)
  useEffect(() => {
    console.log('🔄 useEffect triggered for category changes:', {
      categoriesCount: categoriesWithPricing.length,
      productsCount: products.length
    });
    
    // Only recalculate if we have both products and categories loaded
    if (products.length > 0 && categoriesWithPricing.length > 0) {
      console.log('🔄 Triggering price recalculation due to category changes...');
      recalculateProductPrices();
    }
  }, [categoriesWithPricing.length]); // Only depend on categories length to avoid loops

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Initial data loading started...');
      try {
        // Load both categories and products in parallel
        const [categoriesResult, productsResult] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ]);
        console.log('✅ Both categories and products loaded successfully');
      } catch (error) {
        console.error('❌ Error loading initial data:', error);
        // Try loading products anyway if categories fail
        if (products.length === 0) {
          console.log('🔄 Retrying products load...');
          fetchProducts();
        }
      }
    };
    loadData();
    
    // Listen for messages from popup window
    const handleMessage = async (event) => {
      if (event.data === 'products-updated') {
        console.log('📡 Received products-updated message');
        fetchProducts(); // Refresh products when popup updates them
      } else if (event.data === 'categories-updated') {
        console.log('📡 Received categories-updated message');
        await fetchCategories(); // Refresh categories when they're updated
        // Force recalculation after categories are updated
        setTimeout(() => {
          console.log('🔄 Force recalculating prices after category update message');
          recalculateProductPrices();
        }, 200);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Categories are now fetched from API

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.status !== 'all' && product.status !== filters.status) return false;
    if (filters.stock === 'in-stock' && product.stock === 0) return false;
    if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.sku?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.brand?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'category':
        return a.category.localeCompare(b.category);
      case 'price-low':
        return (a.finalPrice || 0) - (b.finalPrice || 0);
      case 'price-high':
        return (b.finalPrice || 0) - (a.finalPrice || 0);
      case 'stock-high':
        return (b.stock || 0) - (a.stock || 0);
      case 'stock-low':
        return (a.stock || 0) - (b.stock || 0);
      default:
        return 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

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

  // Bulk pricing functionality
  const handleBulkPricingComplete = () => {
    // Refresh products list after successful pricing update
    fetchProducts();
    setShowBulkPricing(false);
  };

  // Bulk stock functionality
  const handleBulkStockComplete = () => {
    // Refresh products list after successful stock update
    fetchProducts();
    setShowBulkStock(false);
  };

  // Bulk publish functionality
  const handleBulkPublishComplete = () => {
    // Refresh products list after bulk publish actions
    fetchProducts();
    setShowBulkPublish(false);
  };

  // Fetch all products for bulk management (including published and unpublished)
  const fetchUnpublishedProducts = async () => {
    try {
      const response = await apiService.getProducts();
      if (response.success) {
        // Show all products for management, not just unpublished ones
        setUnpublishedProducts(response.products);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  // Handle bulk publish
  const handleBulkPublish = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select products to publish');
      return;
    }

    try {
      for (const productId of selectedProducts) {
        await apiService.updateProduct(productId, { published: true });
      }
      alert(`Successfully published ${selectedProducts.length} products`);
      setSelectedProducts([]);
      fetchUnpublishedProducts(); // Refresh unpublished list
      fetchProducts(); // Refresh main products list
    } catch (error) {
      console.error('Failed to publish products:', error);
      alert('Failed to publish products');
    }
  };

  // Product edit modal handlers
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (updatedProduct) => {
    // Update the product in the local state
    setProducts(prev => prev.map(p => 
      p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p
    ));
    // Modal will close automatically after successful save
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
        <div style={{ 
          marginBottom: 'var(--space-6)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--space-2)' 
        }}>
          <TabButton 
            isActive={activeTab === 'products'} 
            onClick={() => setActiveTab('products')}
          >
            📦 Product Catalog
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                <h3 className="card-title">Product Catalog</h3>
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Search Bar */}
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search products, SKU, or brand..."
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '250px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#2563eb';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  />
                  
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="btn btn-outline"
                    style={{ cursor: 'pointer', minWidth: '160px' }}
                  >
                    <option value="name">Sort by Name (A-Z)</option>
                    <option value="category">Sort by Category</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="stock-high">Stock: High to Low</option>
                    <option value="stock-low">Stock: Low to High</option>
                  </select>
                  
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
                  <button
                    onClick={async () => {
                      console.log('🔄 Manual refresh triggered');
                      setIsRecalculatingPrices(true);
                      setProducts([]); // Clear products first
                      setCategoriesWithPricing([]); // Clear categories
                      
                      // Reload categories first
                      await fetchCategories();
                      
                      // Give time for state to update, then reload products
                      setTimeout(async () => {
                        await fetchProducts();
                        setIsRecalculatingPrices(false);
                      }, 500);
                    }}
                    className="btn btn-outline"
                    title="Refresh categories and recalculate prices"
                    style={{ padding: '8px 12px' }}
                    disabled={isRecalculatingPrices}
                  >
                    {isRecalculatingPrices ? '⏳ Updating...' : '🔄 Refresh Prices'}
                  </button>
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
                {/* Product Cards Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                  gap: 'var(--space-4)' 
                }}>
                  {paginatedProducts.map(product => (
                    <div 
                      key={`${product.id}-${product.finalPrice}-${categoriesWithPricing.length}`} 
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: '1px solid #e5e7eb',
                        padding: '16px',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      }}
                    >
                      {/* Product Image Placeholder */}
                      <div style={{
                        width: '100%',
                        height: '192px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      >
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              objectPosition: 'center'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          width: '64px',
                          height: '64px',
                          backgroundColor: '#e5e7eb',
                          borderRadius: '8px',
                          display: product.image ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg style={{ width: '32px', height: '32px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#111827',
                          fontSize: '14px',
                          lineHeight: '1.25',
                          minHeight: '40px',
                          cursor: 'pointer',
                          transition: 'color 0.2s',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#111827';
                        }}
                        >
                          {product.name}
                        </h3>
                        
                        <p style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.category}
                        </p>
                        
                        <p style={{ fontSize: '12px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.brand || 'No Brand'}
                        </p>

                        {/* Pricing Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <span style={{ fontSize: '12px', color: '#6b7280' }}>Base Price:</span>
                              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                                £{product.basePrice.toFixed(2)}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: product.stock > 0 ? '#10b981' : '#ef4444'
                              }}></div>
                              <span style={{
                                fontSize: '12px',
                                color: product.stock > 0 ? '#059669' : '#dc2626'
                              }}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 0',
                            borderTop: '1px solid #f3f4f6',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>Stock Level:</span>
                            <span style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: product.stock === 0 ? '#dc2626' : product.stock <= 20 ? '#d97706' : '#059669'
                            }}>
                              {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>Final Price (Seller Base):</span>
                            <span style={{ 
                              fontSize: '14px', 
                              fontWeight: '600', 
                              color: isRecalculatingPrices ? '#9ca3af' : '#1d4ed8',
                              opacity: isRecalculatingPrices ? 0.7 : 1,
                              transition: 'all 0.3s ease'
                            }}>
                              {isRecalculatingPrices ? '⏳ Updating...' : `£${product.finalPrice.toFixed(2)}`}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>Status:</span>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: product.status === 'published' ? '#d1fae5' : '#fef3c7',
                              color: product.status === 'published' ? '#065f46' : '#92400e'
                            }}>
                              {product.status === 'published' ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleEditProduct(product);
                              }}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                backgroundColor: '#dbeafe',
                                color: '#1d4ed8',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#bfdbfe';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#dbeafe';
                              }}
                            >
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleToggleStatus(product.id)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                backgroundColor: product.status === 'published' ? '#fef3c7' : '#d1fae5',
                                color: product.status === 'published' ? '#92400e' : '#065f46',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = product.status === 'published' ? '#fde68a' : '#a7f3d0';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = product.status === 'published' ? '#fef3c7' : '#d1fae5';
                              }}
                            >
                              {product.status === 'published' ? 'Unpublish' : 'Publish'}
                            </button>
                          </div>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '500',
                              transition: 'all 0.2s',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fecaca';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                          >
                            Delete Product
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ 
                    marginTop: 'var(--space-6)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)'
                  }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: currentPage === 1 ? 0.5 : 1,
                          fontSize: '14px'
                        }}
                      >
                        First
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: currentPage === 1 ? '#f3f4f6' : 'white',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          opacity: currentPage === 1 ? 0.5 : 1,
                          fontSize: '14px'
                        }}
                      >
                        Previous
                      </button>
                      <span style={{ 
                        padding: '8px 12px', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          fontSize: '14px'
                        }}
                      >
                        Next
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: currentPage === totalPages ? '#f3f4f6' : 'white',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          opacity: currentPage === totalPages ? 0.5 : 1,
                          fontSize: '14px'
                        }}
                      >
                        Last
                      </button>
                    </div>
                  </div>
                )}

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


        {/* Pricing Rules Tab */}
        {activeTab === 'pricing' && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Current Pricing Rules by Category</h3>
                <button 
                  onClick={() => fetchCategories()}
                  className="btn btn-outline"
                  style={{ cursor: 'pointer' }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Current pricing rules applied to each category. These rules are used in the formula: ((base price × margin) + shipping fee) × conversion rate
                </p>
              </div>
              
              {categoriesWithPricing.length === 0 ? (
                <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>Loading pricing rules...</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Icon</th>
                        <th>Default Margin (%)</th>
                        <th>Shipping Fee (GBP)</th>
                        <th>Products Count</th>
                        <th>Status</th>
                        <th>Sort Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesWithPricing.map(category => {
                        const productCount = products.filter(p => p.category === category.name).length;
                        return (
                          <tr key={category.id}>
                            <td>
                              <div>
                                <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {category.name}
                                </div>
                                {category.description && (
                                  <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                    {category.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ fontSize: '24px', textAlign: 'center' }}>
                              {category.icon || '📦'}
                            </td>
                            <td>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: category.defaultMargin > 0 ? 'var(--success)' : 'var(--warning)'
                              }}>
                                {category.defaultMargin || 0}%
                              </span>
                            </td>
                            <td>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--text-primary)'
                              }}>
                                £{(category.shippingFee || 0).toFixed(2)}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                productCount > 0 ? 'badge-success' : 'badge-info'
                              }`}>
                                {productCount} products
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: category.isActive ? '#10b981' : '#ef4444'
                                }}></div>
                                <span style={{
                                  fontSize: '12px',
                                  color: category.isActive ? '#059669' : '#dc2626'
                                }}>
                                  {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{ 
                                fontSize: '14px', 
                                color: 'var(--text-secondary)',
                                fontFamily: 'monospace'
                              }}>
                                {category.sortOrder || 0}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pricing Formula Information */}
              <div style={{
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)',
                backgroundColor: 'var(--bg-accent)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-light)'
              }}>
                <h4 style={{ 
                  margin: '0 0 var(--space-3) 0', 
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  💡 Pricing Formula
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '0 0 var(--space-2) 0' }}>
                    <strong>Final Price (GBP) = (Base Price × (1 + Margin/100)) + Shipping Fee</strong>
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-5)' }}>
                    <li><strong>Base Price:</strong> Original price from CSV import (GBP)</li>
                    <li><strong>Margin:</strong> Category-specific markup percentage</li>
                    <li><strong>Shipping Fee:</strong> Category-specific shipping cost (GBP)</li>
                    <li><strong>Final Price:</strong> This becomes the Base Price for sellers</li>
                    <li><strong>Seller Price (LKR):</strong> Final Price × seller's margin × conversion rate + shipping</li>
                  </ul>
                </div>
              </div>
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
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gridTemplateRows: 'repeat(2, 1fr)', 
                gap: 'var(--space-4)',
                gridAutoFlow: 'row'
              }}>
                {/* Row 1 */}
                <button 
                  onClick={() => setShowCsvImporter(true)}
                  className="btn btn-primary"
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📊</span>
                  <span>Import Products from CSV</span>
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
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📋</span>
                  <span>Export Products to CSV</span>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Web scraping coming soon');
                    alert('Web Scraping feature coming soon!');
                  }}
                  className="btn btn-secondary"
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🕷️</span>
                  <span>Web Scraping Tool</span>
                </button>

                {/* Row 2 */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBulkPricing(true);
                  }}
                  className="btn btn-outline"
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>💰</span>
                  <span>Bulk Update Pricing</span>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBulkStock(true);
                  }}
                  className="btn btn-outline"
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>📦</span>
                  <span>Bulk Update Stock</span>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBulkPublish(true);
                  }}
                  className="btn btn-outline"
                  style={{ 
                    cursor: 'pointer',
                    padding: 'var(--space-4)',
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--space-2)',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🚀</span>
                  <span>Bulk Publish/Unpublish</span>
                </button>
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

      {/* Bulk Pricing Modal */}
      {showBulkPricing && (
        <BulkPricingModal
          onComplete={handleBulkPricingComplete}
          onClose={() => setShowBulkPricing(false)}
        />
      )}

      {/* Bulk Stock Modal */}
      {showBulkStock && (
        <BulkStockModal
          onComplete={handleBulkStockComplete}
          onClose={() => setShowBulkStock(false)}
        />
      )}

      {/* Bulk Publish Modal */}
      {showBulkPublish && (
        <AdminBulkPublishPage
          onComplete={handleBulkPublishComplete}
          onClose={() => setShowBulkPublish(false)}
        />
      )}

      {/* Product Edit Modal */}
      {showEditModal && editingProduct && (
        <ProductEditModal
          isVisible={showEditModal}
          onClose={handleCloseEditModal}
          product={editingProduct}
          onSave={handleSaveProduct}
          categories={categories}
        />
      )}

    </div>
  );
};

export default AdminProductManagementPage;