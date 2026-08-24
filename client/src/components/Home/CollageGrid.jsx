import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShoppingBag, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../../CartContext';
import { resolveImageUrl } from '../../utils/api';
import './CollageGrid.css';

export default function CollageGrid({ products = [], onQuickView }) {
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [addedIds, setAddedIds] = useState({});

  if (!products || products.length < 5) return null;

  const displayList = products.slice(0, 5);
  const featured = displayList[0];
  const companions = displayList.slice(1, 5);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url,
      brand: product.brand,
    }, 1);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  const renderCard = (p, isLarge = false) => {
    const isAdded = addedIds[p.id];
    const imageSrc = resolveImageUrl(p.image_url);

    return (
      <div
        key={p.id}
        className={`shopverse-collage-card ${isLarge ? 'shopverse-collage-card--large' : ''}`}
        onClick={() => navigate(`/product/${p.id}`)}
      >
        <img src={imageSrc} alt={p.name} className="shopverse-collage-card__img" loading="lazy" />
        
        {/* Floating Tag */}
        <span className="shopverse-collage-card__tag">
          {isLarge ? 'Curated Masterpiece' : (p.category || 'Atelier')}
        </span>

        {/* Liquid-Glass Blur Panel Rising on Hover */}
        <div className="shopverse-collage-card__glass-panel">
          <div className="shopverse-collage-card__meta">
            {p.brand && <span className="shopverse-collage-card__brand">{p.brand}</span>}
            <h4 className="shopverse-collage-card__title">{p.name}</h4>
            <span className="shopverse-collage-card__price">₹{Number(p.price).toLocaleString('en-IN')}</span>
          </div>

          <div className="shopverse-collage-card__actions" onClick={e => e.stopPropagation()}>
            {onQuickView && (
              <button
                type="button"
                className="shopverse-collage-card__icon-btn"
                onClick={() => onQuickView(p)}
                title="Quick View"
                aria-label="Quick View"
              >
                <Eye size={18} strokeWidth={1.5} />
              </button>
            )}

            <button
              type="button"
              className={`shopverse-collage-card__icon-btn ${isAdded ? 'shopverse-collage-card__icon-btn--added' : ''}`}
              onClick={(e) => handleAddToCart(e, p)}
              title={isAdded ? 'Added' : 'Add to Bag'}
              aria-label="Add to Bag"
            >
              {isAdded ? <Check size={18} strokeWidth={2} /> : <ShoppingBag size={18} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="shopverse-section shopverse-collage-section">
      <div className="shopverse-section__header">
        <div>
          <span className="shopverse-section__eyebrow">Visual Narrative</span>
          <h2 className="shopverse-section__title">The Atelier Capsule Collage</h2>
        </div>
        <button
          type="button"
          className="shopverse-section__view-all"
          onClick={() => navigate('/shop')}
        >
          <span>Explore All 5 Masterpieces</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="shopverse-collage-grid">
        {/* Large 2x2 Featured Card */}
        {renderCard(featured, true)}

        {/* 4 Companion Cards Grid */}
        <div className="shopverse-collage-companions">
          {companions.map(p => renderCard(p, false))}
        </div>
      </div>
    </section>
  );
}
