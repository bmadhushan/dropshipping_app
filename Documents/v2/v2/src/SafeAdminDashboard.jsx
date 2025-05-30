import React, { useState, useEffect } from 'react';
import apiService from './services/api';
import { Edit3, Check, X } from 'lucide-react';

// Add keyframe animation inline
const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  if (!document.head.querySelector('style[data-spin-animation]')) {
    style.setAttribute('data-spin-animation', 'true');
    document.head.appendChild(style);
  }
}

const SafeAdminDashboard = ({ setCurrentPage }) => {
  console.log('SafeAdminDashboard rendering...');
  
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Conversion rate functions
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

  // Fetch conversion rate
  const fetchConversionRate = async () => {
    try {
      console.log('🔄 SafeAdminDashboard: Loading conversion rate...');
      const response = await apiService.getConversionRate();
      console.log('💱 SafeAdminDashboard: Conversion rate response:', response);
      if (response.success && response.conversionRate) {
        setConversionRate(response.conversionRate);
        setTempConversionRate(response.conversionRate);
        console.log('✅ SafeAdminDashboard: Conversion rate set to:', response.conversionRate);
      } else {
        // Fallback to database default
        console.log('⚠️ SafeAdminDashboard: No conversion rate in response, using fallback');
        setConversionRate(400);
        setTempConversionRate(400);
      }
    } catch (err) {
      console.error('❌ SafeAdminDashboard: Error fetching conversion rate:', err);
      // Fallback to database default
      setConversionRate(400);
      setTempConversionRate(400);
    }
  };

  useEffect(() => {
    console.log('SafeAdminDashboard useEffect - starting...');
    
    const loadData = async () => {
      try {
        console.log('Loading data...');
        
        // Check if we have a real auth token
        const token = localStorage.getItem('auth_token');
        if (token && token !== 'mock-token-for-testing') {
          // Try to fetch real conversion rate
          await fetchConversionRate();
        }
        
        // Simulate mock data loading
        setTimeout(() => {
          console.log('Setting mock stats...');
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
          setLoading(false);
          console.log('Data loaded successfully');
        }, 500);
        
      } catch (err) {
        console.error('Error in loadData:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  console.log('SafeAdminDashboard - loading:', loading, 'error:', error);

  if (loading) {
    console.log('Rendering loading state...');
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'white', minHeight: '400px' }}>
        <h2>Loading Dashboard...</h2>
        <p>Please wait while we load your dashboard data.</p>
      </div>
    );
  }

  if (error) {
    console.log('Rendering error state...');
    return (
      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'white', minHeight: '400px' }}>
        <h2 style={{ color: 'red' }}>Error Loading Dashboard</h2>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }

  console.log('Rendering dashboard content with stats:', stats);

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#354B4A', marginBottom: '10px' }}>Admin Dashboard</h1>
        <p style={{ color: '#819878' }}>Platform overview and management console</p>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#354B4A' }}>Total Sellers</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#354B4A' }}>
            {stats.totalSellers}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#819878' }}>
            {stats.activeSellers} active
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#354B4A' }}>Total Products</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#354B4A' }}>
            {stats.totalProducts}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#819878' }}>
            {stats.pendingProducts} pending approval
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#354B4A' }}>Platform Revenue</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#354B4A' }}>
            £{stats.monthlyRevenue.toFixed(2)}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#819878' }}>This month</p>
        </div>

        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#354B4A' }}>Total Orders</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#354B4A' }}>
            {stats.totalOrders}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#819878' }}>
            {stats.pendingOrders} pending
          </p>
        </div>
      </div>

      {/* LKR Conversion Rate Section */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '30px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <span style={{ 
            fontSize: '16px', 
            fontWeight: '600',
            color: '#354B4A',
            whiteSpace: 'nowrap'
          }}>
            LKR Conversion Rate: 1 GBP =
          </span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            padding: '8px 12px',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: 'white',
            minWidth: '120px'
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
                    width: '80px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    color: '#354B4A',
                    backgroundColor: 'transparent',
                    textAlign: 'center'
                  }}
                  autoFocus
                />
                <button
                  onClick={handleSaveRate}
                  disabled={updatingRate}
                  style={{
                    padding: '4px',
                    border: 'none',
                    borderRadius: '3px',
                    backgroundColor: '#9DBA91',
                    color: 'white',
                    cursor: updatingRate ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: updatingRate ? 0.6 : 1
                  }}
                  title="Save"
                >
                  {updatingRate ? (
                    <div style={{
                      width: '12px',
                      height: '12px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite'
                    }} />
                  ) : (
                    <Check size={12} />
                  )}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={updatingRate}
                  style={{
                    padding: '4px',
                    border: 'none',
                    borderRadius: '3px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    cursor: updatingRate ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: updatingRate ? 0.6 : 1
                  }}
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: '600',
                  color: '#354B4A',
                  textAlign: 'center',
                  minWidth: '60px'
                }}>
                  {conversionRate.toFixed(2)}
                </span>
                <button
                  onClick={handleEditRate}
                  style={{
                    padding: '4px',
                    border: 'none',
                    borderRadius: '3px',
                    backgroundColor: '#9DBA91',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Edit conversion rate"
                >
                  <Edit3 size={12} />
                </button>
              </>
            )}
          </div>
          <span style={{ 
            fontSize: '14px', 
            color: '#819878',
            fontStyle: 'italic'
          }}>
            Formula: ((base price × margin) + shipping fee) × conversion rate
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#354B4A' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <button 
            onClick={() => setCurrentPage && setCurrentPage('sellers')}
            style={{
              padding: '15px',
              backgroundColor: '#9DBA91',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            👥 Seller Management
          </button>
          <button 
            onClick={() => setCurrentPage && setCurrentPage('products')}
            style={{
              padding: '15px',
              backgroundColor: '#9DBA91',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            📦 Product Management
          </button>
          <button 
            onClick={() => setCurrentPage && setCurrentPage('orders')}
            style={{
              padding: '15px',
              backgroundColor: '#9DBA91',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            🛒 Order Review
          </button>
          <button 
            onClick={() => setCurrentPage && setCurrentPage('pricing')}
            style={{
              padding: '15px',
              backgroundColor: '#9DBA91',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            💰 Pricing Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafeAdminDashboard;