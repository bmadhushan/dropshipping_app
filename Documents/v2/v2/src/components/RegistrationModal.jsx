import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/registration-modal.css';
import logo from '../assets/logo animation_1.svg';

const RegistrationModal = ({ isOpen, onClose }) => {
  const { registerSeller } = useAuth();
  
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
      } else {
        setStatus('error');
        setErrorMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Registration failed. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
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
    setStatus('idle');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (status === 'success') {
    return (
      <>
        <div className="modal-overlay" onClick={handleClose} />
        <div className="registration-modal success-modal">
          <button className="modal-close" onClick={handleClose}>×</button>
          <div className="success-content">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Application Submitted Successfully!</h2>
            <p className="success-message">
              Your seller application has been submitted for review. You will receive an email notification 
              once your application has been reviewed by our admin team.
            </p>
            <p className="success-status">
              Status: <span className="status-badge">Pending Approval</span>
            </p>
            <button onClick={handleClose} className="btn-primary">
              Close
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="registration-modal">
        <button className="modal-close" onClick={handleClose}>×</button>
        
        <div className="registration-modal-header">
          <img src={logo} alt="Logo" className="registration-modal-logo" />
          <h2 className="registration-modal-title">Become a Seller</h2>
          <p className="registration-modal-subtitle">Join our dropshipping platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-section">
            <h3 className="section-title">Account Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Choose a username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Create password"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Business Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Your Business Name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Person *</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Full Name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="business@email.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="+94 77 123 4567"
                />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Business Address *</label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  required
                  rows="2"
                  className="form-input"
                  placeholder="Complete business address"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Business Type *</label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Type</option>
                  <option value="retailer">Retailer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="distributor">Distributor</option>
                  <option value="dropshipper">Dropshipper</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Tax ID (Optional)"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Category Interests *</h3>
            <div className="category-grid">
              {categories.map(category => (
                <label key={category} className="category-item">
                  <input
                    type="checkbox"
                    checked={formData.categoryInterests.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="category-checkbox"
                  />
                  <span className="category-label">{category}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Additional Information</h3>
            <div className="form-group full-width">
              <label className="form-label">Business Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="form-input"
                placeholder="Tell us about your business (Optional)"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="btn-primary"
            >
              {status === 'submitting' ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegistrationModal;