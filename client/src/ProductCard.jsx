import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveImageUrl } from './config';

export default function ProductCard({ product, onAddToCart, showAddToCart = true }) {
  const navigate = useNavigate();
  const imageSource = resolveImageUrl(product?.image_url || product?.images?.[0]);
  const isAvailable = Number(product?.stock ?? 0) > 0;

  const handleCardClick = () => {
    if (product?.id) {
      navigate(`/product/${product.id}`);
    }
  };

  const handleAddToCart = event => {
    event.stopPropagation();
    if (typeof onAddToCart === 'function') {
      onAddToCart(product, 1);
    }
  };

  return (
    <article
      className="card product-card"
      onClick={handleCardClick}
      onKeyDown={event => {
        if ((event.key === 'Enter' || event.key === ' ') && product?.id) {
          event.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="image-shell">
        <img
          className="product-image"
          src={imageSource}
          alt={product?.name || 'Product image'}
          onError={event => {
            event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
          }}
        />
      </div>

      <div className="card-body">
        <p className="category-tag">{product?.category_name || 'General'}</p>
        <h3>{product?.name || 'Product'}</h3>
        <p className="price">₹{Number(product?.price ?? 0).toFixed(2)}</p>
        <p className="stock">{isAvailable ? `In stock: ${product.stock}` : 'Out of stock'}</p>

        {showAddToCart && (
          <button
            type="button"
            className="primary-button add-to-cart-button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
          >
            {isAvailable ? 'Add to Cart' : 'Out of stock'}
          </button>
        )}
      </div>
    </article>
  );
}
