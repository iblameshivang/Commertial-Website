import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Heart, Check, ChevronRight } from 'lucide-react';
import { useCart } from '../../CartContext';
import { api, resolveImageUrl } from '../../utils/api';
import { getColorDisplayName, getColorHexValue } from '../../utils/colors';
import './QuickViewModal.css';

export default function QuickViewModal({ product, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [added, setAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (product.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    }
    if (product.sizes && product.sizes.length > 0) {
      setSelectedSize(product.sizes[0]);
    }
    setSelectedImageIndex(0);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, onClose]);

  if (!product) return null;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image_url || '/images/no-image.svg'];

  const isAvailable = Number(product.stock || 0) > 0;

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      stock: product.stock,
      brand: product.brand,
      selectedColor,
      selectedSize,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleToggleWishlist = async () => {
    setIsWishlisted(!isWishlisted);
    try {
      await api.post('/api/wishlist', { product_id: product.id });
    } catch {}
  };

  const handleGoToDetails = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="quickview-overlay" onClick={onClose}>
      <div className="quickview-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="quickview-modal__close" onClick={onClose} aria-label="Close modal">
          <X size={20} strokeWidth={1.5} />
        </button>

        <div className="quickview-modal__content">
          {/* Left: Gallery Panel */}
          <div className="quickview-modal__gallery">
            <div className="quickview-modal__main-img-wrap">
              <img
                src={resolveImageUrl(images[selectedImageIndex])}
                alt={product.name}
                className="quickview-modal__main-img"
              />
            </div>
            {images.length > 1 && (
              <div className="quickview-modal__thumbs">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`quickview-modal__thumb-btn ${idx === selectedImageIndex ? 'quickview-modal__thumb-btn--active' : ''}`}
                    onClick={() => setSelectedImageIndex(idx)}
                  >
                    <img src={resolveImageUrl(img)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info Panel */}
          <div className="quickview-modal__details">
            {product.brand && <span className="quickview-modal__brand">{product.brand}</span>}
            <h2 className="quickview-modal__title">{product.name}</h2>

            <div className="quickview-modal__price-row">
              <span className="quickview-modal__price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              {product.original_price && product.original_price > product.price && (
                <span className="quickview-modal__original-price">₹{Number(product.original_price).toLocaleString('en-IN')}</span>
              )}
              {product.discount_percentage > 0 && (
                <span className="quickview-modal__discount-badge">-{product.discount_percentage}%</span>
              )}
            </div>

            <p className="quickview-modal__desc">{product.description}</p>

            {/* Colors Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="quickview-modal__option-group">
                <label className="quickview-modal__option-label">Color: <span>{getColorDisplayName(selectedColor)}</span></label>
                <div className="quickview-modal__swatches">
                  {product.colors.map(color => (
                    <button
                      key={typeof color === 'object' ? color.name : color}
                      type="button"
                      className={`quickview-modal__swatch ${getColorDisplayName(selectedColor) === getColorDisplayName(color) ? 'quickview-modal__swatch--active' : ''}`}
                      style={{ backgroundColor: getColorHexValue(color) }}
                      onClick={() => setSelectedColor(color)}
                      aria-label={`Select color ${getColorDisplayName(color)}`}
                      title={getColorDisplayName(color)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="quickview-modal__option-group">
                <label className="quickview-modal__option-label">Size: <span>{selectedSize}</span></label>
                <div className="quickview-modal__sizes">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={`quickview-modal__size-btn ${selectedSize === size ? 'quickview-modal__size-btn--active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="quickview-modal__actions">
              <button
                type="button"
                className={`quickview-modal__add-btn ${added ? 'quickview-modal__add-btn--success' : ''}`}
                onClick={handleAddToCart}
                disabled={!isAvailable}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} strokeWidth={1.5} />
                    <span>{isAvailable ? 'Add to Shopping Bag' : 'Out of Stock'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className={`quickview-modal__wishlist-btn ${isWishlisted ? 'quickview-modal__wishlist-btn--active' : ''}`}
                onClick={handleToggleWishlist}
                aria-label="Save to watchlist"
              >
                <Heart size={20} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button type="button" className="quickview-modal__view-details" onClick={handleGoToDetails}>
              <span>View Full Product Details</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
