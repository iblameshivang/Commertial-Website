import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Check, ArrowRight, Tag, Trash2 } from 'lucide-react';
import CartItemRow from './CartItemRow';
import { useCart } from './CartContext';
import { formatCurrency } from './format';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    items,
    cartCount,
    subtotal,
    deliveryFee,
    discountAmount,
    appliedPromo,
    total,
    freeDeliveryRemaining,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const handleKeyDown = event => {
      if (event.key === 'Escape') closeDrawer();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const goTo = path => {
    closeDrawer();
    navigate(path);
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    setPromoError('');
    setPromoLoading(true);
    try {
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={closeDrawer} role="presentation">
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        onClick={event => event.stopPropagation()}
      >
        <header className="drawer-header">
          <h2>Shopping Bag {cartCount > 0 && <span className="drawer-count">({cartCount})</span>}</h2>
          <button type="button" className="drawer-close" onClick={closeDrawer} aria-label="Close cart">
            <X size={20} strokeWidth={1.5} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <p className="drawer-empty-title">Your shopping bag is empty</p>
            <p className="subtle">Explore our curated collections to find your next signature piece.</p>
            <button type="button" className="primary-button" onClick={() => goTo('/shop')}>
              Explore Catalogue
            </button>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              {freeDeliveryRemaining > 0 ? (
                <div className="delivery-hint">
                  <Sparkles size={16} color="var(--color-sage)" />
                  <span>Add {formatCurrency(freeDeliveryRemaining)} more for <strong>Complimentary Shipping</strong></span>
                </div>
              ) : (
                <div className="delivery-hint success">
                  <Check size={16} />
                  <span>You have unlocked <strong>Complimentary Express Shipping</strong></span>
                </div>
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

              {/* Promo Code Drawer Form (Feature 4.2) */}
              <div className={`drawer-promo-box ${promoError ? 'drawer-promo-box--error' : ''}`}>
                {appliedPromo ? (
                  <div className="applied-promo-tag">
                    <div className="applied-promo-info">
                      <Tag size={15} />
                      <span>{appliedPromo.code} (-₹{discountAmount})</span>
                    </div>
                    <button type="button" className="remove-promo-btn" onClick={removePromoCode}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="promo-input-row">
                    <input
                      type="text"
                      placeholder="Promo Code (e.g. WINTER30)"
                      value={promoInput}
                      onChange={e => {
                        setPromoInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError('');
                      }}
                    />
                    <button type="submit" disabled={promoLoading || !promoInput.trim()}>
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {promoError && <p className="promo-error-msg">{promoError}</p>}
              </div>
            </div>

            <footer className="drawer-footer">
              <div className="drawer-subtotal">
                <span>Subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
              {discountAmount > 0 && (
                <div className="drawer-subtotal" style={{ color: 'var(--color-ballet-slipper)' }}>
                  <span>Discount</span>
                  <strong>-{formatCurrency(discountAmount)}</strong>
                </div>
              )}
              <div className="drawer-subtotal">
                <span>Estimated Total</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--color-peacock)' }}>{formatCurrency(total)}</strong>
              </div>

              <button type="button" className="primary-button block-button" onClick={() => goTo('/checkout')}>
                <span>Proceed to Checkout</span>
                <ArrowRight size={16} />
              </button>
              <button type="button" className="secondary-button block-button" onClick={() => goTo('/cart')}>
                View Bag & Details
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
