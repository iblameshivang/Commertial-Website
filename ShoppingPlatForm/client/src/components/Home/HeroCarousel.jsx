import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { api } from '../../utils/api';
import './HeroCarousel.css';

export default function HeroCarousel({ onActiveCategoryChange }) {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const intervalRef = useRef(null);
  const navigate = useNavigate();

  // Parallax tracking
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < window.innerHeight) {
        setScrollY(window.scrollY);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const [adsRes, bestRes, newRes] = await Promise.all([
          api.get('/api/advertisements'),
          api.get('/api/products/best-sellers?limit=5'),
          api.get('/api/products/new-launches?limit=3'),
        ]);

        const adItems = (adsRes.data || []).map(ad => ({
          id: `ad-${ad.id}`,
          eyebrow: 'Featured Curation',
          title: ad.title,
          subtitle: ad.subtitle || 'Experience minimalist craft and refined materiality.',
          image: ad.image_url,
          ctaText: ad.cta_text || 'Explore Collection',
          targetCategory: ad.target_category || 'clothing',
          targetId: ad.target_id,
          targetBrand: ad.target_brand,
        }));

        const bestItems = (bestRes.data || []).slice(0, 2).map(p => ({
          id: `best-${p.id}`,
          eyebrow: 'Best Seller',
          title: p.name,
          subtitle: p.description || 'Award-winning design engineered with timeless precision.',
          image: p.image_url,
          ctaText: 'Shop Best Seller',
          targetCategory: p.category,
          targetId: p.id,
          targetBrand: p.brand,
        }));

        const newItems = (newRes.data || []).slice(0, 1).map(p => ({
          id: `new-${p.id}`,
          eyebrow: 'New Launch',
          title: p.name,
          subtitle: p.description || 'Fresh architectural silhouettes tailored for modern living.',
          image: p.image_url,
          ctaText: 'Discover Release',
          targetCategory: p.category,
          targetId: p.id,
          targetBrand: p.brand,
        }));

        const merged = [...adItems, ...bestItems, ...newItems];
        setSlides(merged.length > 0 ? merged : [
          {
            id: 'default',
            eyebrow: 'Winter Capsule',
            title: 'Timeless Tailoring & Minimal Wear',
            subtitle: 'Discover our curated winter capsule crafted from pure Mongolian cashmere and organic Italian twills.',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=90',
            ctaText: 'Explore Collection',
            targetCategory: 'clothing'
          }
        ]);
      } catch (err) {
        console.error('Failed to load hero slides', err);
      }
    };

    fetchHeroContent();
  }, []);

  // Inform parent of current slide category for "Curated For You" section
  useEffect(() => {
    if (slides[current] && onActiveCategoryChange) {
      onActiveCategoryChange(slides[current].targetCategory || 'clothing');
    }
  }, [current, slides, onActiveCategoryChange]);

  const goTo = useCallback((idx) => {
    if (isTransitioning || slides.length === 0) return;
    setIsTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setIsTransitioning(false), 1200);
  }, [isTransitioning, slides.length]);

  const next = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo]);

  // 10-second auto-rotation
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    intervalRef.current = setInterval(next, 10000);
    return () => clearInterval(intervalRef.current);
  }, [paused, slides.length, next]);

  const handleActionClick = (slide) => {
    if (slide.targetId) {
      navigate(`/product/${slide.targetId}`);
    } else if (slide.targetCategory) {
      navigate(`/shop?category=${encodeURIComponent(slide.targetCategory)}`);
    } else if (slide.targetBrand) {
      navigate(`/shop?brand=${encodeURIComponent(slide.targetBrand)}`);
    } else {
      navigate('/shop');
    }
  };

  if (slides.length === 0) return null;

  return (
    <section
      className="shopverse-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero Carousel"
    >
      <div className="shopverse-hero__viewport">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`shopverse-hero__slide ${idx === current ? 'shopverse-hero__slide--active' : ''}`}
            aria-hidden={idx !== current}
          >
            {/* Parallax Background */}
            <div
              className="shopverse-hero__bg"
              style={{
                backgroundImage: `url(${slide.image})`,
                transform: `translateY(${scrollY * 0.5}px)`
              }}
            />

            {/* Gradient Overlay */}
            <div className="shopverse-hero__overlay" />

            {/* Staggered Text Block */}
            <div className="shopverse-hero__content">
              <span className="shopverse-hero__eyebrow">{slide.eyebrow}</span>
              <h1 className="shopverse-hero__headline">{slide.title}</h1>
              <p className="shopverse-hero__subheadline">{slide.subtitle}</p>
              <button
                type="button"
                className="shopverse-hero__cta"
                onClick={() => handleActionClick(slide)}
              >
                <span>{slide.ctaText}</span>
                <ArrowUpRight size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Circle Arrows (Appear on Hover) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            className="shopverse-hero__arrow shopverse-hero__arrow--left"
            onClick={prev}
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className="shopverse-hero__arrow shopverse-hero__arrow--right"
            onClick={next}
            aria-label="Next slide"
          >
            <ChevronRight size={24} strokeWidth={1.5} />
          </button>

          {/* Dot Indicators */}
          <div className="shopverse-hero__dots" role="tablist">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === current}
                className={`shopverse-hero__dot ${idx === current ? 'shopverse-hero__dot--active' : ''}`}
                onClick={() => goTo(idx)}
                aria-label={`Jump to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
