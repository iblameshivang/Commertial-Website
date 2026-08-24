import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Phone, Mail, MapPin, Package, ArrowRight, ShieldCheck } from 'lucide-react';
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
        const json = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(json.error || json.message || 'Unable to load this order.');
        }

        setOrder(json.data || json);
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
    return <p className="info">Loading order verification…</p>;
  }

  if (error || !order) {
    return (
      <div className="empty-state">
        <h2>Order not found</h2>
        <p>{error || 'We could not find an order with that reference.'}</p>
        <Link to="/" className="primary-button inline-button">Back to store</Link>
      </div>
    );
  }

  const daysToDelivery = countDaysFromNow(order.expected_delivery_at);

  return (
    <div className="confirmation-page">
      <section className="confirmation-hero">
        <div className="confirmation-tick" aria-hidden="true">
          <Check size={28} strokeWidth={2.5} />
        </div>
        <h1>Order Confirmed</h1>
        <p className="subtle">
          Thank you, {order.customer_name?.split(' ')[0] || 'Client'}. Your order has been placed into atelier preparation.
        </p>
      </section>

      <section className="confirmation-highlights">
        <div className="highlight-card">
          <small>Order Reference</small>
          <strong className="order-code">{order.order_code}</strong>
        </div>
        <div className="highlight-card">
          <small>Date & Time</small>
          <strong>{formatDateTime(order.ordered_at)}</strong>
        </div>
        <div className="highlight-card accent">
          <small>Expected White-Glove Delivery</small>
          <strong>{formatDate(order.expected_delivery_at)}</strong>
          {daysToDelivery !== null && (
            <span className="delivery-eta">
              {daysToDelivery === 0 ? 'Arriving today' : `in approx. ${daysToDelivery} ${daysToDelivery === 1 ? 'day' : 'days'}`}
            </span>
          )}
        </div>
      </section>

      <div className="confirmation-layout">
        <section className="confirmation-panel">
          <h2>Items Reserved ({order.items?.length || 0})</h2>
          {order.items?.map(item => (
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="var(--color-sage)" />
                {order.phone}
              </span>
              {order.email ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="var(--color-sage)" />
                  {order.email}
                </span>
              ) : null}
            </address>
          </section>

          <section className="confirmation-panel">
            <h2>Payment & Settlement</h2>
            <div className="price-row">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="price-row">
              <span>White-Glove Shipping</span>
              {order.delivery_fee === 0
                ? <span className="free-tag">Complimentary</span>
                : <span>{formatCurrency(order.delivery_fee)}</span>}
            </div>
            <div className="price-row total">
              <span>Total Amount</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
            <p className="payment-mode">
              Payment Method: <strong>{order.payment_method === 'COD' ? 'Cash on Delivery (COD)' : order.payment_method}</strong>
            </p>
            <p className="order-status">
              Atelier Status: <span className="status-pill">{order.status}</span>
            </p>
          </section>
        </div>
      </div>

      <div className="confirmation-actions">
        <Link to="/" className="primary-button inline-button">
          <span>Continue Exploring</span>
          <ArrowRight size={16} />
        </Link>
        <p className="subtle small-note">
          Save your Order Reference <strong>{order.order_code}</strong> to track your shipment with our private concierge.
        </p>
      </div>
    </div>
  );
}
