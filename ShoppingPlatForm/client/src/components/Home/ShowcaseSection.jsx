import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { useCart } from '../../CartContext';
import { resolveImageUrl } from '../../utils/api';
import './ShowcaseSection.css';

export default function ShowcaseSection({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [activeAngle, setActiveAngle] = useState(0);
  const [added, setAdded] = useState(false);

  // Flagship product
  const flagship = product || {
    id: 1,
    name: 'Architectural Cashmere Overcoat',
    brand: 'Shopverse Atelier',
    category: 'clothing',
    price: 34999,
    original_price: 42999,
    description: 'Sculpted from double-faced 700g Mongolian cashmere with clean unstructured shoulders and horn buttons. Engineered for fluid silhouettes and thermal mastery.',
    image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=90',
    images: [
      'https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=90',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&q=90',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=90'
    ]
  };

  const images = flagship.images && flagship.images.length > 0
    ? flagship.images.map(resolveImageUrl)
    : [resolveImageUrl(flagship.image_url)];

  const handleAddToCart = () => {
    addToCart({
      id: flagship.id,
      name: flagship.name,
      price: flagship.price,
      image: images[activeAngle] || flagship.image_url,
      brand: flagship.brand,
    }, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className="shopverse-showcase">
      <div className="shopverse-showcase__container">
        {/* Left Column: Editorial Typography */}
        <div className="shopverse-showcase__info">
          <div className="shopverse-showcase__badge">
            <Sparkles size={14} />
            <span>Flagship Atelier Showcase</span>
          </div>

          <h2 className="shopverse-showcase__title">
            Pure Materiality. Uncompromised Geometry.
          </h2>

          <p className="shopverse-showcase__desc">
            {flagship.description}
          </p>

          <div className="shopverse-showcase__price-row">
            <span className="shopverse-showcase__price">₹{Number(flagship.price).toLocaleString('en-IN')}</span>
            {flagship.original_price && (
              <span className="shopverse-showcase__orig-price">₹{Number(flagship.original_price).toLocaleString('en-IN')}</span>
            )}
            <span className="shopverse-showcase__tag">Complimentary Express Dispatch</span>
          </div>

          <div className="shopverse-showcase__actions">
            <button
              type="button"
              className={`shopverse-showcase__btn-primary ${added ? 'shopverse-showcase__btn-primary--added' : ''}`}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={18} />
              <span>{added ? 'Added to Bag' : 'Add to Shopping Bag'}</span>
            </button>

            <button
              type="button"
              className="shopverse-showcase__btn-secondary"
              onClick={() => navigate(`/product/${flagship.id}`)}
            >
              <span>Explore Piece</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Column: 500px+ Floating Product Visual */}
        <div className="shopverse-showcase__visual">
          <div className="shopverse-showcase__aura" />
          <div className="shopverse-showcase__img-box">
            <img
              src={images[activeAngle] || images[0]}
              alt={flagship.name}
              className="shopverse-showcase__float-img"
            />
          </div>

          {/* Angle Switcher */}
          {images.length > 1 && (
            <div className="shopverse-showcase__angles">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`shopverse-showcase__angle-btn ${idx === activeAngle ? 'shopverse-showcase__angle-btn--active' : ''}`}
                  onClick={() => setActiveAngle(idx)}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
