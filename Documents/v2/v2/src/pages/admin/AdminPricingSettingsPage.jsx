import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import '../../styles/theme.css';

const AdminPricingSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [pricingRules, setPricingRules] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    defaultMargin: 25,
    defaultTax: 2,
    defaultShipping: 3,
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [calculatorData, setCalculatorData] = useState({
    basePrice: 20.00,
    category: '',
    result: null
  });
  const [formData, setFormData] = useState({
    category: '',
    adminMargin: 25,
    adminTax: 2,
    adminShipping: 3,
    minimumPrice: 5.00,
    maximumDiscount: 40,
    active: true
  });

  const categories = [
    'Snacks & Sweets', 'Cosmetics & Skincare', 'Fashion & Footwear', 
    'Electronics', 'Home & Kitchen', 'Health & Wellness', 'Toys & Games'
  ];

  // Fetch pricing rules
  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.request('/admin/pricing/rules');
      setPricingRules(response.rules || []);
    } catch (err) {
      setError('Failed to fetch pricing rules');
      console.error('Error fetching pricing rules:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch global settings
  const fetchGlobalSettings = async () => {
    try {
      const response = await apiService.request('/admin/pricing/global');
      setGlobalSettings(response.settings || globalSettings);
    } catch (err) {
      console.error('Error fetching global settings:', err);
    }
  };

  useEffect(() => {
    fetchPricingRules();
    fetchGlobalSettings();
  }, []);

  // Create pricing rule
  const handleCreateRule = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.request('/admin/pricing/rules', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      await fetchPricingRules();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError('Failed to create pricing rule');
      console.error('Error creating pricing rule:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update pricing rule
  const handleUpdateRule = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.request(`/admin/pricing/rules/${editingRule.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData)
      });
      await fetchPricingRules();
      setShowModal(false);
      setEditingRule(null);
      resetForm();
    } catch (err) {
      setError('Failed to update pricing rule');
      console.error('Error updating pricing rule:', err);
    } finally {
      setLoading(false);
    }
  };

  // Delete pricing rule
  const handleDeleteRule = async (ruleId) => {
    if (confirm('Are you sure you want to delete this pricing rule?')) {
      try {
        setLoading(true);
        setError(null);
        await apiService.request(`/admin/pricing/rules/${ruleId}`, {
          method: 'DELETE'
        });
        await fetchPricingRules();
      } catch (err) {
        setError('Failed to delete pricing rule');
        console.error('Error deleting pricing rule:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle rule active status
  const handleToggleActive = async (ruleId) => {
    try {
      const rule = pricingRules.find(r => r.id === ruleId);
      await apiService.request(`/admin/pricing/rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !rule.active })
      });
      await fetchPricingRules();
    } catch (err) {
      setError('Failed to toggle rule status');
      console.error('Error toggling rule status:', err);
    }
  };

  // Update global settings
  const handleUpdateGlobalSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      await apiService.request('/admin/pricing/global', {
        method: 'PATCH',
        body: JSON.stringify(globalSettings)
      });
      alert('Global settings updated successfully!');
    } catch (err) {
      setError('Failed to update global settings');
      console.error('Error updating global settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate price
  const handleCalculatePrice = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.request('/admin/pricing/calculate', {
        method: 'POST',
        body: JSON.stringify({
          basePrice: calculatorData.basePrice,
          category: calculatorData.category
        })
      });
      setCalculatorData(prev => ({ ...prev, result: response }));
    } catch (err) {
      setError('Failed to calculate price');
      console.error('Error calculating price:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: '',
      adminMargin: 25,
      adminTax: 2,
      adminShipping: 3,
      minimumPrice: 5.00,
      maximumDiscount: 40,
      active: true
    });
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      category: rule.category,
      adminMargin: rule.adminMargin,
      adminTax: rule.adminTax,
      adminShipping: rule.adminShipping,
      minimumPrice: rule.minimumPrice,
      maximumDiscount: rule.maximumDiscount,
      active: rule.active
    });
    setShowModal(true);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'var(--primary-medium)' }) => (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="stat-label">{title}</p>
          <p className="stat-value">{value}</p>
          {subtitle && <p className="stat-subtitle">{subtitle}</p>}
        </div>
        <div style={{ fontSize: '2rem', color }}>{icon}</div>
      </div>
    </div>
  );

  const TabButton = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={isActive ? 'btn btn-primary' : 'btn btn-outline'}
      style={{ marginRight: 'var(--space-2)' }}
    >
      {children}
    </button>
  );

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Pricing Settings</h1>
          <p className="dashboard-subtitle">Configure pricing rules, margins, and billing settings</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ 
          padding: '0 var(--space-6)', 
          marginBottom: 'var(--space-4)' 
        }}>
          <div style={{ 
            backgroundColor: 'var(--error-light)', 
            color: 'var(--error)', 
            padding: 'var(--space-3)', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--error)'
          }}>
            {error}
          </div>
        </div>
      )}

      <div style={{ padding: '0 var(--space-6)' }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: 'var(--space-6)', 
          marginBottom: 'var(--space-6)' 
        }}>
          <StatCard
            title="Active Rules"
            value={pricingRules.filter(r => r.active).length}
            subtitle={`${pricingRules.length} total rules`}
            icon="💰"
          />
          <StatCard
            title="Average Margin"
            value={pricingRules.length > 0 ? Math.round(pricingRules.reduce((acc, r) => acc + r.adminMargin, 0) / pricingRules.length) + '%' : '0%'}
            subtitle="Across all categories"
            icon="📈"
          />
          <StatCard
            title="Categories Covered"
            value={pricingRules.length}
            subtitle={`${categories.length} total categories`}
            icon="📂"
          />
          <StatCard
            title="Currency"
            value={globalSettings.currency}
            subtitle="Base currency"
            icon="💵"
          />
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <TabButton 
            isActive={activeTab === 'categories'} 
            onClick={() => setActiveTab('categories')}
          >
            📂 Category Rules
          </TabButton>
          <TabButton 
            isActive={activeTab === 'global'} 
            onClick={() => setActiveTab('global')}
          >
            🌐 Global Settings
          </TabButton>
          <TabButton 
            isActive={activeTab === 'calculator'} 
            onClick={() => setActiveTab('calculator')}
          >
            🧮 Price Calculator
          </TabButton>
          <TabButton 
            isActive={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
          >
            📊 Change History
          </TabButton>
        </div>

        {/* Category Rules Tab */}
        {activeTab === 'categories' && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Category Pricing Rules</h3>
                <button 
                  onClick={() => {
                    setEditingRule(null);
                    resetForm();
                    setShowModal(true);
                  }}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  ➕ Add New Rule
                </button>
              </div>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <div style={{ 
                  backgroundColor: 'var(--bg-accent)', 
                  padding: 'var(--space-4)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <h4 className="font-semibold" style={{ color: 'var(--primary-dark)', marginBottom: 'var(--space-2)' }}>
                    💡 Pricing Formula
                  </h4>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
                    <strong>Admin Price = (Base Price × Admin Margin) + Admin Tax + Admin Shipping</strong>
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-light)' }}>
                    Example: $20 × 1.25 (25%) + $2 tax + $3 shipping = $30 admin price
                  </p>
                </div>
              </div>
              
              {loading ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
                  Loading pricing rules...
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Admin Margin</th>
                      <th>Admin Tax</th>
                      <th>Admin Shipping</th>
                      <th>Min Price</th>
                      <th>Max Discount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRules.map(rule => (
                      <tr key={rule.id}>
                        <td className="font-semibold">{rule.category}</td>
                        <td>{rule.adminMargin}%</td>
                        <td>${rule.adminTax.toFixed(2)}</td>
                        <td>${rule.adminShipping.toFixed(2)}</td>
                        <td>${rule.minimumPrice.toFixed(2)}</td>
                        <td>{rule.maximumDiscount}%</td>
                        <td>
                          <span className={`badge ${
                            rule.active ? 'badge-success' : 'badge-warning'
                          }`}>
                            {rule.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                            <button
                              onClick={() => openEditModal(rule)}
                              className="btn btn-outline"
                              disabled={loading}
                              style={{
                                fontSize: '12px',
                                padding: 'var(--space-1) var(--space-3)'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(rule.id)}
                              className="btn btn-secondary"
                              disabled={loading}
                              style={{
                                fontSize: '12px',
                                padding: 'var(--space-1) var(--space-3)',
                                backgroundColor: rule.active ? 'var(--warning)' : 'var(--success)'
                              }}
                            >
                              {rule.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteRule(rule.id)}
                              className="btn btn-secondary"
                              disabled={loading}
                              style={{
                                fontSize: '12px',
                                padding: 'var(--space-1) var(--space-3)',
                                backgroundColor: 'var(--error)'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!loading && pricingRules.length === 0 && (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No pricing rules configured yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Settings Tab */}
        {activeTab === 'global' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Global Pricing Settings</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Default Values</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Default Admin Margin (%)
                      </label>
                      <input 
                        type="number"
                        value={globalSettings.defaultMargin}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, defaultMargin: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Default Admin Tax ($)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={globalSettings.defaultTax}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, defaultTax: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Default Admin Shipping ($)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={globalSettings.defaultShipping}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, defaultShipping: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Currency & Regional</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Base Currency
                      </label>
                      <select 
                        value={globalSettings.currency}
                        onChange={(e) => setGlobalSettings(prev => ({ ...prev, currency: e.target.value }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                    <button 
                      onClick={handleUpdateGlobalSettings}
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      💾 Save Global Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price Calculator Tab */}
        {activeTab === 'calculator' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Price Calculator</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Calculate Pricing</h4>
                  <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Base Price ($)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={calculatorData.basePrice}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, basePrice: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)', color: 'var(--text-primary)' }}>
                        Category
                      </label>
                      <select 
                        value={calculatorData.category}
                        onChange={(e) => setCalculatorData(prev => ({ ...prev, category: e.target.value }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        <option value="">Select Category</option>
                        {pricingRules.map(rule => (
                          <option key={rule.id} value={rule.category}>{rule.category}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleCalculatePrice}
                      className="btn btn-primary"
                      disabled={loading || !calculatorData.category}
                    >
                      🧮 Calculate Price
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>
                    {calculatorData.result ? 'Calculation Result' : 'Example Calculation'}
                  </h4>
                  <div style={{ 
                    backgroundColor: 'var(--bg-accent)', 
                    padding: 'var(--space-4)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)'
                  }}>
                    {calculatorData.result ? (
                      <>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Base Price:</span>
                            <span className="font-semibold">${calculatorData.result.basePrice.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Margin ({calculatorData.result.adminMargin}%):</span>
                            <span>${calculatorData.result.basePrice.toFixed(2)} × {(1 + calculatorData.result.adminMargin / 100).toFixed(2)} = ${(calculatorData.result.basePrice * (1 + calculatorData.result.adminMargin / 100)).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Tax:</span>
                            <span>+ ${calculatorData.result.adminTax.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Shipping:</span>
                            <span>+ ${calculatorData.result.adminShipping.toFixed(2)}</span>
                          </div>
                          <div style={{ 
                            borderTop: '1px solid var(--border-light)', 
                            paddingTop: 'var(--space-2)', 
                            display: 'flex', 
                            justifyContent: 'space-between' 
                          }}>
                            <span className="font-semibold">Admin Price:</span>
                            <span className="font-semibold" style={{ color: 'var(--primary-dark)' }}>${calculatorData.result.adminPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          This is the price sellers will see as their base price for further markup.
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Base Price:</span>
                            <span className="font-semibold">$20.00</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Margin (25%):</span>
                            <span>$20.00 × 1.25 = $25.00</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Tax:</span>
                            <span>+ $2.00</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                            <span>Admin Shipping:</span>
                            <span>+ $3.00</span>
                          </div>
                          <div style={{ 
                            borderTop: '1px solid var(--border-light)', 
                            paddingTop: 'var(--space-2)', 
                            display: 'flex', 
                            justifyContent: 'space-between' 
                          }}>
                            <span className="font-semibold">Admin Price:</span>
                            <span className="font-semibold" style={{ color: 'var(--primary-dark)' }}>$30.00</span>
                          </div>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          Select a category and enter a base price to calculate.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change History Tab */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Pricing Change History</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {[
                  { date: '2024-01-15', action: 'Updated Snacks & Sweets margin from 25% to 30%', user: 'B. Madhushan' },
                  { date: '2024-01-12', action: 'Added new pricing rule for Electronics category', user: 'B. Madhushan' },
                  { date: '2024-01-10', action: 'Changed global default shipping from $2 to $3', user: 'B. Madhushan' },
                  { date: '2024-01-08', action: 'Deactivated Fashion & Footwear bulk discounts', user: 'B. Madhushan' }
                ].map((change, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon" style={{ backgroundColor: 'var(--primary-medium)' }}>
                      💰
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{change.action}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>By {change.user}</p>
                      <p className="text-xs" style={{ color: 'var(--text-light)' }}>{change.date}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: 'var(--space-6)', textAlign: 'center' }}>
                <button 
                  className="btn btn-outline"
                  disabled
                >
                  📄 History coming soon
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Create/Edit Pricing Rule */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div className="card" style={{
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div className="card-header">
                <h3 className="card-title">
                  {editingRule ? 'Edit Pricing Rule' : 'Create New Pricing Rule'}
                </h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="btn btn-outline"
                      style={{ width: '100%', textAlign: 'left' }}
                      disabled={editingRule}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Admin Margin (%)
                      </label>
                      <input
                        type="number"
                        value={formData.adminMargin}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminMargin: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Admin Tax ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.adminTax}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminTax: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Admin Shipping ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.adminShipping}
                        onChange={(e) => setFormData(prev => ({ ...prev, adminShipping: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Minimum Price ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.minimumPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, minimumPrice: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Maximum Discount (%)
                      </label>
                      <input
                        type="number"
                        value={formData.maximumDiscount}
                        onChange={(e) => setFormData(prev => ({ ...prev, maximumDiscount: Number(e.target.value) }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      />
                    </div>
                    <div>
                      <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Status
                      </label>
                      <select
                        value={formData.active}
                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                        className="btn btn-outline"
                        style={{ width: '100%', textAlign: 'left' }}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setEditingRule(null);
                        resetForm();
                      }}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingRule ? handleUpdateRule : handleCreateRule}
                      className="btn btn-primary"
                      disabled={loading || !formData.category}
                    >
                      {editingRule ? 'Update Rule' : 'Create Rule'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPricingSettingsPage;