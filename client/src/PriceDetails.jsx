import React, { useState } from 'react';
import { Tag, Check, X, Sparkles } from 'lucide-react';
import { DELIVERY_FEE, useCart } from './CartContext';
import { formatCurrency } from './format';

export default function PriceDetails({
  subtotal,
  deliveryFee,
  total,
  itemCount,
  freeDeliveryRemaining = 0,
  children,
}) {
  const { appliedPromo, discountAmount, applyPromoCode, removePromoCode } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    setPromoError('');
    setLoading(true);
    try {
      await applyPromoCode(promoInput);
      setPromoInput('');
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="price-details">
      <h2>Order Summary</h2>

      {/* Promo Code Box */}
      <div className="summary-promo-container">
        {appliedPromo ? (
          <div className="summary-promo-applied">
            <div className="summary-promo-info">
              <Tag size={16} color="var(--color-peacock)" />
              <div>
                <strong>{appliedPromo.code}</strong>
                <small>-₹{discountAmount} Discount Applied</small>
              </div>
            </div>
            <button type="button" className="summary-promo-remove" onClick={removePromoCode}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApply} className="summary-promo-form">
            <input
              type="text"
              placeholder="Promo code (e.g. WELCOME10)"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
            />
            <button type="submit" disabled={loading || !promoInput.trim()}>
              {loading ? '...' : 'Apply'}
            </button>
          </form>
        )}
        {promoError && <p className="promo-error-msg">{promoError}</p>}
      </div>

      <div className="price-row">
        <span>Cart Items ({itemCount})</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {discountAmount > 0 && (
        <div className="price-row discount-row" style={{ color: 'var(--color-ballet-slipper)' }}>
          <span>Voucher Discount</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
      )}

      <div className="price-row">
        <span>Express Delivery</span>
        {deliveryFee === 0
          ? <span className="free-tag">Complimentary</span>
          : <span>{formatCurrency(deliveryFee)}</span>}
      </div>

      <div className="price-row total">
        <span>Total Due</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {deliveryFee === 0 && subtotal > 0 && (
        <p className="savings-note">
          <Sparkles size={14} />
          <span>Complimentary White-Glove delivery applied</span>
        </p>
      )}

      {freeDeliveryRemaining > 0 && (
        <p className="delivery-hint">
          Add {formatCurrency(freeDeliveryRemaining)} more for <strong>Complimentary Shipping</strong>
        </p>
      )}

      {children}
    </aside>
  );
}
