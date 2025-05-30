import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import DarkModeToggle from '../common/DarkModeToggle.jsx';
import { LogOut } from 'lucide-react';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { userRole, currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to home or login page after logout
  };

  return (
    <nav className={`p-4 shadow-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600 dark:text-indigo-400">MyApp</Link>
        <div className="flex items-center space-x-4">
          <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          {userRole === 'guest' && (
            <>
              <Link to="/register" className="hover:text-indigo-500">Register</Link>
            </>
          )}
          {currentUser && <span className="text-sm">Welcome, {currentUser.name}! ({userRole})</span>}
          {userRole === 'seller' && <Link to="/seller/dashboard" className="hover:text-indigo-500">Seller Dashboard</Link>}
          {userRole === 'super_admin' && <Link to="/admin/dashboard" className="hover:text-indigo-500">Admin Dashboard</Link>}
          {(userRole === 'seller' || userRole === 'super_admin') && (
            <button type="button" onClick={handleLogout} className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${darkMode ? 'bg-red-600 hover:bg-red-500' : 'bg-red-500 text-white hover:bg-red-600'}`}>
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;