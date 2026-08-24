import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from './CartContext';
import { api, resolveImageUrl } from './utils/api';
import './WishlistPage.css';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/api/wishlist');
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      await api.post('/api/wishlist', { product_id: productId });
      setItems(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveToCart = (item) => {
    if (item.stock <= 0) return;
    addToCart({
      id: item.product_id,
      name: item.name,
      price: item.price,
      image: item.image_url,
      stock: item.stock,
      brand: item.brand,
    });
    handleRemove(item.product_id);
  };

  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="skeleton-shimmer" style={{ width: 280, height: 36, marginBottom: 40 }} />
        <div className="wishlist-page__grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '3/4' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="wishlist-page__header">
        <span className="wishlist-page__eyebrow">Saved Items</span>
        <h1 className="wishlist-page__title">Curated Watchlist</h1>
        <p className="wishlist-page__subtitle">Pieces reserved for your considered selection</p>
      </div>

      {items.length === 0 ? (
        <div className="wishlist-page__empty">
          <Heart size={44} strokeWidth={1} color="var(--color-sage)" />
          <h2>Your Watchlist is Empty</h2>
          <p>Explore our seasonal capsules and save pieces you wish to review later.</p>
          <button
            type="button"
            className="wishlist-page__explore-btn"
            onClick={() => navigate('/shop')}
          >
            <span>Explore Catalogue</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div className="wishlist-page__grid">
          {items.map(item => {
            const isAvailable = Number(item.stock || 0) > 0;
            return (
              <div
                key={item.id}
                className="wishlist-card"
                onClick={() => navigate(`/product/${item.product_id}`)}
              >
                <div className="wishlist-card__img-wrap">
                  <img
                    src={resolveImageUrl(item.image_url)}
                    alt={item.name}
                    className="wishlist-card__img"
                    onError={e => { e.currentTarget.src = '/images/no-image.svg'; }}
                  />
                  <button
                    type="button"
                    className="wishlist-card__remove-btn"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.product_id); }}
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="wishlist-card__info">
                  {item.brand && <span className="wishlist-card__brand">{item.brand}</span>}
                  <h3 className="wishlist-card__name">{item.name}</h3>
                  <div className="wishlist-card__price-row">
                    <span className="wishlist-card__price">₹{Number(item.price).toLocaleString('en-IN')}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="wishlist-card__original-price">₹{Number(item.original_price).toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="wishlist-card__move-btn"
                    disabled={!isAvailable}
                    onClick={(e) => { e.stopPropagation(); handleMoveToCart(item); }}
                  >
                    <ShoppingBag size={16} strokeWidth={1.5} />
                    <span>{isAvailable ? 'Move to Shopping Bag' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
