import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Modal } from 'bootstrap';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import {
  FaTachometerAlt, FaClipboardList, FaUtensils, FaSignOutAlt, FaPlus, FaSync,
  FaChartLine, FaClock, FaPen, FaTrash, FaUsers, FaBell
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  // --- STATE MANAGEMENT ---
  // Data State
  const [analytics, setAnalytics] = useState(null);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [shippingRecords, setShippingRecords] = useState([]);
  
  // UI & Control State
  const [activeView, setActiveView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // State for Modals
  const [productToUpdate, setProductToUpdate] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: '', price: '', imageUrl: '' });
  const [imageFile, setImageFile] = useState(null);

  // --- REFS & MODAL INSTANCES ---
  const addModalRef = useRef();
  const updateModalRef = useRef();
  const [addModalInstance, setAddModalInstance] = useState(null);
  const [updateModalInstance, setUpdateModalInstance] = useState(null);
  const [notifModalInstance, setNotifModalInstance] = useState(null);

  const notifModalRef = useRef(null);

  const [notificationForm, setNotificationForm] = useState({ userId: '', title: '', message: '' });

  // --- HOOKS & SETUP ---
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const COLORS = ['#5e72e4', '#2dce89', '#f5365c', '#fb6340', '#11cdef', '#ffd600'];

  useEffect(() => {
    if (addModalRef.current) setAddModalInstance(new Modal(addModalRef.current));
    if (updateModalRef.current) setUpdateModalInstance(new Modal(updateModalRef.current));
    if (notifModalRef.current) setNotifModalInstance(new Modal(notifModalRef.current));
    fetchData();
  }, []);

  // --- DATA FETCHING (Corrected) ---
  const fetchData = async (showLoading = true) => {
    const shouldShow = showLoading === true || (showLoading !== false && typeof showLoading === 'object');
    if (shouldShow) setLoading(true);
    try {
      const [analyticsRes, dailyRes, weeklyRes, ordersRes, productsRes, usersRes, shippingRes] = await Promise.all([
        // This line is essential and now correctly included
        axios.get("http://localhost:8080/api/analytics/summary", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/analytics/daily-revenue", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/analytics/weekly-revenue", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/orders/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/products", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/auth/users/all", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("http://localhost:8080/api/shipping", { headers: { Authorization: `Bearer ${token}` } }).catch(err => ({ data: [] }))
      ]);
      
      // All state updates are now processed correctly
      setAnalytics(analyticsRes.data);
      setWeeklyRevenue(weeklyRes.data.map(entry => ({ date: entry.label, revenue: entry.totalRevenue })));
      setDailyRevenue(dailyRes.data.map(entry => ({ date: entry.label, revenue: entry.totalRevenue })));
      setOrders(ordersRes.data.reverse());
      setProducts(productsRes.data);
      setUsers(usersRes.data);
      setShippingRecords(shippingRes ? shippingRes.data : []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error("Failed to fetch dashboard data.");
      }
    } finally {
      if (shouldShow) setLoading(false);
    }
  };

  // --- EVENT HANDLERS ---
  const handleStatusUpdate = (orderId, status) => {
    // Optimistic UI Update for orders
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status } : order));

    axios.put(`http://localhost:8080/api/orders/${orderId}/status`, { status }, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        toast.success(`Order #${orderId} status updated to ${status}`);
        fetchData(false);
      })
      .catch(err => {
        console.error("Failed to update order status", err);
        toast.error("Failed to update order status.");
        fetchData(false);
      });
  };

  const handleShippingUpdate = (orderId, status) => {
    // Optimistic UI Update for shipping records
    setShippingRecords(prev => (prev || []).map(ship => ship.orderId === orderId ? { ...ship, status } : ship));

    axios.put(`http://localhost:8080/api/shipping/${orderId}/status?status=${status}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        if (status === "DISPATCHED" || status === "IN_TRANSIT" || status === "DELIVERED") {
            // Automatically accept the order if it hasn't been already
            axios.put(`http://localhost:8080/api/orders/${orderId}/status?status=ACCEPTED`, {}, { headers: { Authorization: `Bearer ${token}` } })
                 .catch(err => console.error("Auto-accept failed", err));
        }
        toast.success(`Shipping status for Order #${orderId} updated to ${status}`);
        fetchData(false);
      })
      .catch(err => {
        console.error("Failed to update shipping status", err);
        toast.error("Failed to update shipping status.");
        fetchData(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openUpdateModal = (product) => {
    setProductToUpdate(product);
    setImageFile(null);
    updateModalInstance?.show();
  };
  
  const renderStatusBadge = (status) => {
    const color = status === "ACCEPTED" ? "success" : status === "DECLINED" ? "danger" : "warning";
    return <span className={`badge bg-${color}`}>{status}</span>;
  };

  // --- MODAL FORM HANDLERS ---
  const handleNewProductChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleNotificationChange = (e) => {
    setNotificationForm({ ...notificationForm, [e.target.name]: e.target.value });
  };

  const openNotificationModal = (userId) => {
    setNotificationForm({ userId: userId.toString(), title: '', message: '' });
    notifModalInstance?.show();
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8080/api/notifications", notificationForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Notification sent to user successfully!");
      notifModalInstance?.hide();
      setNotificationForm({ userId: '', title: '', message: '' });
    } catch (error) {
      toast.error("Failed to send notification.");
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append('file', imageFile);
    try {
      const res = await axios.post("http://localhost:8080/api/products/upload", formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      return res.data; // returns the path like /images/...
    } catch (error) {
      toast.error("Failed to upload image.");
      return null;
    }
  };

  const handleNewProductSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalImageUrl = newProduct.imageUrl;
      if (imageFile) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) finalImageUrl = uploadedPath;
      }
      
      const productData = { ...newProduct, imageUrl: finalImageUrl };
      await axios.post("http://localhost:8080/api/products", productData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Product added successfully!");
      addModalInstance?.hide();
      fetchData();
      setNewProduct({ name: '', description: '', category: '', price: '', imageUrl: '' }); // Reset form
      setImageFile(null);
    } catch (error) {
      toast.error("Failed to add product.");
    }
  };

  const handleUpdateProductChange = (e) => {
    setProductToUpdate({ ...productToUpdate, [e.target.name]: e.target.value });
  };

  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!productToUpdate || !productToUpdate.id) {
      toast.error("No product selected to update.");
      return;
    }
    try {
      let finalImageUrl = productToUpdate.imageUrl;
      if (imageFile) {
        const uploadedPath = await uploadImage();
        if (uploadedPath) finalImageUrl = uploadedPath;
      }
      
      const productData = { ...productToUpdate, imageUrl: finalImageUrl };
      await axios.put(`http://localhost:8080/api/products/${productToUpdate.id}`, productData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Product updated successfully!");
      updateModalInstance?.hide();
      fetchData();
      setImageFile(null);
    } catch (error) {
      console.error("Could not update product.", error);
      toast.error("Could not update product.");
    }
  };

  // --- CHILD VIEW COMPONENTS ---
  const Sidebar = () => (
    <div className="d-flex flex-column flex-shrink-0 p-3 text-white bg-dark vh-100 position-fixed" style={{ width: '280px' }}>
      <a href="/admin/dashboard" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto text-white text-decoration-none"><span className="fs-4 fw-bold">Tasty Bites</span></a><hr />
      <ul className="nav nav-pills flex-column mb-auto">
        <li className="nav-item mb-1"><button className={`nav-link text-white ${activeView === 'dashboard' && 'active'}`} onClick={() => setActiveView('dashboard')}><FaTachometerAlt className="me-2"/>Dashboard</button></li>
        <li className="nav-item mb-1"><button className={`nav-link text-white ${activeView === 'menu' && 'active'}`} onClick={() => setActiveView('menu')}><FaUtensils className="me-2"/>Menu Management</button></li>
        <li className="nav-item mb-1"><button className={`nav-link text-white ${activeView === 'orders' && 'active'}`} onClick={() => setActiveView('orders')}><FaClipboardList className="me-2"/>Online Orders</button></li>
        <li className="nav-item mb-1"><button className={`nav-link text-white ${activeView === 'shipping' && 'active'}`} onClick={() => setActiveView('shipping')}><i className="fa-solid fa-truck me-2"></i>Shipping</button></li>
        <li className="nav-item mb-1"><button className={`nav-link text-white ${activeView === 'customers' && 'active'}`} onClick={() => setActiveView('customers')}><FaUsers className="me-2"/>Customers</button></li>
      </ul><hr />
      <button className="btn btn-outline-light w-100" onClick={handleLogout}><FaSignOutAlt className="me-2"/>Logout</button>
    </div>
  );

  const DashboardView = () => (
    <><div className="row g-4"><div className="col-md-6 col-lg-3"><div className="card text-white h-100" style={{backgroundColor: '#5e72e4'}}><div className="card-body d-flex justify-content-between align-items-center"><div><h5 className="card-title text-uppercase">Total Orders</h5><h2 className="fw-bold">{analytics?.totalOrders || 0}</h2></div><FaClipboardList size={40} className="opacity-50"/></div></div></div><div className="col-md-6 col-lg-3"><div className="card text-white h-100" style={{backgroundColor: '#2dce89'}}><div className="card-body d-flex justify-content-between align-items-center"><div><h5 className="card-title text-uppercase">Total Revenue</h5><h2 className="fw-bold">₹{analytics?.totalRevenue?.toFixed(2) || 0}</h2></div><FaChartLine size={40} className="opacity-50"/></div></div></div><div className="col-md-6 col-lg-3"><div className="card text-white h-100" style={{backgroundColor: '#fb6340'}}><div className="card-body d-flex justify-content-between align-items-center"><div><h5 className="card-title text-uppercase">Pending Orders</h5><h2 className="fw-bold">{orders.filter(o => o.status === 'PENDING').length}</h2></div><FaClock size={40} className="opacity-50"/></div></div></div><div className="col-md-6 col-lg-3"><div className="card text-white h-100" style={{backgroundColor: '#f5365c'}}><div className="card-body d-flex justify-content-between align-items-center"><div><h5 className="card-title text-uppercase">Total Users</h5><h2 className="fw-bold">{users.length}</h2></div><FaUsers size={40} className="opacity-50"/></div></div></div></div><div className="row g-4 mt-2"><div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-header bg-white border-0"><h4>Daily Revenue</h4></div><div className="card-body"><ResponsiveContainer width="100%" height={300}><BarChart data={dailyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => `₹${value.toFixed(2)}`} /><Bar dataKey="revenue" radius={[5, 5, 0, 0]}>{dailyRevenue.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div></div><div className="col-lg-6"><div className="card shadow-sm h-100"><div className="card-header bg-white border-0"><h4>Weekly Revenue</h4></div><div className="card-body"><ResponsiveContainer width="100%" height={300}><BarChart data={weeklyRevenue} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => `₹${value.toFixed(2)}`} /><Bar dataKey="revenue" fill="#2dce89" radius={[5, 5, 0, 0]}>{weeklyRevenue.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div></div></div></>
  );

  const OrdersView = () => ( <div className="card shadow-sm"><div className="card-header bg-white border-0"><h4>All Online Orders</h4></div><div className="card-body"><div className="table-responsive"><table className="table table-striped table-hover align-middle"><thead><tr><th>ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>{orders.length > 0 ? orders.map(order => (<tr key={order.id}><td>#{order.id}</td><td>{order.userName}</td><td>{order.items.map(i => `${i.productName} (x${i.quantity})`).join(", ")}</td><td>₹{order.totalAmount.toFixed(2)}</td><td>{renderStatusBadge(order.status)}</td><td>{order.status === 'PENDING' && (<div className="btn-group btn-group-sm"><button className="btn btn-success" onClick={() => handleStatusUpdate(order.id, "ACCEPTED")}>Accept</button><button className="btn btn-danger" onClick={() => handleStatusUpdate(order.id, "DECLINED")}>Decline</button></div>)}</td></tr>)) : <tr><td colSpan="6" className="text-center p-4">No orders available.</td></tr>}</tbody></table></div></div></div>);
  
  const MenuView = () => {
    const handleDelete = async (id) => { if (window.confirm("Are you sure you want to delete this product?")) { try { await axios.delete(`http://localhost:8080/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Product deleted successfully!"); fetchData(); } catch (error) { toast.error("Could not delete product."); } } };
    return (<div className="card shadow-sm"><div className="card-header bg-white border-0"><h4>Manage Products</h4></div><div className="card-body">{products.length === 0 ? (<div className="alert alert-info">No products available.</div>) : (<div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">{products.map(product => (<div className="col" key={product.id}><div className="card h-100 product-card-admin"><div className="position-relative"><img src={`http://localhost:8080${product.imageUrl}`} className="card-img-top" alt={product.name} style={{ height: '200px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://placehold.co/400x300/cccccc/333333?text=Image+Not+Found'; }}/><span className="badge bg-primary position-absolute top-0 end-0 m-2">{product.category}</span></div><div className="card-body d-flex flex-column"><h5 className="card-title flex-grow-1">{product.name}</h5><p className="card-text fw-bold fs-5 text-success">₹{product.price}</p></div><div className="card-footer bg-transparent border-0 d-flex justify-content-end gap-2 pb-3"><button className="btn btn-sm btn-outline-secondary" onClick={() => openUpdateModal(product)}><FaPen/></button><button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(product.id)}><FaTrash/></button></div></div></div>))}</div>)}</div></div>);
  };
  
  const CustomersView = () => (<div className="card shadow-sm"><div className="card-header bg-white border-0"><h4>Registered Customers</h4></div><div className="card-body"><div className="table-responsive"><table className="table table-striped table-hover align-middle"><thead><tr><th>User ID</th><th>Email</th><th>Action</th></tr></thead><tbody>{users.length > 0 ? users.map(user => (<tr key={user.id}><td>{user.id}</td><td>{user.email}</td><td><button className="btn btn-sm btn-outline-warning" onClick={() => openNotificationModal(user.id)}><FaBell className="me-1"/>Send Alert</button></td></tr>)) : (<tr><td colSpan="3" className="text-center p-4">No customers found.</td></tr>)}</tbody></table></div></div></div>);

  const ShippingView = () => {
    const activeShippingRecords = (shippingRecords || []).filter(ship => {
      const associatedOrder = orders.find(o => o.id === ship.orderId);
      return associatedOrder && associatedOrder.status === 'ACCEPTED';
    });

    return (
      <div className="card shadow-sm">
        <div className="card-header bg-white border-0">
          <h4>Shipping Management</h4>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Tracking Number</th>
                  <th>Status</th>
                  <th>Est. Delivery</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeShippingRecords.length > 0 ? (
                  activeShippingRecords.map(ship => (
                    <tr key={ship.id}>
                      <td>#{ship.orderId}</td>
                      <td>{ship.trackingNumber}</td>
                      <td>{renderStatusBadge(ship.status)}</td>
                      <td>{new Date(ship.estimatedDelivery).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className={['DISPATCHED', 'IN_TRANSIT', 'DELIVERED'].includes(ship.status) ? "btn btn-primary" : "btn btn-outline-primary"} 
                            onClick={() => handleShippingUpdate(ship.orderId, "DISPATCHED")} 
                            disabled={ship.status !== 'PENDING'}
                          >
                            Dispatch
                          </button>
                          <button 
                            className={['IN_TRANSIT', 'DELIVERED'].includes(ship.status) ? "btn btn-info text-white" : "btn btn-outline-info"} 
                            onClick={() => handleShippingUpdate(ship.orderId, "IN_TRANSIT")} 
                            disabled={ship.status !== 'DISPATCHED'}
                          >
                            In Transit
                          </button>
                          <button 
                            className={ship.status === 'DELIVERED' ? "btn btn-success" : "btn btn-outline-success"} 
                            onClick={() => handleShippingUpdate(ship.orderId, "DELIVERED")} 
                            disabled={ship.status !== 'IN_TRANSIT'}
                          >
                            Deliver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-4">No shipping records available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <>
      <style>{`body { background-color: #f8f9fe; } .nav-pills .nav-link.active, .nav-pills .show>.nav-link { background-color: #5e72e4; } .product-card-admin { transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; } .product-card-admin:hover { transform: translateY(-5px); box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15) !important; }`}</style>
      <div className="d-flex">
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <Sidebar />
        <main className="container-fluid p-4" style={{ marginLeft: '280px', minHeight: '100vh' }}>
          <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom"><h1 className="h2">{activeView.charAt(0).toUpperCase() + activeView.slice(1)}</h1><div className="btn-toolbar mb-2 mb-md-0"><button className="btn btn-sm btn-outline-secondary me-2" onClick={fetchData} disabled={loading}><FaSync className={loading ? 'fa-spin' : ''} /> Refresh</button><button className="btn btn-sm btn-primary" onClick={() => { setNewProduct({ name: '', description: '', category: '', price: '', imageUrl: '' }); setImageFile(null); addModalInstance?.show(); }}><FaPlus /> Add Product</button></div></div>
          {loading ? (<div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>) : (<>{activeView === 'dashboard' && <DashboardView />}{activeView === 'orders' && <OrdersView />}{activeView === 'shipping' && <ShippingView />}{activeView === 'menu' && <MenuView />}{activeView === 'customers' && <CustomersView />}</>)}
        </main>
        
        {/* Add Product Modal JSX */}
        <div className="modal fade" ref={addModalRef} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Add New Product</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div>
            <div className="modal-body">
              <form onSubmit={handleNewProductSubmit}>
                <div className="mb-3"><label className="form-label">Name</label><input type="text" className="form-control" name="name" value={newProduct.name} onChange={handleNewProductChange} required /></div>
                <div className="mb-3"><label className="form-label">Description</label><textarea className="form-control" name="description" value={newProduct.description} onChange={handleNewProductChange} rows="3"></textarea></div>
                <div className="row">
                  <div className="col-md-6 mb-3"><label className="form-label">Category</label><select className="form-select" name="category" value={newProduct.category} onChange={handleNewProductChange} required><option value="">Select...</option><option value="veg">Veg</option><option value="nonveg">Non-Veg</option><option value="snacks">Snacks</option><option value="drinks">Drinks</option></select></div>
                  <div className="col-md-6 mb-3"><label className="form-label">Price</label><input type="number" className="form-control" name="price" value={newProduct.price} onChange={handleNewProductChange} required min="0" step="0.01" /></div>
                </div>
                <div className="mb-3"><label className="form-label">Product Image</label><input type="file" className="form-control" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} /></div>
                <div className="d-grid"><button type="submit" className="btn btn-primary">Add Product</button></div>
              </form>
            </div>
          </div></div>
        </div>

        {/* Update Product Modal JSX */}
        <div className="modal fade" ref={updateModalRef} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">Update Product</h5><button type="button" className="btn-close" data-bs-dismiss="modal"></button></div>
            <div className="modal-body">
              {productToUpdate && (
                <form onSubmit={handleUpdateProductSubmit}>
                  <div className="mb-3"><label className="form-label">Name</label><input type="text" className="form-control" name="name" value={productToUpdate.name} onChange={handleUpdateProductChange} required /></div>
                  <div className="mb-3"><label className="form-label">Description</label><textarea className="form-control" name="description" value={productToUpdate.description} onChange={handleUpdateProductChange} rows="3"></textarea></div>
                  <div className="row">
                    <div className="col-md-6 mb-3"><label className="form-label">Category</label><select className="form-select" name="category" value={productToUpdate.category} onChange={handleUpdateProductChange} required><option value="">Select...</option><option value="veg">Veg</option><option value="nonveg">Non-Veg</option><option value="snacks">Snacks</option><option value="drinks">Drinks</option></select></div>
                    <div className="col-md-6 mb-3"><label className="form-label">Price</label><input type="number" className="form-control" name="price" value={productToUpdate.price} onChange={handleUpdateProductChange} required min="0" step="0.01" /></div>
                  </div>
                  <div className="mb-3"><label className="form-label">Product Image</label><input type="file" className="form-control" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} /><small className="text-muted">Current: {productToUpdate.imageUrl}</small></div>
                  <div className="d-grid"><button type="submit" className="btn btn-primary">Update Product</button></div>
                </form>
              )}
            </div>
          </div></div>
        </div>

        {/* Send Notification Modal */}
        <div className="modal fade" id="sendNotificationModal" tabIndex="-1" ref={notifModalRef}>
          <div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header bg-warning text-dark"><h5 className="modal-title"><FaBell className="me-2"/>Send Notification</h5><button type="button" className="btn-close" onClick={() => notifModalInstance?.hide()}></button></div><div className="modal-body"><form onSubmit={handleSendNotification}><div className="mb-3"><label className="form-label">To User ID</label><input type="text" className="form-control bg-light" name="userId" value={notificationForm.userId} readOnly/></div><div className="mb-3"><label className="form-label">Notification Title</label><input type="text" className="form-control" name="title" value={notificationForm.title} onChange={handleNotificationChange} required placeholder="e.g. Special Offer!"/></div><div className="mb-3"><label className="form-label">Message</label><textarea className="form-control" name="message" value={notificationForm.message} onChange={handleNotificationChange} required rows="3" placeholder="Type your message here..."></textarea></div><button type="submit" className="btn btn-warning w-100 fw-bold">Send Notification</button></form></div></div></div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;