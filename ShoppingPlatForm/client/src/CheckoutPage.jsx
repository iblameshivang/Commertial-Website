import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PriceDetails from './PriceDetails';
import { useCart } from './CartContext';
import { API_BASE, resolveImageUrl } from './config';
import { formatCurrency } from './format';

const ADDRESS_KEY = 'ecommerce-demo-address';

const EMPTY_ADDRESS = {
  customer_name: '',
  phone: '',
  email: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  pincode: '',
};

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const readSavedAddress = () => {
  try {
    const storedValue = localStorage.getItem(ADDRESS_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : null;
    return parsed && typeof parsed === 'object' ? { ...EMPTY_ADDRESS, ...parsed } : EMPTY_ADDRESS;
  } catch (err) {
    return EMPTY_ADDRESS;
  }
};

// Mirrors validateAddress() in server/index.js so users see problems before submitting.
const validateAddress = address => {
  const errors = {};

  if (!address.customer_name.trim()) {
    errors.customer_name = 'Full name is required.';
  }

  if (!/^[6-9]\d{9}$/.test(address.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }

  if (address.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) {
    errors.email = 'Enter a valid email address, or leave it blank.';
  }

  if (!address.address_line1.trim()) {
    errors.address_line1 = 'Address is required.';
  }

  if (!address.city.trim()) {
    errors.city = 'City is required.';
  }

  if (!address.state.trim()) {
    errors.state = 'Please select your state.';
  }

  if (!/^\d{6}$/.test(address.pincode.trim())) {
    errors.pincode = 'Enter a valid 6-digit pincode.';
  }

  return errors;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    items,
    cartCount,
    subtotal,
    deliveryFee,
    appliedPromo,
    total,
    freeDeliveryRemaining,
    clearCart,
    revalidateCart,
  } = useCart();

  const [address, setAddress] = useState(readSavedAddress);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Guarded on orderPlaced: clearCart() empties the cart right before we navigate away,
  // and without the flag this would bounce the user to the home page instead.
  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/', { replace: true });
    }
  }, [items.length, orderPlaced, navigate]);

  const orderItems = useMemo(
    () => items.map(item => ({ product_id: item.id, quantity: item.quantity })),
    [items]
  );

  const handleChange = event => {
    const { name, value } = event.target;
    setAddress(previous => ({ ...previous, [name]: value }));
    setFieldErrors(previous => ({ ...previous, [name]: '' }));
    setSubmitError('');
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const errors = validateAddress(address);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitError('Please fix the highlighted fields.');
      return;
    }

    setIsPlacingOrder(true);
    setSubmitError('');

    try {
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...address,
          phone: address.phone.replace(/[\s-]/g, ''),
          payment_method: 'COD',
          items: orderItems,
          promo_code: appliedPromo?.code || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // 404/409 mean the catalogue moved on since this cart was built.
        if (response.status === 409 || response.status === 404) {
          await revalidateCart();
        }
        throw new Error(data.error || 'Unable to place your order. Please try again.');
      }

      try {
        // Only persist non-sensitive address fields — NOT phone or email (PII risk in localStorage)
        const { phone, email, ...safeFields } = address;
        localStorage.setItem(ADDRESS_KEY, JSON.stringify(safeFields));
      } catch (err) {
        // Saving the address for next time is a convenience — never block the order on it.
      }

      setOrderPlaced(true);
      clearCart();
      navigate(`/order-confirmation/${data.order_code}`, { replace: true });
    } catch (err) {
      setSubmitError(err.message || 'Unable to place your order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (items.length === 0) {
    return <p className="info">Redirecting…</p>;
  }

  return (
    <div className="checkout-page">
      <button type="button" className="back-link" onClick={() => navigate('/cart')}>
        ← Back to cart
      </button>

      <h1 className="page-title">Checkout</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <section className="checkout-section">
            <h2>Delivery Address</h2>

            <div className="field-grid">
              <label className="field full-width">
                <span>Full Name *</span>
                <input
                  type="text"
                  name="customer_name"
                  value={address.customer_name}
                  onChange={handleChange}
                  placeholder="e.g. Digvijay Singh"
                  autoComplete="name"
                />
                {fieldErrors.customer_name && <small className="field-error">{fieldErrors.customer_name}</small>}
              </label>

              <label className="field">
                <span>Mobile Number *</span>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                />
                {fieldErrors.phone && <small className="field-error">{fieldErrors.phone}</small>}
              </label>

              <label className="field">
                <span>Email (optional)</span>
                <input
                  type="email"
                  name="email"
                  value={address.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
              </label>

              <label className="field full-width">
                <span>Address (House no., Building, Street) *</span>
                <input
                  type="text"
                  name="address_line1"
                  value={address.address_line1}
                  onChange={handleChange}
                  placeholder="Flat 302, Green Residency, MG Road"
                  autoComplete="address-line1"
                />
                {fieldErrors.address_line1 && <small className="field-error">{fieldErrors.address_line1}</small>}
              </label>

              <label className="field full-width">
                <span>Landmark / Area (optional)</span>
                <input
                  type="text"
                  name="address_line2"
                  value={address.address_line2}
                  onChange={handleChange}
                  placeholder="Near City Hospital"
                  autoComplete="address-line2"
                />
              </label>

              <label className="field">
                <span>City *</span>
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Indore"
                  autoComplete="address-level2"
                />
                {fieldErrors.city && <small className="field-error">{fieldErrors.city}</small>}
              </label>

              <label className="field">
                <span>State *</span>
                <select name="state" value={address.state} onChange={handleChange}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(stateName => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>
                {fieldErrors.state && <small className="field-error">{fieldErrors.state}</small>}
              </label>

              <label className="field">
                <span>Pincode *</span>
                <input
                  type="text"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  placeholder="6-digit pincode"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                />
                {fieldErrors.pincode && <small className="field-error">{fieldErrors.pincode}</small>}
              </label>
            </div>
          </section>

          <section className="checkout-section">
            <h2>Payment Method</h2>
            <label className="payment-option selected">
              <input type="radio" name="payment_method" value="COD" checked readOnly />
              <span>
                <strong>Cash on Delivery</strong>
                <small>Pay with cash when your order arrives.</small>
              </span>
            </label>
            <p className="subtle small-note">Online payment is not enabled on this demo store yet.</p>
          </section>

          {submitError && <p className="status-message error">{submitError}</p>}

          <button type="submit" className="primary-button block-button place-order-button" disabled={isPlacingOrder}>
            {isPlacingOrder ? 'Placing order…' : `Place Order • ${formatCurrency(total)}`}
          </button>
        </form>

        <div className="checkout-aside">
          <section className="order-summary">
            <h2>Order Summary ({cartCount})</h2>
            {items.map(item => (
              <div key={item.id} className="summary-item">
                <img
                  src={resolveImageUrl(item.image)}
                  alt={item.name}
                  onError={event => {
                    event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
                  }}
                />
                <div>
                  <p className="summary-item-name">{item.name}</p>
                  <small className="subtle">Qty {item.quantity} × {formatCurrency(item.price)}</small>
                </div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
          </section>

          <PriceDetails
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            total={total}
            itemCount={cartCount}
            freeDeliveryRemaining={freeDeliveryRemaining}
          />
        </div>
      </div>
    </div>
  );
}
