import { useState } from 'react';
import { useOrders } from '../contexts/OrderContext.jsx';
import { useProducts } from '../contexts/ProductContext.jsx';
import '../styles/theme.css';

const OrderForm = ({ onClose, onSuccess }) => {
  const { createOrder, searchProducts, getProductsByCategory } = useOrders();
  const { categories } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    notes: '',
    urgency: 'standard',
    shippingAddress: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: ''
    }
  });
  const [currentStep, setCurrentStep] = useState(1); // 1: Products, 2: Cart, 3: Details

  const availableCategories = ['all', ...categories.map(cat => cat.name || cat)];

  const filteredProducts = searchQuery 
    ? searchProducts(searchQuery)
    : getProductsByCategory(selectedCategory);

  const addToCart = (product, quantity = 1) => {
    if (quantity <= 0) return;
    
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { 
          productId: product.id, 
          quantity,
          product 
        }];
      }
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => 
      prev.map(item =>
        item.productId === productId 
          ? { ...item, quantity }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.quantity * item.product.adminPrice), 0
    );
  };

  const handleSubmitOrder = async () => {
    try {
      if (cartItems.length === 0) {
        alert('Please add items to your cart');
        return;
      }

      const orderData = {
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        notes: orderDetails.notes,
        urgency: orderDetails.urgency,
        shippingAddress: orderDetails.shippingAddress
      };

      const newOrder = createOrder(orderData);
      
      if (onSuccess) {
        onSuccess(newOrder);
      }
      
      alert(`Order ${newOrder.orderNumber} created successfully! It will be reviewed by admin.`);
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order. Please try again.');
    }
  };

  const ProductCard = ({ product }) => {
    const [quantity, setQuantity] = useState(1);
    
    return (
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'var(--space-4)', alignItems: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              backgroundColor: 'var(--bg-accent)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📦
            </div>
            
            <div>
              <h4 className="font-semibold" style={{ marginBottom: 'var(--space-1)' }}>{product.name}</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                {product.brand} • {product.sku}
              </p>
              <p className="text-sm" style={{ color: 'var(--text-light)', marginBottom: 'var(--space-2)' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <span className="badge badge-info">{product.category}</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{product.weight}</span>
                <span className="font-semibold" style={{ color: 'var(--primary-dark)' }}>
                  ${product.adminPrice.toFixed(2)}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  style={{ 
                    width: '60px', 
                    padding: 'var(--space-1)', 
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    textAlign: 'center'
                  }}
                />
                <button
                  onClick={() => addToCart(product, quantity)}
                  className="btn btn-primary"
                  style={{ cursor: 'pointer' }}
                  disabled={product.stock === 0}
                >
                  Add to Cart
                </button>
              </div>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {product.stock} in stock
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(53, 75, 74, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="card" style={{
        maxWidth: '1200px',
        width: '95%',
        maxHeight: '95vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Create New Order</h3>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Step indicator */}
          <div style={{ display: 'flex', marginTop: 'var(--space-4)', gap: 'var(--space-4)' }}>
            {[
              { step: 1, label: 'Select Products' },
              { step: 2, label: 'Review Cart' },
              { step: 3, label: 'Order Details' }
            ].map(({ step, label }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: currentStep >= step ? 'var(--primary-dark)' : 'var(--bg-accent)',
                  color: currentStep >= step ? 'white' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {step}
                </div>
                <span className={currentStep >= step ? 'font-semibold' : ''}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
          {/* Step 1: Product Selection */}
          {currentStep === 1 && (
            <div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="btn btn-outline"
                    style={{ width: '100%', textAlign: 'left' }}
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="btn btn-outline"
                  style={{ minWidth: '150px' }}
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products */}
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
                
                {filteredProducts.length === 0 && (
                  <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No products found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Cart Review */}
          {currentStep === 2 && (
            <div>
              <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Cart Items</h4>
              
              {cartItems.length === 0 ? (
                <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Your cart is empty. Go back to add products.
                </div>
              ) : (
                <>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map(item => (
                        <tr key={item.productId}>
                          <td>
                            <div>
                              <div className="font-semibold">{item.product.name}</div>
                              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {item.product.brand} • {item.product.sku}
                              </div>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max={item.product.stock}
                              value={item.quantity}
                              onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value) || 1)}
                              style={{ 
                                width: '80px', 
                                padding: 'var(--space-1)', 
                                border: '1px solid var(--border-medium)',
                                borderRadius: 'var(--radius-sm)',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td>${item.product.adminPrice.toFixed(2)}</td>
                          <td className="font-semibold">${(item.quantity * item.product.adminPrice).toFixed(2)}</td>
                          <td>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="btn btn-secondary"
                              style={{
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: 'var(--space-1) var(--space-3)',
                                backgroundColor: 'var(--error)'
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: 'var(--bg-accent)' }}>
                        <td colSpan="3" className="font-semibold" style={{ textAlign: 'right' }}>
                          Total Order Value:
                        </td>
                        <td className="font-bold" style={{ color: 'var(--primary-dark)' }}>
                          ${calculateTotal().toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}

          {/* Step 3: Order Details */}
          {currentStep === 3 && (
            <div>
              <h4 className="font-semibold" style={{ marginBottom: 'var(--space-4)' }}>Order Details</h4>
              
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div>
                  <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Order Notes (Optional)
                  </label>
                  <textarea
                    value={orderDetails.notes}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Special instructions, delivery requirements, etc."
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: 'var(--space-3)', 
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label className="font-semibold" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                    Urgency
                  </label>
                  <select
                    value={orderDetails.urgency}
                    onChange={(e) => setOrderDetails(prev => ({ ...prev, urgency: e.target.value }))}
                    className="btn btn-outline"
                    style={{ width: '200px' }}
                  >
                    <option value="standard">Standard (5-7 days)</option>
                    <option value="urgent">Urgent (2-3 days)</option>
                    <option value="rush">Rush (Next day)</option>
                  </select>
                </div>

                <div>
                  <h5 className="font-semibold" style={{ marginBottom: 'var(--space-3)' }}>Shipping Address</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={orderDetails.shippingAddress.name}
                      onChange={(e) => setOrderDetails(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, name: e.target.value }
                      }))}
                      className="btn btn-outline"
                      style={{ textAlign: 'left' }}
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={orderDetails.shippingAddress.phone}
                      onChange={(e) => setOrderDetails(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, phone: e.target.value }
                      }))}
                      className="btn btn-outline"
                      style={{ textAlign: 'left' }}
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={orderDetails.shippingAddress.address}
                      onChange={(e) => setOrderDetails(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, address: e.target.value }
                      }))}
                      className="btn btn-outline"
                      style={{ textAlign: 'left', gridColumn: 'span 2' }}
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={orderDetails.shippingAddress.city}
                      onChange={(e) => setOrderDetails(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                      }))}
                      className="btn btn-outline"
                      style={{ textAlign: 'left' }}
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={orderDetails.shippingAddress.postalCode}
                      onChange={(e) => setOrderDetails(prev => ({ 
                        ...prev, 
                        shippingAddress: { ...prev.shippingAddress, postalCode: e.target.value }
                      }))}
                      className="btn btn-outline"
                      style={{ textAlign: 'left' }}
                    />
                  </div>
                </div>

                {/* Order Summary */}
                <div style={{ 
                  backgroundColor: 'var(--bg-accent)', 
                  padding: 'var(--space-4)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <h5 className="font-semibold" style={{ marginBottom: 'var(--space-3)' }}>Order Summary</h5>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span>Items:</span>
                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} products</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span>Urgency:</span>
                    <span>{orderDetails.urgency}</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: 'var(--space-2)',
                    fontWeight: 'bold',
                    fontSize: '1.1em'
                  }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--primary-dark)' }}>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          padding: 'var(--space-4)', 
          borderTop: '1px solid var(--border-light)',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            {cartItems.length > 0 && (
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {cartItems.length} product(s) in cart • Total: ${calculateTotal().toFixed(2)}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="btn btn-outline"
                style={{ cursor: 'pointer' }}
              >
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
                disabled={currentStep === 2 && cartItems.length === 0}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitOrder}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
                disabled={cartItems.length === 0}
              >
                Submit Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderForm;