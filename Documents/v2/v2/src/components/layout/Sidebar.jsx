import { NavLink } from 'react-router-dom';

const AdminSidebar = ({ darkMode }) => {
  const linkClass = `block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700`;
  const activeLinkClass = `bg-indigo-500 text-white dark:bg-indigo-600`;

  return (
    <aside className={`w-64 p-4 space-y-2 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
      <h3 className="text-lg font-semibold px-2">Admin Menu</h3>
      <NavLink to="/admin/dashboard" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Dashboard</NavLink>
      <NavLink to="/admin/sellers" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Seller Management</NavLink>
      <NavLink to="/admin/products" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Product Management</NavLink>
      <NavLink to="/admin/headers" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Header Settings</NavLink>
      <NavLink to="/admin/pricing" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Pricing Settings</NavLink>
      <NavLink to="/admin/orders" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Order Review</NavLink>
    </aside>
  );
};

const SellerSidebar = ({ darkMode }) => {
  const linkClass = `block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700`;
  const activeLinkClass = `bg-blue-500 text-white dark:bg-blue-600`;

  return (
    <aside className={`w-64 p-4 space-y-2 ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
      <h3 className="text-lg font-semibold px-2">Seller Menu</h3>
      <NavLink to="/seller/dashboard" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Dashboard</NavLink>
      <NavLink to="/seller/products" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Product Panel</NavLink>
      <NavLink to="/seller/export" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Export CSV</NavLink>
      <NavLink to="/seller/orders" className={({isActive}) => `${linkClass} ${isActive ? activeLinkClass : ''}`}>Orders</NavLink>
    </aside>
  );
};

export { AdminSidebar, SellerSidebar };