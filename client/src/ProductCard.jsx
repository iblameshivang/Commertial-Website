import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeartIcon from './HeartIcon';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
import { resolveImageUrl } from './config';

export default function ProductCard({ product, showAddToCart = true, showWishlist = true }) {
  const navigate = useNavigate();
  const { addToCart, showToast } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const imageSource = resolveImageUrl(product?.image_url || product?.images?.[0]);
  const isAvailable = Number(product?.stock ?? 0) > 0;
  const wishlisted = Boolean(product?.id) && isWishlisted(product.id);

  const handleCardClick = () => {
    if (product?.id) {
      navigate(`/product/${product.id}`);
    }
  };

  const handleAddToCart = event => {
    // Without this the card's own click handler would navigate to the detail page.
    event.stopPropagation();
    addToCart(product, 1);
  };

  const handleWishlistToggle = event => {
    event.stopPropagation();

    const action = toggleWishlist(product);
    if (action === 'added') {
      showToast(`${product.name} saved to wishlist`);
    } else if (action === 'removed') {
      showToast(`${product.name} removed from wishlist`);
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
        {showWishlist && (
          // Stays enabled when the product is out of stock — remembering an item until it
          // restocks is exactly what the wishlist is for.
          <button
            type="button"
            className={wishlisted ? 'wishlist-heart active' : 'wishlist-heart'}
            onClick={handleWishlistToggle}
            aria-pressed={wishlisted}
            aria-label={wishlisted
              ? `Remove ${product?.name || 'product'} from wishlist`
              : `Save ${product?.name || 'product'} to wishlist`}
          >
            <HeartIcon filled={wishlisted} size={18} />
          </button>
        )}

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
