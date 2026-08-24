import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import HeroCarousel from '../components/Home/HeroCarousel';
import ShowcaseSection from '../components/Home/ShowcaseSection';
import CollageGrid from '../components/Home/CollageGrid';
import ProductScroller from '../components/Home/ProductScroller';
import ProductCard from '../components/Home/ProductCard';
import QuickViewModal from '../components/Product/QuickViewModal';
import { api } from '../utils/api';
import './HomePage.css';

const CATEGORY_DATA = [
  {
    id: 'clothing',
    name: 'Tailored Apparel',
    count: '8 Items',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
    tag: 'Winter Capsule'
  },
  {
    id: 'electronics',
    name: 'Acoustics & Studio',
    count: '6 Items',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
    tag: 'Audiophile'
  },
  {
    id: 'home',
    name: 'Sculptural Living',
    count: '5 Items',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=85',
    tag: 'Interior'
  },
  {
    id: 'beauty',
    name: 'Botanical Grooming',
    count: '2 Items',
    image: 'https://images.unsplash.com/photo-1608248597359-59367d32efee?w=800&q=85',
    tag: 'Self Care'
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [activeHeroCategory, setActiveHeroCategory] = useState('clothing');
  const [curatedProducts, setCuratedProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Fetch initial collections
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [bsRes, naRes, allRes] = await Promise.all([
          api.get('/api/products/best-sellers?limit=8'),
          api.get('/api/products/new-launches?limit=8'),
          api.get('/api/products?limit=10'),
        ]);

        const markedBestSellers = (bsRes.data || []).map(p => ({ ...p, is_best_seller: true }));
        setBestSellers(markedBestSellers);
        setNewArrivals(naRes.data || []);
        setAllProducts(allRes.data || []);
      } catch (err) {
        console.error('Failed to load home page collections', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Fetch Curated Section dynamically based on active hero slide
  useEffect(() => {
    const fetchCurated = async () => {
      try {
        const res = await api.get(`/api/products?category=${encodeURIComponent(activeHeroCategory)}&limit=4`);
        setCuratedProducts(res.data || []);
      } catch {
        setCuratedProducts([]);
      }
    };
    if (activeHeroCategory) fetchCurated();
  }, [activeHeroCategory]);

  return (
    <div className="shopverse-home">
      {/* 1. Immersive Hero Carousel */}
      <HeroCarousel onActiveCategoryChange={setActiveHeroCategory} />

      <div className="shopverse-home__content">
        {/* 2. Curated For You (Dynamic) */}
        {curatedProducts.length > 0 && (
          <section className="shopverse-section shopverse-section--curated">
            <div className="shopverse-section__header">
              <div>
                <span className="shopverse-section__eyebrow">Handpicked Selection</span>
                <h2 className="shopverse-section__title">Curated For You</h2>
              </div>
              <button
                type="button"
                className="shopverse-section__view-all"
                onClick={() => navigate(`/shop?category=${encodeURIComponent(activeHeroCategory)}`)}
              >
                <span>View Full Capsule</span>
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="shopverse-home__curated-grid">
              {curatedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          </section>
        )}

        {/* 3. Samsung-Style Full-Width Showcase (Feature 5.1) */}
        <ShowcaseSection product={bestSellers[0] || allProducts[0]} />

        {/* 4. 5-Card Liquid Reveal Collage Grid (Feature 5.2) */}
        {allProducts.length >= 5 && (
          <CollageGrid
            products={allProducts.slice(0, 5)}
            onQuickView={setQuickViewProduct}
          />
        )}

        {/* 5. Trending Now (Best Sellers Scroller) */}
        <section className="shopverse-section">
          <ProductScroller
            title="Trending Now"
            subtitle="The most coveted pieces of the current season"
            products={bestSellers}
            loading={loading}
            onQuickView={setQuickViewProduct}
          />
        </section>

        {/* 4. Section 3: Fresh Arrivals */}
        <section className="shopverse-section">
          <div className="shopverse-section__header">
            <div>
              <span className="shopverse-section__eyebrow">Just Released</span>
              <h2 className="shopverse-section__title">Fresh Arrivals</h2>
            </div>
            <button
              type="button"
              className="shopverse-section__view-all"
              onClick={() => navigate('/shop?sortBy=newest')}
            >
              <span>Explore All</span>
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="shopverse-home__arrivals-grid">
            {newArrivals.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        </section>

        {/* 5. Section 4: Shop by Category (Large 4:5 Cards with Gradient-Dark) */}
        <section className="shopverse-section">
          <div className="shopverse-section__header shopverse-section__header--center">
            <span className="shopverse-section__eyebrow">Curated Collections</span>
            <h2 className="shopverse-section__title">Shop by Category</h2>
          </div>

          <div className="shopverse-home__category-grid">
            {CATEGORY_DATA.map(cat => (
              <div
                key={cat.id}
                className="shopverse-category-card"
                onClick={() => navigate(`/shop?category=${cat.id}`)}
                tabIndex={0}
                role="button"
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/shop?category=${cat.id}`)}
              >
                <img src={cat.image} alt={cat.name} className="shopverse-category-card__bg" loading="lazy" />
                <div className="shopverse-category-card__overlay" />
                <div className="shopverse-category-card__content">
                  <span className="shopverse-category-card__tag">{cat.tag}</span>
                  <h3 className="shopverse-category-card__name">{cat.name}</h3>
                  <div className="shopverse-category-card__footer">
                    <span className="shopverse-category-card__count">{cat.count}</span>
                    <div className="shopverse-category-card__btn">
                      <ArrowUpRight size={18} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Editorial Brand Manifesto Banner */}
        <section className="shopverse-manifesto">
          <div className="shopverse-manifesto__inner">
            <span className="shopverse-manifesto__eyebrow">The Shopverse Philosophy</span>
            <h2 className="shopverse-manifesto__heading">
              "We believe true luxury resides in restraint, exceptional materiality, and intentional craftsmanship."
            </h2>
            <button
              type="button"
              className="shopverse-manifesto__cta"
              onClick={() => navigate('/shop')}
            >
              <span>Explore The Store</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
