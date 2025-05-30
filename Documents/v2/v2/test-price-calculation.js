// Test script to verify price calculation logic
console.log('Testing price calculation logic...');

// Mock category data
const categoriesWithPricing = [
  { name: 'Electronics', defaultMargin: 20, shippingFee: 5 },
  { name: 'Clothing', defaultMargin: 50, shippingFee: 0 },
  { name: 'Books', defaultMargin: 30, shippingFee: 2 }
];

// Mock product data
const products = [
  { name: 'iPhone', category: 'Electronics', adminPrice: 100 },
  { name: 'T-Shirt', category: 'Clothing', adminPrice: 20 },
  { name: 'Novel', category: 'Books', adminPrice: 15 },
  { name: 'Unknown Item', category: 'Unknown', adminPrice: 50 }
];

// Price calculation function (copied from AdminProductManagementPage)
const calculateFinalPrice = (adminPrice, categoryName, categoriesWithPricing) => {
  if (!adminPrice || !categoryName || !categoriesWithPricing?.length) {
    return adminPrice * 1.5; // Fallback to 50% markup
  }
  
  const category = categoriesWithPricing.find(cat => cat.name === categoryName);
  if (!category) {
    return adminPrice * 1.5; // Fallback to 50% markup
  }
  
  const margin = category.defaultMargin || 20; // Default to 20% if not set
  const shippingFee = category.shippingFee || 0;
  
  // Calculate final price: (adminPrice * (1 + margin/100)) + shippingFee
  return (adminPrice * (1 + margin / 100)) + shippingFee;
};

console.log('\n=== Price Calculation Test Results ===');

products.forEach(product => {
  const finalPrice = calculateFinalPrice(product.adminPrice, product.category, categoriesWithPricing);
  const category = categoriesWithPricing.find(cat => cat.name === product.category);
  
  console.log(`\n${product.name} (${product.category}):`);
  console.log(`  Admin Price: $${product.adminPrice}`);
  console.log(`  Category Margin: ${category?.defaultMargin || 'N/A (using 50% fallback)'}%`);
  console.log(`  Shipping Fee: $${category?.shippingFee || 'N/A (using fallback)'}`);
  console.log(`  Final Price: $${finalPrice.toFixed(2)}`);
  
  if (category) {
    const expectedPrice = (product.adminPrice * (1 + category.defaultMargin / 100)) + category.shippingFee;
    console.log(`  Expected: $${expectedPrice.toFixed(2)}`);
    console.log(`  ✅ Calculation: ${finalPrice.toFixed(2) === expectedPrice.toFixed(2) ? 'CORRECT' : 'INCORRECT'}`);
  } else {
    const expectedPrice = product.adminPrice * 1.5;
    console.log(`  Expected (fallback): $${expectedPrice.toFixed(2)}`);
    console.log(`  ✅ Fallback: ${finalPrice.toFixed(2) === expectedPrice.toFixed(2) ? 'CORRECT' : 'INCORRECT'}`);
  }
});

console.log('\n=== Category Margin Update Test ===');

// Simulate updating Electronics margin from 20% to 35%
console.log('\nBefore margin update:');
const electronicsProductBefore = products.find(p => p.category === 'Electronics');
const priceBeforeUpdate = calculateFinalPrice(electronicsProductBefore.adminPrice, electronicsProductBefore.category, categoriesWithPricing);
console.log(`Electronics product price: $${priceBeforeUpdate.toFixed(2)}`);

// Update the margin
const updatedCategories = categoriesWithPricing.map(cat => 
  cat.name === 'Electronics' ? { ...cat, defaultMargin: 35 } : cat
);

console.log('\nAfter margin update (20% → 35%):');
const priceAfterUpdate = calculateFinalPrice(electronicsProductBefore.adminPrice, electronicsProductBefore.category, updatedCategories);
console.log(`Electronics product price: $${priceAfterUpdate.toFixed(2)}`);
console.log(`Price difference: $${(priceAfterUpdate - priceBeforeUpdate).toFixed(2)}`);

console.log('\n✅ Price calculation logic test completed!');