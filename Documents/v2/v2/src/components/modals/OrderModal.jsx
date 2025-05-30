import React from 'react';

const OrderModal = ({ 
  isVisible, 
  onClose, 
  products, 
  selectedForBulk, 
  orderItems, 
  setOrderItems, 
  orderStep, 
  setOrderStep, 
  orderForm, 
  setOrderForm,
  apiService 
}) => {
  if (!isVisible) return null;

  const selectedProductsList = products.filter(p => selectedForBulk.has(p.id));

  if (selectedProductsList.length === 0) {
    return null;
  }

  // Calculate totals
  let totalAmount = 0;
  selectedProductsList.forEach(product => {
    const quantity = orderItems[product.id] || 1;
    totalAmount += product.adminPrice * quantity;
  });

  const handleQuantityChange = (productId, newQuantity) => {
    setOrderItems(prev => ({
      ...prev,
      [productId]: Math.max(1, parseInt(newQuantity) || 1)
    }));
  };

  const handleNextStep = () => {
    setOrderStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setOrderStep(prev => prev - 1);
  };

  const handleFormChange = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOrderSubmit = async () => {
    try {
      const orderData = {
        customerName: orderForm.customerName,
        customerEmail: orderForm.customerEmail,
        customerPhone: orderForm.customerPhone,
        shippingAddress: orderForm.customerAddress,
        notes: orderForm.notes,
        items: selectedProductsList.map(product => ({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: orderItems[product.id] || 1,
          unitPrice: product.adminPrice
        }))
      };

      console.log('Order data being sent:', orderData);
      
      const response = await apiService.createOrder(orderData);
      if (response.success) {
        alert('Order created successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Full error object:', error);
      alert(`Failed to create order: ${error.message || error}. Please try again.`);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
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
            cursor: 'pointer'
          }}
        >
          ×
        </button>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem'
        }}>
          {[1, 2, 3].map(step => (
            <div key={step} style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: step < 3 ? '2rem' : '0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: orderStep >= step ? '#354F52' : '#e5e7eb',
                color: orderStep >= step ? '#FFFFFF' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600'
              }}>
                {step}
              </div>
              <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.875rem',
                color: orderStep >= step ? '#354B4A' : '#6b7280'
              }}>
                {step === 1 && 'Items'}
                {step === 2 && 'Customer'}
                {step === 3 && 'Review'}
              </span>
              {step < 3 && (
                <div style={{
                  width: '2rem',
                  height: '2px',
                  background: orderStep > step ? '#354F52' : '#e5e7eb',
                  marginLeft: '1rem'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {orderStep === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Order Items ({selectedProductsList.length})
            </h2>
            
            {selectedProductsList.map(product => (
              <div key={product.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                gap: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {product.name}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Admin Price: ${product.adminPrice}
                  </p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleQuantityChange(product.id, (orderItems[product.id] || 1) - 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={orderItems[product.id] || 1}
                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                    style={{
                      width: '60px',
                      textAlign: 'center',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db'
                    }}
                    min="1"
                  />
                  <button
                    onClick={() => handleQuantityChange(product.id, (orderItems[product.id] || 1) + 1)}
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #d1d5db',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
                
                <div style={{ textAlign: 'right', minWidth: '100px' }}>
                  <p style={{ fontWeight: '600' }}>
                    ${(product.adminPrice * (orderItems[product.id] || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {orderStep === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Customer Details
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={orderForm.customerName}
                  onChange={(e) => handleFormChange('customerName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={orderForm.customerPhone}
                  onChange={(e) => handleFormChange('customerPhone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={orderForm.customerEmail}
                  onChange={(e) => handleFormChange('customerEmail', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Notes
                </label>
                <input
                  type="text"
                  value={orderForm.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
              
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Delivery Address *
                </label>
                <textarea
                  value={orderForm.customerAddress}
                  onChange={(e) => handleFormChange('customerAddress', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    minHeight: '100px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {orderStep === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
              Order Overview
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Customer Information
              </h3>
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                <p><strong>Name:</strong> {orderForm.customerName}</p>
                <p><strong>Phone:</strong> {orderForm.customerPhone}</p>
                <p><strong>Email:</strong> {orderForm.customerEmail}</p>
                <p><strong>Address:</strong> {orderForm.customerAddress}</p>
                {orderForm.notes && <p><strong>Notes:</strong> {orderForm.notes}</p>}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
                Order Items
              </h3>
              {selectedProductsList.map(product => (
                <div key={product.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>
                    <p style={{ fontWeight: '600' }}>{product.name}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      ${product.adminPrice.toFixed(2)} x {orderItems[product.id] || 1}
                    </p>
                  </div>
                  <p style={{ fontWeight: '600' }}>
                    ${(product.adminPrice * (orderItems[product.id] || 1)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              background: '#f9fafb',
              padding: '1rem',
              borderRadius: '8px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                <span>Total Amount:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '2rem'
        }}>
          <div>
            {orderStep > 1 && (
              <button
                onClick={handlePrevStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Previous
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            {orderStep < 3 ? (
              <button
                onClick={handleNextStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#354F52',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
                disabled={orderStep === 2 && (!orderForm.customerName || !orderForm.customerAddress || !orderForm.customerPhone || !orderForm.customerEmail)}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleOrderSubmit}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#354F52',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Create Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;