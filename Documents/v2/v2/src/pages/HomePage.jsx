import { useState } from 'react';
import '../styles/homepage.css';
import logo from '../assets/logo animation_1.svg';
import LoginModal from '../components/LoginModal';
import RegistrationModal from '../components/RegistrationModal';

const HomePage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const handleLoginClick = (e) => {
    e.preventDefault();
    setIsLoginModalOpen(true);
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    setIsRegistrationModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const handleCloseRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
  };

  return (
    <div className="home-page-container">
      <div className="home-content">
        <div className="hero-section">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="hero-logo" />
          </div>
          <h1 className="hero-title">Dropshipping Made Easy for Sri Lankan Sellers</h1>
          <p className="hero-subtitle">
            🚚 UK-Branded Products, Delivered to Your Customer
          </p>
          <p className="hero-description">
            Access a wide range of authentic branded products — all shipped directly from the UK.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📦</div>
            <h3 className="feature-title">No Inventory Needed</h3>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3 className="feature-title">Set Your Own Profit</h3>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛒</div>
            <h3 className="feature-title">One Platform, Complete Fulfillment</h3>
          </div>
        </div>

        <div className="highlight-banner">
          <p className="highlight-text">
            🔗 100% Dropshipping Friendly — Built for Sri Lanka
          </p>
        </div>

        <div className="action-buttons">
          <button onClick={handleLoginClick} className="btn-primary">
            Log In
          </button>
          <button onClick={handleRegisterClick} className="btn-secondary">
            Join as Seller
          </button>
        </div>
      </div>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />
      <RegistrationModal isOpen={isRegistrationModalOpen} onClose={handleCloseRegistrationModal} />
    </div>
  );
};

export default HomePage;