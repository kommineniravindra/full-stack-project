import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from './CartContext';
import { Link } from 'react-router-dom'; // Using Link for proper navigation

import Footer from './Footer'; 

function Snacks() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRanges, setSelectedRanges] = useState(['all']);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;



  // Fetch data
  useEffect(() => {
    const MIN_LOAD_TIME = 200;
    const startTime = Date.now();
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8080/api/products/snacks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProducts(response.data);
      } catch (err) {
        setError('Failed to load snacks. Please try again later.');
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = MIN_LOAD_TIME - elapsedTime;
        setTimeout(() => setLoading(false), Math.max(0, remainingTime));
      }
    };
    fetchData();
  }, []);

  // A cleaner way to define price range logic
  const priceRangeFilters = {
    '0-100': price => price <= 100,
    '101-200': price => price > 100 && price <= 200,
    '201+': price => price > 200,
  };

  // Simplified filtering logic
  const filteredProducts = selectedRanges.includes('all')
    ? products
    : products.filter(product =>
        selectedRanges.some(range => priceRangeFilters[range]?.(product.price))
      );

  const handleCheckboxChange = (range) => {
    setCurrentPage(1);
    if (range === 'all') {
      setSelectedRanges(['all']);
      return;
    }
    setSelectedRanges(prev => {
      const newRanges = prev.filter(r => r !== 'all');
      if (newRanges.includes(range)) {
        const updatedRanges = newRanges.filter(r => r !== range);
        return updatedRanges.length === 0 ? ['all'] : updatedRanges;
      } else {
        return [...newRanges, range];
      }
    });
  };



  // Cleaned up and made more robust
  const handleAddToCartClick = (product) => {
    try {
      addToCart(product);
    } catch (error) {
      console.error("Failed to add item to cart:", error);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const filters = [
    { key: 'all', label: 'All' },
    { key: '0-100', label: '₹0 – ₹100' },
    { key: '101-200', label: '₹101 – ₹200' },
    { key: '201+', label: '₹201+' },
  ];

  return (
    <>
      <style>
        {`
          .card-hover { transition: transform 0.3s ease, box-shadow 0.3s ease; }
          .card-hover:hover { transform: translateY(-5px); box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important; }

        `}
      </style>
      <div className="bg-light-subtle">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">🍟 Crispy Snacks</h2>
          
          <div className="d-flex justify-content-center align-items-center flex-wrap gap-4 mb-5">
            <span className="fw-bold text-muted">Filter by Price:</span>
            {filters.map(filter => (
              <div className="form-check" key={filter.key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`snacks-filter-${filter.key}`}
                  checked={selectedRanges.includes(filter.key)}
                  onChange={() => handleCheckboxChange(filter.key)}
                />
                <label className="form-check-label" htmlFor={`snacks-filter-${filter.key}`}>
                  {filter.label}
                </label>
              </div>
            ))}

          </div>

          {loading ? null : error ? (
            <div className="alert alert-danger text-center">{error}</div>
          ) : (
            <>
              <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                {currentItems.length > 0 ? (
                  currentItems.map(product => (
                    <div className="col" key={product.id}>
                      <div className="card h-100 shadow-sm text-center border-0 rounded-3 card-hover">
                        <img src={`http://localhost:8080${product.imageUrl}`} alt={product.name} className="card-img-top rounded-top-3"
                          style={{ height: '180px', objectFit: 'cover' }}
                          onError={(e) => { e.target.src = 'https://placehold.co/400x300/cccccc/333333?text=Image+Not+Found'; }}
                        />
                        <div className="card-body d-flex flex-column p-3">
                          <div className="flex-grow-1">
                            <h5 className="card-title fw-bold mb-1">{product.name}</h5>
                            <h5 className="card-text text-danger mb-3">₹{product.price}</h5>
                          </div>
                          <button className="btn btn-warning w-100 fw-bold mt-auto" onClick={() => handleAddToCartClick(product)}>
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12"><div className="alert alert-info text-center">No snacks found for this price range.</div></div>
                )}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Page navigation" className="d-flex justify-content-center pt-5">
                  <ul className="pagination">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => (
                      <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Snacks;