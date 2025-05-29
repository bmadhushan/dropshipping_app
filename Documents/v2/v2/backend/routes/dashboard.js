import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { SellerProduct } from '../models/SellerProduct.js';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    // Get total counts
    const totalSellers = await User.countSellers();
    const totalProducts = await Product.countProducts();
    const totalCategories = await Category.countCategories();
    
    // Get pending sellers count
    const pendingSellers = await User.countPendingSellers();
    
    // Get active products count
    const activeProducts = await Product.countActiveProducts();
    
    // Calculate revenue (mock for now, would need Order model)
    const totalRevenue = 12500; // Mock value
    
    res.json({
      totalSellers,
      totalProducts,
      totalCategories,
      totalRevenue,
      pendingSellers,
      activeProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent seller registrations
router.get('/recent-sellers', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const recentSellers = await User.getRecentSellers(5); // Get last 5 sellers
    res.json(recentSellers);
  } catch (error) {
    console.error('Error fetching recent sellers:', error);
    res.status(500).json({ message: 'Failed to fetch recent sellers' });
  }
});

// Get recent activity
router.get('/recent-activity', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    // For now, we'll generate activity based on recent database changes
    const activities = [];
    
    try {
      // Get recent seller registrations
      const recentSellers = await User.getRecentSellers(3);
      recentSellers.forEach(seller => {
        activities.push({
          id: `seller-${seller.id}`,
          type: 'seller',
          message: `New seller registration: ${seller.business_name || seller.name}`,
          time: new Date(seller.created_at).toISOString(),
          icon: '👤'
        });
      });
    } catch (sellerError) {
      console.error('Error fetching recent sellers:', sellerError);
    }
    
    try {
      // Get recently added products
      const recentProducts = await Product.getRecentProducts(3);
      recentProducts.forEach(product => {
        activities.push({
          id: `product-${product.id}`,
          type: 'product',
          message: `New product added: ${product.name}`,
          time: new Date(product.createdAt || product.created_at).toISOString(),
          icon: '📦'
        });
      });
    } catch (productError) {
      console.error('Error fetching recent products:', productError);
    }
    
    // If no activities, provide a default one
    if (activities.length === 0) {
      activities.push({
        id: 'system-1',
        type: 'system',
        message: 'System initialized successfully',
        time: new Date().toISOString(),
        icon: '🚀'
      });
    }
    
    // Sort by time (most recent first)
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json(activities.slice(0, 5)); // Return top 5 activities
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
});

// Get top categories
router.get('/top-categories', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const topCategories = await Category.getTopCategories(5); // Get top 5 categories
    res.json(topCategories);
  } catch (error) {
    console.error('Error fetching top categories:', error);
    res.status(500).json({ message: 'Failed to fetch top categories' });
  }
});

export default router;