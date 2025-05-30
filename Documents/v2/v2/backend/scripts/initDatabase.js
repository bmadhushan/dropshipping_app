import { initDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const defaultCategories = [
  // Parent Categories with their children
  {
    name: 'Snacks & Sweets',
    description: 'Delicious snacks and confectionery',
    icon: '🍫',
    defaultMargin: 30,
    isActive: true,
    sortOrder: 1,
    children: [
      { name: 'UK Chocolates', description: 'Premium UK chocolate brands', icon: '🍫' },
      { name: 'Candy & Gummies', description: 'Sweet candies and gummy treats', icon: '🍬' },
      { name: 'Biscuits & Cookies', description: 'Biscuits and cookies variety', icon: '🍪' },
      { name: 'Crisps & Savoury Snacks', description: 'Crisps and savory snack options', icon: '🥨' },
      { name: 'Nuts & Dried Fruits', description: 'Healthy nuts and dried fruits', icon: '🥜' },
      { name: 'Sugar-Free / Vegan Treats', description: 'Sugar-free and vegan options', icon: '🌱' },
      { name: 'Seasonal Specials', description: 'Seasonal and holiday treats', icon: '🎄' }
    ]
  },
  {
    name: 'Cosmetics & Skincare',
    description: 'Beauty and personal care products',
    icon: '💄',
    defaultMargin: 35,
    isActive: true,
    sortOrder: 2,
    children: [
      { name: 'Face Care', description: 'Facial skincare products', icon: '✨' },
      { name: 'Body Care', description: 'Body lotions and care', icon: '🧴' },
      { name: 'Makeup', description: 'Makeup and cosmetics', icon: '💋' },
      { name: 'Fragrances', description: 'Perfumes and fragrances', icon: '🌸' },
      { name: 'Hair Care', description: 'Hair care products', icon: '💇' },
      { name: "Men's Grooming", description: 'Grooming products for men', icon: '🧔' },
      { name: 'Baby & Kids Care', description: 'Gentle care for babies and kids', icon: '👶' },
      { name: 'UK Organic/Green Beauty', description: 'Organic and eco-friendly beauty', icon: '🌿' }
    ]
  },
  {
    name: 'Fashion & Footwear',
    description: 'Clothing and footwear',
    icon: '👟',
    defaultMargin: 25,
    isActive: true,
    sortOrder: 3,
    children: [
      { name: "Men's Shoes", description: 'Footwear for men', icon: '👞' },
      { name: "Women's Shoes", description: 'Footwear for women', icon: '👠' },
      { name: "Children's Shoes", description: 'Footwear for children', icon: '👟' },
      { name: 'UK Streetwear', description: 'Trendy UK street fashion', icon: '🧥' },
      { name: 'Loungewear & Pajamas', description: 'Comfortable loungewear', icon: '🩳' },
      { name: 'Branded Socks & Underwear', description: 'Quality undergarments', icon: '🧦' },
      { name: 'Seasonal Apparel', description: 'Seasonal clothing items', icon: '🧤' }
    ]
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports equipment and fitness gear',
    icon: '⚽',
    defaultMargin: 20,
    isActive: true,
    sortOrder: 4,
    children: [
      { name: 'Gym Equipment', description: 'Equipment for gym workouts', icon: '🏋️' },
      { name: 'Sports Shoes', description: 'Athletic footwear', icon: '👟' },
      { name: 'Sportswear', description: 'Athletic clothing', icon: '🎽' },
      { name: 'Supplements & Protein Bars', description: 'Nutritional supplements', icon: '💪' },
      { name: 'Yoga & Home Workout Gear', description: 'Yoga and home fitness', icon: '🧘' }
    ]
  },
  {
    name: 'Health & Wellness',
    description: 'Health and wellness products',
    icon: '🏥',
    defaultMargin: 25,
    isActive: true,
    sortOrder: 5,
    children: [
      { name: 'Vitamins & Supplements', description: 'Dietary supplements', icon: '💊' },
      { name: 'Pain Relief & First Aid', description: 'Medical and first aid', icon: '🩹' },
      { name: 'Feminine Hygiene', description: 'Feminine care products', icon: '🌸' },
      { name: 'Oral Care', description: 'Dental and oral hygiene', icon: '🦷' },
      { name: 'Sanitary & Hygiene Products', description: 'General hygiene products', icon: '🧼' },
      { name: 'Sexual Wellness', description: 'Sexual health products', icon: '❤️' }
    ]
  },
  {
    name: 'Home & Kitchen',
    description: 'Home and kitchen essentials',
    icon: '🏠',
    defaultMargin: 30,
    isActive: true,
    sortOrder: 6,
    children: [
      { name: 'Food Storage Containers', description: 'Storage solutions', icon: '📦' },
      { name: 'Kitchen Tools & Gadgets', description: 'Kitchen utensils and tools', icon: '🔪' },
      { name: 'Cleaning Supplies', description: 'Cleaning products', icon: '🧹' },
      { name: 'Home Fragrance', description: 'Air fresheners and candles', icon: '🕯️' },
      { name: 'Tableware & Cutlery', description: 'Dining essentials', icon: '🍽️' },
      { name: 'Water Bottles & Travel Mugs', description: 'Drinkware for on-the-go', icon: '🥤' }
    ]
  },
  {
    name: 'Gift Sets & Hampers',
    description: 'Special gift collections',
    icon: '🎁',
    defaultMargin: 35,
    isActive: true,
    sortOrder: 7,
    children: [
      { name: 'Cosmetic Gift Sets', description: 'Beauty gift collections', icon: '💝' },
      { name: 'Sweet Hampers', description: 'Confectionery gift baskets', icon: '🍰' },
      { name: 'Branded Product Bundles', description: 'Branded gift bundles', icon: '📦' },
      { name: 'Special Occasion Gifts', description: 'Gifts for special occasions', icon: '🎉' }
    ]
  },
  {
    name: 'Baby & Kids',
    description: 'Products for babies and children',
    icon: '👶',
    defaultMargin: 30,
    isActive: true,
    sortOrder: 8,
    children: [
      { name: 'Baby Food', description: 'Nutritious baby food', icon: '🍼' },
      { name: 'Diapers & Wipes', description: 'Baby hygiene essentials', icon: '👶' },
      { name: 'Baby Skin Care', description: 'Gentle baby skincare', icon: '🧴' },
      { name: 'Toys & Activity Kits', description: 'Educational toys and activities', icon: '🧸' },
      { name: "Kids' Sweets & Cereal", description: 'Child-friendly snacks', icon: '🥣' }
    ]
  },
  {
    name: 'Toys & Games',
    description: 'Toys and games for all ages',
    icon: '🧸',
    defaultMargin: 30,
    isActive: true,
    sortOrder: 9,
    children: [
      { name: 'Educational & Learning Toys', description: 'Educational toy options', icon: '📚' },
      { name: 'Baby & Toddler Toys', description: 'Toys for young children', icon: '🍼' },
      { name: 'Action & Play Figures', description: 'Action figures and characters', icon: '🦸' },
      { name: 'Building & Construction Sets', description: 'Building blocks and sets', icon: '🧱' },
      { name: 'Dolls & Accessories', description: 'Dolls and doll accessories', icon: '🪆' },
      { name: 'Vehicles & Remote Control Toys', description: 'Toy vehicles and RC toys', icon: '🚗' },
      { name: 'Board Games & Card Games', description: 'Traditional games', icon: '🎲' },
      { name: 'Creative Play & Dress-Up', description: 'Creative play items', icon: '🎨' },
      { name: 'Outdoor Toys', description: 'Toys for outdoor play', icon: '⚽' },
      { name: 'Gift Bundles', description: 'Toy gift sets', icon: '🎁' }
    ]
  },
  {
    name: 'Tech & Accessories',
    description: 'Technology and accessories',
    icon: '📱',
    defaultMargin: 15,
    isActive: true,
    sortOrder: 10,
    children: [
      { name: 'Headphones & Earbuds', description: 'Audio accessories', icon: '🎧' },
      { name: 'Smartwatches & Bands', description: 'Wearable technology', icon: '⌚' },
      { name: 'Phone Accessories', description: 'Mobile phone accessories', icon: '📱' },
      { name: 'Laptop Sleeves & Backpacks', description: 'Tech carrying solutions', icon: '💼' }
    ]
  },
  {
    name: 'Pet Supplies',
    description: 'Products for pets',
    icon: '🐾',
    defaultMargin: 25,
    isActive: true,
    sortOrder: 11,
    children: [
      { name: 'UK Dog Treats', description: 'Treats for dogs', icon: '🦴' },
      { name: 'Grooming Products', description: 'Pet grooming essentials', icon: '✂️' },
      { name: 'Toys & Accessories', description: 'Pet toys and accessories', icon: '🎾' },
      { name: 'Supplements & Vitamins', description: 'Pet health supplements', icon: '💊' }
    ]
  }
];

const sampleProducts = [
  {
    sku: 'UK-CHO-001',
    name: 'Cadbury Dairy Milk Selection Box',
    description: 'Premium UK chocolate selection including Dairy Milk varieties',
    category: 'UK Chocolates',
    brand: 'Cadbury',
    adminPrice: 12.99,
    stock: 150,
    weight: 0.5,
    dimensions: '25x20x5cm',
    image: 'https://via.placeholder.com/300x300/7B3F99/white?text=Chocolate+Box',
    published: true
  },
  {
    sku: 'BH-001',
    name: 'Bluetooth Wireless Headphones',
    description: 'Premium noise-cancelling wireless headphones',
    category: 'Headphones & Earbuds',
    brand: 'SoundTech',
    adminPrice: 89.99,
    stock: 75,
    weight: 0.3,
    dimensions: '20x18x8cm',
    image: 'https://via.placeholder.com/300x300/2196F3/white?text=Headphones',
    published: true
  },
  {
    sku: 'FC-001',
    name: 'Vitamin C Face Serum',
    description: 'Brightening face serum with vitamin C and hyaluronic acid',
    category: 'Face Care',
    brand: 'GlowBeauty',
    adminPrice: 24.99,
    stock: 120,
    weight: 0.1,
    dimensions: '5x5x10cm',
    image: 'https://via.placeholder.com/300x300/FF69B4/white?text=Face+Serum',
    published: true
  },
  {
    sku: 'YG-001',
    name: 'Premium Yoga Mat Set',
    description: 'Non-slip yoga mat with carrying strap and blocks',
    category: 'Yoga & Home Workout Gear',
    brand: 'FitZone',
    adminPrice: 45.00,
    stock: 80,
    weight: 1.2,
    dimensions: '180x60x1cm',
    image: 'https://via.placeholder.com/300x300/9C27B0/white?text=Yoga+Mat',
    published: true
  },
  {
    sku: 'BF-001',
    name: 'Organic Baby Food Variety Pack',
    description: 'Nutritious organic baby food pouches - mixed flavors',
    category: 'Baby Food',
    brand: 'TinyTums',
    adminPrice: 18.99,
    stock: 200,
    weight: 1.0,
    dimensions: '20x15x10cm',
    image: 'https://via.placeholder.com/300x300/90EE90/white?text=Baby+Food',
    published: true
  },
  {
    sku: 'MS-001',
    name: "Men's Running Shoes",
    description: 'Lightweight breathable running shoes for men',
    category: "Men's Shoes",
    brand: 'SpeedRun',
    adminPrice: 65.00,
    stock: 60,
    weight: 0.8,
    dimensions: '30x20x12cm',
    image: 'https://via.placeholder.com/300x300/1E90FF/white?text=Running+Shoes',
    published: true
  },
  {
    sku: 'KG-001',
    name: 'Kitchen Gadget Set',
    description: '5-piece essential kitchen tools set',
    category: 'Kitchen Tools & Gadgets',
    brand: 'ChefPro',
    adminPrice: 29.99,
    stock: 90,
    weight: 0.6,
    dimensions: '25x20x8cm',
    image: 'https://via.placeholder.com/300x300/FF6347/white?text=Kitchen+Tools',
    published: true
  },
  {
    sku: 'DT-001',
    name: 'Premium Dog Treats',
    description: 'Natural grain-free dog treats made in UK',
    category: 'UK Dog Treats',
    brand: 'PawTreats',
    adminPrice: 8.99,
    stock: 150,
    weight: 0.2,
    dimensions: '15x10x5cm',
    image: 'https://via.placeholder.com/300x300/8B4513/white?text=Dog+Treats',
    published: true
  },
  {
    sku: 'ET-001',
    name: 'STEM Learning Kit',
    description: 'Educational science experiment kit for kids 8+',
    category: 'Educational & Learning Toys',
    brand: 'BrainBox',
    adminPrice: 34.99,
    stock: 45,
    weight: 1.0,
    dimensions: '30x25x10cm',
    image: 'https://via.placeholder.com/300x300/4169E1/white?text=STEM+Kit',
    published: true
  },
  {
    sku: 'VS-001',
    name: 'Daily Multivitamin Complex',
    description: 'Complete daily vitamin and mineral supplement',
    category: 'Vitamins & Supplements',
    brand: 'HealthPlus',
    adminPrice: 19.99,
    stock: 100,
    weight: 0.15,
    dimensions: '8x8x12cm',
    image: 'https://via.placeholder.com/300x300/32CD32/white?text=Vitamins',
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
      for (const parentCategory of defaultCategories) {
        const { children, ...parentData } = parentCategory;
        
        try {
          // Create parent category
          const parent = await Category.create(parentData);
          console.log(`Created parent category: ${parent.name}`);
          
          // Create child categories if they exist
          if (children && children.length > 0) {
            for (let i = 0; i < children.length; i++) {
              const childData = {
                ...children[i],
                parentId: parent.id,
                defaultMargin: children[i].defaultMargin || parentData.defaultMargin,
                isActive: true,
                sortOrder: i + 1
              };
              
              await Category.create(childData);
            }
            console.log(`  Created ${children.length} child categories for ${parent.name}`);
          }
        } catch (error) {
          console.error(`Error creating category ${parentData.name}:`, error);
        }
      }
      
      const totalCategories = await Category.countCategories();
      console.log(`Created ${totalCategories} total categories`);
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