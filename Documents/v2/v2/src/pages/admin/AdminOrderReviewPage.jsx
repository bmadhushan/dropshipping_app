import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import '../../styles/theme.css';

const AdminOrderReviewPage = () => {
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    hasMore: false
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [filter, search, dateFrom, dateTo, pagination.page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're using mock authentication
      const token = localStorage.getItem('auth_token');
      if (token === 'mock-token-for-testing') {
        // Use mock data when backend is not available
        setTimeout(() => {
          const mockOrders = [
            {
              id: 1,
              order_number: 'ORD-1748507773207-AI06IH',
              seller_business_name: 'Tech Solutions Ltd',
              seller_email: 'contact@techsolutions.com',
              created_at: '2025-05-29T08:36:13Z',
              total_amount: 447.71,
              status: 'pending',
              customer_name: 'John Doe',
              customer_email: 'john@example.com',
              customer_phone: '+1234567890',
              shipping_address: '123 Main St, City, State 12345',
              notes: 'Please handle with care',
              items: [
                {
                  id: 1,
                  order_id: 1,
                  product_id: 7,
                  product_name: 'Bamboo Hoodie',
                  product_sku: 'EW-007',
                  quantity: 2,
                  unit_price: 223.855,
                  total_price: 447.71
                }
              ]
            },
            {
              id: 2,
              order_number: 'ORD-1748508858824-VG5JBQ',
              seller_business_name: 'Fashion Forward',
              seller_email: 'info@fashionforward.com',
              created_at: '2025-05-29T08:54:18Z',
              total_amount: 91.00,
              status: 'approved',
              customer_name: 'Jane Smith',
              customer_email: 'jane@example.com',
              customer_phone: '+1987654321',
              shipping_address: '456 Oak Ave, Town, State 67890',
              notes: 'Standard delivery',
              items: [
                {
                  id: 2,
                  order_id: 2,
                  product_id: 3,
                  product_name: 'Ceramic Planter Set',
                  product_sku: 'HG-003',
                  quantity: 2,
                  unit_price: 45.50,
                  total_price: 91.00
                }
              ]
            },
            {
              id: 3,
              order_number: 'ORD-1748509547560-Q5XXI1',
              seller_business_name: 'Home & Garden Co',
              seller_email: 'sales@homegarden.com',
              created_at: '2025-05-29T09:05:47Z',
              total_amount: 325.00,
              status: 'pending',
              customer_name: 'Mike Johnson',
              customer_email: 'mike@example.com',
              customer_phone: '+1122334455',
              shipping_address: '789 Pine St, Village, State 13579',
              notes: 'Red colour, size 7 UK',
              items: [
                {
                  id: 3,
                  order_id: 3,
                  product_id: 7,
                  product_name: 'Bamboo Hoodie',
                  product_sku: 'EW-007',
                  quantity: 5,
                  unit_price: 65.00,
                  total_price: 325.00
                }
              ]
            }
          ];

          const formattedOrders = mockOrders.map(order => ({
            id: order.id,
            orderNumber: order.order_number,
            seller: {
              name: order.seller_business_name,
              email: order.seller_email
            },
            date: order.created_at,
            totalValue: parseFloat(order.total_amount),
            status: order.status,
            items: order.items || [],
            notes: order.notes,
            rejectionReason: order.rejection_reason,
            customerName: order.customer_name,
            customerEmail: order.customer_email,
            customerPhone: order.customer_phone,
            shippingAddress: order.shipping_address
          }));

          setOrders(formattedOrders);
          setPagination(prev => ({
            ...prev,
            totalPages: 1,
            hasMore: false
          }));
          setLoading(false);
        }, 1000);
        return;
      }
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const response = await apiService.get('/orders/admin/all', { params });
      console.log('Raw API response:', response);
      
      const formattedOrders = response.orders.map(order => {
        console.log('Processing order:', order.id, 'Items:', order.items);
        return {
          id: order.id,
          orderNumber: order.order_number,
          seller: {
            name: order.seller_business_name || order.seller_name || 'Unknown Seller',
            email: order.seller_email || 'unknown@email.com'
          },
          date: order.created_at,
          totalValue: parseFloat(order.total_amount),
          status: order.status,
          items: order.items || [],
          notes: order.notes,
          rejectionReason: order.rejection_reason,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          shippingAddress: order.shipping_address
        };
      });

      setOrders(formattedOrders);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil(response.pagination?.total / pagination.limit) || 1,
        hasMore: response.pagination?.hasMore || false
      }));
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Check if we're using mock authentication
      const token = localStorage.getItem('auth_token');
      if (token === 'mock-token-for-testing') {
        // Use mock stats data
        setStats({
          total_orders: 3,
          pending_orders: 2,
          approved_orders: 1,
          rejected_orders: 0,
          processing_orders: 0,
          shipped_orders: 0,
          delivered_orders: 0,
          cancelled_orders: 0,
          total_revenue: 863.71,
          pending_revenue: 772.71,
          approved_revenue: 91.00
        });
        return;
      }

      const response = await apiService.get('/orders/admin/stats');
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusChange = async (orderId, newStatus, reason = '') => {
    try {
      const payload = { status: newStatus };
      if (reason) payload.reason = reason;
      
      await apiService.patch(`/orders/admin/${orderId}/status`, payload);
      
      // If approved, automatically send payment link
      if (newStatus === 'approved') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          await handleSendPaymentLink(order);
        }
      }
      
      // Refresh orders and stats
      fetchOrders();
      fetchStats();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleDownloadInvoice = async (order) => {
    try {
      const response = await apiService.get(`/orders/admin/${order.id}/invoice`, {
        responseType: 'blob'
      });
      
      // Create download link
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleSendPaymentLink = async (order) => {
    try {
      setLoading(true);
      const response = await apiService.post(`/orders/admin/${order.id}/payment-link`, {
        sellerEmail: order.seller.email,
        amount: order.totalValue,
        currency: 'gbp',
        description: `Payment for Order ${order.orderNumber}`
      });
      
      if (response.success) {
        alert(`Payment link sent successfully to ${order.seller.email}`);
      }
    } catch (err) {
      console.error('Error sending payment link:', err);
      alert(err.response?.data?.message || 'Failed to send payment link');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders first');
      return;
    }

    try {
      await apiService.patch('/orders/admin/bulk-update', {
        orderIds: selectedOrders,
        status: action
      });
      
      setSelectedOrders([]);
      fetchOrders();
      fetchStats();
    } catch (err) {
      console.error('Error bulk updating orders:', err);
      alert(err.response?.data?.message || 'Failed to update orders');
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false;
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const TabButton = ({ isActive, onClick, children, count }) => (
    <button
      onClick={onClick}
      className={isActive ? 'btn btn-primary' : 'btn btn-outline'}
      style={{ 
        whiteSpace: 'nowrap',
        minWidth: 'fit-content'
      }}
    >
      {children} ({count})
    </button>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Order Review</h1>
          <p className="dashboard-subtitle">Review and manage seller orders and requests</p>
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
            title="Pending Orders"
            value={stats.pending_orders || 0}
            subtitle="Awaiting review"
            icon="⏳"
            color="var(--warning)"
          />
          <StatCard
            title="Approved Orders"
            value={stats.approved_orders || 0}
            subtitle="Orders processed"
            icon="✅"
            color="var(--success)"
          />
          <StatCard
            title="Total Value"
            value={`£${(stats.total_revenue || 0).toFixed(0)}`}
            subtitle="All orders"
            icon="💰"
          />
          <StatCard
            title="Total Orders"
            value={stats.total_orders || 0}
            subtitle="All time"
            icon="📋"
          />
        </div>

        {/* Search and Filters */}
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-3)', 
          marginBottom: 'var(--space-6)',
          alignItems: 'center',
          overflow: 'auto'
        }}>
          <input
            type="text"
            placeholder="Search orders, sellers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="form-input"
            style={{ 
              minWidth: '180px',
              maxWidth: '250px',
              flex: '1'
            }}
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="form-input"
            style={{ 
              minWidth: '140px',
              whiteSpace: 'nowrap'
            }}
            placeholder="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="form-input"
            style={{ 
              minWidth: '140px',
              whiteSpace: 'nowrap'
            }}
            placeholder="To date"
          />
          <button
            onClick={clearFilters}
            className="btn btn-outline"
            style={{
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          marginBottom: 'var(--space-6)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          alignItems: 'center'
        }}>
          <TabButton 
            isActive={filter === 'all'} 
            onClick={() => setFilter('all')}
            count={stats.total_orders || 0}
          >
            📋 All Orders
          </TabButton>
          <TabButton 
            isActive={filter === 'pending'} 
            onClick={() => setFilter('pending')}
            count={stats.pending_orders || 0}
          >
            ⏳ Pending Review
          </TabButton>
          <TabButton 
            isActive={filter === 'approved'} 
            onClick={() => setFilter('approved')}
            count={stats.approved_orders || 0}
          >
            ✅ Approved
          </TabButton>
          <TabButton 
            isActive={filter === 'rejected'} 
            onClick={() => setFilter('rejected')}
            count={stats.rejected_orders || 0}
          >
            ❌ Rejected
          </TabButton>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div style={{ 
            marginBottom: 'var(--space-4)',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-accent)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)'
          }}>
            <span>{selectedOrders.length} orders selected</span>
            <button
              onClick={() => handleBulkAction('approved')}
              className="btn btn-secondary"
              style={{ backgroundColor: 'var(--success)' }}
            >
              Approve Selected
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              className="btn btn-secondary"
              style={{ backgroundColor: 'var(--error)' }}
            >
              Reject Selected
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Order Management</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }}></div>
                <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>Loading orders...</p>
              </div>
            ) : error ? (
              <div style={{ 
                padding: 'var(--space-10)', 
                textAlign: 'center', 
                color: 'var(--error)' 
              }}>
                <p>Error: {error}</p>
                <button 
                  onClick={() => {
                    setError(null);
                    fetchOrders();
                  }}
                  className="btn btn-primary"
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Order #</th>
                      <th>Seller</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total Value</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => toggleOrderSelection(order.id)}
                          />
                        </td>
                        <td>
                          <div className="font-semibold">{order.orderNumber}</div>
                        </td>
                        <td>
                          <div>
                            <div className="font-semibold">{order.seller.name}</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {order.seller.email}
                            </div>
                          </div>
                        </td>
                        <td className="text-sm">
                          {formatDate(order.date)}
                        </td>
                        <td>
                          <div className="text-sm">
                            {order.items.length} item(s)
                          </div>
                        </td>
                        <td className="font-semibold">
                          £{order.totalValue.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${
                            order.status === 'pending' ? 'badge-warning' :
                            order.status === 'approved' ? 'badge-success' :
                            'badge-error'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div style={{ 
                            display: 'flex', 
                            gap: 'var(--space-1)', 
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start'
                          }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-outline"
                              style={{
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="View order details"
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              className="btn btn-outline"
                              style={{
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: '4px 8px',
                                minWidth: '60px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: 'var(--primary-light)',
                                borderColor: 'var(--primary-medium)'
                              }}
                              title="Download invoice"
                            >
                              📄 Invoice
                            </button>
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(order.id, 'approved')}
                                  className="btn btn-secondary"
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    minWidth: '70px',
                                    backgroundColor: 'var(--success)',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Approve order and send payment link"
                                >
                                  ✅ Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:');
                                    if (reason) handleStatusChange(order.id, 'rejected', reason);
                                  }}
                                  className="btn btn-secondary"
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    padding: '4px 8px',
                                    minWidth: '60px',
                                    backgroundColor: 'var(--error)',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Reject order"
                                >
                                  ❌ Reject
                                </button>
                              </>
                            )}
                            {order.status === 'approved' && (
                              <button
                                onClick={() => handleSendPaymentLink(order)}
                                className="btn btn-secondary"
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  minWidth: '80px',
                                  backgroundColor: 'var(--primary-medium)',
                                  border: 'none',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="Send payment link to seller"
                              >
                                💳 Payment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredOrders.length === 0 && (
                  <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders found for the selected filter.
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div style={{ 
            marginTop: 'var(--space-6)', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 'var(--space-4)' 
          }}>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="btn btn-outline"
            >
              Previous
            </button>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: 'var(--text-secondary)' 
            }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="btn btn-outline"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(53, 75, 74, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h3 className="card-title">Order Details - {selectedOrder.orderNumber}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
                {/* Order Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Order Number
                    </label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontFamily: 'monospace', backgroundColor: 'var(--bg-accent)', padding: '4px 8px', borderRadius: '4px' }}>
                      {selectedOrder.orderNumber}
                    </p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Order Date
                    </label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Status
                    </label>
                    <span className={`badge ${
                      selectedOrder.status === 'pending' ? 'badge-warning' :
                      selectedOrder.status === 'approved' ? 'badge-success' :
                      'badge-error'
                    }`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Seller Information */}
                <div style={{ backgroundColor: 'var(--bg-accent)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)' }}>👤 Seller Information</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Business Name
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.seller.name}</p>
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Email Address
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.seller.email}</p>
                    </div>
                  </div>
                </div>

                {/* Customer & Shipping Information */}
                <div style={{ backgroundColor: 'var(--bg-light)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ margin: '0 0 var(--space-3) 0', color: 'var(--text-primary)' }}>🚚 Customer & Shipping Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Customer Name
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.customerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Customer Email
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.customerEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Phone Number
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.customerPhone || 'N/A'}</p>
                    </div>
                    <div style={{ gridColumn: 'span 1' }}>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Shipping Address
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {selectedOrder.shippingAddress || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>📦 Order Items</h4>
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder)}
                      className="btn btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--primary-light)',
                        borderColor: 'var(--primary-medium)',
                        color: 'var(--primary-dark)'
                      }}
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                  
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table className="table" style={{ margin: 0 }}>
                        <thead style={{ backgroundColor: 'var(--bg-accent)' }}>
                          <tr>
                            <th style={{ padding: 'var(--space-3)' }}>Product</th>
                            <th style={{ padding: 'var(--space-3)' }}>SKU</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Unit Price</th>
                            <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: index < selectedOrder.items.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <div style={{ fontWeight: '500' }}>{item.product_name}</div>
                              </td>
                              <td style={{ padding: 'var(--space-3)' }}>
                                <code style={{ backgroundColor: 'var(--bg-accent)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                  {item.product_sku}
                                </code>
                              </td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'center' }}>
                                <span style={{ 
                                  backgroundColor: 'var(--primary-light)', 
                                  color: 'var(--primary-dark)',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {item.quantity}
                                </span>
                              </td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}>
                                £{parseFloat(item.unit_price).toFixed(2)}
                              </td>
                              <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '500' }}>
                                £{parseFloat(item.total_price).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ backgroundColor: 'var(--success-light)' }}>
                          <tr>
                            <td colSpan="4" style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '600', color: 'var(--success-dark)' }}>
                              Total Order Value:
                            </td>
                            <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: 'var(--success-dark)' }}>
                              £{selectedOrder.totalValue.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{ 
                      border: '1px solid var(--border-light)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: 'var(--space-6)',
                      textAlign: 'center',
                      backgroundColor: 'var(--bg-accent)',
                      color: 'var(--text-secondary)'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        📦 No order items found. This might indicate an issue with order data loading.
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
                        Debug info: {selectedOrder.items ? `Items array length: ${selectedOrder.items.length}` : 'Items array is null/undefined'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div style={{ backgroundColor: 'var(--bg-accent)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                        📝 Order Notes
                      </label>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.5' }}>
                        "{selectedOrder.notes}"
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {selectedOrder.status === 'rejected' && selectedOrder.rejectionReason && (
                    <div style={{ backgroundColor: 'var(--error-light)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--error)' }}>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-2)', color: 'var(--error)' }}>
                        ❌ Rejection Reason
                      </label>
                      <p style={{ margin: 0, color: 'var(--error)', fontWeight: '500' }}>{selectedOrder.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--space-3)', 
                  paddingTop: 'var(--space-4)', 
                  borderTop: '2px solid var(--border-light)',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    {selectedOrder.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(selectedOrder.id, 'approved')}
                          className="btn btn-secondary"
                          style={{
                            backgroundColor: 'var(--success)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: 'var(--space-3) var(--space-4)'
                          }}
                        >
                          ✅ Approve Order & Send Payment Link
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) handleStatusChange(selectedOrder.id, 'rejected', reason);
                          }}
                          className="btn btn-secondary"
                          style={{
                            backgroundColor: 'var(--error)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: 'var(--space-3) var(--space-4)'
                          }}
                        >
                          ❌ Reject Order
                        </button>
                      </>
                    )}
                    {selectedOrder.status === 'approved' && (
                      <button
                        onClick={() => handleSendPaymentLink(selectedOrder)}
                        className="btn btn-secondary"
                        style={{
                          backgroundColor: 'var(--primary-medium)',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: 'var(--space-3) var(--space-4)'
                        }}
                      >
                        💳 Resend Payment Link
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      onClick={() => handleDownloadInvoice(selectedOrder)}
                      className="btn btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--primary-light)',
                        borderColor: 'var(--primary-medium)',
                        color: 'var(--primary-dark)'
                      }}
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderReviewPage;