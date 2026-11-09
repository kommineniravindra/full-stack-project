import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import ImageSlider from './ImageSlider';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password,
      });

      const { token, role, email: loggedInEmail, name } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name, email: loggedInEmail, role }));

      setLoading(false);

      if (role === 'ADMIN') {
        setError('Please use the Admin Portal to login.');
        setLoading(false);
        return;
      } else {
        navigate('/user/home');
      }
    } catch (err) {
      setLoading(false);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
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
                <p className="text-light small">Welcome back! Please login</p>
              </div>

              <form onSubmit={handleLogin}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control bg-transparent text-white"
                    id="floatingEmail"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="floatingEmail" className="text-dark">Email address</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control bg-transparent text-white"
                    id="floatingPassword"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="floatingPassword" className="text-dark">Password</label>
                </div>

                <div className="d-grid mb-3">
                  <button className="btn btn-warning btn-lg fw-bold text-white" type="submit" disabled={loading}>
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      'Login'
                    )}
                  </button>
                </div>
              </form>

              {error && <p className="text-danger text-center mt-3">{error}</p>}

              <p className="text-center text-light mt-4">
                Not registered?{' '}
                <Link to="/signup" className="fw-bold text-warning text-decoration-none">Signup here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
