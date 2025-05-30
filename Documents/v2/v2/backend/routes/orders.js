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
    console.log('Received order creation request:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
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
    
    // First get orders
    let orderQuery = `
      SELECT o.*, u.business_name as seller_business_name, u.email as seller_email
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      orderQuery += ' AND o.status = ?';
      params.push(status);
    }

    if (sellerId) {
      orderQuery += ' AND o.seller_id = ?';
      params.push(parseInt(sellerId));
    }

    orderQuery += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    console.log('Executing order query:', orderQuery, 'with params:', params);

    db.all(orderQuery, params, (err, orders) => {
      if (err) {
        console.error('Get all orders error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to fetch orders'
        });
      }

      console.log(`Found ${orders.length} orders`);

      if (orders.length === 0) {
        return res.json({
          success: true,
          orders: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: false
          }
        });
      }

      // Get all order items in one query
      const orderIds = orders.map(o => o.id);
      const placeholders = orderIds.map(() => '?').join(',');
      const itemsQuery = `SELECT * FROM order_items WHERE order_id IN (${placeholders}) ORDER BY order_id, id`;
      
      console.log('Executing items query:', itemsQuery, 'with order IDs:', orderIds);

      db.all(itemsQuery, orderIds, (itemsErr, allItems) => {
        if (itemsErr) {
          console.error('Get order items error:', itemsErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch order items'
          });
        }

        console.log(`Found ${allItems.length} total items for all orders`);

        // Group items by order_id
        const itemsByOrderId = {};
        allItems.forEach(item => {
          if (!itemsByOrderId[item.order_id]) {
            itemsByOrderId[item.order_id] = [];
          }
          itemsByOrderId[item.order_id].push(item);
        });

        // Attach items to orders
        const ordersWithItems = orders.map(order => {
          const items = itemsByOrderId[order.id] || [];
          console.log(`Order ${order.id} has ${items.length} items`);
          return {
            ...order,
            items: items
          };
        });

        console.log('Final orders with items:', ordersWithItems.map(o => ({ 
          id: o.id, 
          order_number: o.order_number,
          itemCount: o.items.length 
        })));

        res.json({
          success: true,
          orders: ordersWithItems,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: orders.length === parseInt(limit)
          }
        });
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

// Generate and download invoice (admin only)
router.get('/admin/:id/invoice', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const db = getDatabase();

    // Get order with seller and items
    const orderQuery = `
      SELECT o.*, u.business_name as seller_business_name, u.email as seller_email,
             u.business_address, u.contact_person, u.phone as seller_phone
      FROM orders o
      LEFT JOIN users u ON o.seller_id = u.id
      WHERE o.id = ?
    `;
    
    db.get(orderQuery, [orderId], (err, order) => {
      if (err) {
        console.error('Get order for invoice error:', err);
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
      
      db.all(itemsQuery, [orderId], async (itemsErr, items) => {
        if (itemsErr) {
          console.error('Get order items for invoice error:', itemsErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch order items'
          });
        }

        try {
          // Generate invoice HTML
          const invoiceHTML = generateInvoiceHTML(order, items);
          
          // For now, return HTML. In production, you'd convert to PDF
          res.setHeader('Content-Type', 'text/html');
          res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.order_number}.html"`);
          res.send(invoiceHTML);
        } catch (invoiceErr) {
          console.error('Invoice generation error:', invoiceErr);
          res.status(500).json({
            success: false,
            message: 'Failed to generate invoice'
          });
        }
      });
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send payment link (admin only)
router.post('/admin/:id/payment-link', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const { sellerEmail, amount, currency = 'usd', description } = req.body;
    
    // In a real implementation, you would:
    // 1. Create a Stripe payment link
    // 2. Send email to seller with the payment link
    // 3. Store the payment link in database
    
    // For now, simulate the process
    const paymentLink = `https://buy.stripe.com/test_payment_${orderId}_${Date.now()}`;
    
    console.log(`Payment link generated for order ${orderId}:`, {
      sellerEmail,
      amount,
      currency,
      description,
      paymentLink
    });
    
    // Here you would integrate with:
    // - Stripe API to create payment link
    // - Email service to send notification
    
    res.json({
      success: true,
      message: 'Payment link sent successfully',
      paymentLink: paymentLink
    });
  } catch (error) {
    console.error('Payment link generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment link'
    });
  }
});

// Helper function to generate invoice HTML
function generateInvoiceHTML(order, items) {
  const currentDate = new Date().toLocaleDateString();
  const orderDate = new Date(order.created_at).toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order.order_number}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #354F52; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; color: #354F52; margin-bottom: 5px; }
            .invoice-title { font-size: 18px; color: #666; }
            .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .section-title { font-weight: bold; margin-bottom: 10px; color: #354F52; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #354F52; color: white; }
            .total-row { background-color: #f0f8f0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">Dropshipping Platform</div>
            <div class="invoice-title">INVOICE</div>
        </div>
        
        <div class="invoice-details">
            <div>
                <strong>Invoice Number:</strong> ${order.order_number}<br>
                <strong>Invoice Date:</strong> ${currentDate}<br>
                <strong>Order Date:</strong> ${orderDate}
            </div>
            <div>
                <strong>Status:</strong> ${order.status.toUpperCase()}<br>
                <strong>Payment Status:</strong> ${order.payment_status || 'PENDING'}
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Seller Information</div>
            <strong>${order.seller_business_name || 'Business Name'}</strong><br>
            Email: ${order.seller_email}<br>
            ${order.business_address ? `Address: ${order.business_address}<br>` : ''}
            ${order.seller_phone ? `Phone: ${order.seller_phone}<br>` : ''}
        </div>
        
        <div class="section">
            <div class="section-title">Customer Information</div>
            <strong>${order.customer_name}</strong><br>
            Email: ${order.customer_email}<br>
            ${order.customer_phone ? `Phone: ${order.customer_phone}<br>` : ''}
            <br><strong>Shipping Address:</strong><br>
            ${order.shipping_address}
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => `
                    <tr>
                        <td>${item.product_name}</td>
                        <td>${item.product_sku}</td>
                        <td>${item.quantity}</td>
                        <td>$${parseFloat(item.unit_price).toFixed(2)}</td>
                        <td>$${parseFloat(item.total_price).toFixed(2)}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="4"><strong>Total Amount</strong></td>
                    <td><strong>$${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                </tr>
            </tbody>
        </table>
        
        ${order.notes ? `
        <div class="section">
            <div class="section-title">Order Notes</div>
            ${order.notes}
        </div>
        ` : ''}
        
        <div class="footer">
            <p>Thank you for your business!</p>
            <p>This invoice was generated on ${currentDate}</p>
        </div>
    </body>
    </html>
  `;
}

// Test endpoint to check order items
router.get('/admin/test-items', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get all orders
    db.all('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5', [], (err, orders) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      // Get all order items
      db.all('SELECT * FROM order_items ORDER BY order_id, id', [], (itemErr, items) => {
        if (itemErr) {
          return res.status(500).json({ error: itemErr.message });
        }
        
        res.json({
          success: true,
          orders: orders,
          items: items,
          summary: {
            totalOrders: orders.length,
            totalItems: items.length,
            orderItemMapping: items.reduce((acc, item) => {
              if (!acc[item.order_id]) acc[item.order_id] = 0;
              acc[item.order_id]++;
              return acc;
            }, {})
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;