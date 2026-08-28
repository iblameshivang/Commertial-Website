import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CartItemRow from './CartItemRow';
import PriceDetails from './PriceDetails';
import { useCart } from './CartContext';
import { formatCurrency } from './format';

export default function CartPage() {
  const navigate = useNavigate();
  const {
    items,
    cartCount,
    subtotal,
    deliveryFee,
    total,
    freeDeliveryRemaining,
    updateQuantity,
    removeItem,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="empty-state cart-empty-state">
        <h2>Your cart is empty</h2>
        <p className="subtle">Looks like you haven’t added anything yet.</p>
        <Link to="/" className="primary-button inline-button">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        ← Continue shopping
      </button>

      <div className="cart-layout">
        <section className="cart-items-panel">
          <header className="cart-items-header">
            <h2>My Cart ({cartCount})</h2>
          </header>

          {items.map(item => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
            />
          ))}
        </section>

        <PriceDetails
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
          itemCount={cartCount}
          freeDeliveryRemaining={freeDeliveryRemaining}
        >
          <button
            type="button"
            className="primary-button block-button checkout-button"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
        </PriceDetails>
      </div>

      <div className="mobile-checkout-bar">
        <div>
          <small>Total</small>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('/checkout')}>
          Checkout
        </button>
      </div>
    </div>
  );
}
