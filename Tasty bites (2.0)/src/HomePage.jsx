import React from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from './ImageSlider'; // make sure the path is correct

function HomePage() {
  const navigate = useNavigate();

  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/signup');

  return (
    <div className="position-relative vh-100 overflow-hidden text-white text-center d-flex align-items-center justify-content-center">
      {/* Image Slider as Background */}
      <div className="position-absolute top-0 start-0 w-100 h-100">
        <ImageSlider />
        <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" />
      </div>

      {/* Content */}
      <div className="position-relative z-2">
        <h1 className="display-2 fw-bold mb-3">Welcome to Tasty Bites</h1>
        <h4 className="lead fs-4 mb-5">Deliciously Delivered</h4>
        <h6 className="display-6 text-warning fw-bold mb-3">KOMMINENI RAVINDRA</h6>
        <div className="d-flex justify-content-center gap-4">
          <button
            onClick={handleLogin}
            className="btn btn-outline-light btn-lg px-5 py-3 fw-bold"
          >
            Login
          </button>
          <button
            onClick={handleSignup}
            className="btn btn-warning btn-lg px-5 py-3 fw-bold"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
