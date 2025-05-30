import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.js';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// Get conversion rate
router.get('/conversion-rate', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    
    const result = await new Promise((resolve, reject) => {
      db.get(
        "SELECT value FROM global_settings WHERE key = 'lkr_conversion_rate'",
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    res.json({
      success: true,
      conversionRate: result ? parseFloat(result.value) : 330
    });
  } catch (error) {
    console.error('Get conversion rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversion rate'
    });
  }
});

// Update conversion rate (admin only)
router.post('/conversion-rate', [
  authenticate,
  authorize('admin', 'super_admin'),
  body('rate').isFloat({ min: 1, max: 1000 }).withMessage('Conversion rate must be between 1 and 1000')
], async (req, res) => {
  try {
    console.log('🔧 Update conversion rate endpoint hit');
    console.log('👤 User:', req.user?.username, 'Role:', req.user?.role);
    console.log('📊 Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const db = getDatabase();
    const { rate } = req.body;
    console.log('💰 Converting rate:', rate, 'Type:', typeof rate);
    
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT OR REPLACE INTO global_settings (key, value) VALUES ('lkr_conversion_rate', ?)",
        [rate.toString()],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log('✅ Conversion rate updated successfully to:', rate);
    res.json({
      success: true,
      message: 'Conversion rate updated successfully',
      conversionRate: rate
    });
  } catch (error) {
    console.error('Update conversion rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update conversion rate'
    });
  }
});

export default router;