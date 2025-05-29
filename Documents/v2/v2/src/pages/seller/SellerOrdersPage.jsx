import { useState, useEffect } from 'react';
import SellerLayout from '../../components/layout/SellerLayout.jsx';
import '../../styles/theme.css';

const SellerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    // Mock data - replace with API call
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        date: '2024-01-15T10:30:00Z',
        status: 'pending',
        customer: 'John Smith',
        shippingAddress: '123 Main St, Sydney, NSW 2000',
        items: [
          { name: 'Premium Cotton T-Shirt', sku: 'CLT-001', quantity: 2, price: 46.00, adminPrice: 32.00 },
          { name: 'Wireless Headphones', sku: 'ELC-002', quantity: 1, price: 186.49, adminPrice: 129.19 }
        ],
        totalValue: 278.49,
        notes: 'Please ship ASAP',
        trackingNumber: null
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        date: '2024-01-12T14:20:00Z',
        status: 'shipped',
        customer: 'Sarah Johnson',
        shippingAddress: '456 Queen St, Melbourne, VIC 3000',
        items: [
          { name: 'Indoor Plant Pot Set', sku: 'HG-003', quantity: 1, price: 64.06, adminPrice: 47.25 }
        ],
        totalValue: 64.06,
        notes: 'Standard delivery',
        trackingNumber: 'AU1234567890'
      },
      {
        id: 3,
        orderNumber: 'ORD-2024-003',
        date: '2024-01-08T16:45:00Z',
        status: 'delivered',
        customer: 'Mike Wilson',
        shippingAddress: '789 Collins St, Brisbane, QLD 4000',
        items: [
          { name: 'Premium Cotton T-Shirt', sku: 'CLT-001', quantity: 3, price: 46.00, adminPrice: 32.00 }
        ],
        totalValue: 138.00,
        notes: 'Gift wrapping requested',
        trackingNumber: 'AU0987654321'
      },
      {
        id: 4,
        orderNumber: 'ORD-2024-004',
        date: '2024-01-05T09:15:00Z',
        status: 'cancelled',
        customer: 'Lisa Brown',
        shippingAddress: '321 George St, Perth, WA 6000',
        items: [
          { name: 'Wireless Headphones', sku: 'ELC-002', quantity: 2, price: 186.49, adminPrice: 129.19 }
        ],
        totalValue: 372.98,
        notes: 'Customer requested cancellation',
        trackingNumber: null
      }
    ];
    setOrders(mockOrders);
  }, []);

  const filteredOrders = orders.filter(order => 
    filter === 'all' || order.status === filter
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const handleExportOrders = (exportFilters = {}) => {
    let ordersToExport = [...orders];

    // Apply filters
    if (exportFilters.status && exportFilters.status !== 'all') {
      ordersToExport = ordersToExport.filter(order => order.status === exportFilters.status);
    }

    if (exportFilters.dateFrom) {
      const fromDate = new Date(exportFilters.dateFrom);
      ordersToExport = ordersToExport.filter(order => new Date(order.date) >= fromDate);
    }

    if (exportFilters.dateTo) {
      const toDate = new Date(exportFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      ordersToExport = ordersToExport.filter(order => new Date(order.date) <= toDate);
    }

    if (ordersToExport.length === 0) {
      alert('No orders match the selected filters.');
      return;
    }

    // Create CSV content with all order details
    const headers = [
      'Order Number', 'Date', 'Customer', 'Status', 'Total (AUD)', 
      'Items Count', 'Item Details', 'Shipping Address', 'Tracking Number', 
      'Notes', 'Created Time', 'Admin Cost', 'Profit Margin'
    ];
    
    const csvContent = [
      headers.join(','),
      ...ordersToExport.map(order => {
        const adminCost = order.items.reduce((sum, item) => sum + (item.adminPrice * item.quantity), 0);
        const profit = order.totalValue - adminCost;
        const profitMargin = adminCost > 0 ? ((profit / adminCost) * 100).toFixed(2) : '0';
        
        return [
          order.orderNumber,
          formatDate(order.date),
          `"${order.customer}"`,
          order.status,
          order.totalValue.toFixed(2),
          order.items.length,
          `"${order.items.map(item => `${item.name} (SKU: ${item.sku}, Qty: ${item.quantity}, Price: $${item.price})`).join('; ')}"`,
          `"${order.shippingAddress}"`,
          order.trackingNumber || 'N/A',
          `"${order.notes || 'N/A'}"`,
          new Date(order.date).toISOString(),
          adminCost.toFixed(2),
          `${profitMargin}%`
        ].join(',');
      })
    ].join('\n');

    // Generate filename with filter info
    let filename = 'orders_export';
    if (exportFilters.status && exportFilters.status !== 'all') {
      filename += `_${exportFilters.status}`;
    }
    if (exportFilters.dateFrom || exportFilters.dateTo) {
      filename += '_filtered';
    }
    filename += `_${new Date().toISOString().split('T')[0]}.csv`;

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const OrderDetailModal = ({ order, onClose }) => {
    const [tracking, setTracking] = useState(order.trackingNumber || '');
    const [status, setStatus] = useState(order.status);

    const handleSave = () => {
      // Update order with new tracking and status
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? { ...o, trackingNumber: tracking, status: status }
          : o
      ));
      onClose();
    };

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
          maxWidth: '48rem',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Order Details</h3>
              <button onClick={onClose} className="btn btn-outline" style={{ padding: 'var(--space-2)' }}>✕</button>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
              {/* Order Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Order Number</label>
                  <p className="text-sm">{order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Date</label>
                  <p className="text-sm">{formatDate(order.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Customer</label>
                  <p className="text-sm">{order.customer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Total</label>
                  <p className="text-sm font-semibold">${order.totalValue.toFixed(2)} AUD</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Shipping Address</label>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{order.shippingAddress}</p>
              </div>

              {/* Items */}
              <div>
                <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Items</label>
                <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right">${item.price.toFixed(2)}</td>
                          <td className="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status and Tracking */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Order Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>Tracking Number</label>
                  <input
                    type="text"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    placeholder="Enter tracking number"
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

              {/* Notes */}
              {order.notes && (
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>Notes</label>
                  <p className="text-sm" style={{ 
                    backgroundColor: 'var(--bg-accent)', 
                    padding: 'var(--space-3)', 
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)'
                  }}>{order.notes}</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button
                onClick={onClose}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CsvUploadModal = ({ onClose }) => {
    const [csvFile, setCsvFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file && file.type === 'text/csv') {
        setCsvFile(file);
      } else {
        alert('Please select a valid CSV file.');
      }
    };

    const handleUpload = async () => {
      if (!csvFile) {
        alert('Please select a CSV file first.');
        return;
      }

      setUploading(true);
      
      try {
        const text = await csvFile.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Expected headers: Customer, Items, Shipping Address, Notes
        const expectedHeaders = ['customer', 'items', 'shipping_address', 'notes'];
        
        const newOrders = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length >= 4) {
            const newOrder = {
              id: Date.now() + i,
              orderNumber: `ORD-${new Date().getFullYear()}-${String(orders.length + i).padStart(3, '0')}`,
              date: new Date().toISOString(),
              status: 'pending',
              customer: values[0],
              shippingAddress: values[2],
              items: values[1].split(';').map(item => {
                const [name, qty] = item.split('(');
                return {
                  name: name.trim(),
                  sku: `SKU-${Date.now()}`,
                  quantity: qty ? parseInt(qty.replace('x)', '')) || 1 : 1,
                  price: 0, // Will need to be set manually
                  adminPrice: 0
                };
              }),
              totalValue: 0, // Will need to be calculated
              notes: values[3] || '',
              trackingNumber: null
            };
            newOrders.push(newOrder);
          }
        }

        setOrders(prev => [...prev, ...newOrders]);
        alert(`Successfully imported ${newOrders.length} orders from CSV.`);
        onClose();
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format.');
      } finally {
        setUploading(false);
      }
    };

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
        <div className="card" style={{ maxWidth: '32rem', width: '100%' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Import Orders from CSV</h3>
              <button onClick={onClose} className="btn btn-outline" style={{ padding: 'var(--space-2)' }}>✕</button>
            </div>
          </div>

          <div className="card-body">
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                Upload a CSV file with the following columns:
              </p>
              <div style={{ 
                backgroundColor: 'var(--bg-accent)', 
                padding: 'var(--space-3)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)'
              }}>
                <code style={{ fontSize: '0.75rem' }}>
                  Customer, Items, Shipping Address, Notes<br/>
                  John Smith, "T-Shirt (2x); Headphones (1x)", "123 Main St, Sydney", "Express delivery"
                </code>
              </div>
              
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button 
                onClick={handleUpload} 
                className="btn btn-primary"
                disabled={!csvFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Import Orders'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ExportModal = ({ onClose }) => {
    const [exportFilters, setExportFilters] = useState({
      status: 'all',
      dateFrom: '',
      dateTo: '',
      includeDetails: true
    });

    const handleExport = () => {
      handleExportOrders(exportFilters);
      onClose();
    };

    const handleQuickFilter = (days) => {
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(toDate.getDate() - days);
      
      setExportFilters(prev => ({
        ...prev,
        dateFrom: fromDate.toISOString().split('T')[0],
        dateTo: toDate.toISOString().split('T')[0]
      }));
    };

    const getFilteredCount = () => {
      let count = orders.length;
      if (exportFilters.status !== 'all') {
        count = orders.filter(o => o.status === exportFilters.status).length;
      }
      return count;
    };

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
        <div className="card" style={{ maxWidth: '32rem', width: '100%' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Export Orders</h3>
              <button onClick={onClose} className="btn btn-outline" style={{ padding: 'var(--space-2)' }}>✕</button>
            </div>
          </div>

          <div className="card-body">
            {/* Status Filter */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                Order Status
              </label>
              <select
                value={exportFilters.status}
                onChange={(e) => setExportFilters(prev => ({ ...prev, status: e.target.value }))}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)'
                }}
              >
                <option value="all">All Orders ({orders.length})</option>
                <option value="pending">Pending ({orderStats.pending})</option>
                <option value="processing">Processing ({orderStats.processing})</option>
                <option value="shipped">Shipped ({orderStats.shipped})</option>
                <option value="delivered">Delivered ({orderStats.delivered})</option>
                <option value="cancelled">Cancelled ({orderStats.cancelled})</option>
              </select>
            </div>

            {/* Date Range */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                Date Range
              </label>
              
              {/* Quick Filter Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleQuickFilter(7)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }}
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => handleQuickFilter(30)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }}
                >
                  Last 30 days
                </button>
                <button
                  onClick={() => handleQuickFilter(90)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }}
                >
                  Last 3 months
                </button>
                <button
                  onClick={() => setExportFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }))}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: 'var(--space-1) var(--space-2)' }}
                >
                  All time
                </button>
              </div>

              {/* Custom Date Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label className="text-xs" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={exportFilters.dateFrom}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)'
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={exportFilters.dateTo}
                    onChange={(e) => setExportFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-primary)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Export Info */}
            <div style={{ 
              backgroundColor: 'var(--bg-accent)', 
              padding: 'var(--space-3)', 
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-4)'
            }}>
              <p className="text-sm font-medium" style={{ marginBottom: 'var(--space-1)' }}>
                Export will include:
              </p>
              <ul className="text-xs" style={{ color: 'var(--text-secondary)', listStyle: 'disc', paddingLeft: 'var(--space-4)' }}>
                <li>Order details (number, date, customer, status, total)</li>
                <li>Item details (name, SKU, quantity, price)</li>
                <li>Shipping information and tracking</li>
                <li>Admin costs and profit margins</li>
                <li>Approximately {getFilteredCount()} orders will be exported</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleExport} className="btn btn-primary">
                Export CSV ({getFilteredCount()} orders)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  const StatCard = ({ label, value }) => (
    <div className="stat-card">
      <div style={{ textAlign: 'center' }}>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </div>
  );

  return (
    <SellerLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">Order Management</h1>
              <p className="dashboard-subtitle">Track and manage your customer orders</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => setShowCreateOrder(true)}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
              >
                🛒 Create Order
              </button>
              <button
                onClick={() => setShowCsvUpload(true)}
                className="btn btn-secondary"
                style={{ cursor: 'pointer' }}
              >
                📁 Import CSV
              </button>
              <button 
                onClick={() => setShowExportModal(true)}
                className="btn btn-secondary"
                style={{ cursor: 'pointer' }}
              >
                📊 Export Orders
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <StatCard label="Total" value={orderStats.total} />
          <StatCard label="Pending" value={orderStats.pending} />
          <StatCard label="Processing" value={orderStats.processing} />
          <StatCard label="Shipped" value={orderStats.shipped} />
          <StatCard label="Delivered" value={orderStats.delivered} />
          <StatCard label="Cancelled" value={orderStats.cancelled} />
        </div>

        {/* Filter Tabs */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-body" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: 'All Orders' },
                { key: 'pending', label: 'Pending' },
                { key: 'processing', label: 'Processing' },
                { key: 'shipped', label: 'Shipped' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={filter === tab.key ? 'btn btn-primary' : 'btn btn-outline'}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label} ({tab.key === 'all' ? orderStats.total : orderStats[tab.key]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id}>
                      <td>
                        <div>
                          <div className="font-medium">{order.orderNumber}</div>
                          {order.trackingNumber && (
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              Tracking: {order.trackingNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{order.customer}</td>
                      <td>
                        <div>
                          <div className="text-sm">{order.items.length} item(s)</div>
                          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {order.items.map(item => item.name).join(', ').substring(0, 50)}
                            {order.items.map(item => item.name).join(', ').length > 50 && '...'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">${order.totalValue.toFixed(2)}</div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>AUD</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          order.status === 'pending' ? 'badge-warning' :
                          order.status === 'processing' ? 'badge-info' :
                          order.status === 'shipped' ? 'badge-info' :
                          order.status === 'delivered' ? 'badge-success' :
                          order.status === 'cancelled' ? 'badge-error' :
                          'badge-info'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {formatDate(order.date)}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-outline"
                          style={{ 
                            padding: 'var(--space-2) var(--space-3)', 
                            fontSize: '0.875rem',
                            marginRight: 'var(--space-2)',
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'processing')}
                            className="btn btn-primary"
                            style={{ 
                              padding: 'var(--space-2) var(--space-3)', 
                              fontSize: '0.875rem',
                              cursor: 'pointer'
                            }}
                          >
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
                <p>No orders found for the selected filter.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* CSV Upload Modal */}
      {showCsvUpload && (
        <CsvUploadModal
          onClose={() => setShowCsvUpload(false)}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Create Order Modal - Placeholder */}
      {showCreateOrder && (
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
          <div className="card" style={{ maxWidth: '24rem', width: '100%' }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Create New Order</h3>
                <button onClick={() => setShowCreateOrder(false)} className="btn btn-outline" style={{ padding: 'var(--space-2)' }}>✕</button>
              </div>
            </div>
            <div className="card-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Manual order creation functionality will be implemented here. For now, please use the CSV import feature to add multiple orders at once.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button onClick={() => setShowCreateOrder(false)} className="btn btn-outline">
                  Close
                </button>
                <button onClick={() => setShowCsvUpload(true)} className="btn btn-primary">
                  Import CSV Instead
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SellerLayout>
  );
};

export default SellerOrdersPage;