const API_BASE_URL = 'http://localhost:5001/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    // Refresh token from localStorage in case it was updated
    this.token = localStorage.getItem('auth_token');
    
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      console.log('Making API request to:', url);
      console.log('Request config:', config);
      
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('API response status:', response.status);
      console.log('API response data:', data);

      if (!response.ok) {
        // Include validation errors if they exist
        let errorMessage = data.message || 'An error occurred';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += ': ' + data.errors.map(err => err.msg || err.message).join(', ');
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async changePassword(currentPassword, newPassword) {
    return await this.request('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // User management endpoints
  async getUsers(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await this.request(`/users${params ? `?${params}` : ''}`);
  }

  async getPendingSellers() {
    return await this.request('/users/pending-sellers');
  }

  async getActiveSellers() {
    return await this.request('/users/active-sellers');
  }

  async getUserById(id) {
    return await this.request(`/users/${id}`);
  }

  async updateUser(id, userData) {
    return await this.request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async approveSeller(id) {
    return await this.request(`/users/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectSeller(id, reason) {
    return await this.request(`/users/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async updateUserStatus(id, status) {
    return await this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteUser(id) {
    return await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Product endpoints
  async getProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await this.request(`/products${params ? `?${params}` : ''}`);
  }

  async getProductCategories() {
    return await this.request('/products/categories');
  }

  async getProductBrands() {
    return await this.request('/products/brands');
  }

  async getProductById(id) {
    return await this.request(`/products/${id}`);
  }

  async createProduct(productData) {
    return await this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  async bulkCreateProducts(products) {
    return await this.request('/products/bulk', {
      method: 'POST',
      body: JSON.stringify({ products }),
    });
  }

  async updateProduct(id, productData) {
    return await this.request(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(id) {
    return await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleProductStatus(id) {
    const product = await this.getProductById(id);
    return await this.updateProduct(id, { 
      published: !product.product.published 
    });
  }

  async exportProductsCSV() {
    const response = await fetch(`${API_BASE_URL}/products/export/csv`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to export products');
    }
    
    return response.blob();
  }

  async importProductsCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/products/import/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to import CSV');
    }

    return data;
  }

  // Seller product endpoints
  async getSellerProducts() {
    return await this.request('/seller-products');
  }

  async getSelectedProducts() {
    return await this.request('/seller-products/selected');
  }

  async getProductCatalog(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await this.request(`/seller-products/catalog${params ? `?${params}` : ''}`);
  }

  async selectProduct(productId, customMargin, customPrice, isSelected, customShippingFee) {
    return await this.request('/seller-products/select', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        customMargin,
        customPrice,
        isSelected,
        customShippingFee,
      }),
    });
  }

  async updateProductPricing(productId, customMargin, customPrice, customShippingFee) {
    return await this.request(`/seller-products/pricing/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ customMargin, customPrice, customShippingFee }),
    });
  }

  async bulkSelectProducts(productIds, isSelected) {
    return await this.request('/seller-products/bulk-select', {
      method: 'POST',
      body: JSON.stringify({ productIds, isSelected }),
    });
  }

  async bulkUpdatePricing(productIds, marginAdjustment, setMargin) {
    const body = { productIds };
    if (marginAdjustment !== undefined) body.marginAdjustment = marginAdjustment;
    if (setMargin !== undefined) body.setMargin = setMargin;

    return await this.request('/seller-products/bulk-pricing', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async removeProduct(productId) {
    return await this.request(`/seller-products/${productId}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrder(orderData) {
    return await this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await this.request(`/orders${params ? `?${params}` : ''}`);
  }

  async getOrderById(id) {
    return await this.request(`/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return await this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAllOrders(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return await this.request(`/orders/admin/all${params ? `?${params}` : ''}`);
  }

  // Category endpoints
  async getCategories(includeInactive = false, hierarchical = false) {
    const params = new URLSearchParams();
    if (includeInactive) params.append('includeInactive', 'true');
    if (hierarchical) params.append('hierarchical', 'true');
    const queryString = params.toString();
    return await this.request(`/categories${queryString ? `?${queryString}` : ''}`);
  }

  async getCategoriesHierarchy(includeInactive = false) {
    const params = includeInactive ? '?includeInactive=true' : '';
    return await this.request(`/categories/hierarchy${params}`);
  }

  async getRootCategories() {
    return await this.request('/categories/root');
  }

  async getCategoryChildren(parentId) {
    return await this.request(`/categories/${parentId}/children`);
  }

  async getActiveCategories() {
    return await this.request('/categories/active');
  }

  async getCategoryById(id) {
    return await this.request(`/categories/${id}`);
  }

  async createCategory(categoryData) {
    return await this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id, categoryData) {
    console.log('🔧 API Service updateCategory called with:', { id, categoryData });
    console.log('🔑 Current token:', this.token);
    
    const result = await this.request(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    });
    
    console.log('📤 updateCategory result:', result);
    return result;
  }

  async toggleCategoryStatus(id) {
    return await this.request(`/categories/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  // Settings methods
  async getConversionRate() {
    return await this.request('/settings/conversion-rate');
  }

  async updateConversionRate(rate) {
    return await this.request('/settings/conversion-rate', {
      method: 'POST',
      body: JSON.stringify({ rate }),
    });
  }

  async reorderCategories(categories) {
    return await this.request('/categories/reorder', {
      method: 'POST',
      body: JSON.stringify({ categories }),
    });
  }

  async deleteCategory(id) {
    return await this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Dashboard endpoints
  async getDashboardStats() {
    return await this.request('/admin/dashboard/stats');
  }

  async getRecentSellers() {
    return await this.request('/admin/dashboard/recent-sellers');
  }

  async getRecentActivity() {
    return await this.request('/admin/dashboard/recent-activity');
  }

  async getTopCategories() {
    return await this.request('/admin/dashboard/top-categories');
  }

  // General request method for parameters
  async get(endpoint, options = {}) {
    let url = endpoint;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      const paramString = searchParams.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }
    return await this.request(url, { method: 'GET', ...options });
  }

  async post(endpoint, data, options = {}) {
    return await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }

  async patch(endpoint, data, options = {}) {
    return await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }

  async delete(endpoint, options = {}) {
    return await this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
}

export default new ApiService();