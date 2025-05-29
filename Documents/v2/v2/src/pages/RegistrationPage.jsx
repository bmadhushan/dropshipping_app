
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Section from '../components/common/Section';

const RegistrationPage = ({ darkMode }) => {
  const { registerSeller } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessAddress: '',
    businessType: '',
    categoryInterests: [],
    taxId: '',
    description: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'Clothing', 'Electronics', 'Home & Garden', 'Sports', 'Beauty', 
    'Books', 'Toys', 'Automotive', 'Food & Beverages', 'Health'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      categoryInterests: prev.categoryInterests.includes(category)
        ? prev.categoryInterests.filter(c => c !== category)
        : [...prev.categoryInterests, category]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      setStatus('idle');
      return;
    }
    
    if (formData.password.length < 4) {
      setErrorMessage('Password must be at least 4 characters long');
      setStatus('idle');
      return;
    }
    
    if (formData.categoryInterests.length === 0) {
      setErrorMessage('Please select at least one category interest');
      setStatus('idle');
      return;
    }
    
    try {
      const result = await registerSeller(formData);
      
      if (result.success) {
        setStatus('success');
        console.log('Registration submitted:', formData);
      } else {
        setStatus('error');
        setErrorMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Registration failed. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="container mx-auto p-4">
        <Section title="Registration Submitted" darkMode={darkMode}>
          <div className="text-center py-8">
            <div className="text-green-500 text-6xl mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Application Submitted Successfully!</h3>
            <p className="text-gray-600 mb-4">
              Your seller application has been submitted for review. You will receive an email notification 
              once your application has been reviewed by our admin team.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Status: <span className="font-semibold text-yellow-600">Pending Approval</span>
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Go to Home
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Home
              </button>
            </div>
          </div>
        </Section>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Section title="Seller Registration" darkMode={darkMode}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Your Business Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Full Name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm your password"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="contact@business.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Address *</label>
            <textarea
              name="businessAddress"
              value={formData.businessAddress}
              onChange={handleInputChange}
              required
              rows="3"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Complete business address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Business Type</option>
                <option value="retailer">Retailer</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="distributor">Distributor</option>
                <option value="dropshipper">Dropshipper</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tax ID / Business License</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tax ID or Business License Number"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category Interests *</label>
            <p className="text-sm text-gray-600 mb-3">Select the product categories you're interested in selling:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categoryInterests.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="rounded"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Business Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about your business, experience, and goals..."
            />
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
};

export default RegistrationPage;