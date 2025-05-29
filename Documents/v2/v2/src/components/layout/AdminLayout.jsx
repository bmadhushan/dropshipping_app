import { useAuth } from '../../contexts/AuthContext';
import '../../styles/theme.css';
import logoSvg from '../../assets/logo animation_1.svg';

const AdminLayout = ({ children, currentPage, setCurrentPage }) => {
  const { logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'sellers', label: 'Seller Management', icon: '👥' },
    { id: 'products', label: 'Product Management', icon: '📦' },
    { id: 'categories', label: 'Category Management', icon: '📋' },
    { id: 'pricing', label: 'Pricing Settings', icon: '💰' },
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
        backgroundColor: 'var(--primary-dark)', 
        color: 'white', 
        padding: '20px',
        boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <img 
            src={logoSvg} 
            alt="Blitzify" 
            style={{ height: '70px', width: '100%' }}
          />
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
                backgroundColor: currentPage === item.id ? 'var(--primary-medium)' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.id) {
                  e.target.style.backgroundColor = 'var(--primary-light)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
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
              backgroundColor: '#84A98C',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
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
        backgroundColor: 'var(--bg-secondary)',
        overflow: 'auto',
        marginLeft: '250px'
      }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;