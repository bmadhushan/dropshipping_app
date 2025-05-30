import React, { useState } from 'react';

const ProductDetailModal = ({ 
  isVisible, 
  onClose, 
  product,
  allProducts = [],
  currentIndex = 0,
  onNextProduct,
  onPrevProduct
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isVisible || !product) return null;

  // Parse images from comma-separated string or handle array
  const parseImages = () => {
    const imageList = [];
    
    // Check for 'images' field (comma-separated or array)
    if (product.images) {
      if (typeof product.images === 'string') {
        imageList.push(...product.images.split(',').map(img => img.trim()).filter(Boolean));
      } else if (Array.isArray(product.images)) {
        imageList.push(...product.images.filter(Boolean));
      }
    }
    
    // Check for individual image fields
    if (product.image && !imageList.includes(product.image)) imageList.push(product.image);
    if (product.imageUrl && !imageList.includes(product.imageUrl)) imageList.push(product.imageUrl);
    if (product.image_url && !imageList.includes(product.image_url)) imageList.push(product.image_url);
    if (product.thumbnail && !imageList.includes(product.thumbnail)) imageList.push(product.thumbnail);
    if (product.gallery) {
      if (typeof product.gallery === 'string') {
        imageList.push(...product.gallery.split(',').map(img => img.trim()).filter(Boolean));
      } else if (Array.isArray(product.gallery)) {
        imageList.push(...product.gallery.filter(Boolean));
      }
    }
    
    // Remove duplicates
    return [...new Set(imageList)];
  };
  
  const images = parseImages();
  const displayImages = images.length > 0 ? images : [null];

  const formatPrice = (price) => {
    return price ? `£${parseFloat(price).toFixed(2)}` : 'N/A';
  };

  const formatBoolean = (value) => {
    if (value === true || value === 'true' || value === '1' || value === 'yes') return 'Yes';
    if (value === false || value === 'false' || value === '0' || value === 'no') return 'No';
    return value || 'N/A';
  };

  const handleNextProduct = () => {
    if (onNextProduct && currentIndex < allProducts.length - 1) {
      setActiveImageIndex(0); // Reset image index for new product
      onNextProduct();
    }
  };

  const handlePrevProduct = () => {
    if (onPrevProduct && currentIndex > 0) {
      setActiveImageIndex(0); // Reset image index for new product
      onPrevProduct();
    }
  };

  const handleOverlayClick = (e) => {
    // Close modal when clicking on the overlay (not the modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
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
          maxWidth: '1200px',
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

        {/* First Row: Product Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Left Column: Image Gallery */}
          <div>
            {/* Main Image */}
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {displayImages[activeImageIndex] ? (
                <img
                  src={displayImages[activeImageIndex]}
                  alt={product.name}
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
                  <p style={{ margin: 0 }}>No image available</p>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))',
                gap: '0.5rem'
              }}>
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    style={{
                      border: activeImageIndex === index ? '2px solid #354F52' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '0.25rem',
                      background: '#ffffff',
                      cursor: 'pointer',
                      aspectRatio: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '4px'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '1.5rem' }}>📷</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Info */}
          <div>
            {/* Product Name */}
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#354B4A',
              marginBottom: '1rem',
              lineHeight: '1.3'
            }}>
              {product.name}
            </h2>

            {/* SKU */}
            <div style={{
              background: '#f3f4f6',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'inline-block'
            }}>
              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>SKU: </span>
              <span style={{ fontWeight: '600', color: '#374151' }}>{product.sku}</span>
            </div>

            {/* Short Description */}
            {product.shortDescription && (
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #e0f2fe',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <p style={{
                  margin: 0,
                  color: '#0f172a',
                  fontSize: '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {product.shortDescription}
                </p>
              </div>
            )}

            {/* Pricing */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#166534',
                marginBottom: '1rem'
              }}>
                Pricing Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Admin Price</p>
                  <p style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#059669',
                    margin: 0
                  }}>
                    {formatPrice(product.adminPrice)}
                  </p>
                </div>
                
                {product.salePrice && parseFloat(product.salePrice) > 0 && (
                  <div>
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Sale Price</p>
                    <p style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: '#dc2626',
                      margin: 0
                    }}>
                      {formatPrice(product.salePrice)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Product Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {/* Brand */}
              {product.brand && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Brand</p>
                  <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{product.brand}</p>
                </div>
              )}

              {/* Category */}
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Category</p>
                <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{product.category}</p>
              </div>

              {/* Stock */}
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Stock</p>
                <p style={{ 
                  fontWeight: '600', 
                  color: (product.stock || 0) > 0 ? '#059669' : '#dc2626',
                  margin: 0 
                }}>
                  {(product.stock || 0) > 0 ? `${product.stock} units` : 'Out of stock'}
                </p>
              </div>

              {/* Weight */}
              {product.weight && (
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Weight</p>
                  <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{product.weight} kg</p>
                </div>
              )}

              {/* Tax Status */}
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Tax Status</p>
                <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{product.taxStatus || 'Taxable'}</p>
              </div>

              {/* Shipping */}
              <div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>Shipping</p>
                <p style={{ fontWeight: '600', color: '#374151', margin: 0 }}>{product.shippingClass || 'Standard'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: '#e5e7eb',
          margin: '2rem 0'
        }} />

        {/* Second Row: Product Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#354B4A',
            marginBottom: '1rem'
          }}>
            Product Description
          </h3>
          
          {product.description ? (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div 
                style={{ 
                  color: '#374151', 
                  lineHeight: '1.6',
                  fontSize: '0.95rem'
                }}
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>
          ) : (
            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              <p style={{ margin: 0 }}>No detailed description available for this product.</p>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* Previous Product Button */}
          <button
            onClick={handlePrevProduct}
            disabled={currentIndex <= 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: '1px solid #d1d5db',
              background: currentIndex <= 0 ? '#f9fafb' : '#ffffff',
              color: currentIndex <= 0 ? '#9ca3af' : '#374151',
              borderRadius: '8px',
              cursor: currentIndex <= 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentIndex > 0) {
                e.target.style.background = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              if (currentIndex > 0) {
                e.target.style.background = '#ffffff';
              }
            }}
          >
            <span>←</span>
            Previous Product
          </button>

          {/* Product Counter */}
          <div style={{
            background: '#f3f4f6',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {currentIndex + 1} of {allProducts.length}
          </div>

          {/* Next Product Button */}
          <button
            onClick={handleNextProduct}
            disabled={currentIndex >= allProducts.length - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: currentIndex >= allProducts.length - 1 ? '#f9fafb' : '#354F52',
              color: currentIndex >= allProducts.length - 1 ? '#9ca3af' : '#ffffff',
              borderRadius: '8px',
              cursor: currentIndex >= allProducts.length - 1 ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (currentIndex < allProducts.length - 1) {
                e.target.style.background = '#2a3e41';
              }
            }}
            onMouseLeave={(e) => {
              if (currentIndex < allProducts.length - 1) {
                e.target.style.background = '#354F52';
              }
            }}
          >
            Next Product
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;