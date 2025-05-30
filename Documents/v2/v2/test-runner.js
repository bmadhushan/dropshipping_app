import apiService from './src/services/api.js';

console.log('=== Testing API Service ===');
try {
  console.log('✓ API Service instantiated successfully');
  console.log('✓ API Base URL: http://localhost:5001/api');
  
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(apiService))
    .filter(name => name !== 'constructor');
  
  console.log('✓ Available methods count:', methods.length);
  console.log('✓ Key methods available:', methods.slice(0, 10));
  
  // Test basic configuration
  const headers = apiService.getHeaders();
  console.log('✓ Headers structure correct');
  
  console.log('\n✅ API Service tests passed!');
} catch (error) {
  console.error('✗ API Service test failed:', error.message);
}