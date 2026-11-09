import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ImageSlider from './ImageSlider';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/auth/signup', formData);
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('An account with this email already exists.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Signup failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }
      `}</style>

      <div className="container-fluid vh-100 p-0 position-relative">
        {/* Background Slider */}
        <div className="position-absolute top-0 start-0 w-100 h-100 z-0">
          <ImageSlider />
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50" />
        </div>

        {/* Foreground Content */}
        <div className="row g-0 h-100 position-relative z-1">
          <div className="col-12 d-flex justify-content-center align-items-center">
            <div
              className="card glass-card text-white border-0 rounded-4 p-4 p-sm-5"
              style={{ width: '100%', maxWidth: '26rem' }}
            >
              <div className="text-center mb-4">
                <h2 className="fw-bold text-warning">TASTY BITE'S</h2>
                <p className="text-light small">Create your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control bg-transparent text-white"
                    id="floatingName"
                    placeholder="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="floatingName" className="text-white">Full Name</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control bg-transparent text-white"
                    id="floatingEmail"
                    placeholder="name@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="floatingEmail" className="text-white">Email address</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control bg-transparent text-white"
                    id="floatingPassword"
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="floatingPassword" className="text-white">Password</label>
                </div>

                <div className="d-grid mb-3">
                  <button className="btn btn-warning btn-lg fw-bold text-white" type="submit" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </form>

              {error && <p className="text-danger text-center mt-3">{error}</p>}

              <p className="text-center text-light mt-4">
                Already have an account?{' '}
                <Link to="/login" className="fw-bold text-danger text-decoration-none">Login here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;
