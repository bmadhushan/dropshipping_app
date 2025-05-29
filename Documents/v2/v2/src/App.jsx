import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext.jsx';
import { OrderProvider } from './contexts/OrderContext.jsx';
import { ProductProvider } from './contexts/ProductContext.jsx';

import HomePage from './pages/HomePage.jsx';
import RegistrationPage from './pages/RegistrationPage.jsx';
import AdminLayout from './components/layout/AdminLayout.jsx';
import SellerManagement from './components/SellerManagement.jsx';

// Import Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage.jsx';
import SellerProductPanelPage from './pages/seller/SellerProductPanelPage.jsx';
import SellerProductDetailPage from './pages/seller/SellerProductDetailPage.jsx';
import SellerOrdersPage from './pages/seller/SellerOrdersPage.jsx';
import SellerExportCsvPage from './pages/seller/SellerExportCsvPage.jsx';
import SellerProfilePage from './pages/seller/SellerProfilePage.jsx';

// Import Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminPricingSettingsPage from './pages/admin/AdminPricingSettingsPage.jsx';
import AdminProductManagementPage from './pages/admin/AdminProductManagementPage.jsx';
import AdminOrderReviewPage from './pages/admin/AdminOrderReviewPage.jsx';
import AdminCategoryManagementPage from './pages/admin/AdminCategoryManagementPage.jsx';

// Simple Layout Component for public pages
const SimpleLayout = ({ children }) => (
  <div style={{ 
    minHeight: '100vh', 
    padding: '20px', 
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0f0f0'
  }}>
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <nav style={{ marginBottom: '20px', textAlign: 'center' }}>
        <a href="/" style={{ marginRight: '10px', padding: '10px', textDecoration: 'none', color: '#007bff' }}>Home</a>
      </nav>
      {children}
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { userRole, currentUser, loading } = useAuth();
  
  // Show loading while authentication is being initialized
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px'
    }}>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

// Complete Admin Panel
const AdminPanel = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboardPage setCurrentPage={setCurrentPage} />;
      case 'sellers':
        return <SellerManagement />;
      case 'products':
        return <AdminProductManagementPage darkMode={false} />;
      case 'categories':
        return <AdminCategoryManagementPage />;
      case 'pricing':
        return <AdminPricingSettingsPage darkMode={false} />;
      case 'orders':
        return <AdminOrderReviewPage />;
      default:
        return <AdminDashboardPage setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <AdminLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderContent()}
    </AdminLayout>
  );
};

// Seller Routes Component
const SellerRoutes = () => (
  <Routes>
    <Route path="/" element={<SellerDashboardPage />} />
    <Route path="/products" element={<SellerProductPanelPage />} />
    <Route path="/products/:productId" element={<SellerProductDetailPage />} />
    <Route path="/orders" element={<SellerOrdersPage />} />
    <Route path="/export" element={<SellerExportCsvPage />} />
    <Route path="/profile" element={<SellerProfilePage />} />
    <Route path="*" element={<Navigate to="/seller" />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <OrderProvider>
          <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            
            <Route path="/register" element={
              <SimpleLayout>
                <RegistrationPage />
              </SimpleLayout>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <AdminPanel />
              </ProtectedRoute>
            } />

            {/* Seller Routes */}
            <Route path="/seller/*" element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerRoutes />
              </ProtectedRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
        </OrderProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;