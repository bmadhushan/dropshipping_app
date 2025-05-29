import express from 'express';
import { body, validationResult } from 'express-validator';
import { SellerProduct } from '../models/SellerProduct.js';
import { Product } from '../models/Product.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get seller's products
router.get('/', authenticate, authorize('seller'), async (req, res) => {
  try {
    const sellerProducts = await SellerProduct.findBySeller(req.user.id);
    
    res.json({
      success: true,
      products: sellerProducts
    });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get seller's selected products
router.get('/selected', authenticate, authorize('seller'), async (req, res) => {
  try {
    const selectedProducts = await SellerProduct.getSelectedProducts(req.user.id);
    
    res.json({
      success: true,
      products: selectedProducts
    });
  } catch (error) {
    console.error('Get selected products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add/Update product selection and pricing
router.post('/select', [
  authenticate,
  authorize('seller'),
  body('productId').isInt({ min: 1 }).withMessage('Valid product ID is required'),
  body('customMargin').optional().isFloat({ min: 0, max: 200 }).withMessage('Custom margin must be between 0 and 200'),
  body('customPrice').optional().isFloat({ min: 0 }).withMessage('Custom price must be positive'),
  body('isSelected').isBoolean().withMessage('isSelected must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productId, customMargin, customPrice, isSelected } = req.body;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Create or update seller product
    const sellerProduct = await SellerProduct.upsert({
      sellerId: req.user.id,
      productId,
      customMargin,
      customPrice,
      isSelected
    });

    res.json({
      success: true,
      message: isSelected ? 'Product added to your store' : 'Product removed from your store',
      sellerProduct
    });
  } catch (error) {
    console.error('Select product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update product pricing
router.patch('/pricing/:productId', [
  authenticate,
  authorize('seller'),
  body('customMargin').optional().isFloat({ min: 0, max: 200 }).withMessage('Custom margin must be between 0 and 200'),
  body('customPrice').optional().isFloat({ min: 0 }).withMessage('Custom price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const productId = parseInt(req.params.productId);
    const { customMargin, customPrice } = req.body;

    // Find seller product
    const sellerProduct = await SellerProduct.findBySellerAndProduct(req.user.id, productId);
    if (!sellerProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your store'
      });
    }

    // Update pricing
    const updatedSellerProduct = await sellerProduct.update({
      customMargin,
      customPrice
    });

    res.json({
      success: true,
      message: 'Product pricing updated successfully',
      sellerProduct: updatedSellerProduct
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update product selection
router.post('/bulk-select', [
  authenticate,
  authorize('seller'),
  body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
  body('productIds.*').isInt({ min: 1 }).withMessage('All product IDs must be valid integers'),
  body('isSelected').isBoolean().withMessage('isSelected must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productIds, isSelected } = req.body;

    // Verify all products exist
    const products = await Promise.all(productIds.map(id => Product.findById(id)));
    const missingProducts = productIds.filter((id, index) => !products[index]);
    
    if (missingProducts.length > 0) {
      return res.status(404).json({
        success: false,
        message: 'Some products not found',
        missingProductIds: missingProducts
      });
    }

    // Create or update seller products for each product
    const results = await Promise.all(productIds.map(productId => 
      SellerProduct.upsert({
        sellerId: req.user.id,
        productId,
        isSelected
      })
    ));

    res.json({
      success: true,
      message: `${productIds.length} products ${isSelected ? 'added to' : 'removed from'} your store`,
      count: results.length
    });
  } catch (error) {
    console.error('Bulk select error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update pricing
router.post('/bulk-pricing', [
  authenticate,
  authorize('seller'),
  body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
  body('productIds.*').isInt({ min: 1 }).withMessage('All product IDs must be valid integers'),
  body('marginAdjustment').optional().isFloat({ min: -50, max: 50 }).withMessage('Margin adjustment must be between -50 and 50'),
  body('setMargin').optional().isFloat({ min: 0, max: 200 }).withMessage('Set margin must be between 0 and 200')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { productIds, marginAdjustment, setMargin } = req.body;

    if (!marginAdjustment && !setMargin) {
      return res.status(400).json({
        success: false,
        message: 'Either marginAdjustment or setMargin is required'
      });
    }

    let updatedCount = 0;

    if (marginAdjustment !== undefined) {
      // Adjust existing margins
      updatedCount = await SellerProduct.bulkUpdatePricing(req.user.id, productIds, marginAdjustment);
    } else if (setMargin !== undefined) {
      // Set specific margin for all products
      const updatePromises = productIds.map(async (productId) => {
        const sellerProduct = await SellerProduct.findBySellerAndProduct(req.user.id, productId);
        if (sellerProduct) {
          return await sellerProduct.update({ customMargin: setMargin, customPrice: null });
        }
        return null;
      });
      
      const results = await Promise.all(updatePromises);
      updatedCount = results.filter(result => result !== null).length;
    }

    res.json({
      success: true,
      message: `Pricing updated for ${updatedCount} products`,
      updatedCount
    });
  } catch (error) {
    console.error('Bulk pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove product from seller's store
router.delete('/:productId', authenticate, authorize('seller'), async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const sellerProduct = await SellerProduct.findBySellerAndProduct(req.user.id, productId);
    if (!sellerProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in your store'
      });
    }

    await sellerProduct.delete();

    res.json({
      success: true,
      message: 'Product removed from your store'
    });
  } catch (error) {
    console.error('Remove product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all products with seller's customization (for product catalog view)
router.get('/catalog', authenticate, authorize('seller'), async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      priceMin,
      priceMax,
      showSelected
    } = req.query;

    // Get all products
    const filters = {};
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (search) filters.search = search;
    if (priceMin) filters.priceMin = parseFloat(priceMin);
    if (priceMax) filters.priceMax = parseFloat(priceMax);
    filters.published = true;

    const allProducts = await Product.findAll(filters);
    
    // Get seller's product customizations
    const sellerProducts = await SellerProduct.findBySeller(req.user.id);
    const sellerProductMap = new Map();
    sellerProducts.forEach(sp => {
      sellerProductMap.set(sp.productId, sp);
    });

    // Merge data
    let products = allProducts.map(product => {
      const sellerProduct = sellerProductMap.get(product.id);
      return {
        ...product,
        customMargin: sellerProduct?.customMargin || null,
        customPrice: sellerProduct?.customPrice || null,
        isSelected: sellerProduct?.isSelected || false
      };
    });

    // Filter by selection if requested
    if (showSelected === 'true') {
      products = products.filter(p => p.isSelected);
    }

    res.json({
      success: true,
      products,
      totalCount: products.length
    });
  } catch (error) {
    console.error('Get catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;