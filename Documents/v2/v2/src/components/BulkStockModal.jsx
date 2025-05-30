import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import { X, Package, Check, AlertCircle, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

const BulkStockModal = ({ onClose, onComplete }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    stockLevel: 'all'
  });
  const [stockMode, setStockMode] = useState('set');
  const [stockValue, setStockValue] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, categoriesResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getActiveCategories()
      ]);

      if (productsResponse.success) {
        const transformedProducts = productsResponse.products.map(product => ({
          ...product,
          selected: false,
          newStock: product.stock || 0
        }));
        setProducts(transformedProducts);
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.categories);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.status === 'published' && !product.published) return false;
    if (filters.status === 'draft' && product.published) return false;
    if (filters.stockLevel === 'in-stock' && product.stock === 0) return false;
    if (filters.stockLevel === 'out-of-stock' && product.stock > 0) return false;
    if (filters.stockLevel === 'low-stock' && (product.stock === 0 || product.stock > 20)) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, selected: !product.selected }
        : product
    ));
  };

  // Select all visible products
  const toggleSelectAll = () => {
    const visibleIds = paginatedProducts.map(p => p.id);
    const allSelected = visibleIds.every(id => 
      products.find(p => p.id === id)?.selected
    );

    setProducts(prev => prev.map(product => 
      visibleIds.includes(product.id)
        ? { ...product, selected: !allSelected }
        : product
    ));
  };

  // Calculate new stock levels
  const calculateNewStock = (currentStock, mode, value) => {
    const numValue = parseInt(value) || 0;
    switch (mode) {
      case 'set':
        return numValue;
      case 'increase':
        return Math.max(0, currentStock + numValue);
      case 'decrease':
        return Math.max(0, currentStock - numValue);
      default:
        return currentStock;
    }
  };

  // Apply stock changes
  const applyStockChanges = () => {
    const value = parseInt(stockValue) || 0;
    setProducts(prev => prev.map(product => ({
      ...product,
      newStock: product.selected 
        ? calculateNewStock(product.stock || 0, stockMode, value)
        : product.newStock
    })));
  };

  // Execute bulk update
  const executeBulkUpdate = async () => {
    const selectedProductsList = products.filter(p => p.selected);
    
    if (selectedProductsList.length === 0) {
      alert('Please select at least one product to update');
      return;
    }

    try {
      setProcessing(true);
      let successCount = 0;
      let errorCount = 0;

      for (const product of selectedProductsList) {
        try {
          await apiService.updateProduct(product.id, {
            stock: product.newStock
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to update product ${product.id}:`, err);
          errorCount++;
        }
      }

      setResults({
        total: selectedProductsList.length,
        success: successCount,
        errors: errorCount
      });

      if (onComplete) {
        onComplete();
      }

    } catch (err) {
      console.error('Bulk update error:', err);
      setError('Failed to update products');
    } finally {
      setProcessing(false);
    }
  };

  const selectedCount = products.filter(p => p.selected).length;

  const getStockStatusColor = (stock) => {
    if (stock === 0) return '#dc2626';
    if (stock <= 20) return '#d97706';
    return '#059669';
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 20) return 'Low Stock';
    return 'In Stock';
  };

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
        maxWidth: '1200px',
        height: '90%',
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
              📦 Bulk Update Stock
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Update inventory levels for multiple products at once
            </p>
          </div>
          <button
            onClick={onClose}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {/* Category Filter */}
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
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
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

            {/* Stock Level Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Stock Level Filter
              </label>
              <select
                value={filters.stockLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, stockLevel: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤20)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            {/* Stock Update Mode */}
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                Update Mode
              </label>
              <select
                value={stockMode}
                onChange={(e) => setStockMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="set">Set Stock Level</option>
                <option value="increase">Increase Stock</option>
                <option value="decrease">Decrease Stock</option>
              </select>
            </div>
          </div>

          {/* Stock Update Controls */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                {stockMode === 'set' ? 'New Stock Level' : 
                 stockMode === 'increase' ? 'Increase Amount' : 'Decrease Amount'}
              </label>
              <input
                type="number"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
                placeholder={
                  stockMode === 'set' ? 'e.g., 100 units' : 
                  stockMode === 'increase' ? 'e.g., 50 units to add' : 
                  'e.g., 10 units to remove'
                }
                min="0"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              onClick={applyStockChanges}
              disabled={!stockValue || selectedCount === 0}
              style={{
                padding: '8px 16px',
                backgroundColor: selectedCount > 0 && stockValue ? '#2563eb' : '#d1d5db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedCount > 0 && stockValue ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RotateCcw size={14} />
              Preview Changes
            </button>
          </div>

          {selectedCount > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#dbeafe',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#1d4ed8'
            }}>
              {selectedCount} product{selectedCount !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Products List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px' }} />
              <p>{error}</p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={paginatedProducts.length > 0 && paginatedProducts.every(p => 
                    products.find(prod => prod.id === p.id)?.selected
                  )}
                  onChange={toggleSelectAll}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  Select All ({paginatedProducts.length} products on this page)
                </span>
              </div>

              {/* Products Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {paginatedProducts.map(product => {
                  const productData = products.find(p => p.id === product.id);
                  const stockChange = productData?.newStock - (product.stock || 0);

                  return (
                    <div
                      key={product.id}
                      style={{
                        border: `2px solid ${productData?.selected ? '#2563eb' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        padding: '16px',
                        backgroundColor: productData?.selected ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => toggleProductSelection(product.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <input
                          type="checkbox"
                          checked={productData?.selected || false}
                          onChange={() => toggleProductSelection(product.id)}
                          style={{ marginTop: '2px' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            margin: '0 0 4px 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {product.name}
                          </h4>
                          <p style={{
                            margin: '0 0 4px 0',
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {product.category} • {product.brand || 'No Brand'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: getStockStatusColor(product.stock)
                            }}></div>
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: getStockStatusColor(product.stock),
                              fontWeight: '500'
                            }}>
                              {getStockStatusText(product.stock)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ color: '#6b7280' }}>Current Stock:</span>
                          <span style={{ 
                            fontWeight: '600',
                            color: getStockStatusColor(product.stock)
                          }}>
                            {product.stock || 0} units
                          </span>
                        </div>
                        {productData?.selected && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ color: '#6b7280' }}>New Stock:</span>
                              <span style={{ 
                                fontWeight: '600', 
                                color: getStockStatusColor(productData.newStock)
                              }}>
                                {productData.newStock} units
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280' }}>Change:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {stockChange > 0 ? (
                                  <TrendingUp size={14} style={{ color: '#059669' }} />
                                ) : stockChange < 0 ? (
                                  <TrendingDown size={14} style={{ color: '#dc2626' }} />
                                ) : null}
                                <span style={{
                                  fontWeight: '600',
                                  color: stockChange > 0 ? '#059669' : stockChange < 0 ? '#dc2626' : '#6b7280'
                                }}>
                                  {stockChange > 0 ? '+' : ''}{stockChange} units
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
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
            </>
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
              ✅ Updated {results.success} of {results.total} products
              {results.errors > 0 && ` (${results.errors} errors)`}
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              Ready to update {selectedCount} product{selectedCount !== 1 ? 's' : ''}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
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
              Cancel
            </button>
            <button
              onClick={executeBulkUpdate}
              disabled={selectedCount === 0 || processing}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: selectedCount > 0 && !processing ? '#2563eb' : '#d1d5db',
                color: 'white',
                cursor: selectedCount > 0 && !processing ? 'pointer' : 'not-allowed',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {processing ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Updating...
                </>
              ) : (
                <>
                  <Package size={16} />
                  Update Stock ({selectedCount})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStockModal;