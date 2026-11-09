import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from './CartContext';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cartItems, clearCart, totalAmount } = useCart();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [message, setMessage] = useState('Verifying your payment transaction with PhonePe. Please wait...');
  const [countdown, setCountdown] = useState(5);

  const orderId = searchParams.get('orderId');
  const transactionId = searchParams.get('transactionId');

  const SERVICE_ID = 'service_o1fbb8a';
  const TEMPLATE_ID = 'template_uy7nn2j';
  const PUBLIC_KEY = 'QT4vFNSyQjWyMeDEz';

  useEffect(() => {
    if (!transactionId || !orderId) {
      setStatus('failed');
      setMessage('Invalid transaction details. Missing orderId or transactionId.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/orders/payment/status/${transactionId}`);
        if (!res.ok) {
          throw new Error('Failed to verify payment status with backend');
        }

        const data = await res.json();
        if (data.success) {
          const statusUpdateRes = await fetch(`http://localhost:8080/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'ACCEPTED' })
          });

          if (!statusUpdateRes.ok) {
            throw new Error('Failed to update order status to ACCEPTED');
          }

          const storedAddress = JSON.parse(localStorage.getItem('checkout_address') || '{}');
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userEmail = storedUser.email || '';
          
          const templateParams = {
            user_email: userEmail,
            order_id: 'TB' + Date.now(),
            payment_method: 'PHONEPE PREPROD GATEWAY',
            customer_name: storedAddress.fullName || storedUser.name || 'Customer',
            delivery_address: `${storedAddress.streetAddress || ''}, ${storedAddress.city || ''}, ${storedAddress.state || ''} - ${storedAddress.zipCode || ''}`,
            customer_phone: storedAddress.phone || '',
            orders: cartItems.map((item) => ({
              name: item.name,
              price: item.price.toFixed(2),
              units: item.quantity,
            })),
            cost: {
              subtotal: totalAmount.toFixed(2),
              tax: '1.00',
              shipping: '1.00',
              discount: '0.00',
              total: (totalAmount + 2.00).toFixed(2),
            }
          };

          try {
            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
          } catch (emailErr) {
            console.error("Email send error:", emailErr);
          }

          setStatus('success');
          setMessage('Payment verified successfully! Your order has been placed.');
          clearCart();
          localStorage.removeItem('cartItems');
          localStorage.removeItem('checkout_address');
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment was not authorized or has failed.');
        }
      } catch (err) {
        console.error("Payment callback error:", err);
        setStatus('failed');
        setMessage('An error occurred while verifying the payment: ' + err.message);
      }
    };

    verifyPayment();
  }, [transactionId, orderId]);

  useEffect(() => {
    if (status !== 'verifying' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status !== 'verifying' && countdown === 0) {
      if (status === 'success') {
        navigate('/user/orders');
      } else {
        navigate('/user/cart');
      }
    }
  }, [status, countdown, navigate]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light p-4 text-center">
      <div className="card shadow border-0 p-5 rounded-4" style={{ maxWidth: '480px', width: '100%' }}>
        <div className="mb-4" style={{ backgroundColor: '#5f259f', padding: '15px', borderRadius: '12px 12px 0 0', margin: '-48px -48px 40px -48px' }}>
          <h3 className="text-white fw-bold mb-0">PhonePe Payment Gateway</h3>
        </div>

        {status === 'verifying' && (
          <div className="py-4">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3.5rem', height: '3.5rem', borderWidth: '5px' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h5 className="fw-bold text-dark">{message}</h5>
            <p className="text-muted small mt-2">Please do not click refresh or close this window.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <FaCheckCircle className="text-success mb-3" size={60} />
            <h4 className="fw-bold text-success">Payment Confirmed!</h4>
            <p className="text-dark my-3">{message}</p>
            <p className="text-muted small mt-3">Redirecting to My Orders in {countdown} seconds...</p>
          </div>
        )}

        {status === 'failed' && (
          <div className="py-4">
            <FaTimesCircle className="text-danger mb-3" size={60} />
            <h4 className="fw-bold text-danger">Payment Failed</h4>
            <p className="text-dark my-3">{message}</p>
            <p className="text-muted small mt-3">Redirecting back to Cart in {countdown} seconds...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallback;
