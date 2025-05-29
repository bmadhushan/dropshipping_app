import { useState, useEffect } from 'react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    visibility: 'all',
    stock: 'all'
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const categories = ['Clothing', 'Electronics', 'Home & Garden', 'Sports', 'Beauty', 'Books', 'Toys', 'Automotive'];

  useEffect(() => {
    // Mock data - replace with API call
    const mockProducts = [
      {
        id: 1,
        sku: 'CLT-001',
        name: 'Premium Cotton T-Shirt',
        category: 'Clothing',
        basePrice: 25.00,
        adminMargin: 25,
        adminTax: 5,
        adminShipping: 2,
        stock: 150,
        published: true,
        brand: 'EcoWear',
        description: 'Comfortable organic cotton t-shirt'
      },
      {
        id: 2,
        sku: 'ELC-002',
        name: 'Wireless Bluetooth Headphones',
        category: 'Electronics',
        basePrice: 89.99,
        adminMargin: 30,
        adminTax: 8,
        adminShipping: 5,
        stock: 75,
        published: true,
        brand: 'TechSound',
        description: 'High-quality wireless headphones with noise cancellation'
      },
      {
        id: 3,
        sku: 'HG-003',
        name: 'Indoor Plant Pot Set',
        category: 'Home & Garden',
        basePrice: 35.50,
        adminMargin: 20,
        adminTax: 3,
        adminShipping: 8,
        stock: 0,
        published: false,
        brand: 'GreenLife',
        description: 'Set of 3 ceramic plant pots with drainage'
      }
    ];
    setProducts(mockProducts);
  }, []);

  const filteredProducts = products.filter(product => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.visibility === 'published' && !product.published) return false;
    if (filters.visibility === 'unpublished' && product.published) return false;
    if (filters.stock === 'in-stock' && product.stock === 0) return false;
    if (filters.stock === 'out-of-stock' && product.stock > 0) return false;
    return true;
  });

  const calculateFinalPrice = (product) => {
    const margin = (product.basePrice * product.adminMargin) / 100;
    const tax = (product.basePrice * product.adminTax) / 100;
    return product.basePrice + margin + tax + product.adminShipping;
  };

  const handleTogglePublished = (productId) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, published: !product.published }
        : product
    ));
  };

  const handleDeleteProduct = (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(prev => prev.filter(product => product.id !== productId));
    }
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      setProducts(prev => prev.map(product => 
        product.id === editingProduct.id 
          ? { ...product, ...productData }
          : product
      ));
      setEditingProduct(null);
    } else {
      const newId = Math.max(...products.map(p => p.id)) + 1;
      setProducts(prev => [...prev, { ...productData, id: newId }]);
      setShowAddForm(false);
    }
  };

  const ProductForm = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState(product || {
      sku: '',
      name: '',
      category: '',
      basePrice: 0,
      adminMargin: 25,
      adminTax: 5,
      adminShipping: 2,
      stock: 0,
      published: false,
      brand: '',
      description: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

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
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '20px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>SKU *</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Product Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  min="0"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Base Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                  required
                  min="0"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Admin Margin (%)</label>
                <input
                  type="number"
                  value={formData.adminMargin}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminMargin: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Admin Tax (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.adminTax}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminTax: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="50"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Admin Shipping ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.adminShipping}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminShipping: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData(prev => ({ ...prev, published: e.target.checked }))}
                />
                <span>Published (visible to sellers)</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {product ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CsvUploadComponent = ({ onClose }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error
    const [previewData, setPreviewData] = useState([]);

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file && file.type === 'text/csv') {
        setCsvFile(file);
        
        // Read and parse CSV
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const data = lines.slice(1).filter(line => line.trim()).map(line => {
            const values = line.split(',').map(v => v.trim());
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            return row;
          });
          
          setCsvData(data);
          setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        };
        reader.readAsText(file);
      } else {
        alert('Please select a valid CSV file');
      }
    };

    const handleUpload = async () => {
      if (!csvData.length) return;
      
      setUploadStatus('processing');
      
      try {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Process CSV data and add to products
        const newProducts = csvData.map((row, index) => ({
          id: Math.max(...products.map(p => p.id), 0) + index + 1,
          sku: row.SKU || `AUTO-${Date.now()}-${index}`,
          name: row.Name || row.Product || 'Unnamed Product',
          category: row.Category || 'Uncategorized',
          basePrice: parseFloat(row.Price || row['Base Price'] || 0),
          adminMargin: parseFloat(row['Admin Margin'] || 25),
          adminTax: parseFloat(row['Admin Tax'] || 5),
          adminShipping: parseFloat(row['Admin Shipping'] || 2),
          stock: parseInt(row.Stock || row.Quantity || 0),
          published: row.Published === 'true' || row.Published === '1' || false,
          brand: row.Brand || '',
          description: row.Description || ''
        }));

        setProducts(prev => [...prev, ...newProducts]);
        setUploadStatus('success');
        
        setTimeout(() => {
          onClose();
          setUploadStatus('idle');
          setCsvFile(null);
          setCsvData([]);
          setPreviewData([]);
        }, 2000);
        
      } catch (error) {
        setUploadStatus('error');
      }
    };

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
          maxWidth: '800px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Upload Products via CSV</h3>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>

          {uploadStatus === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ color: '#2ecc71' }}>Upload Successful!</h3>
              <p>{csvData.length} products have been added to your catalog.</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h4>CSV Format Requirements:</h4>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '5px',
                  fontSize: '14px',
                  marginBottom: '15px'
                }}>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Required Headers:</strong> SKU, Name, Category, Price</p>
                  <p style={{ margin: '0 0 10px 0' }}><strong>Optional Headers:</strong> Brand, Description, Stock, Published, Admin Margin, Admin Tax, Admin Shipping</p>
                  <p style={{ margin: '0' }}><strong>Example:</strong> SKU,Name,Category,Price,Stock,Brand,Published</p>
                </div>
                
                <label style={{ 
                  display: 'block',
                  padding: '20px',
                  border: '2px dashed #ddd',
                  borderRadius: '5px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: csvFile ? '#f0f8ff' : '#fafafa'
                }}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  {csvFile ? (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📄</div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{csvFile.name}</p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                        {csvData.length} products detected
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '10px' }}>📁</div>
                      <p style={{ margin: 0 }}>Click to select CSV file or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>

              {previewData.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h4>Preview (First 5 rows):</h4>
                  <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                        <tr>
                          {Object.keys(previewData[0] || {}).map(header => (
                            <th key={header} style={{ 
                              padding: '8px', 
                              borderBottom: '1px solid #ddd',
                              textAlign: 'left',
                              minWidth: '100px'
                            }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <td key={cellIndex} style={{ 
                                padding: '8px', 
                                borderBottom: '1px solid #eee',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <button
                  onClick={onClose}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!csvData.length || uploadStatus === 'processing'}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: uploadStatus === 'processing' ? '#95a5a6' : '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: uploadStatus === 'processing' ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploadStatus === 'processing' ? 'Processing...' : `Upload ${csvData.length} Products`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Product Management</h1>
        <p style={{ margin: '0', color: '#666' }}>
          Manage your product catalog, pricing, and availability.
        </p>
      </div>

      {/* Filters and Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <select
            value={filters.visibility}
            onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value }))}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Products</option>
            <option value="published">Published Only</option>
            <option value="unpublished">Unpublished Only</option>
          </select>
          
          <select
            value={filters.stock}
            onChange={(e) => setFilters(prev => ({ ...prev, stock: e.target.value }))}
            style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Stock Levels</option>
            <option value="in-stock">In Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowCsvUpload(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📁 Upload CSV
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Add Product
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Product</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Category</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Base Price</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Final Price</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Stock</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Status</th>
              <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '15px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>SKU: {product.sku}</div>
                    {product.brand && <div style={{ fontSize: '12px', color: '#999' }}>{product.brand}</div>}
                  </div>
                </td>
                <td style={{ padding: '15px' }}>{product.category}</td>
                <td style={{ padding: '15px' }}>${product.basePrice.toFixed(2)}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>${calculateFinalPrice(product).toFixed(2)}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: product.stock > 0 ? '#d4edda' : '#f8d7da',
                    color: product.stock > 0 ? '#155724' : '#721c24'
                  }}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: product.published ? '#d4edda' : '#e2e3e5',
                    color: product.published ? '#155724' : '#383d41'
                  }}>
                    {product.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => setEditingProduct(product)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleTogglePublished(product.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {product.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
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

        {filteredProducts.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            No products found matching the current filters.
          </div>
        )}
      </div>

      {/* Product Forms */}
      {showAddForm && (
        <ProductForm
          onSave={handleSaveProduct}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};

export default ProductManagement;