import React from 'react';
import { resolveImageUrl } from './config';
import { formatCurrency } from './format';

export default function CartItemRow({ item, onUpdateQuantity, onRemove, compact = false }) {
  const stockLimit = Math.max(Number(item.stock || 1), 1);
  const atMaxStock = item.quantity >= stockLimit;

  return (
    <div className={compact ? 'cart-row compact' : 'cart-row'}>
      <img
        className="cart-row-image"
        src={resolveImageUrl(item.image)}
        alt={item.name}
        onError={event => {
          event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
        }}
      />

      <div className="cart-row-info">
        <h3>{item.name}</h3>
        <p className="cart-row-price">{formatCurrency(item.price)}</p>

        <div className="quantity-stepper">
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.name}`}
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            −
          </button>
          <span aria-live="polite">{item.quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.name}`}
            disabled={atMaxStock}
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            +
          </button>
        </div>

        {atMaxStock && <small className="stock-hint">Only {stockLimit} in stock</small>}
      </div>

      <div className="cart-row-actions">
        <strong>{formatCurrency(item.price * item.quantity)}</strong>
        <button type="button" className="link-button" onClick={() => onRemove(item.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}
