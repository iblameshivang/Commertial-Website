import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import './ProductScroller.css';

export default function ProductScroller({ title, subtitle, products = [], loading = false, onQuickView }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [products]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section ref={sectionRef} className={`shopverse-scroller ${isVisible ? 'shopverse-scroller--visible' : ''}`}>
      <div className="shopverse-scroller__header">
        <div className="shopverse-scroller__title-group">
          <h2 className="shopverse-scroller__title">{title}</h2>
          {subtitle && <p className="shopverse-scroller__subtitle">{subtitle}</p>}
        </div>
        <div className="shopverse-scroller__controls">
          <button
            type="button"
            className="shopverse-scroller__arrow"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="shopverse-scroller__arrow"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="shopverse-scroller__track" ref={scrollRef}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shopverse-scroller__item">
                <div className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '3/4' }} />
                <div className="skeleton-shimmer" style={{ width: '60%', height: 14, marginTop: 16 }} />
                <div className="skeleton-shimmer" style={{ width: '80%', height: 18, marginTop: 8 }} />
                <div className="skeleton-shimmer" style={{ width: '40%', height: 18, marginTop: 8 }} />
              </div>
            ))
          : products.map((product, idx) => (
              <div
                key={product.id}
                className="shopverse-scroller__item"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <ProductCard product={product} onQuickView={onQuickView} />
              </div>
            ))}
      </div>
    </section>
  );
}
