import express from 'express';
import { body, validationResult } from 'express-validator';
import { getDatabase } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Create order
router.post('/', [
  authenticate,
  authorize('seller'),
  body('customerName').trim().notEmpty().withMessage('Customer name is required'),
  body('customerEmail').isEmail().withMessage('Valid customer email is required'),
  body('customerPhone').optional().trim().notEmpty().withMessage('Customer phone cannot be empty'),
  body('shippingAddress').trim().notEmpty().withMessage('Shipping address is required'),
  body('items').isArray({ min: 1 }).withMessage('Order items are required'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('Valid product ID is required for all items'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required for all items'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Valid unit price is required for all items')
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

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items,
      notes
    } = req.body;

    const db = getDatabase();

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create order
    const orderQuery = `
      INSERT INTO orders (
        order_number, seller_id, customer_name, customer_email, 
        customer_phone, shipping_address, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const orderParams = [
      orderNumber,
      req.user.id,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      totalAmount,
      notes
    ];

    db.run(orderQuery, orderParams, function(err) {
      if (err) {
        console.error('Create order error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to create order'
        });
      }

      const orderId = this.lastID;

      // Create order items
      const itemQuery = `
        INSERT INTO order_items (
          order_id, product_id, product_name, product_sku, 
          quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      let completedItems = 0;
      const totalItems = items.length;

      items.forEach(item => {
        const itemParams = [
          orderId,
          item.productId,
          item.productName,
          item.productSku,
          item.quantity,
          item.unitPrice,
          item.quantity * item.unitPrice
        ];

        db.run(itemQuery, itemParams, function(itemErr) {
          if (itemErr) {
            console.error('Create order item error:', itemErr);
          }

          completedItems++;
          if (completedItems === totalItems) {
            res.status(201).json({
              success: true,
              message: 'Order created successfully',
              order: {
                id: orderId,
                orderNumber,
                totalAmount,
                itemCount: totalItems
              }
            });
          }
        });
      });
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get seller's orders
router.get('/', authenticate, authorize('seller'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let query = `
      SELECT o.*, 
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.seller_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Get orders error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch orders'
        });
      }

      res.json({
        success: true,
        orders: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: rows.length === parseInt(limit)
        }
      });
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order by ID
router.get('/:id', authenticate, authorize('seller'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = getDatabase();

    // Get order details
    const orderQuery = 'SELECT * FROM orders WHERE id = ? AND seller_id = ?';
    
    db.get(orderQuery, [orderId, req.user.id], (err, order) => {
      if (err) {
        console.error('Get order error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order'
        });
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get order items
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
      
      db.all(itemsQuery, [orderId], (itemsErr, items) => {
        if (itemsErr) {
          console.error('Get order items error:', itemsErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch order items'
          });
        }

        res.json({
          success: true,
          order: {
            ...order,
            items
          }
        });
      });
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update order status
router.patch('/:id/status', [
  authenticate,
  authorize('seller'),
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
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

    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    const db = getDatabase();

    const query = `
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND seller_id = ?
    `;

    db.run(query, [status, orderId, req.user.id], function(err) {
      if (err) {
        console.error('Update order status error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update order status'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get all orders (admin only)
router.get('/admin/all', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { status, sellerId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const db = getDatabase();
    let query = `
      SELECT o.*, u.business_name as seller_business_name,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (sellerId) {
      query += ' AND o.seller_id = ?';
      params.push(parseInt(sellerId));
    }

    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Get all orders error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch orders'
        });
      }

      res.json({
        success: true,
        orders: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: rows.length === parseInt(limit)
        }
      });
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Admin update order status
router.patch('/admin/:id/status', [
  authenticate,
  authorize('super_admin'),
  body('status').isIn(['pending', 'approved', 'rejected', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
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

    const orderId = parseInt(req.params.id);
    const { status } = req.body;
    const db = getDatabase();

    const query = `
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    db.run(query, [status, orderId], function(err) {
      if (err) {
        console.error('Admin update order status error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update order status'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get order statistics (admin only)
router.get('/admin/stats', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_orders,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN status IN ('approved', 'processing', 'shipped', 'delivered') THEN total_amount END), 0) as approved_revenue
      FROM orders
    `;
    
    db.get(query, [], (err, stats) => {
      if (err) {
        console.error('Get order stats error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order statistics'
        });
      }
      
      res.json({
        success: true,
        stats
      });
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Bulk update orders (admin only)
router.patch('/admin/bulk-update', [
  authenticate,
  authorize('super_admin'),
  body('orderIds').isArray({ min: 1 }).withMessage('Order IDs array is required'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected')
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

    const { orderIds, status } = req.body;
    const db = getDatabase();
    
    const placeholders = orderIds.map(() => '?').join(',');
    const query = `
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${placeholders})
    `;
    
    const params = [status, ...orderIds];
    
    db.run(query, params, function(err) {
      if (err) {
        console.error('Bulk update orders error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to update orders'
        });
      }
      
      res.json({
        success: true,
        message: `${this.changes} orders updated successfully`,
        updatedCount: this.changes
      });
    });
  } catch (error) {
    console.error('Bulk update orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get admin order by ID
router.get('/admin/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = getDatabase();

    // Get order details with seller info
    const orderQuery = `
      SELECT o.*, u.business_name as seller_business_name, u.email as seller_email
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.id = ?
    `;
    
    db.get(orderQuery, [orderId], (err, order) => {
      if (err) {
        console.error('Get admin order error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch order'
        });
      }

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Get order items
      const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
      
      db.all(itemsQuery, [orderId], (itemsErr, items) => {
        if (itemsErr) {
          console.error('Get order items error:', itemsErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch order items'
          });
        }

        res.json({
          success: true,
          order: {
            ...order,
            items
          }
        });
      });
    });
  } catch (error) {
    console.error('Get admin order error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;