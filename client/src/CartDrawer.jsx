import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItemRow from './CartItemRow';
import { useCart } from './CartContext';
import { formatCurrency } from './format';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    cartCount,
    subtotal,
    freeDeliveryRemaining,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  useEffect(() => {
    if (!isDrawerOpen) {
      return undefined;
    }

    const handleKeyDown = event => {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) {
    return null;
  }

  const goTo = path => {
    closeDrawer();
    navigate(path);
  };

  return (
    <div className="drawer-backdrop" onClick={closeDrawer} role="presentation">
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        onClick={event => event.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>Shopping Cart {cartCount > 0 && <span className="drawer-count">({cartCount})</span>}</h2>
          <button type="button" className="drawer-close" onClick={closeDrawer} aria-label="Close cart">
            ✕
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p className="drawer-empty-title">Your cart is empty</p>
            <p className="subtle">Browse the store and add a few essentials to get started.</p>
            <button type="button" className="primary-button" onClick={() => goTo('/')}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              {freeDeliveryRemaining > 0 ? (
                <p className="delivery-hint">
                  Add {formatCurrency(freeDeliveryRemaining)} more for <strong>FREE delivery</strong>
                </p>
              ) : (
                <p className="delivery-hint success">🎉 You have unlocked FREE delivery</p>
              )}

              {items.map(item => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                  compact
                />
              ))}
            </div>

            <footer className="drawer-footer">
              <div className="drawer-subtotal">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              <button type="button" className="primary-button block-button" onClick={() => goTo('/checkout')}>
                Proceed to Checkout
              </button>
              <button type="button" className="secondary-button block-button" onClick={() => goTo('/cart')}>
                View Full Cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
