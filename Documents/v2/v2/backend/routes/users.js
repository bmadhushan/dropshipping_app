import express from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { role, status } = req.query;
    const filters = {};
    
    if (role) filters.role = role;
    if (status) filters.status = status;

    const users = await User.findAll(filters);
    
    res.json({
      success: true,
      users: users.map(user => user.toJSON())
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending sellers (admin only)
router.get('/pending-sellers', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const pendingSellers = await User.findAll({ role: 'seller', status: 'pending' });
    
    res.json({
      success: true,
      sellers: pendingSellers.map(seller => seller.toJSON())
    });
  } catch (error) {
    console.error('Get pending sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active sellers (admin only)
router.get('/active-sellers', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const activeSellers = await User.findAll({ role: 'seller', status: 'active' });
    
    res.json({
      success: true,
      sellers: activeSellers.map(seller => seller.toJSON())
    });
  } catch (error) {
    console.error('Get active sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID (admin only or own profile)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Allow users to access their own profile or admin to access any profile
    if (req.user.role !== 'super_admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.patch('/:id', [
  authenticate,
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('businessName').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('contactPerson').optional().trim().notEmpty().withMessage('Contact person cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('businessAddress').optional().trim().notEmpty().withMessage('Business address cannot be empty'),
  body('categoryInterests').optional().isArray().withMessage('Category interests must be an array')
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

    const userId = parseInt(req.params.id);
    
    // Allow users to update their own profile or admin to update any profile
    if (req.user.role !== 'super_admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;
    delete updateData.status;
    delete updateData.id;

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await User.findByEmail(updateData.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updatedUser = await user.update(updateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Approve seller (admin only)
router.patch('/:id/approve', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'seller') {
      return res.status(400).json({
        success: false,
        message: 'User is not a seller'
      });
    }

    if (user.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'Seller is already approved'
      });
    }

    const updatedUser = await user.update({
      status: 'active',
      approvedDate: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Seller approved successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject seller (admin only)
router.patch('/:id/reject', [
  authenticate,
  authorize('super_admin'),
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
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

    const userId = parseInt(req.params.id);
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role !== 'seller') {
      return res.status(400).json({
        success: false,
        message: 'User is not a seller'
      });
    }

    const updatedUser = await user.update({
      status: 'rejected',
      rejectionReason: reason,
      rejectedDate: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Seller rejected',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user status (admin only)
router.patch('/:id/status', [
  authenticate,
  authorize('super_admin'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
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

    const userId = parseInt(req.params.id);
    const { status } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await user.update({
      status,
      statusUpdatedDate: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'User status updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;