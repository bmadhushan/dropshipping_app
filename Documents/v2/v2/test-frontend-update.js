// Test frontend API service
import apiService from './src/services/api.js';

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => 'mock-token-for-testing',
  setItem: () => {},
  removeItem: () => {}
};

// Mock fetch for testing
global.fetch = async (url, options) => {
  console.log('Making request to:', url);
  console.log('With options:', JSON.stringify(options, null, 2));
  
  // Return a mock successful response
  return {
    ok: true,
    json: async () => ({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: 1,
        name: 'Test Updated Category',
        description: 'Test description',
        defaultMargin: 30
      }
    })
  };
};

async function testFrontendUpdate() {
  try {
    console.log('Testing frontend category update...');
    
    // Set the token
    apiService.setToken('mock-token-for-testing');
    
    const updateData = {
      name: 'Frontend Test Update',
      description: 'Updated via frontend test',
      defaultMargin: 45
    };
    
    console.log('Updating category with data:', updateData);
    const result = await apiService.updateCategory(1, updateData);
    
    console.log('✅ Frontend update test result:', result);
  } catch (error) {
    console.error('❌ Frontend update test failed:', error);
  }
}

testFrontendUpdate();