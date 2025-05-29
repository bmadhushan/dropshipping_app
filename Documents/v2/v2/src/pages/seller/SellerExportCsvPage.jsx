import { useState, useEffect } from 'react';
import SellerLayout from '../../components/layout/SellerLayout.jsx';
import '../../styles/theme.css';

const SellerExportCsvPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    stock: 'all',
    brand: 'all',
    search: ''
  });
  const [exportSettings, setExportSettings] = useState({
    format: 'woocommerce',
    currency: 'AUD',
    includeImages: false,
    customFileName: '',
    mapping: {}
  });
  const [sellerPricing, setSellerPricing] = useState({
    currencyConversion: 1.25, // USD to AUD
    margin: 15,
    shippingCost: 5.00
  });
  const [availableHeaders, setAvailableHeaders] = useState([]);
  const [exportStatus, setExportStatus] = useState('idle');
  const [exportHistory, setExportHistory] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Mock products available to seller
    const mockProducts = [
      {
        id: 1,
        sku: 'CLT-001',
        name: 'Premium Cotton T-Shirt',
        category: 'Clothing',
        adminPrice: 32.00,
        basePrice: 25.00,
        stock: 150,
        brand: 'EcoWear',
        description: 'Comfortable organic cotton t-shirt made from 100% organic cotton',
        images: ['https://example.com/tshirt1.jpg', 'https://example.com/tshirt2.jpg'],
        weight: 0.2,
        dimensions: { length: 25, width: 20, height: 1 },
        tags: ['cotton', 'organic', 'casual'],
        attributes: { size: 'S,M,L,XL', color: 'Black,White,Gray' }
      },
      {
        id: 2,
        sku: 'ELC-002',
        name: 'Wireless Bluetooth Headphones',
        category: 'Electronics',
        adminPrice: 129.19,
        basePrice: 89.99,
        stock: 75,
        brand: 'TechSound',
        description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life',
        images: ['https://example.com/headphones1.jpg'],
        weight: 0.3,
        dimensions: { length: 20, width: 18, height: 8 },
        tags: ['wireless', 'bluetooth', 'noise-cancelling'],
        attributes: { color: 'Black,Silver', warranty: '2 years' }
      },
      {
        id: 3,
        sku: 'HG-003',
        name: 'Indoor Plant Pot Set',
        category: 'Home & Garden',
        adminPrice: 47.25,
        basePrice: 35.50,
        stock: 45,
        brand: 'GreenLife',
        description: 'Set of 3 ceramic plant pots with drainage holes, perfect for indoor plants',
        images: ['https://example.com/pots1.jpg', 'https://example.com/pots2.jpg'],
        weight: 2.5,
        dimensions: { length: 30, width: 30, height: 25 },
        tags: ['ceramic', 'drainage', 'indoor'],
        attributes: { material: 'Ceramic', set_size: '3 pieces' }
      }
    ];
    setProducts(mockProducts);

    // Mock available headers from admin settings
    const mockHeaders = [
      { name: 'ID', enabled: true, required: true },
      { name: 'Type', enabled: true, required: true },
      { name: 'SKU', enabled: true, required: true },
      { name: 'Name', enabled: true, required: true },
      { name: 'Published', enabled: true, required: false },
      { name: 'Description', enabled: true, required: false },
      { name: 'Short description', enabled: true, required: false },
      { name: 'Categories', enabled: true, required: true },
      { name: 'Tags', enabled: true, required: false },
      { name: 'Regular price', enabled: true, required: true },
      { name: 'Stock', enabled: true, required: false },
      { name: 'Weight (kg)', enabled: true, required: false },
      { name: 'Length (cm)', enabled: true, required: false },
      { name: 'Width (cm)', enabled: true, required: false },
      { name: 'Height (cm)', enabled: true, required: false },
      { name: 'Images', enabled: false, required: false },
      { name: 'Brand', enabled: true, required: false }
    ];
    setAvailableHeaders(mockHeaders);

    // Mock export history
    setExportHistory([
      {
        id: 1,
        filename: 'woocommerce-export-2024-01-15.csv',
        date: '2024-01-15T10:30:00Z',
        productCount: 45,
        format: 'WooCommerce',
        status: 'completed'
      },
      {
        id: 2,
        filename: 'custom-export-2024-01-12.csv',
        date: '2024-01-12T14:20:00Z',
        productCount: 23,
        format: 'Custom',
        status: 'completed'
      }
    ]);
  }, []);

  const calculateSellerPrice = (product) => {
    const converted = product.adminPrice * sellerPricing.currencyConversion;
    const withMargin = converted * (1 + sellerPricing.margin / 100);
    return withMargin + sellerPricing.shippingCost;
  };

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.brand !== 'all' && product.brand !== filters.brand) return false;
    if (filters.stock === 'in-stock' && product.stock === 0) return false;
    if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
    if (filters.search && !product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !product.sku.toLowerCase().includes(filters.search.toLowerCase())) return false;
    
    if (filters.priceRange !== 'all') {
      const price = calculateSellerPrice(product);
      const [min, max] = filters.priceRange.split('-').map(Number);
      if (max) {
        if (price < min || price > max) return false;
      } else {
        if (price < min) return false;
      }
    }
    
    return true;
  });

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    const allIds = filteredProducts.map(p => p.id);
    setSelectedProducts(prev => 
      prev.length === allIds.length ? [] : allIds
    );
  };

  const generateWooCommerceCSV = (products) => {
    const headers = [
      'ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Visibility in catalog',
      'Short description', 'Description', 'Date sale price starts', 'Date sale price ends',
      'Tax status', 'Tax class', 'In stock?', 'Stock', 'Low stock amount', 'Backorders allowed?',
      'Sold individually?', 'Weight (kg)', 'Length (cm)', 'Width (cm)', 'Height (cm)',
      'Allow customer reviews?', 'Purchase note', 'Sale price', 'Regular price', 'Categories',
      'Tags', 'Shipping class', 'Images', 'Download limit', 'Download expiry days',
      'Parent', 'Grouped products', 'Upsells', 'Cross-sells', 'External URL',
      'Button text', 'Position', 'Attribute 1 name', 'Attribute 1 value(s)',
      'Attribute 1 visible', 'Attribute 1 global', 'Meta: _brand'
    ];

    const rows = products.map((product) => {
      const sellerPrice = calculateSellerPrice(product);
      const shortDescription = product.description && product.description.length > 100 
        ? product.description.substring(0, 100) + '...' 
        : product.description || '';
      
      return [
        product.sku, // Use SKU as ID for better WooCommerce compatibility
        'simple',
        product.sku,
        product.name || '',
        '1', // Published
        '0', // Not featured
        'visible',
        shortDescription,
        product.description || '',
        '', // Sale price start date
        '', // Sale price end date
        'taxable',
        '', // Tax class
        product.stock > 0 ? '1' : '0',
        product.stock || '0',
        '1', // Low stock amount
        'no', // Backorders
        'no', // Sold individually
        product.weight || '0',
        product.dimensions?.length || '0',
        product.dimensions?.width || '0',
        product.dimensions?.height || '0',
        '1', // Allow reviews
        '', // Purchase note
        '', // Sale price (empty for no sale)
        sellerPrice.toFixed(2), // Regular price
        product.category || '',
        product.tags?.join(', ') || '',
        '', // Shipping class
        exportSettings.includeImages ? (product.images?.join(', ') || '') : '',
        '', // Download limit
        '', // Download expiry
        '', // Parent
        '', // Grouped products
        '', // Upsells
        '', // Cross-sells
        '', // External URL
        '', // Button text
        '', // Position
        Object.keys(product.attributes || {})[0] || '', // First attribute name
        Object.values(product.attributes || {})[0] || '', // First attribute values
        '1', // Attribute visible
        '1', // Attribute global
        product.brand || '' // Brand meta
      ];
    });

    return [headers, ...rows];
  };

  const generateCustomCSV = (products) => {
    const enabledHeaders = availableHeaders.filter(h => h.enabled);
    const headers = enabledHeaders.map(h => h.name);
    
    const rows = products.map(product => 
      headers.map(header => {
        switch(header.toLowerCase()) {
          case 'id': return product.id;
          case 'type': return 'simple';
          case 'sku': return product.sku;
          case 'name': return product.name;
          case 'published': return '1';
          case 'description': return product.description;
          case 'short description': return product.description.substring(0, 100) + '...';
          case 'categories': return product.category;
          case 'tags': return product.tags?.join(', ') || '';
          case 'regular price': return calculateSellerPrice(product).toFixed(2);
          case 'stock': return product.stock;
          case 'weight (kg)': return product.weight || '0';
          case 'length (cm)': return product.dimensions?.length || '0';
          case 'width (cm)': return product.dimensions?.width || '0';
          case 'height (cm)': return product.dimensions?.height || '0';
          case 'images': return product.images?.join(', ') || '';
          case 'brand': return product.brand || '';
          default: return '';
        }
      })
    );
    return [headers, ...rows];
  };

  const downloadCSV = (data, filename) => {
    try {
      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = '\uFEFF';
      const csvContent = BOM + data.map(row => 
        row.map(field => {
          const stringValue = String(field || '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ).join('\r\n'); // Use CRLF for better Windows compatibility
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      return true;
    } catch (error) {
      console.error('Error downloading CSV:', error);
      return false;
    }
  };

  const handleExport = async () => {
    if (selectedProducts.length === 0) {
      alert('Please select at least one product to export.');
      return;
    }

    setExportStatus('exporting');
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const productsToExport = products.filter(p => selectedProducts.includes(p.id));
      
      if (productsToExport.length === 0) {
        throw new Error('No products found to export');
      }
      
      const data = exportSettings.format === 'woocommerce' 
        ? generateWooCommerceCSV(productsToExport)
        : generateCustomCSV(productsToExport);
      
      if (!data || data.length === 0) {
        throw new Error('Failed to generate CSV data');
      }
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const baseFilename = exportSettings.customFileName || 
        `${exportSettings.format}-export-${timestamp}`;
      const filename = baseFilename.endsWith('.csv') ? baseFilename : `${baseFilename}.csv`;
      
      const downloadSuccess = downloadCSV(data, filename);
      
      if (!downloadSuccess) {
        throw new Error('Failed to download CSV file');
      }
      
      // Add to export history
      const newExport = {
        id: Date.now(),
        filename,
        date: new Date().toISOString(),
        productCount: productsToExport.length,
        format: exportSettings.format === 'woocommerce' ? 'WooCommerce' : 'Custom',
        status: 'completed'
      };
      setExportHistory(prev => [newExport, ...prev]);
      
      setExportStatus('success');
      
      // Show success message
      setTimeout(() => {
        alert(`Successfully exported ${productsToExport.length} products to ${filename}`);
        setExportStatus('idle');
      }, 500);
      
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      alert(`Export failed: ${error.message}`);
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const generatePreviewData = () => {
    if (selectedProducts.length === 0) return [];
    
    const productsToPreview = products.filter(p => selectedProducts.includes(p.id)).slice(0, 5); // Show max 5 for preview
    return exportSettings.format === 'woocommerce' 
      ? generateWooCommerceCSV(productsToPreview)
      : generateCustomCSV(productsToPreview);
  };

  const PreviewModal = () => {
    const previewData = generatePreviewData();
    
    if (previewData.length === 0) return null;
    
    const headers = previewData[0];
    const rows = previewData.slice(1);
    
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 50
      }}>
        <div className="card" style={{
          maxWidth: '90vw',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">CSV Preview</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
                  Preview of first {Math.min(rows.length, 5)} products ({selectedProducts.length} total selected)
                </p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="btn btn-outline"
                style={{ padding: 'var(--space-2)' }}
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="card-body" style={{ overflow: 'auto', maxHeight: '70vh' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '0.75rem' }}>
                <thead>
                  <tr>
                    {headers.map((header, index) => (
                      <th key={index} style={{ whiteSpace: 'nowrap' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ whiteSpace: 'nowrap' }}>
                          {String(cell).length > 50 ? String(cell).substring(0, 50) + '...' : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div style={{ 
            padding: 'var(--space-4)', 
            borderTop: '1px solid var(--border-light)', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 'var(--space-3)' 
          }}>
            <button
              onClick={() => setShowPreview(false)}
              className="btn btn-outline"
            >
              Close
            </button>
            <button
              onClick={() => {
                setShowPreview(false);
                handleExport();
              }}
              className="btn btn-primary"
            >
              Export Now
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SellerLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">CSV Export</h1>
              <p className="dashboard-subtitle">Export products with your pricing to WooCommerce or custom format</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <button 
                onClick={() => setShowPreview(true)}
                disabled={selectedProducts.length === 0}
                className="btn btn-secondary"
                style={{ 
                  cursor: selectedProducts.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedProducts.length === 0 ? '0.5' : '1'
                }}
              >
                👁️ Preview CSV
              </button>
              <button
                onClick={handleExport}
                disabled={selectedProducts.length === 0 || exportStatus === 'exporting'}
                className="btn btn-primary"
                style={{ 
                  cursor: selectedProducts.length === 0 || exportStatus === 'exporting' ? 'not-allowed' : 'pointer',
                  opacity: selectedProducts.length === 0 || exportStatus === 'exporting' ? '0.5' : '1'
                }}
              >
                {exportStatus === 'exporting' ? 'Exporting...' : 
                 exportStatus === 'success' ? '✓ Exported' : 
                 exportStatus === 'error' ? '✗ Error' :
                 `📊 Export ${selectedProducts.length} Products`}
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Settings */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <h3 className="card-title">Pricing Configuration</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
              <div>
                <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  Currency Conversion (USD → AUD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sellerPricing.currencyConversion}
                  onChange={(e) => setSellerPricing(prev => ({ ...prev, currencyConversion: parseFloat(e.target.value) || 0 }))}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  Your Margin (%)
                </label>
                <input
                  type="number"
                  value={sellerPricing.margin}
                  onChange={(e) => setSellerPricing(prev => ({ ...prev, margin: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                  Shipping Cost (AUD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={sellerPricing.shippingCost}
                  onChange={(e) => setSellerPricing(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Export Settings and Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          {/* Export Settings */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Export Settings</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Export Format
                  </label>
                  <select
                    value={exportSettings.format}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="woocommerce">WooCommerce Compatible</option>
                    <option value="custom">Custom Headers</option>
                  </select>
                  <p className="text-sm" style={{ color: 'var(--text-light)', marginTop: 'var(--space-1)' }}>
                    {exportSettings.format === 'woocommerce' 
                      ? 'Full WooCommerce import format with all required fields'
                      : 'Customizable format with selected headers only'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Custom Filename
                  </label>
                  <input
                    type="text"
                    value={exportSettings.customFileName}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, customFileName: e.target.value }))}
                    placeholder="Leave empty for auto-generated name"
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={exportSettings.includeImages}
                      onChange={(e) => setExportSettings(prev => ({ ...prev, includeImages: e.target.checked }))}
                      style={{ borderRadius: 'var(--radius-sm)' }}
                    />
                    <span className="text-sm">Include image URLs</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Filters</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                    Search Products
                  </label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search by name or SKU..."
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      Brand
                    </label>
                    <select
                      value={filters.brand}
                      onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      Price Range
                    </label>
                    <select
                      value={filters.priceRange}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Prices</option>
                      <option value="0-50">$0 - $50</option>
                      <option value="50-100">$50 - $100</option>
                      <option value="100-200">$100 - $200</option>
                      <option value="200">$200+</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                      Stock
                    </label>
                    <select
                      value={filters.stock}
                      onChange={(e) => setFilters(prev => ({ ...prev, stock: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="all">All Stock</option>
                      <option value="in-stock">In Stock</option>
                      <option value="out-of-stock">Out of Stock</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">Select Products</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {selectedProducts.length} of {filteredProducts.length} products selected
                </p>
              </div>
              <button
                onClick={handleSelectAll}
                className="btn btn-outline"
                style={{ cursor: 'pointer' }}
              >
                {selectedProducts.length === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                        style={{ borderRadius: 'var(--radius-sm)' }}
                      />
                    </th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Admin Price</th>
                    <th>Your Price</th>
                    <th>Margin</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const sellerPrice = calculateSellerPrice(product);
                    const marginAmount = sellerPrice - (product.adminPrice * sellerPricing.currencyConversion);
                    
                    return (
                      <tr key={product.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleSelectProduct(product.id)}
                            style={{ borderRadius: 'var(--radius-sm)' }}
                          />
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>SKU: {product.sku}</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.brand}</div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <div className="text-sm">${product.adminPrice.toFixed(2)}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>USD</div>
                        </td>
                        <td>
                          <div className="font-medium" style={{ color: 'var(--success)' }}>${sellerPrice.toFixed(2)}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>AUD</div>
                        </td>
                        <td>
                          <div className="text-sm" style={{ color: 'var(--success)' }}>+${marginAmount.toFixed(2)}</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{sellerPricing.margin}% + shipping</div>
                        </td>
                        <td>
                          <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-error'}`}>
                            {product.stock > 0 ? `${product.stock} units` : 'Out of stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                <p>No products found matching your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Export History */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Exports</h3>
          </div>
          <div className="card-body">
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Date</th>
                    <th>Products</th>
                    <th>Format</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exportHistory.map(export_ => (
                    <tr key={export_.id}>
                      <td className="font-medium">{export_.filename}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {new Date(export_.date).toLocaleDateString()}
                      </td>
                      <td>{export_.productCount}</td>
                      <td>{export_.format}</td>
                      <td>
                        <span className="badge badge-success">
                          {export_.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && <PreviewModal />}
    </SellerLayout>
  );
};

export default SellerExportCsvPage;