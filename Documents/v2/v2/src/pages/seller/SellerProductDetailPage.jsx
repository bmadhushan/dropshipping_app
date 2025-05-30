import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SellerProductDetailPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the product list page since we now use modals for product details
    navigate('/seller/products', { replace: true });
  }, [navigate]);

  return null;
};

export default SellerProductDetailPage;