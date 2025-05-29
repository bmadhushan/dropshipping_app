import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../contexts/OrderContext.jsx';
import OrderForm from '../../components/OrderForm.jsx';
import SellerLayout from '../../components/layout/SellerLayout.jsx';
import '../../styles/theme.css';
import logoSvg from '../../assets/logo animation_1.svg';

const SellerDashboardPage = () => {
  const navigate = useNavigate();
  const { getUserOrders } = useOrders();
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    avgOrderValue: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    // Get actual orders from context
    const userOrders = getUserOrders();
    
    // Calculate real stats from orders
    const totalOrders = userOrders.length;
    const pendingOrders = userOrders.filter(order => order.status === 'pending').length;
    const approvedOrders = userOrders.filter(order => order.status === 'approved');
    const totalRevenue = approvedOrders.reduce((sum, order) => sum + order.totalValue, 0);
    
    // Mock additional data - replace with API calls
    setStats({
      totalProducts: 45,
      activeProducts: 38,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.3, // Approximate monthly
      conversionRate: 3.2,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    });

    // Set recent orders from actual data
    setRecentOrders(userOrders.slice(0, 5).map(order => ({
      id: order.orderNumber,
      customer: 'Wholesale Order', // Since these are B2B orders
      products: order.items.length,
      amount: order.totalValue,
      status: order.status,
      date: new Date(order.date).toLocaleDateString()
    })));

    setRecentActivity([
      { action: 'Order submitted', details: 'New wholesale order pending review', time: '2 hours ago', type: 'order' },
      { action: 'Product updated', details: 'Updated pricing for Premium T-Shirts', time: '1 day ago', type: 'product' },
      { action: 'Order approved', details: 'Wholesale order ORD-001 approved', time: '2 days ago', type: 'order' },
      { action: 'Inventory alert', details: 'Low stock on Wireless Headphones', time: '3 days ago', type: 'inventory' }
    ]);

    setTopProducts([
      { name: 'Premium Cotton T-Shirt', sales: 45, revenue: 2250.00 },
      { name: 'Wireless Headphones', sales: 23, revenue: 2990.00 },
      { name: 'Face Care Serum', sales: 34, revenue: 1870.00 },
      { name: 'Garden Tools Set', sales: 18, revenue: 819.00 }
    ]);
  }, [getUserOrders]);

  const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
          {trend && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: 'var(--space-2)', 
              fontSize: '14px',
              color: trend > 0 ? 'var(--success)' : 'var(--error)' 
            }}>
              <span>{trend > 0 ? '↗️' : '↘️'}</span>
              <span style={{ marginLeft: '4px' }}>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: '2rem', color: 'var(--primary-medium)' }}>{icon}</div>
      </div>
    </div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'order': return '🛒';
      case 'product': return '📦';
      case 'inventory': return '📊';
      default: return '📝';
    }
  };

  const handleOrderSuccess = () => {
    // Refresh the page data
    window.location.reload();
  };

  return (
    <SellerLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-title">Seller Dashboard</h1>
              <p className="dashboard-subtitle">Manage your wholesale business operations</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <button 
                onClick={() => setShowOrderForm(true)}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
              >
                🛒 Create Order
              </button>
              <button 
                onClick={() => window.location.href = '/seller/orders'}
                className="btn btn-secondary"
                style={{ cursor: 'pointer' }}
              >
                📋 View Orders
              </button>
            </div>
          </div>
        </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 'var(--space-6)'
      }}>
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`${stats.pendingOrders} pending review`}
          icon="🛒"
          trend={15}
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          subtitle="From approved orders"
          icon="💰"
          trend={24}
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts}
          subtitle={`${stats.totalProducts} total products`}
          icon="📦"
          trend={12}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${stats.avgOrderValue.toFixed(2)}`}
          subtitle="Per wholesale order"
          icon="📊"
          trend={8}
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: 'var(--space-6)',
        marginTop: 'var(--space-6)'
      }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Recent Orders</h3>
              <button 
                onClick={() => navigate('/seller/orders')}
                className="btn btn-outline"
                style={{ cursor: 'pointer' }}
              >
                View All
              </button>
            </div>
          </div>
          <div className="card-body">
            {recentOrders.length === 0 ? (
              <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>No orders yet</p>
                <button 
                  onClick={() => setShowOrderForm(true)}
                  className="btn btn-primary"
                  style={{ cursor: 'pointer', marginTop: 'var(--space-3)' }}
                >
                  Create Your First Order
                </button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Products</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-medium">{order.id}</td>
                      <td>{order.products} items</td>
                      <td className="font-semibold">${order.amount.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'pending' ? 'badge-warning' :
                          order.status === 'approved' ? 'badge-success' :
                          order.status === 'rejected' ? 'badge-error' :
                          'badge-info'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-sm">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activity.action}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activity.details}</p>
                    <p className="text-xs" style={{ color: 'var(--text-light)', marginTop: 'var(--space-1)' }}>{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 'var(--space-6)',
        marginTop: 'var(--space-6)'
      }}>
        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Selling Products</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
              {topProducts.map((product, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      backgroundColor: 'var(--primary-medium)', 
                      color: 'var(--text-white)' 
                    }}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: 'var(--primary-dark)' }}>${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <button 
                onClick={() => setShowOrderForm(true)}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">🛒</div>
                <span className="quick-action-label">Create New Order</span>
              </button>
              <button 
                onClick={() => navigate('/seller/orders')}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">📋</div>
                <span className="quick-action-label">View All Orders</span>
              </button>
              <button 
                onClick={() => window.location.href = '/seller/products'}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">📦</div>
                <span className="quick-action-label">Manage Products</span>
              </button>
              <button 
                onClick={() => window.location.href = '/seller/export'}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">📊</div>
                <span className="quick-action-label">Export Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Order Form Modal */}
        {showOrderForm && (
          <OrderForm 
            onClose={() => setShowOrderForm(false)}
            onSuccess={handleOrderSuccess}
          />
        )}
      </div>
    </SellerLayout>
  );
};

export default SellerDashboardPage;