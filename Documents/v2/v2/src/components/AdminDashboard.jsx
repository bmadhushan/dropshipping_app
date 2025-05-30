import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSellers: 0,
    pendingSellers: 0,
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0
  });

  useEffect(() => {
    // Mock data - replace with API calls
    setStats({
      totalSellers: 47,
      pendingSellers: 5,
      totalProducts: 1247,
      totalOrders: 189,
      revenue: 45230.50
    });
  }, []);

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `3px solid ${color}`
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{icon}</div>
      <h3 style={{ margin: '0 0 5px 0', color: color, fontSize: '24px' }}>{value}</h3>
      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{title}</p>
      {subtitle && <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#666' }}>{subtitle}</p>}
    </div>
  );

  const RecentActivity = () => {
    const activities = [
      { type: 'seller', message: 'New seller registration: Fashion Forward LLC', time: '2 hours ago' },
      { type: 'order', message: 'Order #ORD-2024-189 needs review', time: '4 hours ago' },
      { type: 'product', message: '25 new products added to catalog', time: '6 hours ago' },
      { type: 'seller', message: 'Tech Solutions Inc approved', time: '1 day ago' },
    ];

    return (
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>📋 Recent Activity</h3>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {activities.map((activity, index) => (
            <div key={index} style={{
              padding: '10px',
              borderBottom: index < activities.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ margin: '0', fontSize: '14px' }}>{activity.message}</p>
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuickActions = () => (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ marginTop: '0', marginBottom: '15px' }}>⚡ Quick Actions</h3>
      <div style={{ display: 'grid', gap: '10px' }}>
        <button style={{
          padding: '12px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          👤 Review Pending Sellers ({stats.pendingSellers})
        </button>
        <button style={{
          padding: '12px',
          backgroundColor: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          📦 Add New Products
        </button>
        <button style={{
          padding: '12px',
          backgroundColor: '#f39c12',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          🛒 Review Orders
        </button>
        <button style={{
          padding: '12px',
          backgroundColor: '#9b59b6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          💰 Update Pricing Rules
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Dashboard Overview</h1>
        <p style={{ margin: '0', color: '#666' }}>
          Welcome to your admin dashboard. Here's what's happening in your e-commerce platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <StatCard
          title="Total Sellers"
          value={stats.totalSellers}
          icon="👥"
          color="#3498db"
          subtitle="Active sellers"
        />
        <StatCard
          title="Pending Reviews"
          value={stats.pendingSellers}
          icon="⏳"
          color="#f39c12"
          subtitle="Seller applications"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          icon="📦"
          color="#2ecc71"
          subtitle="In catalog"
        />
        <StatCard
          title="Orders"
          value={stats.totalOrders}
          icon="🛒"
          color="#9b59b6"
          subtitle="This month"
        />
        <StatCard
          title="Revenue"
          value={`£${stats.revenue.toLocaleString()}`}
          icon="💰"
          color="#e74c3c"
          subtitle="This month"
        />
      </div>

      {/* Bottom Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px'
      }}>
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
};

export default AdminDashboard;