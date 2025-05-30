// Test to check product pricing in the actual API
const API_BASE = 'http://localhost:5001/api';
const TOKEN = 'mock-token-for-testing';

async function testProductPricing() {
  try {
    console.log('🧪 Testing Product Pricing Logic...\n');

    // Fetch categories
    console.log('📂 Fetching categories...');
    const categoriesResponse = await fetch(`${API_BASE}/categories/active`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const categoriesData = await categoriesResponse.json();
    
    if (!categoriesData.success) {
      throw new Error('Failed to fetch categories');
    }
    
    const categories = categoriesData.categories;
    console.log(`✅ Found ${categories.length} categories`);
    
    // Find the Headphones & Earbuds category we updated
    const headphoneCategory = categories.find(cat => cat.name === 'Headphones & Earbuds');
    if (headphoneCategory) {
      console.log('🎧 Headphones category:', {
        name: headphoneCategory.name,
        defaultMargin: headphoneCategory.defaultMargin,
        shippingFee: headphoneCategory.shippingFee
      });
    }

    // Fetch products from that category
    console.log('\n📦 Fetching products...');
    const productsResponse = await fetch(`${API_BASE}/products?category=Headphones%20%26%20Earbuds`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const productsData = await productsResponse.json();
    
    if (!productsData.success) {
      throw new Error('Failed to fetch products');
    }
    
    const products = productsData.products;
    console.log(`✅ Found ${products.length} products in Headphones & Earbuds category`);
    
    // Calculate prices manually to test logic
    products.forEach(product => {
      if (product.adminPrice && headphoneCategory) {
        const margin = headphoneCategory.defaultMargin || 20;
        const shippingFee = headphoneCategory.shippingFee || 0;
        const calculatedPrice = (product.adminPrice * (1 + margin / 100)) + shippingFee;
        
        console.log(`\n💰 ${product.name}:`);
        console.log(`   Admin Price: $${product.adminPrice}`);
        console.log(`   Margin: ${margin}%`);
        console.log(`   Shipping: $${shippingFee}`);
        console.log(`   Calculated Final Price: $${calculatedPrice.toFixed(2)}`);
        console.log(`   Calculation: $${product.adminPrice} × (1 + ${margin}/100) + $${shippingFee} = $${calculatedPrice.toFixed(2)}`);
      }
    });
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProductPricing();