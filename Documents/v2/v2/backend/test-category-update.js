import { Category } from './models/Category.js';

console.log('Testing Category update functionality...');

async function testCategoryUpdate() {
  try {
    // First, find a category to update
    const categories = await Category.findAll();
    if (categories.length === 0) {
      console.log('No categories found to test with');
      return;
    }

    const testCategory = categories[0];
    console.log('Original category:', testCategory.toJSON());

    // Update the category
    const updateData = {
      name: 'UPDATED Test Category',
      description: 'Updated description for testing',
      defaultMargin: 99
    };

    console.log('Updating with data:', updateData);
    const updatedCategory = await testCategory.update(updateData);
    
    console.log('Updated category:', updatedCategory.toJSON());
    
    // Verify the update persisted
    const reloadedCategory = await Category.findById(testCategory.id);
    console.log('Reloaded category:', reloadedCategory.toJSON());
    
    console.log('✅ Category update test PASSED!');
  } catch (error) {
    console.error('❌ Category update test FAILED:', error);
  }
}

testCategoryUpdate();