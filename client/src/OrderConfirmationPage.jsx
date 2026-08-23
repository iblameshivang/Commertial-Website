import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE, resolveImageUrl } from './config';
import { countDaysFromNow, formatCurrency, formatDate, formatDateTime } from './format';

export default function OrderConfirmationPage() {
  const { orderCode } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderCode)}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load this order.');
        }

        setOrder(data);
      } catch (err) {
        setError(err.message || 'Unable to load this order.');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (orderCode) {
      fetchOrder();
    }
  }, [orderCode]);

  if (loading) {
    return <p className="info">Loading your order…</p>;
  }

  if (error || !order) {
    return (
      <div className="empty-state">
        <h2>Order not found</h2>
        <p>{error || 'We could not find an order with that ID.'}</p>
        <Link to="/" className="primary-button inline-button">Back to store</Link>
      </div>
    );
  }

  const daysToDelivery = countDaysFromNow(order.expected_delivery_at);

  return (
    <div className="confirmation-page">
      <section className="confirmation-hero">
        <div className="confirmation-tick" aria-hidden="true">✓</div>
        <h1>Order Confirmed!</h1>
        <p className="subtle">
          Thank you, {order.customer_name.split(' ')[0]}. Your order has been placed successfully.
        </p>
      </section>

      <section className="confirmation-highlights">
        <div className="highlight-card">
          <small>Order ID</small>
          <strong className="order-code">{order.order_code}</strong>
        </div>
        <div className="highlight-card">
          <small>Order Date</small>
          <strong>{formatDateTime(order.ordered_at)}</strong>
        </div>
        <div className="highlight-card accent">
          <small>Expected Delivery</small>
          <strong>{formatDate(order.expected_delivery_at)}</strong>
          {daysToDelivery !== null && (
            <span className="delivery-eta">
              {daysToDelivery === 0 ? 'Arriving today' : `in about ${daysToDelivery} ${daysToDelivery === 1 ? 'day' : 'days'}`}
            </span>
          )}
        </div>
      </section>

      <div className="confirmation-layout">
        <section className="confirmation-panel">
          <h2>Items in this order ({order.items.length})</h2>
          {order.items.map(item => (
            <div key={item.id} className="summary-item">
              <img
                src={resolveImageUrl(item.image_url)}
                alt={item.product_name}
                onError={event => {
                  event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
                }}
              />
              <div>
                <p className="summary-item-name">{item.product_name}</p>
                <small className="subtle">Qty {item.quantity} × {formatCurrency(item.unit_price)}</small>
              </div>
              <strong>{formatCurrency(item.line_total)}</strong>
            </div>
          ))}
        </section>

        <div className="confirmation-side">
          <section className="confirmation-panel">
            <h2>Delivery Address</h2>
            <address className="delivery-address">
              <span className="address-name">{order.customer_name}</span>
              <span>{order.address_line1}</span>
              {order.address_line2 ? <span>{order.address_line2}</span> : null}
              <span>{order.city}, {order.state} – {order.pincode}</span>
              <span>📞 {order.phone}</span>
              {order.email ? <span>✉ {order.email}</span> : null}
            </address>
          </section>

          <section className="confirmation-panel">
            <h2>Payment Summary</h2>
            <div className="price-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="price-row">
              <span>Delivery Charges</span>
              {order.delivery_fee === 0
                ? <span className="free-tag">FREE</span>
                : <span>{formatCurrency(order.delivery_fee)}</span>}
            </div>
            <div className="price-row total">
              <span>Total Paid</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <p className="payment-mode">
              Payment Mode: <strong>{order.payment_method === 'COD' ? 'Cash on Delivery' : order.payment_method}</strong>
            </p>
            <p className="order-status">
              Status: <span className="status-pill">{order.status}</span>
            </p>
          </section>
        </div>
      </div>

      <div className="confirmation-actions">
        <Link to="/" className="primary-button inline-button">Continue Shopping</Link>
        <p className="subtle small-note">
          Save your Order ID <strong>{order.order_code}</strong> — you can revisit this page anytime to track it.
        </p>
      </div>
    </div>
  );
}
