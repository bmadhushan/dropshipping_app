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
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filter === 'all' ? undefined : filter,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const response = await apiService.get('/orders/admin/all', { params });
      
      const formattedOrders = response.orders.map(order => ({
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
        rejectionReason: order.rejection_reason
      }));

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
      
      // Refresh orders and stats
      fetchOrders();
      fetchStats();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(err.response?.data?.message || 'Failed to update order status');
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
      style={{ marginRight: 'var(--space-2)' }}
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
            value={`$${(stats.total_revenue || 0).toFixed(0)}`}
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
          gap: 'var(--space-4)', 
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          alignItems: 'center'
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
            style={{ minWidth: '200px' }}
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="form-input"
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
            placeholder="To date"
          />
          <button
            onClick={clearFilters}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
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
                          ${order.totalValue.toFixed(2)}
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
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-outline"
                              style={{
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: 'var(--space-1) var(--space-3)'
                              }}
                            >
                              View
                            </button>
                            {order.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusChange(order.id, 'approved')}
                                  className="btn btn-secondary"
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: 'var(--space-1) var(--space-3)',
                                    backgroundColor: 'var(--success)'
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Rejection reason:');
                                    if (reason) handleStatusChange(order.id, 'rejected', reason);
                                  }}
                                  className="btn btn-secondary"
                                  style={{
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    padding: 'var(--space-1) var(--space-3)',
                                    backgroundColor: 'var(--error)'
                                  }}
                                >
                                  Reject
                                </button>
                              </>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Seller
                    </label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.seller.name}</p>
                    <p className="text-sm" style={{ margin: 0, color: 'var(--text-light)' }}>{selectedOrder.seller.email}</p>
                  </div>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Order Date
                    </label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{formatDate(selectedOrder.date)}</p>
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
                      Order Items
                    </label>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td className="text-sm">{item.product_name}</td>
                            <td className="text-sm">{item.product_sku}</td>
                            <td className="text-sm">{item.quantity}</td>
                            <td className="text-sm">${parseFloat(item.unit_price).toFixed(2)}</td>
                            <td className="text-sm font-semibold">
                              ${parseFloat(item.total_price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ backgroundColor: 'var(--bg-accent)' }}>
                          <td colSpan="4" className="text-sm font-semibold" style={{ textAlign: 'right' }}>
                            Total Order Value:
                          </td>
                          <td className="text-sm font-bold">
                            ${selectedOrder.totalValue.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                      Order Notes
                    </label>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Status Info */}
                <div>
                  <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                    Current Status
                  </label>
                  <span className={`badge ${
                    selectedOrder.status === 'pending' ? 'badge-warning' :
                    selectedOrder.status === 'approved' ? 'badge-success' :
                    'badge-error'
                  }`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>

                {/* Rejection Reason */}
                {selectedOrder.status === 'rejected' && selectedOrder.rejectionReason && (
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--error)' }}>
                      Rejection Reason
                    </label>
                    <p style={{ margin: 0, color: 'var(--error)' }}>{selectedOrder.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)' }}>
                    <button
                      onClick={() => handleStatusChange(selectedOrder.id, 'approved')}
                      className="btn btn-secondary"
                      style={{
                        backgroundColor: 'var(--success)',
                        cursor: 'pointer'
                      }}
                    >
                      ✅ Approve Order
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) handleStatusChange(selectedOrder.id, 'rejected', reason);
                      }}
                      className="btn btn-secondary"
                      style={{
                        backgroundColor: 'var(--error)',
                        cursor: 'pointer'
                      }}
                    >
                      ❌ Reject Order
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderReviewPage;