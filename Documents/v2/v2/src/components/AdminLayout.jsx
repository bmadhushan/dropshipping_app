import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

const AdminLayout = ({ children, currentPage, setCurrentPage }) => {
  const { logout, currentUser } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sellers', label: 'Seller Management', icon: '👥' },
    { id: 'products', label: 'Product Management', icon: '📦' },
    { id: 'pricing', label: 'Pricing Settings', icon: '💰' },
    { id: 'headers', label: 'CSV Headers', icon: '📋' },
    { id: 'orders', label: 'Order Review', icon: '🛒' }
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>Admin Panel</h2>
          <p style={{ margin: '0', fontSize: '14px', opacity: '0.8' }}>
            Welcome, {currentUser?.name}
          </p>
        </div>

        <nav>
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              style={{
                width: '100%',
                padding: '12px 15px',
                margin: '5px 0',
                backgroundColor: currentPage === item.id ? '#34495e' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '20px',
        backgroundColor: '#ecf0f1',
        overflow: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;