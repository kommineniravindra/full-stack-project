// In your Navbar.js file...
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from './CartContext'; // Assuming CartContext.js is in the same directory
import axios from 'axios';

import {
  FaHome,
  FaCarrot,
  FaDrumstickBite,
  FaCookieBite,
  FaGlassWhiskey,
  FaShoppingCart,
  FaClipboardList,
  FaUserCircle,
  FaSignOutAlt,
  FaBell
} from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  // **FIX 1: Get totalQuantity from the context**
  const { totalQuantity } = useCart(); 
  
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [userName, setUserName] = useState('');
  const [activePath, setActivePath] = useState('');
  
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const dropdownRef = useRef(null); 
  const notifRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.name) {
      setUserName(storedUser.name);
    } else if (storedUser?.email) {
      setUserName(storedUser.email.split('@')[0]);
    } else {
      setUserName('Guest');
    }
    setActivePath(location.pathname);
    fetchNotifications();
  }, [location.pathname]);

  const fetchNotifications = () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    if (storedUser?.id && token) {
      axios.get(`http://localhost:8080/api/notifications/user/${storedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setNotifications(res.data))
      .catch(err => console.log("Could not fetch notifications"));
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    if (isUserDropdownOpen || isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserDropdownOpen, isNotifOpen]);

  const handleReadNotification = (id) => {
    const token = localStorage.getItem('token');
    axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => fetchNotifications());
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsNavCollapsed(true);
    setIsUserDropdownOpen(false); 
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
    setIsUserDropdownOpen(false);
  };

  const navItems = [
    { label: 'Home', icon: <FaHome />, path: '/user/home' },
    { label: 'Veg', icon: <FaCarrot />, path: '/user/veg' },
    { label: 'Non-Veg', icon: <FaDrumstickBite />, path: '/user/nonveg' },
    { label: 'Snacks', icon: <FaCookieBite />, path: '/user/snacks' },
    { label: 'Drinks', icon: <FaGlassWhiskey />, path: '/user/drinks' },
    // **FIX 2: Use totalQuantity for the badge value**
    { label: 'Cart', icon: <FaShoppingCart />, path: '/user/cart', badge: totalQuantity },
    { label: 'Orders', icon: <FaClipboardList />, path: '/user/orders' },
    { label: 'About Us', icon: null, path: '/about-us' },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4 py-2 shadow-sm sticky-top">
      <button className="navbar-brand btn btn-link text-white fs-4" onClick={() => handleNavigate('/user/home')}>
        Tasty <span className="text-warning">Bites</span>
      </button>

      <button 
        className="navbar-toggler" 
        type="button" 
        onClick={() => setIsNavCollapsed(!isNavCollapsed)}
        aria-controls="navbarNav"
        aria-expanded={!isNavCollapsed}
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className={`collapse navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarNav">
        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
          {navItems.map((item) => (
            <li className="nav-item position-relative" key={item.path}>
              <button
                className={`btn nav-link px-3 ${activePath === item.path ? 'bg-warning text-dark' : 'text-white hover-effect'}`}
                onClick={() => handleNavigate(item.path)}
              >
                {item.icon && <span className="me-2">{item.icon}</span>}
                {item.label}
                {item.badge > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {item.badge}
                    <span className="visually-hidden">items in cart</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="d-flex align-items-center">
          <div className="dropdown me-3" ref={notifRef}>
            <button
              className="btn btn-outline-light position-relative"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
            >
              <FaBell />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.65rem'}}>
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            {isNotifOpen && (
              <div className="dropdown-menu dropdown-menu-end show mt-2 p-0 shadow-lg" style={{ position: 'absolute', width: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                <div className="dropdown-header bg-light fw-bold text-dark border-bottom">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-3 text-center text-muted">No new notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`p-3 border-bottom ${n.read ? 'bg-white' : 'bg-light'}`} style={{ cursor: 'pointer' }} onClick={() => !n.read && handleReadNotification(n.id)}>
                      <h6 className={`mb-1 ${n.read ? 'text-secondary' : 'text-dark fw-bold'}`}>{n.title}</h6>
                      <p className="mb-0 small text-muted">{n.message}</p>
                      <small className="text-muted" style={{fontSize: '0.7rem'}}>{new Date(n.createdAt).toLocaleString()}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="dropdown" ref={dropdownRef}>
          <button
            className="btn btn-outline-light dropdown-toggle d-flex align-items-center"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            <FaUserCircle className="me-2" /> {userName}
          </button>
          {isUserDropdownOpen && (
            <ul className="dropdown-menu dropdown-menu-end show mt-2" style={{ position: 'absolute' }}>
              <li>
                <button className="dropdown-item" onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Logout
                </button>
              </li>
            </ul>
          )}
        </div>
        </div>
      </div>

      <style>{`
        .hover-effect:hover {
          background-color: rgba(255, 193, 7, 0.8);
          color: #212529 !important;
          border-radius: 5px;
        }
        .navbar-brand, .nav-link {
          transition: all 0.3s ease;
        }
      `}</style>
    </nav>
  );
}

export default Navbar;