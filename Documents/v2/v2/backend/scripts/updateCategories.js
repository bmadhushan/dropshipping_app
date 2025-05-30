import { initDatabase, getDatabase } from '../config/database.js';
import { Category } from '../models/Category.js';

const newCategories = [
  // Parent Categories
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

async function updateCategories() {
  try {
    console.log('Starting category update...');
    
    // Initialize database first
    await initDatabase();
    const db = getDatabase();
    
    // Clear existing categories
    console.log('Clearing existing categories...');
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM categories', [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Reset the auto-increment counter
    await new Promise((resolve, reject) => {
      db.run("DELETE FROM sqlite_sequence WHERE name='categories'", [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log('Existing categories cleared.');
    
    // Add new categories
    for (const parentCategory of newCategories) {
      const { children, ...parentData } = parentCategory;
      
      // Create parent category
      console.log(`Creating parent category: ${parentData.name}`);
      const parent = await Category.create(parentData);
      
      // Create child categories
      if (children && children.length > 0) {
        for (let i = 0; i < children.length; i++) {
          const childData = {
            ...children[i],
            parentId: parent.id,
            defaultMargin: parentData.defaultMargin, // Inherit parent's margin if not specified
            isActive: true,
            sortOrder: i + 1
          };
          
          console.log(`  Creating child category: ${childData.name}`);
          await Category.create(childData);
        }
      }
    }
    
    console.log('\nCategory update completed successfully!');
    
    // Display category count
    const categoryCount = await Category.countCategories();
    console.log(`Total categories in database: ${categoryCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating categories:', error);
    process.exit(1);
  }
}

// Run the update
updateCategories();