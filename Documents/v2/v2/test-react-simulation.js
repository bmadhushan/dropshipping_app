// Simulate the React component behavior to debug the price calculation
const API_BASE = 'http://localhost:5001/api';
const TOKEN = 'mock-token-for-testing';

// Simulate the calculateFinalPrice function
const calculateFinalPrice = (adminPrice, categoryName, categoriesWithPricing) => {
  console.log('🧮 calculateFinalPrice called:', { adminPrice, categoryName, categoriesCount: categoriesWithPricing?.length });
  
  if (!adminPrice || !categoryName || !categoriesWithPricing?.length) {
    console.log('📊 Using fallback pricing (50% markup):', adminPrice * 1.5);
    return adminPrice * 1.5; // Fallback to 50% markup
  }
  
  const category = categoriesWithPricing.find(cat => cat.name === categoryName);
  console.log('🏷️ Found category:', category);
  
  if (!category) {
    console.log('📊 Category not found, using fallback (50% markup):', adminPrice * 1.5);
    return adminPrice * 1.5; // Fallback to 50% markup
  }
  
  const margin = category.defaultMargin || 20; // Default to 20% if not set
  const shippingFee = category.shippingFee || 0;
  const finalPrice = (adminPrice * (1 + margin / 100)) + shippingFee;
  
  console.log('💰 Price calculation:', {
    adminPrice,
    margin: `${margin}%`,
    shippingFee: `$${shippingFee}`,
    calculation: `$${adminPrice} × (1 + ${margin}/100) + $${shippingFee}`,
    finalPrice: `$${finalPrice.toFixed(2)}`
  });
  
  return finalPrice;
};

async function simulateReactComponent() {
  try {
    console.log('🚀 Simulating React component loading...\n');

    // Step 1: Fetch categories (like fetchCategories)
    console.log('📂 Step 1: Fetching categories...');
    const categoriesResponse = await fetch(`${API_BASE}/categories/active`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.success) {
      throw new Error('Failed to fetch categories');
    }
    
    const categoriesWithPricing = categoriesData.categories;
    console.log(`✅ Categories loaded: ${categoriesWithPricing.length}`);
    console.log('🏷️ Sample categories with pricing:', categoriesWithPricing.slice(0, 3).map(cat => ({
      name: cat.name,
      defaultMargin: cat.defaultMargin,
      shippingFee: cat.shippingFee
    })));

    // Step 2: Fetch products (like fetchProducts)
    console.log('\n📦 Step 2: Fetching products...');
    const productsResponse = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const productsData = await productsResponse.json();
    
    if (!productsData.success) {
      throw new Error('Failed to fetch products');
    }

    console.log('🔍 Raw products from API:', productsData.products.slice(0, 1).map(p => ({
      name: p.name,
      category: p.category,
      adminPrice: p.adminPrice,
      finalPrice: p.finalPrice,
      existingFinalPrice: 'finalPrice' in p
    })));

    // Step 3: Transform products (like in fetchProducts)
    console.log('\n📊 Step 3: Transforming products with price calculation...');
    const transformedProducts = productsData.products.map(product => {
      const calculatedFinalPrice = calculateFinalPrice(product.adminPrice, product.category, categoriesWithPricing);
      console.log(`💲 Product ${product.name}: Calculated=$${calculatedFinalPrice?.toFixed(2)}, AdminPrice=$${product.adminPrice}, Categories=${categoriesWithPricing.length}`);
      return {
        ...product,
        basePrice: product.adminPrice,
        finalPrice: calculatedFinalPrice,
        status: product.published ? 'published' : 'draft'
      };
    });

    console.log('\n🔍 Final transformed products sample:', transformedProducts.slice(0, 2).map(p => ({
      name: p.name,
      category: p.category,
      adminPrice: p.adminPrice,
      finalPrice: p.finalPrice,
      categoriesAvailable: categoriesWithPricing.length
    })));

    // Find the Bluetooth Headphones specifically
    const headphones = transformedProducts.find(p => p.category === 'Headphones & Earbuds');
    if (headphones) {
      console.log('\n🎧 Bluetooth Headphones Final Result:');
      console.log(`   Name: ${headphones.name}`);
      console.log(`   Admin Price: $${headphones.adminPrice}`);
      console.log(`   Final Price: $${headphones.finalPrice.toFixed(2)}`);
      console.log(`   Category: ${headphones.category}`);
    }

    console.log('\n✅ Simulation completed successfully!');
    
  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  }
}

// Run the simulation
simulateReactComponent();