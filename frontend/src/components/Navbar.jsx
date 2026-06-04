import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  ShoppingCart, LayoutDashboard, Package, ScanLine,
  ClipboardList, LogOut, User, Zap, ChevronDown, Shield
} from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/products', label: 'Products', icon: Package },
    { to: '/scan', label: 'Scan', icon: ScanLine },
    { to: '/orders', label: 'Orders', icon: ClipboardList },
    ...(isAdmin ? [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 border-b border-dark-700/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/products" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text">SmartShop</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Cart button */}
            <Link
              to="/cart"
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive('/cart')
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-dark-700/50 transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-dark-100 leading-none">{user?.name}</p>
                  <p className="text-xs text-dark-500 mt-0.5 flex items-center gap-1">
                    {isAdmin && <Shield className="w-3 h-3 text-primary-400" />}
                    {user?.role}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card border border-dark-700 rounded-xl shadow-card overflow-hidden animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-dark-700">
                    <p className="text-sm font-medium text-dark-100">{user?.name}</p>
                    <p className="text-xs text-dark-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-dark-700/50 px-4 pb-3 pt-2 flex gap-1 overflow-x-auto">
        {navLinks.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              isActive(to)
                ? 'bg-primary-600/20 text-primary-400'
                : 'text-dark-400 hover:text-dark-100 hover:bg-dark-700/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
