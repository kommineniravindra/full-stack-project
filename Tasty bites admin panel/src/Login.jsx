import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

      if (role !== 'ADMIN') {
        setError('Access denied: Admin privileges required.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name, email: loggedInEmail, role }));

      setLoading(false);
      navigate('/admin/dashboard');
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
    <div className="d-flex justify-content-center align-items-center vh-100 bg-dark text-white">
      <div className="card shadow-lg p-4 bg-secondary text-white" style={{ width: '100%', maxWidth: '400px', border: 'none', borderRadius: '15px' }}>
        <div className="text-center mb-4">
          <h3 className="fw-bold text-warning">Tasty Bites Admin</h3>
          <p className="small">Login to access the dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{ backgroundColor: '#2b3035', color: '#fff', border: '1px solid #495057' }}
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ backgroundColor: '#2b3035', color: '#fff', border: '1px solid #495057' }}
            />
          </div>

          <button className="btn btn-warning w-100 fw-bold" type="submit" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>

        {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
      </div>
    </div>
  );
}

export default Login;
