// Backup of full app
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';

import Navbar from './components/layout/Navbar';
import { AdminSidebar, SellerSidebar } from './components/layout/Sidebar';

// Page Imports
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminSellerManagementPage from './pages/admin/AdminSellerManagementPage';
import AdminProductManagementPage from './pages/admin/AdminProductManagementPage';
import AdminHeaderSettingsPage from './pages/admin/AdminHeaderSettingsPage';
import AdminPricingSettingsPage from './pages/admin/AdminPricingSettingsPage';
import AdminOrderReviewPage from './pages/admin/AdminOrderReviewPage';

// Seller Pages
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import SellerProductPanelPage from './pages/seller/SellerProductPanelPage';
import SellerExportCsvPage from './pages/seller/SellerExportCsvPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';

// Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { userRole, currentUser } = useAuth();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return children ? children : <Outlet />;
};

// Layout for Admin pages
const AdminLayout = ({ darkMode }) => (
  <div className="flex">
    <AdminSidebar darkMode={darkMode} />
    <main className="flex-1 p-6">
      <Outlet context={{ darkMode }} />
    </main>
  </div>
);

// Layout for Seller pages
const SellerLayout = ({ darkMode }) => (
  <div className="flex">
    <SellerSidebar darkMode={darkMode} />
    <main className="flex-1 p-6">
      <Outlet context={{ darkMode }} />
    </main>
  </div>
);

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage darkMode={darkMode}/>} />
              <Route path="/login" element={<LoginPage darkMode={darkMode}/>} />
              <Route path="/register" element={<RegistrationPage darkMode={darkMode}/>} />

              <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/admin" element={<AdminLayout darkMode={darkMode} />}>
                  <Route path="dashboard" element={<AdminDashboardPage darkMode={darkMode}/>} />
                  <Route path="sellers" element={<AdminSellerManagementPage darkMode={darkMode}/>} />
                  <Route path="products" element={<AdminProductManagementPage darkMode={darkMode}/>} />
                  <Route path="headers" element={<AdminHeaderSettingsPage darkMode={darkMode}/>} />
                  <Route path="pricing" element={<AdminPricingSettingsPage darkMode={darkMode}/>} />
                  <Route path="orders" element={<AdminOrderReviewPage darkMode={darkMode}/>} />
                  <Route index element={<Navigate to="dashboard" />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
                 <Route path="/seller" element={<SellerLayout darkMode={darkMode} />}>
                  <Route path="dashboard" element={<SellerDashboardPage darkMode={darkMode}/>} />
                  <Route path="products" element={<SellerProductPanelPage darkMode={darkMode}/>} />
                  <Route path="export" element={<SellerExportCsvPage darkMode={darkMode}/>} />
                  <Route path="orders" element={<SellerOrdersPage darkMode={darkMode}/>} />
                  <Route index element={<Navigate to="dashboard" />} />
                </Route>
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
          <footer className={`text-center py-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
            Multi-Layer E-commerce Platform © {new Date().getFullYear()}
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;