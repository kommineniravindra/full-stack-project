import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-light pt-5 pb-4">
      <div className="container text-center text-md-start">
        <div className="row gy-4">
          <div className="col-md-4 col-lg-4 mx-auto">
            <h5 className="text-uppercase fw-bold text-warning">Tasty Bites</h5>
            <hr className="mb-4 mt-0 d-inline-block mx-auto" style={{ width: '60px', backgroundColor: '#ffc107', height: '2px' }} />
            <p className="text-white-50">Your daily dose of delicious meals and quick bites in Hyderabad. Crafted with passion, delivered with joy.</p>
          </div>

          <div className="col-md-4 col-lg-2 mx-auto">
            <h5 className="text-uppercase fw-bold text-warning">Explore</h5>
            <hr className="mb-4 mt-0 d-inline-block mx-auto" style={{ width: '60px', backgroundColor: '#ffc107', height: '2px' }} />
            <ul className="list-unstyled">
              <li className="mb-2"><Link to="/user/home" className="text-white-50 text-decoration-none">Home</Link></li>
              <li className="mb-2"><Link to="/user/veg" className="text-white-50 text-decoration-none">Veg Menu</Link></li>
              <li className="mb-2"><Link to="/user/nonveg" className="text-white-50 text-decoration-none">Non-Veg Menu</Link></li>
              <li className="mb-2"><Link to="/user/snacks" className="text-white-50 text-decoration-none">Snacks</Link></li>
            </ul>
          </div>

          <div className="col-md-4 col-lg-3 mx-auto">
            <h5 className="text-uppercase fw-bold text-warning">Contact</h5>
            <hr className="mb-4 mt-0 d-inline-block mx-auto" style={{ width: '60px', backgroundColor: '#ffc107', height: '2px' }} />
            <p className="text-white-50"><i className="bi bi-geo-alt-fill me-3"></i>Hyderabad, Telangana, India</p>
            <p className="text-white-50"><i className="bi bi-envelope-fill me-3"></i>kommineniravindra99@gmail.com</p>
            <p className="text-white-50"><i className="bi bi-phone-fill me-3"></i>+91 960-326-2008</p>
          </div>
        </div>
      </div>
      <div className="text-center text-white-50 p-3 mt-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        © 2025 Copyright: <a className="text-warning text-decoration-none fw-bold" href="#">TastyBites.com</a>
      </div>
    </footer>
  );
};

export default Footer;