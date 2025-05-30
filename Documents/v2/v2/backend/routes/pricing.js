import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';

const router = express.Router();

// Get all pricing rules
router.get('/rules', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const query = 'SELECT * FROM pricing_rules ORDER BY created_at DESC';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching pricing rules:', err);
        return res.status(500).json({ message: 'Failed to fetch pricing rules' });
      }
      
      res.json(rows);
    });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create pricing rule
router.post('/rules', [
  authenticate,
  authorize('super_admin'),
  body('name').trim().notEmpty().withMessage('Rule name is required'),
  body('type').isIn(['category', 'product', 'global']).withMessage('Invalid rule type'),
  body('adjustmentType').isIn(['percentage', 'fixed']).withMessage('Invalid adjustment type'),
  body('adjustmentValue').isFloat().withMessage('Adjustment value must be a number')
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

    const db = getDatabase();
    const { name, type, categoryId, productId, adjustmentType, adjustmentValue, isActive } = req.body;
    
    const query = `
      INSERT INTO pricing_rules (name, type, category_id, product_id, adjustment_type, adjustment_value, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      name,
      type,
      categoryId || null,
      productId || null,
      adjustmentType,
      adjustmentValue,
      isActive !== undefined ? isActive : true
    ];
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error creating pricing rule:', err);
        return res.status(500).json({ message: 'Failed to create pricing rule' });
      }
      
      res.status(201).json({
        success: true,
        message: 'Pricing rule created successfully',
        rule: { id: this.lastID, ...req.body }
      });
    });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update pricing rule
router.patch('/rules/:id', [
  authenticate,
  authorize('super_admin'),
  body('adjustmentValue').optional().isFloat().withMessage('Adjustment value must be a number')
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

    const db = getDatabase();
    const ruleId = parseInt(req.params.id);
    const updates = [];
    const params = [];
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined && key !== 'id') {
        if (key === 'categoryId') {
          updates.push('category_id = ?');
        } else if (key === 'productId') {
          updates.push('product_id = ?');
        } else if (key === 'adjustmentType') {
          updates.push('adjustment_type = ?');
        } else if (key === 'adjustmentValue') {
          updates.push('adjustment_value = ?');
        } else if (key === 'isActive') {
          updates.push('is_active = ?');
        } else {
          updates.push(`${key} = ?`);
        }
        params.push(req.body[key]);
      }
    });
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(ruleId);
    
    const query = `UPDATE pricing_rules SET ${updates.join(', ')} WHERE id = ?`;
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Error updating pricing rule:', err);
        return res.status(500).json({ message: 'Failed to update pricing rule' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Pricing rule not found' });
      }
      
      res.json({
        success: true,
        message: 'Pricing rule updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete pricing rule
router.delete('/rules/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const ruleId = parseInt(req.params.id);
    
    const query = 'DELETE FROM pricing_rules WHERE id = ?';
    
    db.run(query, [ruleId], function(err) {
      if (err) {
        console.error('Error deleting pricing rule:', err);
        return res.status(500).json({ message: 'Failed to delete pricing rule' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Pricing rule not found' });
      }
      
      res.json({
        success: true,
        message: 'Pricing rule deleted successfully'
      });
    });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get global pricing settings (accessible to all authenticated users)
router.get('/global', authenticate, async (req, res) => {
  try {
    const db = getDatabase();
    const query = 'SELECT * FROM global_settings WHERE key IN ("currencyConversion", "shippingCost", "defaultMargin")';
    
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching global settings:', err);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to fetch global settings' 
        });
      }
      
      const settings = {
        currencyConversion: 182,
        shippingCost: 500,
        defaultMargin: 20
      };
      
      rows.forEach(row => {
        const value = parseFloat(row.value);
        if (!isNaN(value)) {
          settings[row.key] = value;
        }
      });
      
      res.json({
        success: true,
        settings
      });
    });
  } catch (error) {
    console.error('Error fetching global settings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});

// Update global pricing settings
router.patch('/global', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = getDatabase();
    const settings = req.body;
    
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)
      `);
      
      Object.entries(settings).forEach(([key, value]) => {
        if (key.startsWith('pricing_')) {
          stmt.run(key, value.toString());
        }
      });
      
      stmt.finalize();
      
      res.json({
        success: true,
        message: 'Global pricing settings updated successfully'
      });
    });
  } catch (error) {
    console.error('Error updating global settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Calculate price with rules
router.post('/calculate', [
  authenticate,
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be positive'),
  body('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
  body('productId').optional().isInt().withMessage('Product ID must be an integer')
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

    const { basePrice, categoryId, productId } = req.body;
    let finalPrice = basePrice;
    const appliedRules = [];
    
    const db = getDatabase();
    
    // Get applicable rules
    const query = `
      SELECT * FROM pricing_rules 
      WHERE is_active = 1 AND (
        type = 'global' OR 
        (type = 'category' AND category_id = ?) OR 
        (type = 'product' AND product_id = ?)
      )
      ORDER BY type DESC, created_at ASC
    `;
    
    db.all(query, [categoryId || -1, productId || -1], (err, rules) => {
      if (err) {
        console.error('Error fetching pricing rules:', err);
        return res.status(500).json({ message: 'Failed to calculate price' });
      }
      
      // Apply rules in order
      rules.forEach(rule => {
        if (rule.adjustment_type === 'percentage') {
          finalPrice = finalPrice * (1 + rule.adjustment_value / 100);
        } else if (rule.adjustment_type === 'fixed') {
          finalPrice = finalPrice + rule.adjustment_value;
        }
        
        appliedRules.push({
          id: rule.id,
          name: rule.name,
          type: rule.type,
          adjustmentType: rule.adjustment_type,
          adjustmentValue: rule.adjustment_value
        });
      });
      
      res.json({
        basePrice,
        finalPrice: Math.max(0, finalPrice),
        appliedRules,
        totalAdjustment: finalPrice - basePrice,
        adjustmentPercentage: ((finalPrice - basePrice) / basePrice * 100).toFixed(2)
      });
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;