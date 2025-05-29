import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // Mock products data that sellers can order
  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        sku: 'CHC-001',
        name: 'Cadbury Dairy Milk Chocolate Bar',
        category: 'UK Chocolates',
        adminPrice: 6.75,
        stock: 250,
        brand: 'Cadbury',
        description: 'Classic milk chocolate bar made with Alpine milk',
        weight: '110g',
        image: '/api/placeholder/150/150'
      },
      {
        id: 2,
        sku: 'FC-002',
        name: 'CeraVe Foaming Facial Cleanser',
        category: 'Face Care',
        adminPrice: 19.48,
        stock: 85,
        brand: 'CeraVe',
        description: 'Gentle foaming cleanser for normal to oily skin',
        weight: '236ml',
        image: '/api/placeholder/150/150'
      },
      {
        id: 3,
        sku: 'MS-003',
        name: 'Nike Air Max 270 Men\'s Shoes',
        category: 'Men\'s Shoes',
        adminPrice: 158.00,
        stock: 15,
        brand: 'Nike',
        description: 'Comfortable running shoes with Air Max technology',
        weight: '400g per shoe',
        image: '/api/placeholder/150/150'
      },
      {
        id: 4,
        sku: 'HE-004',
        name: 'Sony WH-1000XM4 Wireless Headphones',
        category: 'Headphones & Earbuds',
        adminPrice: 341.99,
        stock: 8,
        brand: 'Sony',
        description: 'Industry-leading noise canceling wireless headphones',
        weight: '254g',
        image: '/api/placeholder/150/150'
      },
      {
        id: 5,
        sku: 'HG-005',
        name: 'Garden Tools Set',
        category: 'Home & Garden',
        adminPrice: 45.50,
        stock: 32,
        brand: 'GardenPro',
        description: 'Complete set of essential garden tools',
        weight: '2.1kg',
        image: '/api/placeholder/150/150'
      },
      {
        id: 6,
        sku: 'BF-006',
        name: 'Organic Baby Food Variety Pack',
        category: 'Baby Food',
        adminPrice: 28.75,
        stock: 45,
        brand: 'Happy Baby',
        description: 'Organic baby food purees for 6+ months',
        weight: '12 x 113g',
        image: '/api/placeholder/150/150'
      }
    ];
    setProducts(mockProducts);
  }, []);

  // Load existing orders on mount
  useEffect(() => {
    // Load orders from localStorage or API
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      // Add some sample orders for demo purposes
      const sampleOrders = [
        {
          id: 1730925000000,
          orderNumber: 'ORD-20241106-001',
          seller: {
            name: 'Test Seller',
            email: 'test@seller.com',
            id: 'test'
          },
          date: '2024-11-06T14:30:00.000Z',
          status: 'pending',
          items: [
            {
              productId: 1,
              name: 'Cadbury Dairy Milk Chocolate Bar',
              sku: 'CHC-001',
              quantity: 50,
              price: 6.75,
              brand: 'Cadbury',
              category: 'UK Chocolates'
            },
            {
              productId: 2,
              name: 'CeraVe Foaming Facial Cleanser',
              sku: 'FC-002',
              quantity: 25,
              price: 19.48,
              brand: 'CeraVe',
              category: 'Face Care'
            }
          ],
          totalValue: 825,
          notes: 'Rush order for weekend promotion',
          shippingAddress: {
            name: 'Test Store',
            address: '123 Main Street',
            city: 'Anytown',
            postalCode: '12345',
            country: 'United States'
          },
          urgency: 'urgent'
        },
        {
          id: 1730838600000,
          orderNumber: 'ORD-20241105-001',
          seller: {
            name: 'Demo Seller',
            email: 'demo@seller.com',
            id: 'demo'
          },
          date: '2024-11-05T10:30:00.000Z',
          status: 'approved',
          items: [
            {
              productId: 3,
              name: 'Nike Air Max 270 Men\'s Shoes',
              sku: 'MS-003',
              quantity: 10,
              price: 158.00,
              brand: 'Nike',
              category: 'Men\'s Shoes'
            }
          ],
          totalValue: 1580,
          notes: 'Regular monthly restock',
          shippingAddress: {
            name: 'Demo Store',
            address: '456 Commerce Ave',
            city: 'Business City',
            postalCode: '67890',
            country: 'United States'
          },
          urgency: 'standard',
          approvedAt: '2024-11-05T11:15:00.000Z'
        }
      ];
      setOrders(sampleOrders);
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const orderCount = orders.length + 1;
    return `ORD-${year}${month}${day}-${String(orderCount).padStart(3, '0')}`;
  };

  // Create new order
  const createOrder = (orderData) => {
    if (!currentUser) {
      throw new Error('User must be logged in to create orders');
    }

    const newOrder = {
      id: Date.now(),
      orderNumber: generateOrderNumber(),
      seller: {
        name: currentUser.name,
        email: currentUser.email,
        id: currentUser.id || currentUser.username
      },
      date: new Date().toISOString(),
      status: 'pending',
      items: orderData.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: product?.name || 'Unknown Product',
          sku: product?.sku || 'UNKNOWN',
          quantity: item.quantity,
          price: product?.adminPrice || 0,
          brand: product?.brand,
          category: product?.category
        };
      }),
      totalValue: orderData.items.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        return total + (item.quantity * (product?.adminPrice || 0));
      }, 0),
      notes: orderData.notes || '',
      shippingAddress: orderData.shippingAddress,
      urgency: orderData.urgency || 'standard'
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  };

  // Get orders for current user (if seller)
  const getUserOrders = () => {
    if (!currentUser || currentUser.role !== 'seller') return [];
    return orders.filter(order => order.seller.email === currentUser.email);
  };

  // Get all orders (for admin)
  const getAllOrders = () => {
    return orders;
  };

  // Update order status (admin function)
  const updateOrderStatus = (orderId, status, reason = '') => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status,
            ...(status === 'approved' && { approvedAt: new Date().toISOString() }),
            ...(status === 'rejected' && { 
              rejectedAt: new Date().toISOString(),
              rejectionReason: reason 
            })
          }
        : order
    ));
  };

  // Cancel order (seller function)
  const cancelOrder = (orderId) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: 'cancelled', cancelledAt: new Date().toISOString() }
        : order
    ));
  };

  // Get product by ID
  const getProduct = (productId) => {
    return products.find(p => p.id === productId);
  };

  // Search products
  const searchProducts = (query) => {
    if (!query) return products;
    
    const lowercaseQuery = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.sku.toLowerCase().includes(lowercaseQuery) ||
      product.brand.toLowerCase().includes(lowercaseQuery) ||
      product.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Filter products by category
  const getProductsByCategory = (category) => {
    if (!category || category === 'all') return products;
    return products.filter(product => product.category === category);
  };

  const value = {
    // State
    orders,
    products,
    
    // Order functions
    createOrder,
    getUserOrders,
    getAllOrders,
    updateOrderStatus,
    cancelOrder,
    
    // Product functions
    getProduct,
    searchProducts,
    getProductsByCategory,
    
    // Utilities
    generateOrderNumber
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderContext;