import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Heart, ShoppingBag, Check, Minus } from 'lucide-react';
import { useCart } from '../../CartContext';
import { api, resolveImageUrl } from '../../utils/api';
import { calculateDiscount } from '../../utils/helpers';
import { getColorHexValue, getColorDisplayName } from '../../utils/colors';
import './ProductCard.css';

export default function ProductCard({ product, onQuickView }) {
  const navigate = useNavigate();
  const { items, addToCart, removeItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartActionState, setCartActionState] = useState(null); // 'added' | 'removed' | null
  const [imgError, setImgError] = useState(false);
  const [activeVariant, setActiveVariant] = useState(null);

  const isInCart = items.some(item => item.id === product.id);
  const discount = product.discount_percentage || calculateDiscount(product.original_price, product.price);
  const isAvailable = Number(product.stock || 0) > 0;

  // Prepare primary and secondary images for CSS-only hover slide
  const variants = product.variants || [];
  const primaryImage = activeVariant?.image_url || product.image_url || product.default_image || '/images/no-image.svg';

  // Build a secondary image: pick the first variant image that differs from the primary
  let secondaryImage = null;
  if (variants.length > 1) {
    for (const v of variants) {
      if (v.image_url && v.image_url !== primaryImage) {
        secondaryImage = v.image_url;
        break;
      }
    }
  }

  const displayImageUrl = imgError
    ? '/images/no-image.svg'
    : resolveImageUrl(primaryImage);

  const handleAddToCartToggle = (e) => {
    e.stopPropagation();
    if (!isAvailable) return;

    if (isInCart) {
      removeItem(product.id);
      setCartActionState('removed');
      setTimeout(() => setCartActionState(null), 1500);
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: activeVariant?.image_url || product.image_url,
        stock: product.stock,
        brand: product.brand,
        color_variant_id: activeVariant?.id || null,
        selected_color: activeVariant?.color_name || null
      }, 1);
      setCartActionState('added');
      setTimeout(() => setCartActionState(null), 2000);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    try {
      await api.post('/api/wishlist', { product_id: product.id });
    } catch {}
  };

  const handleQuickViewClick = (e) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView({ ...product, selectedVariant: activeVariant });
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  return (
    <article
      className={`shopverse-card ${secondaryImage ? 'shopverse-card--has-alt' : ''}`}
      onClick={() => navigate(`/product/${product.id}`)}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          navigate(`/product/${product.id}`);
        }
      }}
    >
      {/* 3:4 Aspect Image Container — hover slide is 100% CSS */}
      <div className="shopverse-card__image-wrap">
        <img
          src={displayImageUrl}
          alt={product.name}
          className="shopverse-card__image"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {/* Secondary image — always rendered, CSS :hover controls slide */}
        {secondaryImage && (
          <img
            src={resolveImageUrl(secondaryImage)}
            alt=""
            className="shopverse-card__image-secondary"
            aria-hidden="true"
          />
        )}

        {/* Liquid gradient overlay sweep */}
        <div className="shopverse-card__liquid-sweep" aria-hidden="true" />

        {/* Badges */}
        <div className="shopverse-card__badges">
          {product.is_best_seller && (
            <span className="shopverse-card__badge shopverse-card__badge--bestseller">
              Best Seller
            </span>
          )}
          {discount > 0 && (
            <span className="shopverse-card__badge shopverse-card__badge--sale">
              -{discount}%
            </span>
          )}
          {!isAvailable && (
            <span className="shopverse-card__badge shopverse-card__badge--out">
              Sold Out
            </span>
          )}
        </div>

        {/* Vertical Hover Action Cluster (Top-Right) */}
        <div className="shopverse-card__actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="shopverse-card__action-btn"
            onClick={handleQuickViewClick}
            aria-label="Quick view"
          >
            <Eye size={18} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`shopverse-card__action-btn ${isWishlisted ? 'shopverse-card__action-btn--active' : ''}`}
            onClick={handleToggleWishlist}
            aria-label="Save to watchlist"
          >
            <Heart size={18} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className={`shopverse-card__action-btn ${
              cartActionState === 'added'
                ? 'shopverse-card__action-btn--success'
                : cartActionState === 'removed'
                ? 'shopverse-card__action-btn--removed'
                : isInCart
                ? 'shopverse-card__action-btn--incart'
                : ''
            }`}
            onClick={handleAddToCartToggle}
            disabled={!isAvailable}
            title={isInCart ? 'In Cart — click to remove' : 'Add to Cart'}
            aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
          >
            {cartActionState === 'added' ? (
              <Check size={18} strokeWidth={2.5} className="shopverse-btn-icon-pop" />
            ) : cartActionState === 'removed' ? (
              <Minus size={18} strokeWidth={2.5} className="shopverse-btn-icon-pop" />
            ) : (
              <ShoppingBag size={18} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      {/* Editorial Card Info */}
      <div className="shopverse-card__info">
        {product.brand && (
          <span className="shopverse-card__brand">{product.brand}</span>
        )}
        <h3 className="shopverse-card__name" title={product.name}>{product.name}</h3>

        {/* Color Swatches */}
        {variants.length > 0 && (
          <div className="shopverse-card__swatches" onClick={e => e.stopPropagation()}>
            {variants.map(v => {
              const isOutOfStock = Number(v.stock || 0) <= 0;
              const isSelected = activeVariant?.id === v.id || (!activeVariant && v.id === variants[0]?.id);
              const hexColor = v.color_hex || getColorHexValue(v.color_name);

              return (
                <div key={v.id} className="shopverse-card__swatch-wrap">
                  <button
                    type="button"
                    className={`shopverse-card__swatch ${isSelected ? 'shopverse-card__swatch--active' : ''} ${isOutOfStock ? 'shopverse-card__swatch--disabled' : ''}`}
                    style={{ backgroundColor: hexColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) setActiveVariant(v);
                    }}
                    onMouseEnter={() => {
                      if (!isOutOfStock) setActiveVariant(v);
                    }}
                    disabled={isOutOfStock}
                    aria-label={`${v.color_name} ${isOutOfStock ? '(Unavailable)' : ''}`}
                  />
                  {isOutOfStock && (
                    <span className="shopverse-card__swatch-tooltip">Currently not available</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="shopverse-card__price-row">
          <span className="shopverse-card__price">₹{Number(product.price || 0).toLocaleString('en-IN')}</span>
          {product.original_price && product.original_price > product.price && (
            <span className="shopverse-card__original-price">
              ₹{Number(product.original_price).toLocaleString('en-IN')}
            </span>
          )}
          {discount > 0 && (
            <span className="shopverse-card__discount-tag">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
