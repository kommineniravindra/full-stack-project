import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import './CartPage.css';
import QRCode from 'react-qr-code';
import { FaLock, FaQrcode, FaCreditCard, FaChevronDown, FaChevronUp, FaClipboardList, FaEnvelope, FaMoneyBillWave } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const debounce = (func, delay) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

const CartPage = () => {
  const {
    cartItems,
    updateQuantity: originalUpdateQuantity,
    removeFromCart: originalRemoveFromCart,
    totalAmount,
    clearCart,
    addToCart
  } = useCart();

  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [visibleSection, setVisibleSection] = useState('');
  const [isBillSummaryOpen, setIsBillSummaryOpen] = useState(true);
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(true);

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const [quantityAnimatingItemId, setQuantityAnimatingItemId] = useState(null);

  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const customerEmail = storedUser.email || '';
  const [userEmail, setUserEmail] = useState(customerEmail);
  const showEmailInput = !customerEmail;

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [upiPaidCheckbox, setUpiPaidCheckbox] = useState(false);
  const [fullName, setFullName] = useState(storedUser.name || '');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [showPhonePeModal, setShowPhonePeModal] = useState(false);
  const [phonePeStatus, setPhonePeStatus] = useState('initiate');
  const [phonePePin, setPhonePePin] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);

  const shippingCost = 1;
  const taxCost = 1;

  const discountAmount = (totalAmount * discount) / 100;
  const estimatedTotalNum = totalAmount - discountAmount + shippingCost + taxCost;
  const estimatedTotal = estimatedTotalNum.toFixed(2);


  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const proceedToAddress = () => {
    if (!userEmail || !validateEmail(userEmail)) {
      toast.error("Please enter a valid email address.", { position: "top-right" });
      return;
    }
    setCheckoutStep(2);
  };

  const proceedToPayment = () => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name.", { position: "top-right" });
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      toast.error("Please enter a valid phone number (at least 10 digits).", { position: "top-right" });
      return;
    }
    if (!streetAddress.trim()) {
      toast.error("Please enter your street address.", { position: "top-right" });
      return;
    }
    if (!city.trim()) {
      toast.error("Please enter your city.", { position: "top-right" });
      return;
    }
    if (!state.trim()) {
      toast.error("Please enter your state.", { position: "top-right" });
      return;
    }
    if (!zipCode.trim() || zipCode.trim().length < 5) {
      toast.error("Please enter a valid zip code.", { position: "top-right" });
      return;
    }
    setCheckoutStep(3);
  };

  const isPaymentValid = () => {
    if (visibleSection === 'cod') {
      return true;
    }
    if (visibleSection === 'qr') {
      return upiPaidCheckbox;
    }
    if (visibleSection === 'card') {
      return cardNumber.length === 19 && cardHolder.trim() !== '' && expiryDate.length === 5;
    }
    return false;
  };

  const getLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.", { position: "top-right" });
      return;
    }

    toast.info("Fetching your location...", { position: "top-right", autoClose: 2000 });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (res.data && res.data.address) {
            const addr = res.data.address;
            
            const road = addr.road || '';
            const suburb = addr.suburb || addr.neighbourhood || '';
            const county = addr.county || '';
            const fullStreet = [suburb, road, county].filter(Boolean).join(', ');
            
            setStreetAddress(fullStreet || res.data.display_name || '');
            setCity(addr.city || addr.town || addr.village || '');
            setState(addr.state || '');
            setZipCode(addr.postcode || '');
            
            toast.success("Location auto-filled successfully!", { position: "top-right" });
          } else {
            toast.error("Failed to parse address details.", { position: "top-right" });
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Failed to retrieve address details.", { position: "top-right" });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Permission denied or failed to retrieve coordinates.", { position: "top-right" });
      }
    );
  };

  const SERVICE_ID = 'service_o1fbb8a';
  const TEMPLATE_ID = 'template_uy7nn2j';
  const PUBLIC_KEY = 'QT4vFNSyQjWyMeDEz';

  const getRandomConfettiColor = () => {
    const colors = ['#ff6f61', '#ffc107', '#4caf50', '#2196f3', '#9c27b0', '#f9a825', '#e65100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const debouncedUpdateQuantityAPI = useRef(
    debounce(async (itemId, newQuantity) => {
      console.log(`API Call: Updated quantity for item ${itemId} to ${newQuantity}`);
      toast.success(`Quantity for item updated!`, {
        position: "top-left", autoClose: 1000, hideProgressBar: true
      });
      setQuantityAnimatingItemId(null);
    }, 300)
  ).current;

  const updateQuantity = useCallback((itemId, newQuantityValue) => {
    const currentItem = cartItems.find(item => item.id === itemId);
    if (!currentItem) return;

    const oldQuantity = currentItem.quantity;
    const newQuantity = parseInt(newQuantityValue);

    if (newQuantity < 1) return;

    originalUpdateQuantity(itemId, newQuantity - oldQuantity);
    setQuantityAnimatingItemId(itemId);
    debouncedUpdateQuantityAPI(itemId, newQuantity);
  }, [cartItems, originalUpdateQuantity, debouncedUpdateQuantityAPI]);

  const removeFromCart = useCallback((itemId) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    if (!itemToRemove) return;

    const itemElement = document.getElementById(`cart-item-${itemId}`);
    if (itemElement) {
        itemElement.classList.add('removing');
        itemElement.addEventListener('animationend', () => {
            originalRemoveFromCart(itemId);
            toast.error(`${itemToRemove.name} removed from cart`, {
                position: "top-right", autoClose: 2000, hideProgressBar: true
            });
        }, { once: true });
    } else {
        originalRemoveFromCart(itemId);
        toast.error(`${itemToRemove.name} removed from cart`, {
            position: "top-right", autoClose: 2000, hideProgressBar: true
        });
    }
    console.log(`API Call: Removed item ${itemId}`);
  }, [cartItems, originalRemoveFromCart]);

  const applyDiscount = (percentage) => {
    setDiscount(percentage);
    setPromoCodeInput(''); // Clear text input
    toast.success(`${percentage}% discount applied!`, {
        position: "top-right", autoClose: 2000, hideProgressBar: true
    });
  };

  const handlePromoCodeSubmit = () => {
    const code = promoCodeInput.toUpperCase();
    let newDiscount = 0;
    if (code === 'RAVI10') {
      newDiscount = 10;
    } else if (code === 'RAVI20') {
      newDiscount = 20;
    } else if (code === 'RAVI30') {
      newDiscount = 30;
    }

    if (newDiscount > 0) {
      setDiscount(newDiscount);
      toast.success(`Promo code "${code}" applied! You got ${newDiscount}% off.`, {
        position: "top-right", autoClose: 2000, hideProgressBar: true
      });
    } else {
      setDiscount(0);
      toast.warn('Invalid promo code.', {
        position: "top-right", autoClose: 2000, hideProgressBar: true
      });
    }
  };

  const freeShippingThreshold = 200;
  const remainingForFreeShipping = freeShippingThreshold - totalAmount;
  const freeShippingProgress = Math.min(100, (totalAmount / freeShippingThreshold) * 100);

  const handleCheckout = async () => {
    if (!token) {
      toast.error('Login session expired. Please log in again.', { position: "top-right" });
      navigate('/login');
      return;
    }

    if (!userEmail || userEmail.trim() === '') {
        toast.error('Please enter your email to receive order details.', { position: "top-right" });
        return;
    }
    
    if (visibleSection === '') {
        toast.error('Please select a payment method.', { position: "top-right" });
        return;
    }

    if (visibleSection === 'card' && (cardNumber.length !== 19 || cardHolder.trim() === '' || expiryDate.length !== 5)) {
        toast.error('Please fill in valid card details.', { position: "top-right" });
        return;
    }

    setIsCheckingOut(true);

    try {
      const response = await fetch('http://localhost:8080/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cartItems: cartItems.map((item) => ({
            productName: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          totalAmount: estimatedTotalNum,
          status: "PENDING",
          paymentMethod: visibleSection.toUpperCase()
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Checkout failed');
      }

      const resText = await response.text();
      let orderData;
      try {
        orderData = JSON.parse(resText);
      } catch (e) {
        console.error("Failed to parse backend order response as JSON. Received response:", resText);
        throw new Error("Backend did not return a valid JSON order object. Please RESTART the Spring Boot order-service backend project to load the new controller changes.");
      }
      setCreatedOrder(orderData);

      if (visibleSection === 'cod') {
        try {
          await fetch(`http://localhost:8080/api/orders/${orderData.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'ACCEPTED' })
          });
        } catch (statusErr) {
          console.error("Failed to auto-accept COD order status:", statusErr);
        }

        const templateParams = {
          user_email: userEmail,
          order_id: 'TB' + Date.now(),
          payment_method: 'CASH ON DELIVERY (COD)',
          customer_name: fullName,
          delivery_address: `${streetAddress}, ${city}, ${state} - ${zipCode}`,
          customer_phone: phone,
          orders: cartItems.map((item) => ({
            name: item.name,
            price: item.price.toFixed(2),
            units: item.quantity,
          })),
          cost: {
            subtotal: totalAmount.toFixed(2),
            tax: taxCost.toFixed(2),
            shipping: shippingCost.toFixed(2),
            discount: discountAmount.toFixed(2),
            total: estimatedTotal,
          }
        };

        try {
          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }

        clearCart();
        localStorage.removeItem('cartItems');
        setIsCheckedOut(true);
        setCheckoutSuccess(true);
        setCountdown(5);
        toast.success('Order placed successfully! Check your email.', { position: "top-right", autoClose: 3000 });
      } else {
        toast.info("Connecting to PhonePe Secure Gateway...", { position: "top-right" });
        const payRes = await fetch(`http://localhost:8080/api/orders/payment/initiate/${orderData.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!payRes.ok) {
          throw new Error('Failed to initiate PhonePe payment transaction');
        }

        const payData = await payRes.json();
        if (payData.success && payData.redirectUrl) {
          localStorage.setItem('checkout_address', JSON.stringify({
            fullName,
            phone,
            streetAddress,
            city,
            state,
            zipCode
          }));
          toast.success("Redirecting to PhonePe Payment Gateway...", { position: "top-right", autoClose: 1500 });
          setTimeout(() => {
            window.location.href = payData.redirectUrl;
          }, 1500);
        } else {
          throw new Error(payData.message || 'Payment initiation failed');
        }
      }
    } catch (err) {
      console.error('Checkout Error:', err);
      toast.error('Checkout failed. Please try again.', { position: "top-right" });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const submitPhonePePin = () => {
    if (phonePePin.length !== 4) return;
    setPhonePeStatus('authorizing');

    setTimeout(async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/orders/${createdOrder.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'ACCEPTED' })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update status on payment confirmation');
        }

        const templateParams = {
          user_email: userEmail,
          order_id: 'TB' + Date.now(),
          payment_method: `${visibleSection.toUpperCase()} (VIA PHONEPE)`,
          customer_name: fullName,
          delivery_address: `${streetAddress}, ${city}, ${state} - ${zipCode}`,
          customer_phone: phone,
          orders: cartItems.map((item) => ({
            name: item.name,
            price: item.price.toFixed(2),
            units: item.quantity,
          })),
          cost: {
            subtotal: totalAmount.toFixed(2),
            tax: taxCost.toFixed(2),
            shipping: shippingCost.toFixed(2),
            discount: discountAmount.toFixed(2),
            total: estimatedTotal,
          }
        };

        try {
          await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }

        setPhonePeStatus('success');

        setTimeout(() => {
          setShowPhonePeModal(false);
          clearCart();
          localStorage.removeItem('cartItems');
          setIsCheckedOut(true);
          setCheckoutSuccess(true);
          setCountdown(5);
        }, 2500);

      } catch (err) {
        console.error("PhonePe simulation payment failure:", err);
        setPhonePeStatus('failed');
        toast.error("Payment authorization failed. Please try again.", { position: "top-right" });
        setTimeout(() => {
          setShowPhonePeModal(false);
        }, 2000);
      }
    }, 2500);
  };

  useEffect(() => {
    if (isCheckedOut && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCheckedOut && countdown === 0) {
      navigate('/user/orders');
    }
  }, [isCheckedOut, countdown, navigate]);

  const toggleSection = (section) => {
    setVisibleSection((prev) => (prev === section ? '' : section));
    setUpiPaidCheckbox(false);
  };

  const toggleBillSummary = () => {
    setIsBillSummaryOpen((prev) => !prev);
  };

  const toggleEmailSection = () => {
    setIsEmailSectionOpen((prev) => !prev);
  };

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(value);
  };

  const handleExpiryDateChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiryDate(value);
  };

  return (
    <div className="cart-container-template">
      <h2 className="my-cart-heading">My Cart ({cartItems.length})</h2>

      {isCheckedOut || cartItems.length === 0 ? (
        <>
          <div className="empty-cart-animation">
            <div className="cart-loader">
              <svg viewBox="0 0 24 24" className="animated-cart-svg">
                <path
                  fill="none"
                  stroke="#ffb300"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.3 5.3a1 1 0 0 0 .98 1.2h11.64M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
                />
              </svg>
            </div>
            <p>{isCheckedOut ? 'Your order has been placed successfully!' : 'Your cart is empty.'}</p>
            {checkoutSuccess && (
              <div className="checkout-success">
                <div className="success-animation">
                 <div className="checkmark-circle">
                <div className="background"></div>
                <div className="checkmark"></div>
                </div>

                  <h3>Checkout Successful!</h3>
                  <p className="countdown-text">Redirecting in {countdown} seconds...</p>
                  <div className="confetti-container">
                    {[...Array(150)].map((_, i) => (
                      <div
                        key={i}
                        className="confetti-piece"
                        style={{
                          '--rand-x': (Math.random() * 2 - 1).toFixed(2),
                          '--rand-y': (Math.random() * 2 - 1).toFixed(2),
                          '--rand-rot': (Math.random() * 2 - 1).toFixed(2),
                          backgroundColor: getRandomConfettiColor(),
                          animationDelay: `${Math.random() * 0.8}s`,
                          animationDuration: `${2 + Math.random() * 1.5}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="cart-empty-actions">
            <button onClick={() => navigate('/user/home')} className="continue-shopping-btn">Continue Shopping</button>
            <button onClick={() => navigate('/user/orders')} className="view-orders-btn">View Orders</button>
          </div>
        </>
      ) : (
        <>
          {/* Checkout Steps Progress Bar */}
          <div className="checkout-steps-bar shadow-sm">
            <div className={`step-item ${checkoutStep >= 1 ? 'active' : ''} ${checkoutStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">{checkoutStep > 1 ? '✓' : '1'}</div>
              <div className="step-label">Cart Summary</div>
            </div>
            <div className={`step-connector ${checkoutStep > 1 ? 'active' : ''}`}></div>
            <div className={`step-item ${checkoutStep >= 2 ? 'active' : ''} ${checkoutStep > 2 ? 'completed' : ''}`}>
              <div className="step-number">{checkoutStep > 2 ? '✓' : '2'}</div>
              <div className="step-label">Shipping Address</div>
            </div>
            <div className={`step-connector ${checkoutStep > 2 ? 'active' : ''}`}></div>
            <div className={`step-item ${checkoutStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Payment Options</div>
            </div>
          </div>

          <div className="cart-content-template">
            <div className="cart-main-column">
              {checkoutStep === 1 && (
                <>
                  <table className="cart-items-table">
                    <thead>
                      <tr>
                        <th className="item-header"></th>
                        <th className="each-header">Each</th>
                        <th className="quantity-header">Quantity</th>
                        <th className="total-header">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} id={`cart-item-${item.id}`} className={quantityAnimatingItemId === item.id ? 'quantity-pulsing' : ''}>
                          <td className="item-details-cell">
                            <img
                              src={`http://localhost:8080${item.imageUrl}`}
                              alt={item.name}
                              className="item-image-template"
                              onError={(e) => { e.target.src = '/fallback.jpg'; }}
                            />
                            <div className="item-info-template">
                              <div className="item-name-template">{item.name}</div>
                              {item.category && <div className="item-category-template">Category: {item.category}</div>}
                              <div className="item-status-template">In Stock</div>
                              <div className="item-actions">
                                <button className="item-action-btn item-action-edit">Edit</button>
                                <button className="item-action-btn item-action-remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                                <button className="item-action-btn item-action-wishlist">Move to Wishlist</button>
                                <button className="item-action-btn item-action-save-later">Save for Later</button>
                              </div>
                            </div>
                          </td>
                          <td className="item-price-cell">
                            ₹{item.price.toFixed(2)}
                          </td>
                          <td className="item-quantity-cell">
                            <div className="quantity-controls-template">
                              <select
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                              >
                                {[...Array(25).keys()].map(num => (
                                  <option key={num + 1} value={num + 1}>{num + 1}</option>
                                ))}
                              </select>
                              <span className="dropdown-arrow"></span>
                            </div>
                          </td>
                          <td className="item-total-cell">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="cart-items-summary-bottom">
                      <span className="items-count">{cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}</span>
                      <span className="cart-subtotal-bottom">₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <button className="clear-cart-btn" onClick={clearCart}>Clear All Items</button>
                </>
              )}

              {checkoutStep === 2 && (
                <div className="address-form-container">
                  <div className="d-flex justify-content-between align-items-center mb-1 flex-wrap gap-2">
                    <h4 className="checkout-step-title mb-0">Shipping Details</h4>
                    <button 
                      className="btn btn-sm btn-outline-warning fw-bold d-flex align-items-center gap-1" 
                      onClick={getLiveLocation} 
                      type="button"
                      style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '20px' }}
                    >
                      📍 Use Live Location
                    </button>
                  </div>
                  <p className="checkout-step-subtitle">Please enter the delivery address for your order.</p>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted">FULL NAME</label>
                      <input
                        type="text"
                        className="form-control address-input-field"
                        placeholder="e.g., John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted">PHONE NUMBER</label>
                      <input
                        type="tel"
                        className="form-control address-input-field"
                        placeholder="e.g., 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small text-muted">STREET ADDRESS</label>
                      <input
                        type="text"
                        className="form-control address-input-field"
                        placeholder="e.g., Flat No. 102, Shanti Vihar"
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small text-muted">CITY</label>
                      <input
                        type="text"
                        className="form-control address-input-field"
                        placeholder="e.g., Hyderabad"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-bold small text-muted">STATE</label>
                      <input
                        type="text"
                        className="form-control address-input-field"
                        placeholder="e.g., Telangana"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <label className="form-label fw-bold small text-muted">ZIP / PIN CODE</label>
                      <input
                        type="text"
                        className="form-control address-input-field"
                        placeholder="e.g., 500081"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="payment-options-container">
                  <h4 className="checkout-step-title mb-3">Select Payment Method</h4>
                  
                  {/* UPI/QR Code Payment Option */}
                  <div className={`payment-method-panel ${visibleSection === 'qr' ? 'active' : ''}`}>
                      <div className="panel-header" onClick={() => toggleSection('qr')}>
                          <FaQrcode className="panel-icon" />
                          <span>Pay with UPI/QR Code</span>
                          {visibleSection === 'qr' ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {visibleSection === 'qr' && (
                          <div className="panel-content qr-code-section">
                              <h4>Scan to Pay ₹{estimatedTotal}</h4>
                              <QRCode
                                  value={`upi://pay?pa=9603262008@ybl&pn=TASTYBITE'S&am=${estimatedTotal}&cu=INR`}
                                  size={120}
                              />
                              <div className="upi-id-wrapper">
                                  <span className="upi-id-text">UPI ID: 9603262008@ybl</span>
                                  <button className="copy-btn-reintegrated" onClick={() => {
                                      navigator.clipboard.writeText('9603262008@ybl');
                                      toast.success('UPI ID copied!', { position: "top-right", autoClose: 2000, hideProgressBar: true });
                                  }}>
                                      Copy
                                  </button>
                              </div>
                              <div className="form-check mt-3 d-flex justify-content-center align-items-center gap-2">
                                  <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id="upiPaidCheckbox"
                                      checked={upiPaidCheckbox}
                                      onChange={(e) => setUpiPaidCheckbox(e.target.checked)}
                                      style={{ cursor: 'pointer', width: '18px', height: '18px', borderColor: '#ffc107' }}
                                  />
                                  <label className="form-check-label text-dark fw-bold" htmlFor="upiPaidCheckbox" style={{ cursor: 'pointer', fontSize: '13px' }}>
                                      I have completed the payment successfully
                                  </label>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Card Payment Option */}
                  <div className={`payment-method-panel ${visibleSection === 'card' ? 'active' : ''}`}>
                      <div className="panel-header" onClick={() => toggleSection('card')}>
                          <FaCreditCard className="panel-icon" />
                          <span>Pay with Credit/Debit Card</span>
                          {visibleSection === 'card' ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {visibleSection === 'card' && (
                          <div className="panel-content card-payment-form-reintegrated">
                              <div>
                                  <label className="card-input-label">Card Number</label>
                                  <input
                                      className="card-number-input"
                                      placeholder="XXXX XXXX XXXX XXXX"
                                      maxLength="19"
                                      value={cardNumber}
                                      onChange={handleCardNumberChange}
                                  />
                              </div>
                              <div className="card-info-group">
                                  <div>
                                      <label className="card-input-label">Card Holder</label>
                                      <input
                                          className="card-holder-input"
                                          placeholder="Name"
                                          value={cardHolder}
                                          onChange={(e) => setCardHolder(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="card-input-label">Expires</label>
                                      <input
                                          className="expiry-date-input"
                                          placeholder="MM/YY"
                                          maxLength="5"
                                          value={expiryDate}
                                          onChange={handleExpiryDateChange}
                                      />
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Cash on Delivery Option */}
                  <div className={`payment-method-panel ${visibleSection === 'cod' ? 'active' : ''}`}>
                      <div className="panel-header" onClick={() => toggleSection('cod')}>
                          <FaMoneyBillWave className="panel-icon" />
                          <span>Cash on Delivery (COD)</span>
                          {visibleSection === 'cod' ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {visibleSection === 'cod' && (
                          <div className="panel-content cod-section">
                              <p>You can pay<span style={{color:'red'}}> ₹ {estimatedTotal}</span> in cash to the delivery agent upon receiving your order.</p>
                          </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="cart-sidebar-column">
              {/* Step 1: Promo Code and Email */}
              {checkoutStep === 1 && (
                <>
                  <div className="promo-code-section">
                    <span className="promo-code-label">ENTER PROMO CODE:</span>
                    <div className="promo-input-group">
                      <input
                        type="text"
                        id="promo-code-input"
                        placeholder="Promo Code"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="promo-code-input"
                        onKeyPress={(e) => { if (e.key === 'Enter') handlePromoCodeSubmit(); }}
                      />
                      <button className="promo-submit-btn" onClick={handlePromoCodeSubmit}>Submit</button>
                    </div>

                    <div className="discount-buttons-container" >
                      <span className="promo-code-label">USE QUICK DISCOUNT:</span>
                      <button className={`discount-btn pct-10 ${discount === 10 ? 'active' : ''}`} onClick={() => applyDiscount(10)}>10% OFF</button>
                      <button className={`discount-btn pct-20 ${discount === 20 ? 'active' : ''}`} onClick={() => applyDiscount(20)}>20% OFF</button>
                      <button className={`discount-btn pct-30 ${discount === 30 ? 'active' : ''}`} onClick={() => applyDiscount(30)}>30% OFF</button>
                      {discount > 0 && <button className="discount-btn clear" onClick={() => setDiscount(0)}>Clear</button>}
                    </div>
                  </div>

                  <div className={`payment-method-panel ${isEmailSectionOpen ? 'active' : ''}`}>
                      <div className="panel-header" onClick={toggleEmailSection}>
                          <FaEnvelope className="panel-icon" />
                          <span>Email for Order Details</span>
                          {isEmailSectionOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </div>
                      {isEmailSectionOpen && (
                          <div className="panel-content">
                              {showEmailInput ? (
                                  <div className="email-input-section">
                                      <p className="email-prompt">Enter your email for order details:</p>
                                      <input
                                          type="email"
                                          value={userEmail}
                                          onChange={(e) => setUserEmail(e.target.value)}
                                          placeholder="e.g., yourname@example.com"
                                          className="email-input-field"
                                      />
                                  </div>
                              ) : (
                                  <div className="email-display-section">
                                      <p className="email-prompt">Order details will be sent to:</p>
                                      <strong className="customer-email-display">{customerEmail}</strong>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
                </>
              )}

              {/* Step 3: Show Address Summary in Sidebar */}
              {checkoutStep === 3 && (
                <div className="shipping-summary-sidebar">
                  <h5 className="sidebar-section-title">Delivery To:</h5>
                  <div className="shipping-summary-card">
                    <div className="fw-bold">{fullName}</div>
                    <div className="text-muted small">{streetAddress}</div>
                    <div className="text-muted small">{city}, {state} - {zipCode}</div>
                    <div className="text-muted small mt-1">Phone: {phone}</div>
                    <button className="btn btn-link btn-sm p-0 text-warning fw-bold text-decoration-none mt-2" onClick={() => setCheckoutStep(2)}>Edit Address</button>
                  </div>
                </div>
              )}

              {/* Bill Summary Panel (Always Visible) */}
              <div className={`payment-method-panel ${isBillSummaryOpen ? 'active' : ''}`}>
                  <div className="panel-header" onClick={toggleBillSummary}>
                      <FaClipboardList className="panel-icon" />
                      <span>Bill Summary</span>
                      {isBillSummaryOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </div>
                  {isBillSummaryOpen && (
                      <div className="panel-content order-summary-details-template">
                          <div className="summary-line">
                              <span className="summary-label">Subtotal</span>
                              <span className="summary-value">₹{totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="summary-line">
                              <span className="summary-label">Shipping cost</span>
                              <span className="summary-value">₹{shippingCost.toFixed(2)}</span>
                          </div>
                          <div className="summary-line">
                              <span className="summary-label">Discount ({discount}%)</span>
                              <span className="summary-value discount-value">-₹{discountAmount.toFixed(2)}</span>
                          </div>
                          <div className="summary-line">
                              <span className="summary-label">Tax</span>
                              <span className="summary-value">₹{taxCost.toFixed(2)}</span>
                          </div>
                          <div className="summary-line estimated-total-line">
                              <span className="summary-label">Estimated Total</span>
                              <span className="summary-value estimated-total-value">₹{estimatedTotal}</span>
                          </div>
                      </div>
                  )}
              </div>

              {/* Free Shipping Alert (Step 1 & 2) */}
              {checkoutStep < 3 && (
                <>
                  {remainingForFreeShipping > 0 ? (
                    <div className="free-shipping-progress-container mt-3">
                        <p className="free-shipping-progress-text">You're ₹{remainingForFreeShipping.toFixed(2)} away from free shipping!</p>
                        <div className="progress-bar-outer">
                            <div className="progress-bar-inner" style={{width: `${freeShippingProgress}%`}}></div>
                        </div>
                    </div>
                  ) : (
                    totalAmount > 0 && (
                      <div className="free-shipping-template green-text mt-3">
                          🎉 You've qualified for FREE shipping!
                      </div>
                    )
                  )}
                </>
              )}

              {/* Action Buttons based on checkoutStep */}
              {checkoutStep === 1 && (
                <button className="checkout-btn-template mt-3" onClick={proceedToAddress}>
                  Proceed to Address
                </button>
              )}

              {checkoutStep === 2 && (
                <div className="d-flex flex-column gap-2 mt-3">
                  <button className="checkout-btn-template" onClick={proceedToPayment}>
                    Proceed to Payment
                  </button>
                  <button className="btn btn-outline-secondary py-2 fw-bold" onClick={() => setCheckoutStep(1)}>
                    Back to Details
                  </button>
                </div>
              )}

              {checkoutStep === 3 && (
                <div className="d-flex flex-column gap-2 mt-3">
                  <button
                    className="checkout-btn-template"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0 || !isPaymentValid()}
                  >
                    {isCheckingOut ? (
                      <>
                        <span className="spinner-template"></span> Processing...
                      </>
                    ) : (
                      <>
                        <FaLock /> Pay & Place Order
                      </>
                    )}
                  </button>
                  <button className="btn btn-outline-secondary py-2 fw-bold" onClick={() => setCheckoutStep(2)}>
                    Back to Address
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showPhonePeModal && (
        <div className="phonepe-modal-overlay">
          <div className="phonepe-modal-card shadow-lg animate-fade-in">
            <div className="phonepe-header">
              <div className="phonepe-logo-text">PhonePe</div>
              <div className="phonepe-secure-badge">🛡️ 100% Secure Payments</div>
            </div>
            
            <div className="phonepe-body text-center">
              <div className="phonepe-txn-details py-3 px-4 mb-4 rounded-3 text-start bg-light border">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Merchant</span>
                  <span className="fw-bold text-dark">TASTY BITES Ltd.</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted small">Order ID</span>
                  <span className="fw-bold text-dark">#{createdOrder?.id}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">Amount</span>
                  <span className="fw-bold text-primary">₹{estimatedTotal}</span>
                </div>
              </div>

              {phonePeStatus === 'initiate' && (
                <div className="phonepe-status-screen animate-fade-in">
                  <div className="phonepe-loader-spinner mb-3"></div>
                  <h5 className="fw-bold text-dark">Connecting to PhonePe Secure Gateway...</h5>
                  <p className="text-muted small">Please do not refresh this page or close the browser.</p>
                </div>
              )}

              {phonePeStatus === 'pin' && (
                <div className="phonepe-status-screen animate-fade-in">
                  <h5 className="fw-bold text-dark mb-3">Enter 4-Digit UPI PIN</h5>
                  <div className="d-flex justify-content-center gap-2 mb-4">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`phonepe-pin-dot ${phonePePin.length > i ? 'filled' : ''}`}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="phonepe-keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        className="phonepe-keypad-btn"
                        onClick={() => {
                          if (phonePePin.length < 4) setPhonePePin(prev => prev + num);
                        }}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      className="phonepe-keypad-btn text-danger fw-bold"
                      onClick={() => setPhonePePin('')}
                    >
                      Clear
                    </button>
                    <button
                      className="phonepe-keypad-btn"
                      onClick={() => {
                        if (phonePePin.length < 4) setPhonePePin(prev => prev + '0');
                      }}
                    >
                      0
                    </button>
                    <button
                      className="phonepe-keypad-btn text-success fw-bold"
                      onClick={submitPhonePePin}
                      disabled={phonePePin.length !== 4}
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}

              {phonePeStatus === 'authorizing' && (
                <div className="phonepe-status-screen animate-fade-in">
                  <div className="phonepe-loader-spinner mb-3"></div>
                  <h5 className="fw-bold text-dark">Authorizing Payment with Bank...</h5>
                  <p className="text-muted small">Verifying transaction details securely.</p>
                </div>
              )}

              {phonePeStatus === 'success' && (
                <div className="phonepe-status-screen animate-fade-in">
                  <div className="phonepe-success-icon-wrapper mb-3">
                    <div className="phonepe-success-circle">
                      <div className="phonepe-success-checkmark"></div>
                    </div>
                  </div>
                  <h4 className="fw-bold text-success">Payment Successful!</h4>
                  <p className="text-muted">₹{estimatedTotal} paid to TASTY BITES</p>
                  <p className="text-muted small mt-2">Redirecting to order confirmation...</p>
                </div>
              )}
            </div>
            
            <div className="phonepe-footer text-center p-3 text-muted small border-top">
              PhonePe UPI Payment Gateway • Powered by Yes Bank
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;