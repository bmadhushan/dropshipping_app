import React, { useState } from 'react';

function ProductCard({ product, pricingSettings, onToggleSelect, onEditPrice, isSelected, onBulkSelect, onViewDetails }) {
  const [imageError, setImageError] = useState(false);
  
  const margin = product.customMargin || 
    pricingSettings?.categories[product.category]?.margin || 
    pricingSettings?.global?.defaultMargin || 0;

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(product);
    }
  };

  const handleCardClick = () => {
    // Toggle bulk selection when clicking on the card body
    if (onBulkSelect) {
      onBulkSelect(product.id);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation(); // Prevent card click when clicking buttons
    action();
  };

  return (
    <div 
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: isSelected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
        border: isSelected ? '1px solid #10b981' : '1px solid #e5e7eb',
        padding: '16px',
        transition: 'all 0.2s',
        cursor: 'pointer',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = isSelected ? '0 4px 6px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)';
      }}
      onClick={handleCardClick}
    >
      {/* Product Image Placeholder */}
      <div style={{
        width: '100%',
        height: '192px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#e5e7eb';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f3f4f6';
      }}
      onClick={handleImageClick}
      >
        {product.image && !imageError ? (
          <img 
            src={product.image} 
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center'
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#e5e7eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '32px', height: '32px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{
          fontWeight: '600',
          color: '#111827',
          fontSize: '14px',
          lineHeight: '1.25',
          minHeight: '40px',
          cursor: 'pointer',
          transition: 'color 0.2s',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#2563eb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#111827';
        }}
        onClick={handleTitleClick}
        >
          {product.name}
        </h3>
        
        <p style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.category}
        </p>
        
        <p style={{ fontSize: '12px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.brand || 'No Brand'}
        </p>

        {/* Pricing Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Base Price (GBP):</span>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: 0 }}>
                £{product.adminPrice?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: product.stock > 0 ? '#10b981' : '#ef4444'
              }}></div>
              <span style={{
                fontSize: '12px',
                color: product.stock > 0 ? '#059669' : '#dc2626'
              }}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 0',
            borderTop: '1px solid #f3f4f6',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>Stock Level:</span>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: product.stock === 0 ? '#dc2626' : product.stock <= 20 ? '#d97706' : '#059669'
            }}>
              {product.stock === 0 ? 'Out of Stock' : `${product.stock} units`}
            </span>
          </div>

          {/* Your Price Section - Updated to match admin style */}
          {product.sellerPrice > 0 && (
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '8px',
              padding: '8px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>Your Price (LKR):</span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#1d4ed8'
                }}>
                  LKR {product.sellerPrice.toFixed(2)}
                </span>
              </div>
              
              {pricingSettings?.global && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#4b5563' }}>Profit:</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>
                    +LKR {(() => {
                      // Calculate profit: sellerPrice - baseCost - shippingCost
                      const baseCost = product.adminPrice * pricingSettings.global.currencyConversion;
                      const shippingCost = product.customShippingFee !== null && product.customShippingFee !== undefined
                        ? product.customShippingFee
                        : pricingSettings.global.shippingCost;
                      
                      const profit = product.sellerPrice - baseCost - shippingCost;
                      return Math.max(0, profit).toFixed(2);
                    })()}
                  </span>
                </div>
              )}
              
              {/* Show margin information */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>Margin:</span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  {(() => {
                    // If product has custom margin, show it
                    if (product.customMargin !== null && product.customMargin !== undefined) {
                      return `${product.customMargin}%`;
                    }
                    
                    // Calculate actual margin from seller price
                    const baseCost = product.adminPrice * pricingSettings.global.currencyConversion;
                    const shippingCost = product.customShippingFee !== null && product.customShippingFee !== undefined
                      ? product.customShippingFee
                      : pricingSettings.global.shippingCost;
                    
                    const priceWithoutShipping = product.sellerPrice - shippingCost;
                    const actualMargin = ((priceWithoutShipping - baseCost) / baseCost * 100);
                    return `${Math.max(0, actualMargin).toFixed(1)}%`;
                  })()}
                </span>
              </div>
              
              {/* Show shipping fee information */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>Shipping Fee:</span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                  {(() => {
                    // If custom shipping fee is saved, use it
                    if (product.customShippingFee !== null && product.customShippingFee !== undefined) {
                      return `LKR ${product.customShippingFee.toFixed(2)}`;
                    }
                    
                    // Otherwise calculate from price structure
                    const baseCost = product.adminPrice * pricingSettings.global.currencyConversion;
                    const margin = product.customMargin !== null && product.customMargin !== undefined
                      ? product.customMargin
                      : (pricingSettings.categories[product.category]?.margin || pricingSettings.global.defaultMargin);
                    
                    const expectedPriceWithoutShipping = baseCost * (1 + margin / 100);
                    const actualShipping = product.sellerPrice - expectedPriceWithoutShipping;
                    return `LKR ${Math.max(0, actualShipping).toFixed(2)}`;
                  })()}
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#4b5563' }}>Status:</span>
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: product.isSelected ? '#d1fae5' : '#fef3c7',
              color: product.isSelected ? '#065f46' : '#92400e'
            }}>
              {product.isSelected ? 'In Store' : 'Available'}
            </span>
          </div>
        </div>

        {/* Action Buttons - Updated to match admin style */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {product.isSelected ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={(e) => handleActionClick(e, () => onEditPrice(product))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#bfdbfe';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dbeafe';
                }}
              >
                Edit Price
              </button>
              <button
                onClick={(e) => handleActionClick(e, () => onToggleSelect(product.id))}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fde68a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef3c7';
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => handleActionClick(e, () => onEditPrice(product))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                transition: 'all 0.2s',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#a7f3d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#d1fae5';
              }}
            >
              Add to Store & Set Price
            </button>
          )}
        </div>
      </div>

      {/* Selection Badges - Updated styling */}
      {product.isSelected && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px'
        }}>
          <span style={{
            fontSize: '12px',
            fontWeight: '500',
            padding: '2px 8px',
            borderRadius: '12px',
            backgroundColor: '#10b981',
            color: 'white'
          }}>
            ✓ In Store
          </span>
        </div>
      )}
      
      {/* Checkbox for bulk selection - Updated styling */}
      <div style={{
        position: 'absolute',
        top: '12px',
        left: '12px'
      }}>
        <div 
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: isSelected ? '2px solid #10b981' : '2px solid #d1d5db',
            backgroundColor: isSelected ? '#10b981' : 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onBulkSelect) onBulkSelect(product.id);
          }}
        >
          {isSelected && (
            <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;