import { useState, useEffect } from 'react';
import SellerLayout from '../../components/layout/SellerLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import '../../styles/theme.css';

const SellerProfilePage = () => {
  const { currentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    contactPerson: '',
    phone: '',
    businessAddress: '',
    businessType: '',
    categoryInterests: [],
    taxId: '',
    description: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: ''
    },
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true }
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        businessName: currentUser.businessName || '',
        contactPerson: currentUser.contactPerson || '',
        phone: currentUser.phone || '',
        businessAddress: currentUser.businessAddress || '',
        businessType: currentUser.businessType || '',
        categoryInterests: currentUser.categoryInterests || [],
        taxId: currentUser.taxId || '',
        description: currentUser.description || '',
        website: currentUser.website || '',
        socialMedia: currentUser.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: ''
        },
        businessHours: currentUser.businessHours || {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '15:00', closed: false },
          sunday: { open: '10:00', close: '14:00', closed: true }
        }
      });
    }
  }, [currentUser]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Simulate API call to update profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // In a real app, you would call the API to update the user profile
      // const response = await apiService.updateUserProfile(formData);
      
    } catch (error) {
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    'retailer',
    'wholesaler',
    'distributor',
    'manufacturer',
    'dropshipper',
    'other'
  ];

  const categories = [
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Health & Beauty',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Automotive',
    'Food & Beverages',
    'Jewelry & Accessories'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <SellerLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Profile</h1>
              <p className="text-gray-600">Manage your business information and settings</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn btn-outline"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          {message && (
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: message.includes('Error') ? 'var(--error-light)' : 'var(--success-light)',
              color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Basic Information</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Business Information</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Business Address
                  </label>
                  <textarea
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Tax ID / Business Number
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Website
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      disabled={!isEditing}
                      placeholder="https://your-website.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Business Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    placeholder="Tell us about your business..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
                    Category Interests
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-2)' }}>
                    {categories.map(category => (
                      <label key={category} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <input
                          type="checkbox"
                          checked={formData.categoryInterests.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange('categoryInterests', [...formData.categoryInterests, category]);
                            } else {
                              handleInputChange('categoryInterests', formData.categoryInterests.filter(c => c !== category));
                            }
                          }}
                          disabled={!isEditing}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Social Media</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia.facebook}
                    onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia.instagram}
                    onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://instagram.com/yourpage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={formData.socialMedia.twitter}
                    onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                    disabled={!isEditing}
                    placeholder="https://twitter.com/yourpage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    style={{ backgroundColor: isEditing ? 'white' : 'var(--bg-accent)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Business Hours</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                {days.map(day => (
                  <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div className="text-sm font-medium" style={{ textTransform: 'capitalize' }}>
                      {day}
                    </div>
                    <div>
                      <input
                        type="time"
                        value={formData.businessHours[day].open}
                        onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                        disabled={!isEditing || formData.businessHours[day].closed}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        style={{ backgroundColor: isEditing && !formData.businessHours[day].closed ? 'white' : 'var(--bg-accent)' }}
                      />
                    </div>
                    <div>
                      <input
                        type="time"
                        value={formData.businessHours[day].close}
                        onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                        disabled={!isEditing || formData.businessHours[day].closed}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        style={{ backgroundColor: isEditing && !formData.businessHours[day].closed ? 'white' : 'var(--bg-accent)' }}
                      />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <input
                        type="checkbox"
                        checked={formData.businessHours[day].closed}
                        onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs">Closed</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Account Status</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Account Status
                  </label>
                  <div style={{ 
                    padding: 'var(--space-2)', 
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: currentUser?.status === 'active' ? 'var(--success-light)' : 'var(--warning-light)',
                    color: currentUser?.status === 'active' ? 'var(--success)' : 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}>
                    <span style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: currentUser?.status === 'active' ? 'var(--success)' : 'var(--warning)' 
                    }}></span>
                    <span className="text-sm font-medium" style={{ textTransform: 'capitalize' }}>
                      {currentUser?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Member Since
                  </label>
                  <div className="text-sm" style={{ 
                    padding: 'var(--space-2)', 
                    backgroundColor: 'var(--bg-accent)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    {currentUser?.registrationDate ? new Date(currentUser.registrationDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Security Settings</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  Change Password
                </h4>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: 'var(--space-3)' }}>
                  Update your password to keep your account secure
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 'var(--space-3)', maxWidth: '400px' }}>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    style={{ backgroundColor: 'var(--primary-medium)', color: 'var(--text-white)' }}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Details Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Billing Details</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: 'var(--space-3)' }}>
                  Billing is handled through Stripe. Manage your payment methods and billing information.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ 
                    padding: 'var(--space-3)', 
                    backgroundColor: 'var(--bg-accent)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          Current Plan
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                          Seller Pro Plan - $29.99/month
                        </p>
                      </div>
                      <span style={{ 
                        padding: 'var(--space-1) var(--space-2)', 
                        backgroundColor: 'var(--success-light)', 
                        color: 'var(--success)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Active
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      style={{ backgroundColor: 'var(--primary-medium)', color: 'var(--text-white)' }}
                    >
                      Manage Billing in Stripe
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      style={{ border: '1px solid var(--border-light)', backgroundColor: 'transparent' }}
                    >
                      View Payment History
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Downloading Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Invoice Management</h3>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: 'var(--space-3)' }}>
                  Download invoices by date range or individual orders
                </p>
                
                {/* Date Filter Section */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    Download by Date Range
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', alignItems: 'end', maxWidth: '600px' }}>
                    <div>
                      <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        From Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        To Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      style={{ backgroundColor: 'var(--success)', color: 'var(--text-white)' }}
                    >
                      📄 Download Invoices
                    </button>
                  </div>
                </div>

                {/* Order by Order Section */}
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    Download by Order
                  </h4>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'end', maxWidth: '400px' }}>
                    <div style={{ flex: '1' }}>
                      <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                        Order ID
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter order ID"
                      />
                    </div>
                    <button
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      style={{ backgroundColor: 'var(--success)', color: 'var(--text-white)' }}
                    >
                      📄 Download Invoice
                    </button>
                  </div>
                </div>

                {/* Recent Invoices */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                    Recent Invoices
                  </h4>
                  <div style={{ 
                    border: '1px solid var(--border-light)', 
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr auto', 
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      backgroundColor: 'var(--bg-accent)',
                      fontWeight: '600',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      <div>Order ID</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Action</div>
                    </div>
                    {[
                      { id: 'ORD-001', date: '2024-01-15', amount: '$29.99' },
                      { id: 'ORD-002', date: '2024-01-01', amount: '$29.99' },
                      { id: 'ORD-003', date: '2023-12-15', amount: '$29.99' }
                    ].map((invoice, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr 1fr auto', 
                          gap: 'var(--space-3)',
                          padding: 'var(--space-3)',
                          borderTop: index > 0 ? '1px solid var(--border-light)' : 'none',
                          fontSize: '14px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        <div>{invoice.id}</div>
                        <div>{invoice.date}</div>
                        <div>{invoice.amount}</div>
                        <button
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          style={{ 
                            backgroundColor: 'var(--primary-medium)', 
                            color: 'var(--text-white)',
                            fontSize: '12px',
                            padding: 'var(--space-1) var(--space-2)'
                          }}
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerProfilePage;