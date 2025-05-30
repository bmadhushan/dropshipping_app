import { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api.js';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('guest');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize auth state from token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          apiService.setToken(token);
          
          // Check if we're using mock authentication
          if (token === 'mock-token-for-testing') {
            // Use mock admin user data directly
            const mockUser = {
              id: 1,
              username: 'bmadhushan',
              email: 'bmadhushan@admin.com',
              role: 'super_admin',
              status: 'active',
              name: 'Admin User'
            };
            setCurrentUser(mockUser);
            setUserRole(mockUser.role);
            setLoading(false);
            return;
          }
          
          if (token === 'mock-seller-token') {
            // Use mock seller user data directly
            const mockSeller = {
              id: 2,
              username: 'seller',
              email: 'seller@example.com',
              role: 'seller',
              status: 'active',
              name: 'Test Seller',
              business_name: 'Test Business'
            };
            setCurrentUser(mockSeller);
            setUserRole(mockSeller.role);
            setLoading(false);
            return;
          }
          
          const response = await apiService.getCurrentUser();
          if (response.success) {
            setCurrentUser(response.user);
            setUserRole(response.user.role);
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          console.log('Error details:', error.message);
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
          apiService.setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Authenticate user with username and password
  const authenticate = async (username, password) => {
    setLoginError('');
    setLoading(true);
    
    // TEMPORARY: Mock login for testing when backend is not available
    if (username === 'bmadhushan' && password) {
      const mockUser = {
        id: 1,
        username: 'bmadhushan',
        email: 'bmadhushan@admin.com',
        role: 'super_admin',
        status: 'active',
        name: 'Admin User'
      };
      
      // Set mock token
      localStorage.setItem('auth_token', 'mock-token-for-testing');
      apiService.setToken('mock-token-for-testing');
      
      setCurrentUser(mockUser);
      setUserRole(mockUser.role);
      setLoading(false);
      return { success: true, user: mockUser };
    }
    
    if (username === 'seller' && password) {
      const mockSeller = {
        id: 2,
        username: 'seller',
        email: 'seller@example.com',
        role: 'seller',
        status: 'active',
        name: 'Test Seller',
        business_name: 'Test Business'
      };
      
      // Set mock token
      localStorage.setItem('auth_token', 'mock-seller-token');
      apiService.setToken('mock-seller-token');
      
      setCurrentUser(mockSeller);
      setUserRole(mockSeller.role);
      setLoading(false);
      return { success: true, user: mockSeller };
    }
    
    try {
      const response = await apiService.login(username, password);
      
      if (response.success) {
        setCurrentUser(response.user);
        setUserRole(response.user.role);
        setLoading(false);
        return { success: true, user: response.user };
      } else {
        setLoginError(response.message);
        setLoading(false);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  // Quick login for testing (backward compatibility)
  const login = (role, userDetails = { name: "Test User" }) => {
    setUserRole(role);
    setCurrentUser(userDetails);
    setLoginError('');
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUserRole('guest');
      setCurrentUser(null);
      setLoginError('');
    }
  };

  // Register new seller
  const registerSeller = async (sellerData) => {
    try {
      const response = await apiService.register(sellerData);
      return {
        success: response.success,
        message: response.message || 'Registration submitted successfully. Awaiting admin approval.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Get all pending sellers (for admin)
  const getPendingSellers = async () => {
    try {
      const response = await apiService.getPendingSellers();
      return response.sellers || [];
    } catch (error) {
      console.error('Get pending sellers error:', error);
      return [];
    }
  };

  // Approve seller (for admin)
  const approveSeller = async (sellerId) => {
    try {
      const response = await apiService.approveSeller(sellerId);
      return response.success;
    } catch (error) {
      console.error('Approve seller error:', error);
      return false;
    }
  };

  // Reject seller (for admin)
  const rejectSeller = async (sellerId, reason = '') => {
    try {
      const response = await apiService.rejectSeller(sellerId, reason);
      return response.success;
    } catch (error) {
      console.error('Reject seller error:', error);
      return false;
    }
  };

  // Get all sellers (for admin)
  const getAllSellers = async () => {
    try {
      const response = await apiService.getUsers({ role: 'seller' });
      return response.users || [];
    } catch (error) {
      console.error('Get all sellers error:', error);
      return [];
    }
  };

  // Get active sellers (for admin)
  const getActiveSellers = async () => {
    try {
      const response = await apiService.getActiveSellers();
      return response.sellers || [];
    } catch (error) {
      console.error('Get active sellers error:', error);
      return [];
    }
  };

  // Update seller status (for admin)
  const updateSellerStatus = async (sellerId, status) => {
    try {
      const response = await apiService.updateUserStatus(sellerId, status);
      return response.success;
    } catch (error) {
      console.error('Update seller status error:', error);
      return false;
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);
      return {
        success: response.success,
        message: response.message || 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.message || 'Failed to change password'
      };
    }
  };

  // Update profile
  const updateProfile = async (userData) => {
    try {
      const response = await apiService.updateUser(currentUser.id, userData);
      if (response.success) {
        setCurrentUser(response.user);
      }
      return {
        success: response.success,
        message: response.message || 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile'
      };
    }
  };

  const isAuthenticated = !!currentUser && userRole !== 'guest';

  const value = {
    currentUser,
    userRole,
    loginError,
    loading,
    authenticate,
    login,
    logout,
    registerSeller,
    isAuthenticated,
    getPendingSellers,
    approveSeller,
    rejectSeller,
    getAllSellers,
    getActiveSellers,
    updateSellerStatus,
    changePassword,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};