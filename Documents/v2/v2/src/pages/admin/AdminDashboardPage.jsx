import { useState, useEffect } from 'react';
import '../../styles/theme.css';
import apiService from '../../services/api';
import { Users, Package, DollarSign, ShoppingCart, TrendingUp, TrendingDown, LayoutDashboard, Activity, Filter, BarChart3, Save, Edit3, Check, X } from 'lucide-react';

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
  // Initialize with cached value or fallback
  const getCachedConversionRate = () => {
    try {
      const cached = localStorage.getItem('conversionRate');
      return cached ? parseFloat(cached) : 400;
    } catch {
      return 400;
    }
  };
  
  const [conversionRate, setConversionRate] = useState(getCachedConversionRate());
  const [tempConversionRate, setTempConversionRate] = useState(getCachedConversionRate());
  const [updatingRate, setUpdatingRate] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Also try to load conversion rate independently
    loadConversionRate();
  }, []);

  const loadConversionRate = async () => {
    try {
      console.log('🔄 Loading conversion rate independently...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const rateData = await Promise.race([
        apiService.getConversionRate(),
        timeoutPromise
      ]);
      
      console.log('💱 Independent conversion rate response:', rateData);
      if (rateData.success && rateData.conversionRate) {
        setConversionRate(rateData.conversionRate);
        setTempConversionRate(rateData.conversionRate);
        // Cache in localStorage for faster loading next time
        localStorage.setItem('conversionRate', rateData.conversionRate.toString());
        console.log('✅ Conversion rate loaded successfully:', rateData.conversionRate);
      } else {
        console.log('⚠️ API succeeded but no conversion rate data');
        // Fallback to database default
        setConversionRate(400); 
        setTempConversionRate(400);
      }
    } catch (error) {
      console.error('❌ Failed to load conversion rate:', error);
      console.log('🔄 Using fallback value 400');
      // Fallback to database default
      setConversionRate(400);
      setTempConversionRate(400);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we're using mock authentication
      const token = localStorage.getItem('auth_token');
      if (token === 'mock-token-for-testing') {
        // Use mock data when backend is not available
        setTimeout(() => {
          setStats({
            totalSellers: 24,
            activeSellers: 18,
            totalProducts: 1247,
            pendingProducts: 23,
            totalRevenue: 45670,
            monthlyRevenue: 12450,
            totalOrders: 156,
            pendingOrders: 8
          });

          setRecentSellers([
            { id: 1, businessName: 'Tech Solutions Ltd', email: 'contact@techsolutions.com', status: 'pending', registrationDate: '2024-01-15' },
            { id: 2, businessName: 'Fashion Forward', email: 'info@fashionforward.com', status: 'active', registrationDate: '2024-01-14' },
            { id: 3, businessName: 'Home & Garden Co', email: 'sales@homegarden.com', status: 'pending', registrationDate: '2024-01-13' }
          ]);

          setRecentActivity([
            { id: 1, type: 'seller_registered', description: 'New seller registration: Tech Solutions Ltd', timestamp: '2024-01-15T10:30:00Z' },
            { id: 2, type: 'product_added', description: '25 new products added to catalog', timestamp: '2024-01-15T09:15:00Z' },
            { id: 3, type: 'order_placed', description: 'New order #ORD-1001 placed', timestamp: '2024-01-15T08:45:00Z' }
          ]);

          setTopCategories([
            { name: 'Electronics', productCount: 456, revenue: 18500 },
            { name: 'Fashion', productCount: 312, revenue: 12300 },
            { name: 'Home & Garden', productCount: 289, revenue: 9800 },
            { name: 'Sports', productCount: 190, revenue: 5070 }
          ]);

          setLoading(false);
        }, 1000); // Simulate API delay
        return;
      }

      // Fetch dashboard data with individual error handling
      const results = await Promise.allSettled([
        apiService.get('/admin/dashboard/stats'),
        apiService.get('/admin/dashboard/recent-sellers'),
        apiService.get('/admin/dashboard/recent-activity'),
        apiService.get('/admin/dashboard/top-categories'),
        apiService.getConversionRate()
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

      // Handle conversion rate data
      if (results[4].status === 'fulfilled') {
        const rateData = results[4].value;
        console.log('💱 Conversion rate API response:', rateData);
        if (rateData.success && rateData.conversionRate) {
          console.log('✅ Setting conversion rate to:', rateData.conversionRate);
          setConversionRate(rateData.conversionRate);
          setTempConversionRate(rateData.conversionRate);
        } else {
          console.log('⚠️ Conversion rate API succeeded but no data, keeping default');
        }
      } else {
        console.log('❌ Conversion rate API failed:', results[4].reason);
        // Try to fetch conversion rate separately
        try {
          const fallbackRate = await apiService.getConversionRate();
          console.log('🔄 Fallback conversion rate:', fallbackRate);
          if (fallbackRate.success && fallbackRate.conversionRate) {
            setConversionRate(fallbackRate.conversionRate);
            setTempConversionRate(fallbackRate.conversionRate);
          }
        } catch (error) {
          console.log('❌ Fallback conversion rate also failed:', error);
        }
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

  const handleEditRate = () => {
    setIsEditingRate(true);
    setTempConversionRate(conversionRate);
  };

  const handleSaveRate = async () => {
    try {
      console.log('🔄 Starting conversion rate update...');
      console.log('📊 Current temp rate:', tempConversionRate);
      console.log('🎯 API token:', localStorage.getItem('auth_token'));
      
      setUpdatingRate(true);
      const result = await apiService.updateConversionRate(tempConversionRate);
      console.log('📤 API result:', result);
      
      if (result.success) {
        setConversionRate(tempConversionRate);
        setIsEditingRate(false);
        // Cache in localStorage for faster loading
        localStorage.setItem('conversionRate', tempConversionRate.toString());
        console.log('✅ Conversion rate updated successfully');
        alert('Conversion rate updated successfully!');
      } else {
        console.log('❌ Update failed:', result.message);
        alert(`Failed to update: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Failed to update conversion rate:', error);
      alert(`Error: ${error.message}`);
      setTempConversionRate(conversionRate); // Revert to previous value
    } finally {
      setUpdatingRate(false);
    }
  };

  const handleCancelEdit = () => {
    setTempConversionRate(conversionRate);
    setIsEditingRate(false);
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
              {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span style={{ marginLeft: '4px' }}>{Math.abs(trend)}% vs last month</span>
            </div>
          )}
        </div>
        <div style={{ color: 'var(--primary-medium)' }}>{icon}</div>
      </div>
    </div>
  );

  const getActivityIcon = (type) => {
    switch (type) {
      case 'seller': return <Users size={20} />;
      case 'product': return <Package size={20} />;
      case 'pricing': return <DollarSign size={20} />;
      default: return <Activity size={20} />;
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
            icon={<Users size={24} />}
            trend={18}
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            subtitle={`${stats.pendingProducts} pending approval`}
            icon={<Package size={24} />}
            trend={12}
          />
          <StatCard
            title="Platform Revenue"
            value={`£${stats.monthlyRevenue.toFixed(2)}`}
            subtitle="This month"
            icon={<DollarSign size={24} />}
            trend={24}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle={`${stats.pendingOrders} pending`}
            icon={<ShoppingCart size={24} />}
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
                      <td className="font-semibold">£{seller.revenue.toFixed(2)}</td>
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

        {/* LKR Conversion Rate Section */}
        <div style={{ 
          padding: '0 var(--space-6)',
          marginTop: 'var(--space-6)'
        }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">LKR Conversion Rate</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500',
                    color: 'var(--text-secondary)' 
                  }}>
                    1 GBP = LKR
                  </label>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--space-3)',
                    padding: '0.75rem',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--background)',
                    transition: 'border-color 0.2s'
                  }}>
                    {isEditingRate ? (
                      <>
                        <input
                          type="number"
                          value={tempConversionRate || ''}
                          onChange={(e) => setTempConversionRate(parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveRate();
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          disabled={updatingRate}
                          min="1"
                          max="1000"
                          step="0.01"
                          style={{
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            fontSize: '1rem',
                            color: 'var(--text-primary)',
                            backgroundColor: 'transparent'
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={handleSaveRate}
                            disabled={updatingRate}
                            style={{
                              padding: '0.25rem',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--success)',
                              color: 'white',
                              cursor: updatingRate ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: updatingRate ? 0.6 : 1
                            }}
                            title="Save"
                          >
                            {updatingRate ? (
                              <div className="spinner" style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid white',
                                borderTopColor: 'transparent',
                                borderRadius: '50%'
                              }} />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={updatingRate}
                            style={{
                              padding: '0.25rem',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--error)',
                              color: 'white',
                              cursor: updatingRate ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              opacity: updatingRate ? 0.6 : 1
                            }}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span style={{ 
                          flex: 1, 
                          fontSize: '1rem', 
                          fontWeight: '600',
                          color: 'var(--text-primary)' 
                        }}>
                          {conversionRate.toFixed(2)}
                        </span>
                        <button
                          onClick={handleEditRate}
                          style={{
                            padding: '0.25rem',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--primary-medium)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Edit conversion rate"
                        >
                          <Edit3 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p style={{ 
                marginTop: '0.75rem', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)' 
              }}>
                This conversion rate is used to calculate admin prices: ((base price × margin) + shipping fee) × conversion rate
              </p>
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
                    <p className="font-semibold text-sm" style={{ color: 'var(--primary-dark)' }}>£{category.revenue.toFixed(2)}</p>
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
                <div className="quick-action-icon"><Users size={24} /></div>
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
                <div className="quick-action-icon"><Package size={24} /></div>
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
                <div className="quick-action-icon"><DollarSign size={24} /></div>
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
                <div className="quick-action-icon"><ShoppingCart size={24} /></div>
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