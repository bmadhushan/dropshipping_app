import { useState, useEffect } from 'react';
import Section from '../../components/common/Section.jsx';

const AdminPricingSettingsPage = ({ darkMode }) => {
  const [pricingRules, setPricingRules] = useState([]);
  const [editingRule, setEditingRule] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  const categories = ['Clothing', 'Electronics', 'Home & Garden', 'Sports', 'Beauty', 'Books', 'Toys', 'Automotive'];

  // Mock data - replace with API call
  useEffect(() => {
    const mockPricingRules = [
      {
        id: 1,
        category: 'Clothing',
        adminMargin: 25,
        adminTax: 5,
        adminShipping: 2,
        conversionRates: {
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.73,
          CAD: 1.25
        },
        active: true
      },
      {
        id: 2,
        category: 'Electronics',
        adminMargin: 30,
        adminTax: 8,
        adminShipping: 5,
        conversionRates: {
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.73,
          CAD: 1.25
        },
        active: true
      },
      {
        id: 3,
        category: 'Home & Garden',
        adminMargin: 20,
        adminTax: 3,
        adminShipping: 8,
        conversionRates: {
          USD: 1.0,
          EUR: 0.85,
          GBP: 0.73,
          CAD: 1.25
        },
        active: true
      }
    ];
    setPricingRules(mockPricingRules);
  }, []);

  const handleSaveRule = (ruleData) => {
    if (editingRule) {
      setPricingRules(prev => prev.map(rule => 
        rule.id === editingRule.id ? { ...rule, ...ruleData } : rule
      ));
    } else {
      const newId = Math.max(...pricingRules.map(r => r.id)) + 1;
      setPricingRules(prev => [...prev, { ...ruleData, id: newId }]);
    }
    setEditingRule(null);
  };

  const handleToggleActive = (ruleId) => {
    setPricingRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    ));
  };

  const handleSaveAllSettings = async () => {
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
    }
  };

  const calculateSellerPrice = (basePrice, adminRule, sellerAdjustments = { margin: 15, tax: 2, shipping: 1 }, currency = 'USD') => {
    // Admin pricing calculation
    const adminMargin = (basePrice * adminRule.adminMargin) / 100;
    const adminTax = (basePrice * adminRule.adminTax) / 100;
    const adminTotal = basePrice + adminMargin + adminTax + adminRule.adminShipping;

    // Seller adjustments
    const sellerMargin = (adminTotal * sellerAdjustments.margin) / 100;
    const sellerTax = (adminTotal * sellerAdjustments.tax) / 100;
    const sellerTotal = adminTotal + sellerMargin + sellerTax + sellerAdjustments.shipping;

    // Apply conversion rate
    const conversionRate = adminRule.conversionRates[currency] || 1;
    return sellerTotal * conversionRate;
  };

  const PricingRuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState(rule || {
      category: '',
      adminMargin: 25,
      adminTax: 5,
      adminShipping: 2,
      conversionRates: {
        USD: 1.0,
        EUR: 0.85,
        GBP: 0.73,
        CAD: 1.25
      },
      active: true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4">
              {rule ? 'Edit Pricing Rule' : 'Add Pricing Rule'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Margin (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.adminMargin}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminMargin: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Tax (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.adminTax}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminTax: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Shipping ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.adminShipping}
                    onChange={(e) => setFormData(prev => ({ ...prev, adminShipping: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Currency Conversion Rates</label>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(formData.conversionRates).map(([currency, rate]) => (
                    <div key={currency}>
                      <label className="block text-sm text-gray-600 mb-1">{currency}</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={rate}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          conversionRates: {
                            ...prev.conversionRates,
                            [currency]: parseFloat(e.target.value) || 0
                          }
                        }))}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm">Active (apply this rule to products)</span>
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {rule ? 'Update Rule' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <Section title="Multi-Layered Pricing Configuration" darkMode={darkMode}>
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            Configure pricing rules that will be applied to products based on their category. 
            These settings control admin margins, taxes, shipping costs, and currency conversion rates.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
