import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/theme.css';
import logoSvg from '../../assets/logo animation_1.svg';

const SellerLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/seller' },
    { id: 'products', label: 'My Products', icon: '📦', path: '/seller/products' },
    { id: 'orders', label: 'Orders', icon: '🛒', path: '/seller/orders' },
    { id: 'export', label: 'Export CSV', icon: '📁', path: '/seller/export' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: 'var(--bg-secondary)' }}>
      {/* Sidebar */}
      <div style={{ 
        width: sidebarOpen ? '256px' : '64px', 
        backgroundColor: 'var(--bg-primary)', 
        boxShadow: 'var(--shadow-lg)',
        transition: 'all 0.3s',
        position: 'relative',
        borderRight: '1px solid var(--border-light)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img 
              src={logoSvg} 
              alt="Blitzify" 
              style={{ height: '70px', width: '100%' }}
            />
          </div>
        </div>

        <nav style={{ marginTop: 'var(--space-8)', flex: '1' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 'var(--space-3)',
                padding: 'var(--space-3) var(--space-4)',
                textAlign: 'left',
                border: 'none',
                backgroundColor: location.pathname === item.path ? 'var(--bg-accent)' : 'transparent',
                color: location.pathname === item.path ? 'var(--primary-dark)' : 'var(--text-secondary)',
                borderRight: location.pathname === item.path ? '3px solid var(--primary-medium)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: location.pathname === item.path ? '600' : '500',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-accent)';
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }
              }}
              onMouseLeave={(e) => {
                if (location.pathname !== item.path) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ 
          position: 'absolute', 
          bottom: '0', 
          width: '100%', 
          padding: 'var(--space-4)', 
          borderTop: '1px solid var(--border-light)',
          backgroundColor: 'var(--bg-primary)'
        }}>
          <div 
            onClick={() => navigate('/seller/profile')}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--space-3)',
              cursor: 'pointer',
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              transition: 'background-color 0.2s',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: 'var(--primary-medium)', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--text-white)'
            }}>
              👤
            </div>
            {sidebarOpen && (
              <div style={{ flex: '1' }}>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.businessName || 'Seller'}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{user?.email}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={logout}
              style={{
                width: '100%',
                marginTop: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                fontSize: '14px',
                color: 'var(--error)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ 
          backgroundColor: 'var(--bg-primary)', 
          boxShadow: 'var(--shadow-sm)', 
          borderBottom: '1px solid var(--border-light)', 
          padding: 'var(--space-4) var(--space-6)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '18px',
                color: 'var(--text-light)',
                cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = 'var(--primary-dark)'}
              onMouseLeave={(e) => e.target.style.color = 'var(--text-light)'}
            >
              ☰
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ 
                  width: '8px', 
                  height: '8px', 
                  backgroundColor: 'var(--success)', 
                  borderRadius: '50%' 
                }}></span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Status: Active</span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-light)' }}>
                Last login: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: '1', overflowY: 'auto', padding: 'var(--space-6)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;