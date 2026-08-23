import React from 'react';
import { DELIVERY_FEE } from './CartContext';
import { formatCurrency } from './format';

export default function PriceDetails({
  subtotal,
  deliveryFee,
  total,
  itemCount,
  freeDeliveryRemaining = 0,
  children,
}) {
  return (
    <aside className="price-details">
      <h2>Price Details</h2>

      <div className="price-row">
        <span>Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className="price-row">
        <span>Delivery Charges</span>
        {deliveryFee === 0
          ? <span className="free-tag">FREE</span>
          : <span>{formatCurrency(deliveryFee)}</span>}
      </div>

      <div className="price-row total">
        <span>Total Amount</span>
        <span>{formatCurrency(total)}</span>
      </div>

      {deliveryFee === 0 && subtotal > 0 && (
        <p className="savings-note">You will save {formatCurrency(DELIVERY_FEE)} on delivery charges</p>
      )}

      {freeDeliveryRemaining > 0 && (
        <p className="delivery-hint">
          Add {formatCurrency(freeDeliveryRemaining)} more for <strong>FREE delivery</strong>
        </p>
      )}

      {children}
    </aside>
  );
}
