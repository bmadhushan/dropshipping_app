import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

const ProductEditModal = ({ 
  isVisible, 
  onClose, 
  product,
  onSave,
  categories = []
}) => {
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category || '',
        brand: product.brand || '',
        adminPrice: product.adminPrice || 0,
        basePrice: product.basePrice || 0,
        salePrice: product.salePrice || 0,
        stock: product.stock || 0,
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        image: product.image || '',
        published: product.published || false,
        taxStatus: product.taxStatus || 'taxable',
        shippingClass: product.shippingClass || 'standard'
      });
    }
  }, [product]);

  if (!isVisible || !product) return null;

  const handleEdit = (fieldName) => {
    setEditingField(fieldName);
    setErrors({});
  };

  const handleCancel = () => {
    setEditingField(null);
    // Reset to original values
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        category: product.category || '',
        brand: product.brand || '',
        adminPrice: product.adminPrice || 0,
        basePrice: product.basePrice || 0,
        salePrice: product.salePrice || 0,
        stock: product.stock || 0,
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        image: product.image || '',
        published: product.published || false,
        taxStatus: product.taxStatus || 'taxable',
        shippingClass: product.shippingClass || 'standard'
      });
    }
    setErrors({});
  };

  const handleSaveField = async (fieldName) => {
    try {
      setSaving(true);
      setErrors({});

      // Validate required fields
      if (fieldName === 'name' && !formData.name?.trim()) {
        setErrors({ [fieldName]: 'Product name is required' });
        return;
      }
      if (fieldName === 'sku' && !formData.sku?.trim()) {
        setErrors({ [fieldName]: 'SKU is required' });
        return;
      }
      if (fieldName === 'category' && !formData.category?.trim()) {
        setErrors({ [fieldName]: 'Category is required' });
        return;
      }

      // Prepare update data
      const updateData = {
        [fieldName]: formData[fieldName]
      };

      // Special handling for numeric fields
      if (['adminPrice', 'basePrice', 'salePrice', 'stock'].includes(fieldName)) {
        updateData[fieldName] = parseFloat(formData[fieldName]) || 0;
      }

      const response = await apiService.updateProduct(product.id, updateData);

      if (response.success) {
        setEditingField(null);
        if (onSave) {
          onSave({ ...product, ...updateData });
        }
      } else {
        setErrors({ [fieldName]: response.message || 'Failed to update field' });
      }
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      setErrors({ [fieldName]: error.message || 'Failed to update field' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const EditableField = ({ 
    label, 
    fieldName, 
    value, 
    type = 'text', 
    multiline = false, 
    options = null,
    placeholder = '',
    required = false
  }) => {
    const isEditing = editingField === fieldName;
    const hasError = errors[fieldName];

    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <label style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {label}
            {required && <span style={{ color: '#ef4444' }}>*</span>}
          </label>
          {!isEditing && (
            <button
              onClick={() => handleEdit(fieldName)}
              style={{
                padding: '4px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb';
                e.target.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#6b7280';
              }}
              title={`Edit ${label.toLowerCase()}`}
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>

        {isEditing ? (
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              {options ? (
                <select
                  value={formData[fieldName]}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: hasError ? '2px solid #ef4444' : '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                >
                  <option value="">Select {label.toLowerCase()}</option>
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : multiline ? (
                <textarea
                  value={formData[fieldName]}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  placeholder={placeholder}
                  rows={4}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: hasError ? '2px solid #ef4444' : '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              ) : (
                <input
                  type={type}
                  value={formData[fieldName]}
                  onChange={(e) => handleInputChange(fieldName, e.target.value)}
                  placeholder={placeholder}
                  step={type === 'number' ? '0.01' : undefined}
                  min={type === 'number' ? '0' : undefined}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: hasError ? '2px solid #ef4444' : '2px solid #3b82f6',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              )}
              <button
                onClick={() => handleSaveField(fieldName)}
                disabled={saving}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1
                }}
                title="Save"
              >
                {saving ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                ) : (
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: saving ? 0.6 : 1
                }}
                title="Cancel"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {hasError && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.75rem',
                marginTop: '0.25rem',
                margin: '0.25rem 0 0 0'
              }}>
                {hasError}
              </p>
            )}
          </div>
        ) : (
          <div style={{
            padding: '0.75rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            minHeight: '3rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              color: value ? '#374151' : '#9ca3af',
              fontSize: '0.875rem',
              wordBreak: 'break-word'
            }}>
              {value || `No ${label.toLowerCase()} set`}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
        onClick={handleOverlayClick}
      >
        <div 
          style={{
            background: '#FFFFFF',
            borderRadius: '20px',
            padding: '2rem',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              color: '#6b7280',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#6b7280';
            }}
          >
            ×
          </button>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#354B4A',
              marginBottom: '0.5rem'
            }}>
              Edit Product
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '0.875rem',
              margin: 0
            }}>
              Click the edit icon next to any field to modify it. Changes are saved immediately.
            </p>
          </div>

          {/* Product Image */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1rem',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {formData.image ? (
                <img
                  src={formData.image}
                  alt={formData.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                  <p style={{ margin: 0, fontSize: '0.75rem' }}>No image</p>
                </div>
              )}
            </div>

            <div>
              <EditableField
                label="Product Name"
                fieldName="name"
                value={formData.name}
                placeholder="Enter product name"
                required
              />
              
              <EditableField
                label="SKU"
                fieldName="sku"
                value={formData.sku}
                placeholder="Enter product SKU"
                required
              />
            </div>
          </div>

          {/* Main Form Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2rem'
          }}>
            {/* Left Column */}
            <div>
              <EditableField
                label="Category"
                fieldName="category"
                value={formData.category}
                options={categories.map(cat => cat.name || cat)}
                required
              />

              <EditableField
                label="Brand"
                fieldName="brand"
                value={formData.brand}
                placeholder="Enter brand name"
              />

              <EditableField
                label="Admin Price (GBP)"
                fieldName="adminPrice"
                value={formData.adminPrice}
                type="number"
                placeholder="0.00"
                required
              />

              <EditableField
                label="Base Price (GBP)"
                fieldName="basePrice"
                value={formData.basePrice}
                type="number"
                placeholder="0.00"
              />

              <EditableField
                label="Sale Price (GBP)"
                fieldName="salePrice"
                value={formData.salePrice}
                type="number"
                placeholder="0.00"
              />

              <EditableField
                label="Stock Quantity"
                fieldName="stock"
                value={formData.stock}
                type="number"
                placeholder="0"
              />
            </div>

            {/* Right Column */}
            <div>
              <EditableField
                label="Weight (kg)"
                fieldName="weight"
                value={formData.weight}
                placeholder="Enter weight"
              />

              <EditableField
                label="Dimensions"
                fieldName="dimensions"
                value={formData.dimensions}
                placeholder="L x W x H"
              />

              <EditableField
                label="Image URL"
                fieldName="image"
                value={formData.image}
                placeholder="https://example.com/image.jpg"
              />

              <EditableField
                label="Tax Status"
                fieldName="taxStatus"
                value={formData.taxStatus}
                options={['taxable', 'shipping', 'none']}
              />

              <EditableField
                label="Shipping Class"
                fieldName="shippingClass"
                value={formData.shippingClass}
                options={['standard', 'express', 'free', 'heavy']}
              />

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  Publication Status
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: formData.published ? '#d1fae5' : '#fef3c7',
                    color: formData.published ? '#065f46' : '#92400e'
                  }}>
                    {formData.published ? 'Published' : 'Draft'}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Use the publish/unpublish button in the main view to change this status.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description Fields */}
          <div style={{ marginTop: '2rem' }}>
            <EditableField
              label="Short Description"
              fieldName="shortDescription"
              value={formData.shortDescription}
              multiline
              placeholder="Brief product description for previews"
            />

            <EditableField
              label="Full Description"
              fieldName="description"
              value={formData.description}
              multiline
              placeholder="Detailed product description with features and specifications"
            />
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            paddingTop: '2rem',
            borderTop: '1px solid #e5e7eb',
            marginTop: '2rem'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                color: '#374151',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ffffff';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductEditModal;