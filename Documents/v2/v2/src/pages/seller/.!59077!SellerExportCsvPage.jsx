import { useState, useEffect } from 'react';
import Section from '../../components/common/Section.jsx';

const SellerExportCsvPage = ({ darkMode }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    stock: 'all',
    brand: 'all'
  });
  const [exportSettings, setExportSettings] = useState({
    format: 'woocommerce',
    currency: 'USD',
    includeImages: false,
    customFileName: ''
  });
  const [sellerPricing, setSellerPricing] = useState({
    margin: 15,
    tax: 2,
    shipping: 1
  });
  const [availableHeaders, setAvailableHeaders] = useState([]);
  const [exportStatus, setExportStatus] = useState('idle');

  // Mock data - replace with API calls
  useEffect(() => {
    // Mock products available to seller
    const mockProducts = [
      {
        id: 1,
        sku: 'CLT-001',
        name: 'Premium Cotton T-Shirt',
        category: 'Clothing',
        adminPrice: 32.00, // Base price + admin adjustments
        basePrice: 25.00,
        stock: 150,
        brand: 'EcoWear',
        description: 'Comfortable organic cotton t-shirt',
        images: ['image1.jpg'],
        weight: 0.2,
        dimensions: { length: 25, width: 20, height: 1 }
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
        description: 'High-quality wireless headphones with noise cancellation',
        images: ['image2.jpg'],
        weight: 0.3,
        dimensions: { length: 20, width: 18, height: 8 }
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
        description: 'Set of 3 ceramic plant pots with drainage',
        images: ['image3.jpg'],
        weight: 2.5,
        dimensions: { length: 30, width: 30, height: 25 }
      }
    ];
    setProducts(mockProducts);

    // Mock available headers from admin settings
    const mockHeaders = [
      { name: 'SKU', enabled: true, required: true },
      { name: 'Name', enabled: true, required: true },
      { name: 'Category', enabled: true, required: true },
      { name: 'Description', enabled: true, required: false },
      { name: 'Price', enabled: true, required: true },
      { name: 'Stock', enabled: true, required: false },
      { name: 'Brand', enabled: true, required: false },
      { name: 'Weight', enabled: false, required: false },
      { name: 'Length', enabled: false, required: false },
      { name: 'Width', enabled: false, required: false },
      { name: 'Height', enabled: false, required: false }
    ].filter(header => header.enabled);
    setAvailableHeaders(mockHeaders);
  }, []);

  const calculateSellerPrice = (product) => {
    const margin = (product.adminPrice * sellerPricing.margin) / 100;
    const tax = (product.adminPrice * sellerPricing.tax) / 100;
    const total = product.adminPrice + margin + tax + sellerPricing.shipping;
    
    // Apply currency conversion if needed
    const conversionRates = { USD: 1.0, EUR: 0.85, GBP: 0.73, CAD: 1.25 };
    return total * (conversionRates[exportSettings.currency] || 1);
  };

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.brand !== 'all' && product.brand !== filters.brand) return false;
    if (filters.stock === 'in-stock' && product.stock === 0) return false;
    if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
    
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

    const rows = products.map(product => [
      product.id,
      'simple',
      product.sku,
      product.name,
      '1',
      '0',
      'visible',
      product.description.substring(0, 100),
      product.description,
      '',
      '',
      'taxable',
      '',
      product.stock > 0 ? '1' : '0',
      product.stock,
      '1',
      'no',
      'no',
      product.weight || '0',
      product.dimensions?.length || '0',
      product.dimensions?.width || '0',
      product.dimensions?.height || '0',
      '1',
      '',
      '',
      calculateSellerPrice(product).toFixed(2),
      product.category,
      '',
      '',
      exportSettings.includeImages ? product.images?.join(',') || '' : '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      product.brand || ''
    ]);

    return [headers, ...rows];
  };

  const generateCustomCSV = (products) => {
    const headers = availableHeaders.map(h => h.name);
    const rows = products.map(product => 
      headers.map(header => {
        switch(header.toLowerCase()) {
          case 'sku': return product.sku;
          case 'name': return product.name;
          case 'category': return product.category;
          case 'description': return product.description;
          case 'price': return calculateSellerPrice(product).toFixed(2);
          case 'stock': return product.stock;
          case 'brand': return product.brand || '';
          case 'weight': return product.weight || '0';
          case 'length': return product.dimensions?.length || '0';
          case 'width': return product.dimensions?.width || '0';
          case 'height': return product.dimensions?.height || '0';
          default: return '';
        }
      })
    );
    return [headers, ...rows];
  };

  const downloadCSV = (data, filename) => {
    const csvContent = data.map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      const data = exportSettings.format === 'woocommerce' 
        ? generateWooCommerceCSV(productsToExport)
        : generateCustomCSV(productsToExport);
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = exportSettings.customFileName || 
        `${exportSettings.format}-export-${timestamp}.csv`;
      
      downloadCSV(data, filename);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  };

  const categories = [...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  return (
    <div className="container mx-auto p-4">
      <Section title="Export Product CSV" darkMode={darkMode}>
        <div className="mb-6">
          <p className="text-gray-600">
            Select products and configure export settings to generate a CSV file with your pricing applied.
          </p>
        </div>

        {/* Seller Pricing Settings */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Your Pricing Adjustments</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Margin (%)</label>
              <input
                type="number"
                value={sellerPricing.margin}
                onChange={(e) => setSellerPricing(prev => ({ ...prev, margin: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Tax (%)</label>
              <input
                type="number"
                value={sellerPricing.tax}
                onChange={(e) => setSellerPricing(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                min="0"
                max="50"
                step="0.1"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">Shipping ($)</label>
              <input
                type="number"
                value={sellerPricing.shipping}
                onChange={(e) => setSellerPricing(prev => ({ ...prev, shipping: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-blue-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Export Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Export Settings</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Export Format</label>
              <select
                value={exportSettings.format}
                onChange={(e) => setExportSettings(prev => ({ ...prev, format: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="woocommerce">WooCommerce Compatible</option>
                <option value="custom">Custom Headers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={exportSettings.currency}
                onChange={(e) => setExportSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="USD">USD ($)</option>
