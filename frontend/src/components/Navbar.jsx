import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Activity, History, Home } from 'lucide-react';

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-logo">
          <Sparkles className="text-secondary" />
          <span className="gradient-text">Oxygen AI</span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={`nav-link flex items-center gap-2 ${isActive('/')}`}>
            <Home size={18} /> Home
          </Link>
          <Link to="/generate" className={`nav-link flex items-center gap-2 ${isActive('/generate')}`}>
            <Sparkles size={18} /> Generate
          </Link>
          <Link to="/history" className={`nav-link flex items-center gap-2 ${isActive('/history')}`}>
            <History size={18} /> History
          </Link>
          <Link to="/analytics" className={`nav-link flex items-center gap-2 ${isActive('/analytics')}`}>
            <Activity size={18} /> Analytics
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
