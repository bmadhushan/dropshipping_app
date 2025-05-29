import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import '../styles/login-modal.css';
import logo from '../assets/logo animation_1.svg';

const LoginModal = ({ isOpen, onClose }) => {
  const { authenticate, loginError } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await authenticate(formData.username, formData.password);
      
      if (result.success) {
        onClose();
        // Redirect based on role
        if (result.user.role === 'super_admin') {
          navigate('/admin');
        } else if (result.user.role === 'seller') {
          navigate('/seller');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="login-modal">
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="login-modal-header">
          <img src={logo} alt="Logo" className="login-modal-logo" />
          <h2 className="login-modal-title">Welcome Back</h2>
          <p className="login-modal-subtitle">Sign in to your dropshipping account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-modal-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>
          
          {loginError && (
            <div className="error-message">
              {loginError}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </>
  );
};

export default LoginModal;