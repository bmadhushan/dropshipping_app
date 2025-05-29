import React, { useState, useEffect } from 'react';
import SellerLayout from '../../components/layout/SellerLayout.jsx';
import ProductCard from '../../components/seller/ProductCard.jsx';
import { useProducts } from '../../contexts/ProductContext.jsx';
import '../../styles/seller.css';

const SellerProductPanelPage = () => {
  const { 
    getProductsWithPricing, 
    toggleProductSelection, 
    updateProductPricing,
    bulkUpdatePricing,
    getSelectedProductsForExport,
    pricingSettings,
    categories,
    calculateSellerPrice,
    loading 
  } = useProducts();
  
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    brand: 'all',
    search: '',
    showSelected: false
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  // Sorting state
  const [sortBy, setSortBy] = useState('name'); // 'name', 'brand', 'price-low', 'price-high'
  const [editingProduct, setEditingProduct] = useState(null);
  const [showBulkPricingModal, setShowBulkPricingModal] = useState(false);
  const [bulkMarginAdjustment, setBulkMarginAdjustment] = useState(0);
  const [bulkPricingMethod, setBulkPricingMethod] = useState('adjust');
  const [bulkMarginSet, setBulkMarginSet] = useState(20);

  useEffect(() => {
    let mounted = true;
    
    const loadProducts = async () => {
      if (productsLoading) return; // Prevent multiple simultaneous calls
      
      setProductsLoading(true);
      try {
        const products = await getProductsWithPricing();
        if (mounted) {
          setProducts(products);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        if (mounted) {
          setProductsLoading(false);
        }
      }
    };
    
    loadProducts();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - run only once on mount


  const handleProductSelect = async (productId) => {
    await toggleProductSelection(productId);
    const updatedProducts = await getProductsWithPricing();
    setProducts(updatedProducts);
  };

  const handleBulkSelect = (productId) => {
    const newSelected = new Set(selectedForBulk);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedForBulk(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedForBulk.size === filteredAndSortedProducts.length) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(filteredAndSortedProducts.map(p => p.id)));
    }
  };


  const handleExportSelected = async () => {
    if (selectedForBulk.size === 0) {
      alert('No products selected for export. Please select products using the checkboxes first.');
      return;
    }

    // Get selected products from the bulk selection
    const exportData = products.filter(product => selectedForBulk.has(product.id));
    
    // Convert to CSV
    const headers = ['SKU', 'Name', 'Description', 'Category', 'Brand', 'Admin Price (USD)', 'Your Price (LKR)', 'Stock', 'Weight', 'Dimensions', 'Image'];
    const csvContent = [
      headers.join(','),
      ...exportData.map(product => [
        product.sku,
        `"${product.name}"`,
        `"${product.description || ''}"`,
        product.category,
        product.brand,
        product.adminPrice.toFixed(2),
        product.sellerPrice ? product.sellerPrice.toFixed(2) : 'N/A',
        product.stock,
        product.weight || 'N/A',
        product.dimensions || 'N/A',
        product.image || ''
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected_products_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      if (filters.showSelected && !product.isSelected) return false;
      if (filters.category !== 'all' && product.category !== filters.category) return false;
      if (filters.brand !== 'all' && product.brand !== filters.brand) return false;
      if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !product.sku.toLowerCase().includes(filters.search.toLowerCase())) return false;
      
      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max) {
          if (product.adminPrice < min || product.adminPrice > max) return false;
        } else {
          if (product.adminPrice < min) return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'brand':
          return (a.brand || '').localeCompare(b.brand || '');
        case 'price-low':
          return (a.adminPrice || 0) - (b.adminPrice || 0);
        case 'price-high':
          return (b.adminPrice || 0) - (a.adminPrice || 0);
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy]);

  const availableCategories = categories.map(cat => cat.name || cat);
  const brands = [...new Set(products.map(p => p.brand))];
  const selectedCount = products.filter(p => p.isSelected).length;

  const PricingModal = ({ product, onSave, onClose }) => {
    const [customMargin, setCustomMargin] = useState(product.customMargin || 
      pricingSettings.categories[product.category]?.margin || 
      pricingSettings.global.defaultMargin);
    const [customPrice, setCustomPrice] = useState(product.sellerPrice);
    const [useCustomPrice, setUseCustomPrice] = useState(false);

    const calculatePrice = (margin) => {
      const converted = product.adminPrice * pricingSettings.global.currencyConversion;
      const withMargin = converted * (1 + margin / 100);
      return withMargin + pricingSettings.global.shippingCost;
    };

    const handleSave = () => {
      if (useCustomPrice) {
        onSave(product.id, null, customPrice);
      } else {
        onSave(product.id, customMargin, null);
      }
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-semibold mb-4">Adjust Pricing - {product.name}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Admin Price (USD)</label>
              <p className="text-lg font-semibold">${product.adminPrice.toFixed(2)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Pricing Method</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!useCustomPrice}
                    onChange={() => setUseCustomPrice(false)}
                    className="mr-2"
                  />
                  <span>Use Margin Calculation</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={useCustomPrice}
                    onChange={() => setUseCustomPrice(true)}
                    className="mr-2"
                  />
                  <span>Set Custom Price</span>
                </label>
              </div>
            </div>
            
            {!useCustomPrice ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Margin (%) - Category Default: {pricingSettings.categories[product.category]?.margin || pricingSettings.global.defaultMargin}%
                </label>
                <input
                  type="number"
                  value={customMargin}
                  onChange={(e) => {
                    const margin = parseFloat(e.target.value) || 0;
                    setCustomMargin(margin);
                    setCustomPrice(calculatePrice(margin));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  max="200"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Custom Price (LKR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                />
              </div>
            )}
            
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium mb-1">Price Calculation:</p>
              <p className="text-xs text-gray-600">
                Base: ${product.adminPrice} × {pricingSettings.global.currencyConversion} = 
                LKR {(product.adminPrice * pricingSettings.global.currencyConversion).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">
                Margin: {customMargin}% = 
                LKR {(product.adminPrice * pricingSettings.global.currencyConversion * customMargin / 100).toFixed(2)}
              </p>
              <p className="text-xs text-gray-600">
                Shipping: LKR {pricingSettings.global.shippingCost.toFixed(2)}
              </p>
              <p className="text-sm font-semibold mt-2">
                Final Price: LKR {customPrice.toFixed(2)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Price
            </button>
          </div>
        </div>
      </div>
    );
  };

  const BulkPricingModal = () => {
    // Get selected products details
    const selectedProductsList = products.filter(p => selectedForBulk.has(p.id));
    const categoriesList = [...new Set(selectedProductsList.map(p => p.category))];
    
    const handleBulkUpdate = () => {
      if (bulkPricingMethod === 'adjust') {
        if (bulkMarginAdjustment !== 0) {
          bulkUpdatePricing(Array.from(selectedForBulk), bulkMarginAdjustment);
        }
      } else if (bulkPricingMethod === 'set') {
        // Set all selected products to the same margin
        selectedProductsList.forEach(product => {
          updateProductPricing(product.id, bulkMarginSet, null);
        });
      }
      
      // Refresh products after update
      setTimeout(async () => {
        const updatedProducts = await getProductsWithPricing();
        setProducts(updatedProducts);
        setShowBulkPricingModal(false);
        setSelectedForBulk(new Set());
        setBulkMarginAdjustment(0);
        setBulkMarginSet(20);
      }, 100);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 50000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '512px',
          width: '100%',
          padding: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h3 className="text-xl font-semibold mb-4">Bulk Price Editor</h3>
          
          {/* Selected Products Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-800">
              {selectedForBulk.size} products selected
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Categories: {categoriesList.join(', ')}
            </p>
          </div>

          {/* Pricing Method Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pricing Method</label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="adjust"
                    checked={bulkPricingMethod === 'adjust'}
                    onChange={(e) => setBulkPricingMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium">Adjust Current Margins</span>
                    <p className="text-xs text-gray-600">Add or subtract from existing margins</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="set"
                    checked={bulkPricingMethod === 'set'}
                    onChange={(e) => setBulkPricingMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium">Set Fixed Margin</span>
                    <p className="text-xs text-gray-600">Apply the same margin to all selected</p>
                  </div>
                </label>
              </div>
            </div>
            
            {bulkPricingMethod === 'adjust' ? (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Margin Adjustment (%)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setBulkMarginAdjustment(prev => Math.max(-50, prev - 5))}
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    -5%
                  </button>
                  <input
                    type="number"
                    value={bulkMarginAdjustment}
                    onChange={(e) => setBulkMarginAdjustment(parseFloat(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    min="-50"
                    max="50"
                    step="1"
                  />
                  <button
                    onClick={() => setBulkMarginAdjustment(prev => Math.min(50, prev + 5))}
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    +5%
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {bulkMarginAdjustment > 0 ? 'Increase' : bulkMarginAdjustment < 0 ? 'Decrease' : 'No change to'} margins by {Math.abs(bulkMarginAdjustment)}%
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Set All Margins To (%)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    value={bulkMarginSet}
                    onChange={(e) => setBulkMarginSet(parseFloat(e.target.value))}
                    className="flex-1"
                    min="0"
                    max="100"
                    step="5"
                  />
                  <input
                    type="number"
                    value={bulkMarginSet}
                    onChange={(e) => setBulkMarginSet(parseFloat(e.target.value) || 0)}
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    min="0"
                    max="100"
                  />
                  <span className="text-sm">%</span>
                </div>
              </div>
            )}

            {/* Preview Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Preview (First 3 products)</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedProductsList.slice(0, 3).map(product => {
                  const currentMargin = product.customMargin || 
                    pricingSettings.categories[product.category]?.margin || 
                    pricingSettings.global.defaultMargin;
                  const newMargin = bulkPricingMethod === 'adjust' 
                    ? currentMargin + bulkMarginAdjustment 
                    : bulkMarginSet;
                  const newPrice = calculateSellerPrice(product.adminPrice, product.category, newMargin);
                  
                  return (
                    <div key={product.id} className="text-xs bg-gray-50 p-2 rounded">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex justify-between mt-1">
                        <span>Current: {currentMargin}% → LKR {product.sellerPrice.toFixed(2)}</span>
                        <span className="text-green-600">New: {newMargin}% → LKR {newPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
                {selectedProductsList.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    ... and {selectedProductsList.length - 3} more products
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowBulkPricingModal(false);
                setBulkMarginAdjustment(0);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkUpdate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={bulkPricingMethod === 'adjust' && bulkMarginAdjustment === 0}
            >
              Apply to {selectedForBulk.size} Products
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveCustomPrice = async (productId, customMargin, customPrice) => {
    await updateProductPricing(productId, customMargin, customPrice);
    const updatedProducts = await getProductsWithPricing();
    setProducts(updatedProducts);
  };

  if (loading || productsLoading) {
    return (
      <SellerLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </SellerLayout>
    );
  }

  return (
    <>
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
            <p className="text-gray-600">Browse and select products for your store</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              Products in Store: {selectedCount} | Selected for Export: {selectedForBulk.size}
            </span>
            <button
              onClick={handleExportSelected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              disabled={selectedForBulk.size === 0}
            >
              Export Selected ({selectedForBulk.size})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Name or SKU..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Brand</label>
              <select
                value={filters.brand}
                onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Brands</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Prices</option>
                <option value="0-50">$0 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200">$200+</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Show</label>
              <select
                value={filters.showSelected ? 'selected' : 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, showSelected: e.target.value === 'selected' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                <option value="selected">Selected Only</option>
              </select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label className="text-sm font-medium text-gray-700 mb-1 inline-block">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Product Name (A-Z)</option>
                <option value="brand">Brand (A-Z)</option>
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                {selectedForBulk.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0 
                  ? 'Deselect All' 
                  : 'Select All'}
              </button>
              {selectedForBulk.size > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedForBulk.size} of {filteredAndSortedProducts.length} selected
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  if (selectedForBulk.size === 0) {
                    alert('Please select at least one product to edit pricing in bulk');
                  } else {
                    setShowBulkPricingModal(true);
                  }
                }}
                className={`px-3 py-2 rounded-lg text-sm ${
                  selectedForBulk.size > 0 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={selectedForBulk.size === 0}
              >
                Bulk Edit Pricing
              </button>
              {selectedForBulk.size > 0 && (
                <button
                  onClick={() => setSelectedForBulk(new Set())}
                  className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-5 gap-4">
          {paginatedProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              pricingSettings={pricingSettings}
              onToggleSelect={handleProductSelect}
              onEditPrice={setEditingProduct}
              onBulkSelect={handleBulkSelect}
              isSelected={selectedForBulk.has(product.id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                let pageNum;
                if (totalPages <= 10) {
                  pageNum = i + 1;
                } else if (currentPage <= 5) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 4) {
                  pageNum = totalPages - 9 + i;
                } else {
                  pageNum = currentPage - 4 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No products found matching your filters.</p>
          </div>
        )}
      </div>
    </SellerLayout>

    {/* Pricing Modal */}
    {editingProduct && (
      <PricingModal
        product={editingProduct}
        onSave={handleSaveCustomPrice}
        onClose={() => setEditingProduct(null)}
      />
    )}

    {/* Bulk Pricing Modal */}
    {showBulkPricingModal && <BulkPricingModal />}
    </>
  );
};

export default SellerProductPanelPage;