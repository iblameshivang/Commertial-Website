import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useWishlist } from './WishlistContext';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { items, wishlistCount, clearWishlist } = useWishlist();
  const [confirmingClear, setConfirmingClear] = useState(false);

  if (items.length === 0) {
    return (
      <div className="empty-state cart-empty-state">
        <h2>Your wishlist is empty</h2>
        <p className="subtle">Tap the heart on any product to save it for later.</p>
        <Link to="/" className="primary-button inline-button">Shop Now</Link>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <button type="button" className="back-link" onClick={() => navigate('/')}>
        ← Continue shopping
      </button>

      <div className="wishlist-header">
        <h2>My Wishlist ({wishlistCount})</h2>

        {confirmingClear ? (
          <div className="wishlist-clear-confirm">
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                clearWishlist();
                setConfirmingClear(false);
              }}
            >
              Confirm clear
            </button>
            <button type="button" className="secondary-button" onClick={() => setConfirmingClear(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="link-button" onClick={() => setConfirmingClear(true)}>
            Clear wishlist
          </button>
        )}
      </div>

      {/* Stored items are already product-shaped, so ProductCard renders them as-is —
          including its own heart, which removes the item when tapped here. */}
      <div className="product-grid">
        {items.map(item => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
}
