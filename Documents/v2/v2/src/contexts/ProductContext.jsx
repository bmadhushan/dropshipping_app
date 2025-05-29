import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import apiService from '../services/api.js';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

// Default pricing settings
const defaultPricingSettings = {
  global: {
    currencyConversion: 1.82, // USD to LKR / 100
    shippingCost: 5.00,
    defaultMargin: 20
  },
  categories: {} // Will be populated from API
};

export const ProductProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pricingSettings, setPricingSettings] = useState(defaultPricingSettings);
  const [categories, setCategories] = useState([]);

  // Load categories and update pricing settings
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await apiService.getActiveCategories();
        if (response.success) {
          setCategories(response.categories);
          
          // Update pricing settings with category margins
          const categoryMargins = {};
          response.categories.forEach(category => {
            categoryMargins[category.name] = { margin: category.defaultMargin };
          });
          
          setPricingSettings(prev => ({
            ...prev,
            categories: categoryMargins
          }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Calculate seller price based on admin price, category, and custom margin
  const calculateSellerPrice = useCallback((adminPrice, category, customMargin = null) => {
    const categorySettings = pricingSettings.categories[category] || {};
    const margin = customMargin !== null ? customMargin : (categorySettings.margin || pricingSettings.global.defaultMargin);
    const converted = adminPrice * pricingSettings.global.currencyConversion;
    const withMargin = converted * (1 + margin / 100);
    return withMargin + pricingSettings.global.shippingCost;
  }, [pricingSettings]);

  // Get all products with pricing information for seller
  const getProductsWithPricing = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProductCatalog();
      
      if (response.success) {
        const productsWithPricing = response.products.map(product => ({
          ...product,
          sellerPrice: product.customPrice || calculateSellerPrice(
            product.adminPrice, 
            product.category, 
            product.customMargin
          )
        }));
        
        setLoading(false);
        return productsWithPricing;
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Get products error:', error);
      setError(error.message);
      setLoading(false);
      return [];
    }
  }, [calculateSellerPrice]);

  // Toggle product selection
  const toggleProductSelection = useCallback(async (productId) => {
    try {
      // First get current catalog to check current selection status
      const response = await apiService.getProductCatalog();
      const product = response.products.find(p => p.id === productId);
      
      if (product) {
        const newSelection = !product.isSelected;
        await apiService.selectProduct(
          productId,
          product.customMargin,
          product.customPrice,
          newSelection
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Toggle product selection error:', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Update product pricing
  const updateProductPricing = useCallback(async (productId, customMargin, customPrice) => {
    try {
      const response = await apiService.updateProductPricing(productId, customMargin, customPrice);
      return response.success;
    } catch (error) {
      console.error('Update product pricing error:', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Bulk update pricing
  const bulkUpdatePricing = useCallback(async (productIds, marginAdjustment) => {
    try {
      const response = await apiService.bulkUpdatePricing(productIds, marginAdjustment);
      return response.success;
    } catch (error) {
      console.error('Bulk update pricing error:', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Bulk set margin
  const bulkSetMargin = async (productIds, margin) => {
    try {
      const response = await apiService.bulkUpdatePricing(productIds, undefined, margin);
      return response.success;
    } catch (error) {
      console.error('Bulk set margin error:', error);
      setError(error.message);
      return false;
    }
  };

  // Get selected products for export
  const getSelectedProductsForExport = useCallback(async () => {
    try {
      const response = await apiService.getSelectedProducts();
      
      if (response.success) {
        return response.products.map(item => {
          const product = item.product;
          const sellerPrice = item.customPrice || calculateSellerPrice(
            product.adminPrice,
            product.category,
            item.customMargin
          );
          
          return {
            sku: product.sku,
            name: product.name,
            description: product.description,
            category: product.category,
            brand: product.brand,
            price: sellerPrice.toFixed(2),
            stock: product.stock,
            weight: product.weight,
            dimensions: product.dimensions,
            image: product.image
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Get selected products error:', error);
      setError(error.message);
      return [];
    }
  }, [calculateSellerPrice]);

  // Get all products (for admin)
  const getAllProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getProducts(filters);
      
      if (response.success) {
        setLoading(false);
        return response.products;
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Get all products error:', error);
      setError(error.message);
      setLoading(false);
      return [];
    }
  };

  // Create product (admin)
  const createProduct = async (productData) => {
    try {
      const response = await apiService.createProduct(productData);
      return {
        success: response.success,
        message: response.message || 'Product created successfully',
        product: response.product
      };
    } catch (error) {
      console.error('Create product error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create product'
      };
    }
  };

  // Update product (admin)
  const updateProduct = async (productId, productData) => {
    try {
      const response = await apiService.updateProduct(productId, productData);
      return {
        success: response.success,
        message: response.message || 'Product updated successfully',
        product: response.product
      };
    } catch (error) {
      console.error('Update product error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update product'
      };
    }
  };

  // Delete product (admin)
  const deleteProduct = async (productId) => {
    try {
      const response = await apiService.deleteProduct(productId);
      return {
        success: response.success,
        message: response.message || 'Product deleted successfully'
      };
    } catch (error) {
      console.error('Delete product error:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete product'
      };
    }
  };

  // Bulk create products (admin)
  const bulkCreateProducts = async (products) => {
    try {
      const response = await apiService.bulkCreateProducts(products);
      return {
        success: response.success,
        message: response.message || 'Products created successfully',
        products: response.products
      };
    } catch (error) {
      console.error('Bulk create products error:', error);
      return {
        success: false,
        message: error.message || 'Failed to create products'
      };
    }
  };

  // Get product categories
  const getCategories = async () => {
    try {
      const response = await apiService.getActiveCategories();
      return response.success ? response.categories.map(cat => cat.name) : [];
    } catch (error) {
      console.error('Get categories error:', error);
      return categories.map(cat => cat.name);
    }
  };

  // Get product brands
  const getBrands = async () => {
    try {
      const response = await apiService.getProductBrands();
      return response.success ? response.brands : [];
    } catch (error) {
      console.error('Get brands error:', error);
      return [];
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    loading,
    error,
    clearError,
    pricingSettings,
    categories,
    calculateSellerPrice,
    getProductsWithPricing,
    toggleProductSelection,
    updateProductPricing,
    bulkUpdatePricing,
    bulkSetMargin,
    getSelectedProductsForExport,
    getAllProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkCreateProducts,
    getCategories,
    getBrands
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};