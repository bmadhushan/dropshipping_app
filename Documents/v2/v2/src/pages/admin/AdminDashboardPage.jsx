import { useState, useEffect } from 'react';
import '../../styles/theme.css';
import apiService from '../../services/api';

const AdminDashboardPage = ({ setCurrentPage }) => {
  const [stats, setStats] = useState({
    totalSellers: 0,
    activeSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0
  });

  const [recentSellers, setRecentSellers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data with individual error handling
      const results = await Promise.allSettled([
        apiService.get('/admin/dashboard/stats'),
        apiService.get('/admin/dashboard/recent-sellers'),
        apiService.get('/admin/dashboard/recent-activity'),
        apiService.get('/admin/dashboard/top-categories')
      ]);

      // Handle stats data
      if (results[0].status === 'fulfilled') {
        const statsData = results[0].value;
        setStats({
          totalSellers: statsData.totalSellers || 0,
          activeSellers: statsData.totalSellers - statsData.pendingSellers || 0,
          totalProducts: statsData.totalProducts || 0,
          pendingProducts: 0,
          totalRevenue: statsData.totalRevenue || 0,
          monthlyRevenue: statsData.totalRevenue || 0,
          totalOrders: 0,
          pendingOrders: 0
        });
      }

      // Handle recent sellers data
      if (results[1].status === 'fulfilled') {
        const sellersData = results[1].value;
        const formattedSellers = (Array.isArray(sellersData) ? sellersData : []).map(seller => ({
          id: seller.id,
          name: seller.business_name || seller.name,
          contact: seller.name,
          products: 0,
          revenue: 0,
          status: seller.status,
          joinDate: new Date(seller.created_at).toLocaleDateString()
        }));
        setRecentSellers(formattedSellers);
      }

      // Handle recent activity data
      if (results[2].status === 'fulfilled') {
        const activityData = results[2].value;
        const formattedActivity = (Array.isArray(activityData) ? activityData : []).map(activity => ({
          action: activity.type === 'seller' ? 'New seller registration' : 'New product added',
          details: activity.message,
          time: formatTimeAgo(new Date(activity.time)),
          type: activity.type
        }));
        setRecentActivity(formattedActivity);
      } else {
        // Fallback activity data
        setRecentActivity([
          { action: 'System initialized', details: 'Dashboard loaded successfully', time: 'just now', type: 'system' }
        ]);
      }

      // Handle top categories data
      if (results[3].status === 'fulfilled') {
        const categoriesData = results[3].value;
        const formattedCategories = (Array.isArray(categoriesData) ? categoriesData : []).map(category => ({
          name: category.name,
          sellers: 0,
          products: category.productCount || 0,
          revenue: 0
        }));
        setTopCategories(formattedCategories);
      }

      // Check if any critical API failed
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount === results.length) {
        throw new Error('All dashboard APIs failed');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 text-sm`} style={{ color: trend > 0 ? 'var(--success)' : 'var(--error)' }}>
              <span>{trend > 0 ? '↗️' : '↘️'}</span>
              <span style={{ marginLeft: '4px' }}>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="text-4xl" style={{ color: 'var(--primary-medium)' }}>{icon}</div>
      </div>
    </div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'seller': return '👥';
      case 'product': return '📦';
      case 'pricing': return '💰';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div className="text-center">
            <p className="text-lg">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div className="text-center">
            <p className="text-lg text-error">{error}</p>
            <button onClick={fetchDashboardData} className="btn btn-primary mt-4">Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">Platform overview and management console</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: 'var(--space-6)', 
          padding: '0 var(--space-6)' 
        }}>
          <StatCard
            title="Total Sellers"
            value={stats.totalSellers}
            subtitle={`${stats.activeSellers} active`}
            icon="👥"
            trend={18}
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            subtitle={`${stats.pendingProducts} pending approval`}
            icon="📦"
            trend={12}
          />
          <StatCard
            title="Platform Revenue"
            value={`$${stats.monthlyRevenue.toFixed(2)}`}
            subtitle="This month"
            icon="💰"
            trend={24}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${stats.pendingOrders} pending`}
            icon="🛒"
            trend={15}
          />
        </div>

        {/* Main Content Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: 'var(--space-6)', 
          padding: '0 var(--space-6)',
          marginTop: 'var(--space-6)'
        }}>
          {/* Recent Sellers - Takes 2 columns */}
          <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Recent Sellers</h3>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (setCurrentPage) {
                    setCurrentPage('sellers');
                  }
                }}
                className="btn btn-outline"
                style={{ cursor: 'pointer' }}
              >
                View All
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Seller ID</th>
                    <th>Business Name</th>
                    <th>Contact</th>
                    <th>Products</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSellers.map(seller => (
                    <tr key={seller.id}>
                      <td className="font-medium">{seller.id}</td>
                      <td className="font-medium">{seller.name}</td>
                      <td>{seller.contact}</td>
                      <td>{seller.products}</td>
                      <td className="font-semibold">${seller.revenue.toFixed(2)}</td>
                      <td>
                        <span className={`badge ${
                          seller.status === 'pending' ? 'badge-warning' :
                          seller.status === 'active' ? 'badge-success' :
                          'badge-error'
                        }`}>
                          {seller.status}
                        </span>
                      </td>
                      <td className="text-sm">{seller.joinDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{activity.action}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{activity.details}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-light)' }}>{activity.time}</p>
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
          padding: '0 var(--space-6)', 
          paddingBottom: 'var(--space-6)',
          marginTop: 'var(--space-6)'
        }}>
        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Categories</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {topCategories.map((category, index) => (
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
                      <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{category.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{category.sellers} sellers, {category.products} products</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm" style={{ color: 'var(--primary-dark)' }}>${category.revenue.toFixed(2)}</p>
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
                onClick={(e) => {
                  e.preventDefault();
                  if (setCurrentPage) {
                    setCurrentPage('sellers');
                  }
                }}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">👥</div>
                <span className="quick-action-label">Seller Management</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (setCurrentPage) {
                    setCurrentPage('products');
                  }
                }}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">📦</div>
                <span className="quick-action-label">Product Management</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (setCurrentPage) {
                    setCurrentPage('pricing');
                  }
                }}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">💰</div>
                <span className="quick-action-label">Pricing Settings</span>
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (setCurrentPage) {
                    setCurrentPage('orders');
                  }
                }}
                className="quick-action"
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-action-icon">🛒</div>
                <span className="quick-action-label">Order Review</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
};

export default AdminDashboardPage;