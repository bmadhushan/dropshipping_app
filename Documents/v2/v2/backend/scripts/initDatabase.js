import { initDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const defaultCategories = [
  {
    name: 'Clothing',
    description: 'Apparel and fashion items',
    icon: '👕',
    defaultMargin: 25,
    sortOrder: 1
  },
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets',
    icon: '📱',
    defaultMargin: 15,
    sortOrder: 2
  },
  {
    name: 'Home & Garden',
    description: 'Home decor and gardening items',
    icon: '🏠',
    defaultMargin: 30,
    sortOrder: 3
  },
  {
    name: 'Sports',
    description: 'Sports and fitness equipment',
    icon: '⚽',
    defaultMargin: 20,
    sortOrder: 4
  },
  {
    name: 'Beauty',
    description: 'Beauty and personal care products',
    icon: '💄',
    defaultMargin: 35,
    sortOrder: 5
  },
  {
    name: 'Books',
    description: 'Books and educational materials',
    icon: '📚',
    defaultMargin: 25,
    sortOrder: 6
  },
  {
    name: 'Toys',
    description: 'Toys and games',
    icon: '🧸',
    defaultMargin: 30,
    sortOrder: 7
  },
  {
    name: 'Automotive',
    description: 'Car accessories and parts',
    icon: '🚗',
    defaultMargin: 20,
    sortOrder: 8
  },
  {
    name: 'Food & Beverages',
    description: 'Food items and beverages',
    icon: '🍕',
    defaultMargin: 15,
    sortOrder: 9
  },
  {
    name: 'Health',
    description: 'Health and wellness products',
    icon: '🏥',
    defaultMargin: 25,
    sortOrder: 10
  }
];

const sampleProducts = [
  {
    sku: 'EW-001',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable organic cotton t-shirt with eco-friendly dyes',
    category: 'Clothing',
    brand: 'EcoWear',
    adminPrice: 24.99,
    stock: 150,
    weight: 0.2,
    dimensions: '30x20x2cm',
    image: 'https://via.placeholder.com/300x300/4CAF50/white?text=Organic+T-Shirt',
    published: true
  },
  {
    sku: 'TG-002',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    category: 'Electronics',
    brand: 'TechGear',
    adminPrice: 89.99,
    stock: 75,
    weight: 0.5,
    dimensions: '18x15x8cm',
    image: 'https://via.placeholder.com/300x300/2196F3/white?text=Headphones',
    published: true
  },
  {
    sku: 'HG-003',
    name: 'Ceramic Planter Set',
    description: 'Set of 3 decorative ceramic planters for indoor plants',
    category: 'Home & Garden',
    brand: 'HomeDecor',
    adminPrice: 45.50,
    stock: 120,
    weight: 1.2,
    dimensions: '25x25x20cm',
    image: 'https://via.placeholder.com/300x300/FF9800/white?text=Planters',
    published: true
  },
  {
    sku: 'FF-004',
    name: 'Yoga Mat Premium',
    description: 'Non-slip premium yoga mat with carrying strap',
    category: 'Sports',
    brand: 'FlexFit',
    adminPrice: 35.00,
    stock: 200,
    weight: 1.0,
    dimensions: '183x61x0.6cm',
    image: 'https://via.placeholder.com/300x300/9C27B0/white?text=Yoga+Mat',
    published: true
  },
  {
    sku: 'BL-005',
    name: 'Natural Face Serum',
    description: 'Anti-aging face serum with natural ingredients',
    category: 'Beauty',
    brand: 'BeautyLux',
    adminPrice: 55.99,
    stock: 90,
    weight: 0.1,
    dimensions: '8x8x12cm',
    image: 'https://via.placeholder.com/300x300/E91E63/white?text=Face+Serum',
    published: true
  },
  {
    sku: 'TG-006',
    name: 'Smart Fitness Tracker',
    description: 'Water-resistant fitness tracker with heart rate monitor',
    category: 'Electronics',
    brand: 'TechGear',
    adminPrice: 129.99,
    stock: 60,
    weight: 0.05,
    dimensions: '4x2x1cm',
    image: 'https://via.placeholder.com/300x300/607D8B/white?text=Fitness+Tracker',
    published: true
  },
  {
    sku: 'EW-007',
    name: 'Bamboo Hoodie',
    description: 'Sustainable bamboo fiber hoodie with soft texture',
    category: 'Clothing',
    brand: 'EcoWear',
    adminPrice: 65.00,
    stock: 85,
    weight: 0.6,
    dimensions: '35x25x5cm',
    image: 'https://via.placeholder.com/300x300/795548/white?text=Bamboo+Hoodie',
    published: true
  },
  {
    sku: 'HG-008',
    name: 'LED String Lights',
    description: 'Solar-powered LED string lights for outdoor decoration',
    category: 'Home & Garden',
    brand: 'HomeDecor',
    adminPrice: 28.50,
    stock: 180,
    weight: 0.3,
    dimensions: '500x2x2cm',
    image: 'https://via.placeholder.com/300x300/FFEB3B/black?text=LED+Lights',
    published: true
  },
  {
    sku: 'BL-009',
    name: 'Hair Care Set',
    description: 'Complete hair care set with shampoo, conditioner and serum',
    category: 'Beauty',
    brand: 'BeautyLux',
    adminPrice: 78.50,
    stock: 55,
    weight: 0.9,
    dimensions: '25x15x10cm',
    image: 'https://via.placeholder.com/300x300/3F51B5/white?text=Hair+Care',
    published: true
  },
  {
    sku: 'FF-010',
    name: 'Resistance Bands Set',
    description: 'Set of 5 resistance bands with different strengths',
    category: 'Sports',
    brand: 'FlexFit',
    adminPrice: 29.99,
    stock: 140,
    weight: 0.4,
    dimensions: '20x15x5cm',
    image: 'https://via.placeholder.com/300x300/4CAF50/white?text=Resistance+Bands',
    published: true
  }
];

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    
    console.log('Creating default admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findByUsername(process.env.DEFAULT_ADMIN_USERNAME);
    
    if (!existingAdmin) {
      const adminUser = await User.create({
        username: process.env.DEFAULT_ADMIN_USERNAME,
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: process.env.DEFAULT_ADMIN_PASSWORD,
        role: 'super_admin',
        status: 'active',
        name: 'Super Administrator',
        businessName: 'Admin Panel',
        contactPerson: 'Administrator',
        phone: '+94 77 136 5799',
        businessAddress: 'Admin Office',
        businessType: 'admin',
        categoryInterests: [],
        description: 'System administrator account'
      });
      console.log('Default admin user created:', adminUser.username);
    } else {
      console.log('Default admin user already exists');
    }
    
    console.log('Creating demo seller user...');
    
    // Check if demo seller already exists
    const existingSeller = await User.findByUsername('seller');
    
    if (!existingSeller) {
      const demoSeller = await User.create({
        username: 'seller',
        email: 'seller@demo.com',
        password: '1234',
        role: 'seller',
        status: 'active',
        name: 'Demo Seller',
        businessName: 'Demo Store',
        contactPerson: 'Demo Seller',
        phone: '+94 77 123 4567',
        businessAddress: 'Colombo, Sri Lanka',
        businessType: 'retailer',
        categoryInterests: ['Electronics', 'Clothing', 'Home & Garden'],
        taxId: 'DEMO123456',
        description: 'This is a demo seller account for testing purposes.'
      });
      console.log('Demo seller user created:', demoSeller.username);
    } else {
      console.log('Demo seller user already exists');
    }
    
    console.log('Creating default categories...');
    
    // Check if categories already exist
    const existingCategories = await Category.findAll({ limit: 1 });
    
    if (existingCategories.length === 0) {
      for (const categoryData of defaultCategories) {
        try {
          await Category.create(categoryData);
        } catch (error) {
          console.error(`Error creating category ${categoryData.name}:`, error);
        }
      }
      console.log(`Created ${defaultCategories.length} default categories`);
    } else {
      console.log('Default categories already exist');
    }
    
    console.log('Creating sample products...');
    
    // Check if products already exist
    const existingProducts = await Product.findAll({ limit: 1 });
    
    if (existingProducts.length === 0) {
      const createdProducts = await Product.bulkCreate(sampleProducts);
      console.log(`Created ${createdProducts.length} sample products`);
    } else {
      console.log('Sample products already exist');
    }
    
    console.log('Database initialization completed successfully!');
    
    console.log('\\n=== Login Credentials ===');
    console.log(`Admin Username: ${process.env.DEFAULT_ADMIN_USERNAME}`);
    console.log(`Admin Password: ${process.env.DEFAULT_ADMIN_PASSWORD}`);
    console.log('');
    console.log('Demo Seller Username: seller');
    console.log('Demo Seller Password: 1234');
    console.log('==========================\\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();