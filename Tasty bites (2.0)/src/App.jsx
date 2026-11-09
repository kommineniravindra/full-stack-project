import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CartProvider } from './CartContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import Pages & Components
import Signup from './SignUp';
import Login from './Login';
import UserHome from './UserHome';

import PrivateRoute from './PrivateRoute';
import Veg from './Veg';
import NonVeg from './NonVeg';
import Snacks from './Snacks';
import Drinks from './Drinks';
import HomePage from './HomePage';
import CartPage from './CartPage';
import Orders from './OrdersPage';
import AboutUsPage from './AboutUsPage';
import Navbar from './Navbar';
import PaymentCallback from './PaymentCallback';
import './App.css';

// NavbarWrapper component to provide a layout for user pages
const NavbarWrapper = () => {
  return (
    <>
      <Navbar />
      <Outlet /> {/* Renders the matched child route component (e.g., <Veg />, <UserHome />) */}
    </>
  );
};

function App() {
  return (
    <CartProvider>
      <Router>

        <ToastContainer
          className="toast-container-custom" 
          position="top-right"
          autoClose={1500}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/WelcomeToTastyBites" />} />
          <Route path="/WelcomeToTastyBites" element={<HomePage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment-callback" element={<PaymentCallback />} />
          
          {/* User Protected Routes */}
          <Route element={<PrivateRoute role="USER" />}>
            <Route element={<NavbarWrapper />}>
              <Route path="/user/home" element={<UserHome />} />
              <Route path="/user/veg" element={<Veg />} />
              <Route path="/user/nonveg" element={<NonVeg />} />
              <Route path="/user/snacks" element={<Snacks />} />
              <Route path="/user/drinks" element={<Drinks />} />
              <Route path="/user/cart" element={<CartPage />} />
              <Route path="/user/orders" element={<Orders />} />
              <Route path="/about-us" element={<AboutUsPage />} />
            </Route>
          </Route>



          {/* Fallback Route */}
          <Route path="*" element={<h2>404 Page Not Found</h2>} />
        </Routes>
      </Router>
    </CartProvider>
  );
}

export default App;