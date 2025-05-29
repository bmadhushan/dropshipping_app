import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SellerLayout from '../../components/layout/SellerLayout';
import apiService from '../../services/api';

const SellerProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProductById(productId);
      setProduct(response.product || response.data || response);
      setError(null);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/seller/products');
  };

  if (loading) {
    return (
      <SellerLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div>
                <p className="mt-6 text-gray-600 text-lg">Loading product details...</p>
              </div>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (error || !product) {
    return (
      <SellerLayout>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center py-20">
              <div className="text-gray-400 text-8xl mb-6">🔍</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h2>
              <p className="text-gray-600 mb-8 text-lg">{error || 'The product you are looking for does not exist.'}</p>
              <button
                onClick={handleGoBack}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Products
              </button>
            </div>
          </div>
        </div>
      </SellerLayout>
    );
  }

  // Parse images from comma-separated string or handle array
  const images = product.images 
    ? (typeof product.images === 'string' ? product.images.split(',').map(img => img.trim()).filter(Boolean) : product.images)
    : (product.image ? [product.image] : []);
  
  // If no images, use a placeholder
  const displayImages = images.length > 0 ? images : [null];

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toFixed(2)}` : 'N/A';
  };

  const formatBoolean = (value) => {
    if (value === true || value === 'true' || value === '1' || value === 'yes') return 'Yes';
    if (value === false || value === 'false' || value === '0' || value === 'no') return 'No';
    return value || 'N/A';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <SellerLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          
          {/* Breadcrumb Navigation */}
          <nav className="mb-8">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </button>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Product Images Section */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden border">
                {displayImages[activeImageIndex] ? (
                  <img
                    src={displayImages[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain p-6"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 text-sm">No image available</p>
                    </div>
                  </div>
                )}
                
                {/* Image count badge */}
                {images.length > 1 && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                )}
              </div>
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === index 
                          ? 'border-green-500 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Product Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-lg text-gray-600">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {formatPrice(product.regularPrice || product.adminPrice)}
                    </div>
                    {product.salePrice && parseFloat(product.salePrice) > 0 && (
                      <div className="text-xl text-red-500 font-semibold">
                        Sale: {formatPrice(product.salePrice)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (product.stock || 0) > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      (product.stock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                  
                  {formatBoolean(product.published) === 'Yes' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Published
                    </span>
                  )}
                  
                  {formatBoolean(product.isFeatured) === 'Yes' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      ⭐ Featured
                    </span>
                  )}
                  
                  {product.brands || product.brand ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {product.brands || product.brand}
                    </span>
                  ) : null}
                </div>

                {/* Category & Tags */}
                <div className="space-y-2 mb-6">
                  {(product.categories || product.category) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">Category:</span>
                      <span className="ml-1">{product.categories || product.category}</span>
                    </div>
                  )}
                  
                  {product.tags && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span className="font-medium">Tags:</span>
                      <span className="ml-1">{product.tags}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Description */}
              {(product.shortDescription || product.description) && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Description</h3>
                  {product.shortDescription && (
                    <div className="text-gray-700 mb-4 text-lg leading-relaxed">
                      {product.shortDescription}
                    </div>
                  )}
                  {product.description && (
                    <div className="text-gray-600 prose max-w-none leading-relaxed">
                      <div dangerouslySetInnerHTML={{ __html: product.description }} />
                    </div>
                  )}
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Type</div>
                  <div className="font-medium text-gray-900">{product.type || 'Simple'}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Tax Status</div>
                  <div className="font-medium text-gray-900">{product.taxStatus || 'Taxable'}</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Weight</div>
                  <div className="font-medium text-gray-900">{product.weight || '0'} kg</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Dimensions</div>
                  <div className="font-medium text-gray-900">
                    {product.length || '0'} × {product.width || '0'} × {product.height || '0'} cm
                  </div>
                </div>
              </div>

              {/* Additional Information Tabs */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 p-6 pb-4">Product Details</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      {product.gtin && (
                        <>
                          <dt className="text-sm text-gray-500">GTIN/UPC/EAN/ISBN</dt>
                          <dd className="text-sm text-gray-900">{product.gtin}</dd>
                        </>
                      )}
                      <dt className="text-sm text-gray-500">Catalog Visibility</dt>
                      <dd className="text-sm text-gray-900">{product.catalogVisibility || 'Visible'}</dd>
                      <dt className="text-sm text-gray-500">Reviews Allowed</dt>
                      <dd className="text-sm text-gray-900">{formatBoolean(product.reviewsAllowed)}</dd>
                      <dt className="text-sm text-gray-500">Sold Individually</dt>
                      <dd className="text-sm text-gray-900">{formatBoolean(product.soldIndividually)}</dd>
                    </dl>
                  </div>

                  {/* Inventory Information */}
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Inventory</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <dt className="text-sm text-gray-500">Low Stock Threshold</dt>
                      <dd className="text-sm text-gray-900">{product.lowStockAmount || '0'}</dd>
                      <dt className="text-sm text-gray-500">Backorders</dt>
                      <dd className="text-sm text-gray-900">{formatBoolean(product.backordersAllowed)}</dd>
                      <dt className="text-sm text-gray-500">Stock Status</dt>
                      <dd className="text-sm text-gray-900">{formatBoolean(product.inStock)}</dd>
                    </dl>
                  </div>

                  {/* Pricing Information */}
                  {(product.salePrice || product.salePriceStart || product.taxClass) && (
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Pricing</h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {product.salePrice && (
                          <>
                            <dt className="text-sm text-gray-500">Sale Price</dt>
                            <dd className="text-sm text-gray-900">{formatPrice(product.salePrice)}</dd>
                          </>
                        )}
                        {product.salePriceStart && (
                          <>
                            <dt className="text-sm text-gray-500">Sale Period</dt>
                            <dd className="text-sm text-gray-900">
                              {formatDate(product.salePriceStart)} - {formatDate(product.salePriceEnd)}
                            </dd>
                          </>
                        )}
                        {product.taxClass && (
                          <>
                            <dt className="text-sm text-gray-500">Tax Class</dt>
                            <dd className="text-sm text-gray-900">{product.taxClass}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Shipping Information */}
                  <div className="border-t border-gray-100 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Shipping</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                      <dt className="text-sm text-gray-500">Shipping Class</dt>
                      <dd className="text-sm text-gray-900">{product.shippingClass || 'Standard'}</dd>
                    </dl>
                  </div>

                  {/* Advanced Fields */}
                  {(product.downloadLimit || product.externalUrl || product.purchaseNote) && (
                    <div className="border-t border-gray-100 pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Advanced</h4>
                      <dl className="grid grid-cols-1 gap-y-3">
                        {product.downloadLimit && (
                          <>
                            <dt className="text-sm text-gray-500">Download Limit</dt>
                            <dd className="text-sm text-gray-900">{product.downloadLimit}</dd>
                          </>
                        )}
                        {product.downloadExpiry && (
                          <>
                            <dt className="text-sm text-gray-500">Download Expiry</dt>
                            <dd className="text-sm text-gray-900">{product.downloadExpiry} days</dd>
                          </>
                        )}
                        {product.externalUrl && (
                          <>
                            <dt className="text-sm text-gray-500">External URL</dt>
                            <dd className="text-sm">
                              <a href={product.externalUrl} target="_blank" rel="noopener noreferrer" 
                                 className="text-green-600 hover:text-green-700 hover:underline">
                                {product.externalUrl}
                              </a>
                            </dd>
                          </>
                        )}
                        {product.purchaseNote && (
                          <>
                            <dt className="text-sm text-gray-500">Purchase Note</dt>
                            <dd className="text-sm text-gray-900">{product.purchaseNote}</dd>
                          </>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerProductDetailPage;