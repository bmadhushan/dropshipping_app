import express from 'express';
import { body, validationResult } from 'express-validator';
import { Category } from '../models/Category.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all categories (public for sellers to view)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { includeInactive = false, search, hierarchical = false } = req.query;
    
    const filters = {};
    if (!includeInactive) {
      filters.isActive = true;
    }
    if (search) {
      filters.search = search;
    }

    let categories;
    if (hierarchical === 'true') {
      categories = await Category.findAllHierarchical(filters);
    } else {
      categories = await Category.findAll(filters);
      categories = categories.map(cat => cat.toJSON());
    }
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active categories only (for dropdowns in forms)
router.get('/active', async (req, res) => {
  try {
    const categories = await Category.getActiveCategories();
    
    res.json({
      success: true,
      categories: categories.map(cat => cat.toJSON())
    });
  } catch (error) {
    console.error('Get active categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get root categories only
router.get('/root', optionalAuth, async (req, res) => {
  try {
    const categories = await Category.getRootCategories();
    
    res.json({
      success: true,
      categories: categories.map(cat => cat.toJSON())
    });
  } catch (error) {
    console.error('Get root categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get hierarchical structure
router.get('/hierarchy', optionalAuth, async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const filters = {};
    if (!includeInactive) {
      filters.isActive = true;
    }

    const categories = await Category.findAllHierarchical(filters);
    
    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Get category hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get children of a specific category
router.get('/:id/children', optionalAuth, async (req, res) => {
  try {
    const parentId = parseInt(req.params.id);
    const children = await Category.getChildren(parentId);
    
    res.json({
      success: true,
      categories: children.map(cat => cat.toJSON())
    });
  } catch (error) {
    console.error('Get category children error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get category by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      category: category.toJSON()
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new category (admin only)
router.post('/', [
  authenticate,
  authorize('super_admin'),
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('defaultMargin').optional().isFloat({ min: 0, max: 200 }).withMessage('Default margin must be between 0 and 200'),
  body('shippingFee').optional().isFloat({ min: 0 }).withMessage('Shipping fee must be 0 or greater'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('parentId').optional().isInt({ min: 1 }).withMessage('Parent ID must be a positive integer')
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

    // Check if category name already exists
    const existingCategory = await Category.findByName(req.body.name);
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: category.toJSON()
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update category (admin only)
router.patch('/:id', [
  authenticate,
  authorize('super_admin'),
  body('name').optional().trim().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().trim(),
  body('icon').optional().trim(),
  body('defaultMargin').optional().isFloat({ min: 0, max: 200 }).withMessage('Default margin must be between 0 and 200'),
  body('shippingFee').optional().isFloat({ min: 0 }).withMessage('Shipping fee must be 0 or greater'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('sortOrder').optional().isInt({ min: 0 }).withMessage('Sort order must be a non-negative integer'),
  body('parentId').optional().isInt({ min: 1 }).withMessage('Parent ID must be a positive integer')
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

    const categoryId = parseInt(req.params.id);
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // If name is being updated, check if it already exists
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findByName(req.body.name);
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    const updatedCategory = await category.update(req.body);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category: updatedCategory.toJSON()
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reorder categories (admin only)
router.post('/reorder', [
  authenticate,
  authorize('super_admin'),
  body('categories').isArray({ min: 1 }).withMessage('Categories array is required'),
  body('categories.*.id').isInt({ min: 1 }).withMessage('Valid category ID is required'),
  body('categories.*.sortOrder').isInt({ min: 0 }).withMessage('Valid sort order is required')
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

    const { categories } = req.body;

    await Category.reorderCategories(categories);

    res.json({
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Toggle category active status (admin only)
router.patch('/:id/toggle-status', [
  authenticate,
  authorize('super_admin')
], async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const updatedCategory = await category.update({
      isActive: !category.isActive
    });

    res.json({
      success: true,
      message: `Category ${updatedCategory.isActive ? 'activated' : 'deactivated'} successfully`,
      category: updatedCategory.toJSON()
    });
  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // TODO: Check if category is being used by products before deletion
    // For now, we'll allow deletion but in production you might want to prevent it

    await category.delete();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;