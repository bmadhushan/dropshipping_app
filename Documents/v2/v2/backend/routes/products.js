import express from 'express';
import { body, validationResult } from 'express-validator';
import { Product } from '../models/Product.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all products (public with optional auth for personalization)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      priceMin,
      priceMax,
      published,
      limit,
      page = 1
    } = req.query;

    const filters = {};
    
    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (search) filters.search = search;
    if (priceMin) filters.priceMin = parseFloat(priceMin);
    if (priceMax) filters.priceMax = parseFloat(priceMax);
    if (published !== undefined) filters.published = published === 'true';
    if (limit) filters.limit = parseInt(limit);

    const products = await Product.findAll(filters);
    
    res.json({
      success: true,
      products,
      totalCount: products.length
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.getCategories();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product brands
router.get('/brands', async (req, res) => {
  try {
    const brands = await Product.getBrands();
    
    res.json({
      success: true,
      brands
    });
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new product (admin only)
router.post('/', [
  authenticate,
  authorize('super_admin'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('adminPrice').isFloat({ min: 0 }).withMessage('Admin price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
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

    // Check if SKU already exists
    const existingProduct = await Product.findBySku(req.body.sku);
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this SKU already exists'
      });
    }

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk create products (admin only)
router.post('/bulk', [
  authenticate,
  authorize('super_admin'),
  body('products').isArray({ min: 1 }).withMessage('Products array is required'),
  body('products.*.sku').trim().notEmpty().withMessage('SKU is required for all products'),
  body('products.*.name').trim().notEmpty().withMessage('Name is required for all products'),
  body('products.*.category').trim().notEmpty().withMessage('Category is required for all products'),
  body('products.*.adminPrice').isFloat({ min: 0 }).withMessage('Admin price must be positive for all products')
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

    const { products } = req.body;

    // Check for duplicate SKUs in the request
    const skus = products.map(p => p.sku);
    const duplicateSKUs = skus.filter((sku, index) => skus.indexOf(sku) !== index);
    if (duplicateSKUs.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SKUs found in request',
        duplicates: duplicateSKUs
      });
    }

    // Check for existing SKUs in database
    const existingSKUs = [];
    for (const product of products) {
      const existing = await Product.findBySku(product.sku);
      if (existing) {
        existingSKUs.push(product.sku);
      }
    }

    if (existingSKUs.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Some SKUs already exist',
        existingSKUs
      });
    }

    const createdProducts = await Product.bulkCreate(products);

    res.status(201).json({
      success: true,
      message: `${createdProducts.length} products created successfully`,
      products: createdProducts
    });
  } catch (error) {
    console.error('Bulk create products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update product (admin only)
router.patch('/:id', [
  authenticate,
  authorize('super_admin'),
  body('adminPrice').optional().isFloat({ min: 0 }).withMessage('Admin price must be a positive number'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('published').optional().isBoolean().withMessage('Published must be a boolean')
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

    const productId = parseInt(req.params.id);
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // If SKU is being updated, check if it already exists
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingProduct = await Product.findBySku(req.body.sku);
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Product with this SKU already exists'
        });
      }
    }

    const updatedProduct = await product.update(req.body);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete product (admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.delete();

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update product pricing (admin only)
router.patch('/bulk/pricing', [
  authenticate,
  authorize('super_admin'),
  body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
  body('adjustment').isObject().withMessage('Adjustment object is required'),
  body('adjustment.type').isIn(['fixed', 'percentage']).withMessage('Adjustment type must be fixed or percentage'),
  body('adjustment.value').isFloat().withMessage('Adjustment value must be a number')
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

    const { productIds, adjustment } = req.body;
    const updatedProducts = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (product) {
        let newPrice = product.adminPrice;
        
        if (adjustment.type === 'fixed') {
          newPrice = Math.max(0, product.adminPrice + adjustment.value);
        } else if (adjustment.type === 'percentage') {
          newPrice = Math.max(0, product.adminPrice * (1 + adjustment.value / 100));
        }

        await product.update({ adminPrice: newPrice });
        updatedProducts.push(product);
      }
    }

    res.json({
      success: true,
      message: `${updatedProducts.length} products updated successfully`,
      products: updatedProducts
    });
  } catch (error) {
    console.error('Bulk update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update product stock (admin only)
router.patch('/bulk/stock', [
  authenticate,
  authorize('super_admin'),
  body('updates').isArray({ min: 1 }).withMessage('Updates array is required'),
  body('updates.*.productId').isInt().withMessage('Product ID must be an integer'),
  body('updates.*.stock').isInt({ min: 0 }).withMessage('Stock must be non-negative')
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

    const { updates } = req.body;
    const updatedProducts = [];

    for (const update of updates) {
      const product = await Product.findById(update.productId);
      if (product) {
        await product.update({ stock: update.stock });
        updatedProducts.push(product);
      }
    }

    res.json({
      success: true,
      message: `${updatedProducts.length} products updated successfully`,
      products: updatedProducts
    });
  } catch (error) {
    console.error('Bulk update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk publish/unpublish products (admin only)
router.patch('/bulk/publish', [
  authenticate,
  authorize('super_admin'),
  body('productIds').isArray({ min: 1 }).withMessage('Product IDs array is required'),
  body('published').isBoolean().withMessage('Published status is required')
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

    const { productIds, published } = req.body;
    const updatedProducts = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (product) {
        await product.update({ published });
        updatedProducts.push(product);
      }
    }

    res.json({
      success: true,
      message: `${updatedProducts.length} products ${published ? 'published' : 'unpublished'} successfully`,
      products: updatedProducts
    });
  } catch (error) {
    console.error('Bulk publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Import products from CSV (admin only)
router.post('/import/csv', authenticate, authorize('super_admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No CSV file provided'
      });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;

    // Convert buffer to stream and parse CSV
    const stream = Readable.from(req.file.buffer.toString());
    
    return new Promise((resolve) => {
      stream
        .pipe(csv({
          mapHeaders: ({ header }) => header.toLowerCase().trim()
        }))
        .on('data', (data) => {
          try {
            // Validate required fields
            const requiredFields = ['sku', 'name', 'category', 'admin_price'];
            const missingFields = requiredFields.filter(field => 
              !data[field] && !data[field.replace('_', ' ')] && !data[field.replace('_', '')]
            );

            if (missingFields.length > 0) {
              errors.push({
                row: processedCount + 1,
                error: `Missing required fields: ${missingFields.join(', ')}`,
                data
              });
              processedCount++;
              return;
            }

            // Map CSV fields to product object
            const product = {
              sku: data.sku || data.SKU,
              name: data.name || data.Name,
              description: data.description || data.Description || '',
              category: data.category || data.Category,
              brand: data.brand || data.Brand || '',
              adminPrice: parseFloat(data.admin_price || data['admin price'] || data.adminprice || data.price) || 0,
              stock: parseInt(data.stock || data.Stock) || 0,
              weight: parseFloat(data.weight || data.Weight) || 0,
              dimensions: data.dimensions || data.Dimensions || '',
              image: data.image || data.Image || data.image_url || data['image url'] || '',
              published: data.published === 'true' || data.published === '1' || data.published === 'Yes'
            };

            // Validate admin price
            if (product.adminPrice <= 0) {
              errors.push({
                row: processedCount + 1,
                error: 'Admin price must be greater than 0',
                data
              });
              processedCount++;
              return;
            }

            results.push(product);
            processedCount++;
          } catch (error) {
            errors.push({
              row: processedCount + 1,
              error: `Processing error: ${error.message}`,
              data
            });
            processedCount++;
          }
        })
        .on('end', async () => {
          try {
            let successCount = 0;
            let skippedCount = 0;

            // Process products in batches
            for (const product of results) {
              try {
                // Check if SKU already exists
                const existingProduct = await Product.findBySku(product.sku);
                if (existingProduct) {
                  errors.push({
                    sku: product.sku,
                    error: 'Product with this SKU already exists',
                    action: 'skipped'
                  });
                  skippedCount++;
                  continue;
                }

                await Product.create(product);
                successCount++;
              } catch (createError) {
                errors.push({
                  sku: product.sku,
                  error: `Failed to create product: ${createError.message}`,
                  action: 'failed'
                });
              }
            }

            resolve(
              res.json({
                success: true,
                message: 'CSV import completed',
                summary: {
                  totalRows: processedCount,
                  successCount,
                  skippedCount,
                  errorCount: errors.length
                },
                errors: errors.length > 0 ? errors.slice(0, 10) : [] // Return first 10 errors
              })
            );
          } catch (error) {
            resolve(
              res.status(500).json({
                success: false,
                message: 'Failed to process CSV import',
                error: error.message
              })
            );
          }
        })
        .on('error', (error) => {
          resolve(
            res.status(400).json({
              success: false,
              message: 'CSV parsing error',
              error: error.message
            })
          );
        });
    });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during CSV import'
    });
  }
});

// Export products to CSV format (admin only)
router.get('/export/csv', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const products = await Product.findAll({ published: true });
    
    // Create CSV header
    const csvHeaders = ['SKU', 'Name', 'Description', 'Category', 'Brand', 'Admin Price', 'Stock', 'Weight', 'Dimensions', 'Image URL', 'Published'];
    
    // Create CSV rows
    const csvRows = products.map(product => [
      product.sku,
      `"${product.name || ''}"`,
      `"${product.description || ''}"`,
      product.category || '',
      product.brand || '',
      product.adminPrice,
      product.stock,
      product.weight || '',
      product.dimensions || '',
      product.image || '',
      product.published ? 'Yes' : 'No'
    ]);
    
    // Combine headers and rows
    const csv = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Export products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;