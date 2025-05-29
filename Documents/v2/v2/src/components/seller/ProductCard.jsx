import React from 'react';
import { useNavigate } from 'react-router-dom';

function ProductCard({ product, pricingSettings, onToggleSelect, onEditPrice, isSelected, onBulkSelect }) {
  const navigate = useNavigate();
  
  const margin = product.customMargin || 
    pricingSettings?.categories[product.category]?.margin || 
    pricingSettings?.global?.defaultMargin || 0;

  const handleImageClick = (e) => {
    e.stopPropagation();
    navigate(`/seller/products/${product.id}`);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    navigate(`/seller/products/${product.id}`);
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
      className={`bg-white rounded-lg shadow-sm border ${
        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200'
      } p-4 hover:shadow-md transition-all cursor-pointer relative group`}
      onClick={handleCardClick}
    >
      {/* Product Image - Top (Clickable to product page) */}
      <div 
        className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors"
        onClick={handleImageClick}
      >
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="space-y-2">
        {/* Product Name (Clickable to product page) */}
        <h3 
          className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-blue-600 transition-colors"
          onClick={handleTitleClick}
        >
          {product.name}
        </h3>
        
        {/* Category */}
        <p className="text-xs text-gray-500 truncate">
          {product.category}
        </p>
        
        {/* Brand */}
        <p className="text-xs text-gray-600 truncate">
          {product.brand || 'No Brand'}
        </p>
        
        {/* Price with Stock Indicator */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-green-700">
            ${product.adminPrice?.toFixed(2) || '0.00'}
          </p>
          
          {/* Stock Status Indicator */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons - Bottom */}
      {product.isSelected && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={(e) => handleActionClick(e, () => onToggleSelect(product.id))}
            className="flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors bg-red-100 text-red-700 hover:bg-red-200"
          >
            Remove
          </button>
          
          <button
            onClick={(e) => handleActionClick(e, () => onEditPrice(product))}
            className="p-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            title="Edit price"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}

      {!product.isSelected && (
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={(e) => handleActionClick(e, () => onToggleSelect(product.id))}
            className="w-full px-3 py-2 rounded-md text-xs font-medium transition-colors bg-green-100 text-green-700 hover:bg-green-200"
          >
            Add to Store
          </button>
        </div>
      )}

      {/* Selection Badge */}
      {product.isSelected && (
        <div className="absolute top-3 right-3">
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            In Store
          </span>
        </div>
      )}
    </div>
  );
}

export default ProductCard;