import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { FaFileInvoice, FaHome, FaShoppingCart } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isFallback, setIsFallback] = useState(false);
  const [shippingStatuses, setShippingStatuses] = useState({});
  const navigate = useNavigate();

  // --- Helper Functions ---
  const getOrderStage = useCallback((status, shippingStatus) => {
    switch (status) {
      case "PENDING": return { text: "Pending", color: "warning" };
      case "ACCEPTED": 
        if (shippingStatus === 'DELIVERED') {
          return { text: "Completed", color: "success" };
        } else if (shippingStatus === 'DISPATCHED') {
          return { text: "Dispatched", color: "info" };
        } else if (shippingStatus === 'IN_TRANSIT') {
          return { text: "In Transit", color: "info" };
        } else {
          return { text: "Accepted", color: "primary" };
        }
      case "DECLINED": return { text: "Cancelled", color: "danger" };
      default: return { text: "Unknown", color: "secondary" };
    }
  }, []);

  const getETA = useCallback((orderDate, status) => {
    if (status === 'DECLINED') return "N/A";
    const deliveryTime = new Date(new Date(orderDate).getTime() + 45 * 60000);
    if (new Date() > deliveryTime) return "Delivered";
    const diffMin = Math.max(0, Math.ceil((deliveryTime - new Date()) / 60000));
    return `${diffMin} min`;
  }, []);

  // --- Data Fetching and Processing ---
  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate("/login");
      toast.error("Please log in to view your orders.", { position: "top-center" });
      return;
    }

    try {
      const res = await axios.get(`http://localhost:8080/api/orders/my?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fetch shipping statuses for ACCEPTED orders
      const acceptedOrders = res.data.filter(order => order.status === 'ACCEPTED');
      const shippingPromises = acceptedOrders.map(order => 
        axios.get(`http://localhost:8080/api/shipping/${order.id}?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(shipRes => ({ orderId: order.id, status: shipRes.data.status }))
        .catch(() => ({ orderId: order.id, status: null }))
      );
      
      const shippingResults = await Promise.all(shippingPromises);
      const statusesMap = {};
      shippingResults.forEach(r => {
        if (r.status) statusesMap[r.orderId] = r.status;
      });
      setShippingStatuses(statusesMap);

      const data = res.data.map(order => ({
        ...order,
        orderStage: getOrderStage(order.status, statusesMap[order.id]),
        eta: getETA(order.orderDate, order.status),
        paymentMode: ["Cash", "Credit Card", "UPI"][order.id % 3]
      })).reverse();
      setOrders(data);
      localStorage.setItem("orders", JSON.stringify(data));
      setIsFallback(false);
    } catch (err) {
      console.warn("⚠️ Backend fetch failed, using fallback:", err);
      try {
        const fallbackData = JSON.parse(localStorage.getItem("orders") || "[]");
        setOrders(fallbackData);
        setIsFallback(true);
      } catch (e) {
        console.error("❌ Fallback load failed:", e);
        setOrders([]);
        setIsFallback(true);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [navigate, getOrderStage, getETA]);

  useEffect(() => {
    console.log("OrdersPage: setting up background polling...");
    fetchOrders();
    const interval = setInterval(() => {
      console.log("OrdersPage: polling backend for order updates...");
      fetchOrders(false);
    }, 3000);
    return () => {
      console.log("OrdersPage: clearing background polling...");
      clearInterval(interval);
    };
  }, [fetchOrders]);
  
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') {
      return ['pending', 'accepted', 'dispatched', 'in transit'].includes(order.orderStage.text.toLowerCase());
    }
    return order.orderStage.text.toLowerCase() === activeTab;
  });

  // --- Invoice Generation ---
  const generateInvoice = (order) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Tasty Bites - Invoice", 14, 25);
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Order ID: #${order.id}`, 14, 35);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleString()}`, 14, 42);
    
    const tableRows = order.items.map(item => [item.productName, `₹${item.price.toFixed(2)}`, item.quantity, `₹${(item.price * item.quantity).toFixed(2)}`]);
    
    autoTable(doc, {
        startY: 50,
        head: [["Product", "Price", "Qty", "Subtotal"]],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [255, 193, 7] }, // Bootstrap Warning Yellow
    });
    
    const finalY = doc.lastAutoTable.finalY || 70;
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 14, finalY + 10);
    doc.save(`invoice-order-${order.id}.pdf`);
  };

  // --- Order Cancellation ---
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/orders/${orderId}/status`, { status: "DECLINED" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Order cancelled successfully!", { position: "top-center" });
      fetchOrders();
    } catch (error) {
      toast.error("Failed to cancel order. Please try again.", { position: "top-center" });
    }
  };

  const OrderSummary = ({ order }) => (
    <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <div>
            <span className="fw-bold me-3">Order #{order.id}</span>
            <span className={`badge bg-${order.orderStage.color}`}>{order.orderStage.text}</span>
        </div>
        <div className="d-none d-md-flex align-items-center gap-4">
            <small className="text-muted">Total: <span className="fw-bold text-dark">₹{order.totalAmount.toFixed(2)}</span></small>
            <small className="text-muted">Placed: {new Date(order.orderDate).toLocaleDateString()}</small>
        </div>
    </div>
  );

  const ShippingTracker = ({ orderId }) => {
    const [shipping, setShipping] = useState(null);
    useEffect(() => {
      const fetchShipping = () => {
        const token = localStorage.getItem('token');
        axios.get(`http://localhost:8080/api/shipping/${orderId}?t=${Date.now()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => setShipping(res.data))
        .catch(err => console.log("No shipping record found"));
      };

      fetchShipping();
      const interval = setInterval(fetchShipping, 3000);
      return () => clearInterval(interval);
    }, [orderId]);

    if (!shipping) return null;

    if (shipping.status === 'DECLINED') {
      return (
        <div className="mt-4 border-top pt-3 text-center">
          <h6 className="text-danger">Shipping Cancelled</h6>
          <p className="text-muted small">This order was cancelled, so shipping has been halted.</p>
        </div>
      );
    }

    const stages = ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    // Handle edge cases if a backend bug temporarily set status to ACCEPTED
    let mappedStatus = shipping.status;
    if (mappedStatus === 'ACCEPTED') mappedStatus = 'PENDING';
    
    let currentIndex = stages.indexOf(mappedStatus);
    if (currentIndex === -1) currentIndex = 0; // Default fallback

    return (
      <div className="mt-4 border-top pt-3">
        <h6>Shipping Tracking <small className="text-muted">(#{shipping.trackingNumber})</small></h6>
        <div className="position-relative m-4">
          <div className="progress" style={{ height: '5px' }}>
            <div className="progress-bar bg-success" role="progressbar" style={{ width: `${(currentIndex / 3) * 100}%` }}></div>
          </div>
          <div className="d-flex justify-content-between position-absolute w-100 top-0 translate-middle-y">
            {stages.map((stage, i) => (
              <div key={stage} className={`rounded-circle d-flex align-items-center justify-content-center text-white ${i <= currentIndex ? 'bg-success' : 'bg-secondary'}`} style={{ width: '25px', height: '25px', fontSize: '10px' }}>
                {i + 1}
              </div>
            ))}
          </div>
          <div className="d-flex justify-content-between mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
            {stages.map(stage => <div key={stage}>{stage.replace('_', ' ')}</div>)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container py-4 py-lg-5">
      <ToastContainer />
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Your Orders</h2>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/user/home")}><FaHome className="me-1"/> Menu</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/user/cart")}><FaShoppingCart className="me-1"/> Cart</button>
        </div>
      </div>
      
      <ul className="nav nav-pills justify-content-center mb-4">
        {['all', 'pending', 'completed', 'cancelled'].map(tab => (
            <li className="nav-item" key={tab}>
                <button className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            </li>
        ))}
      </ul>

      {isFallback && <div className="alert alert-warning small">⚠️ Could not fetch latest data. Displaying cached orders.</div>}

      {loading ? (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
            <p className="mt-2 text-muted">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-5 card card-body bg-light">
          <h5>No orders found in this category.</h5>
          <p className="text-muted">Why not place one now?</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate("/user/home")}>Go to Menu</button>
        </div>
      ) : (
        <div className="accordion" id="ordersAccordion">
          {filteredOrders.map(order => (
            <div className="accordion-item" key={order.id}>
              <h2 className="accordion-header" id={`heading-${order.id}`}>
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${order.id}`} aria-expanded="false" aria-controls={`collapse-${order.id}`}>
                    <OrderSummary order={order} />
                </button>
              </h2>
              <div id={`collapse-${order.id}`} className="accordion-collapse collapse" aria-labelledby={`heading-${order.id}`} data-bs-parent="#ordersAccordion">
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-lg-7 mb-3 mb-lg-0">
                      <h6>Products in this Order:</h6>
                      <ul className="list-group list-group-flush">
                        {order.items.map((item, index) => (
                          <li key={index} className="list-group-item d-flex justify-content-between align-items-center px-0">
                            {item.productName} (x{item.quantity})
                            <span className="badge bg-secondary rounded-pill">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-lg-5">
                      <h6>Delivery Details:</h6>
                      <p className="mb-1"><small className="text-muted">Payment:</small> {order.paymentMode}</p>
                      {order.orderStage.text !== 'Cancelled' && <p className="mb-1"><small className="text-muted">ETA:</small> {order.eta}</p>}
                    </div>
                  </div>
                  <ShippingTracker orderId={order.id} />
                  <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => generateInvoice(order)}>
                      <FaFileInvoice className="me-1"/> Invoice
                    </button>
                    {order.orderStage.text === 'Pending' && (
                      <button className="btn btn-outline-danger btn-sm" onClick={() => handleCancelOrder(order.id)}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrdersPage;