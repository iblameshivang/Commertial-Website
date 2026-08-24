import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Heart, ShoppingBag, Check, Star, ShieldCheck, Truck, RotateCcw,
  Sparkles, ArrowLeft, ChevronRight
} from 'lucide-react';
import ProductCard from './components/Home/ProductCard';
import ProductScroller from './components/Home/ProductScroller';
import { useCart } from './CartContext';
import { api, resolveImageUrl } from './utils/api';
import { getColorDisplayName, getColorHexValue } from './utils/colors';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await api.get(`/api/products/${productId}`);
        const productData = res.data;
        setProduct(productData);

        if (productData.colors?.length) setSelectedColor(productData.colors[0]);
        if (productData.sizes?.length) setSelectedSize(productData.sizes[0]);

        // Record recently viewed & fetch recommendations + reviews
        api.post('/api/recently-viewed', { product_id: productData.id }).catch(() => {});

        const [recRes, rvRes, revRes] = await Promise.all([
          api.get(`/api/products?category=${encodeURIComponent(productData.category || 'clothing')}&limit=4`),
          api.get('/api/recently-viewed'),
          api.get(`/api/reviews/${productId}`).catch(() => ({ data: [] })),
        ]);

        setRecommendations((recRes.data || []).filter(item => item.id !== Number(productId)));
        setRecentlyViewed((rvRes.data || []).filter(item => item.id !== Number(productId)));
        setReviews(revRes.data || []);
      } catch (err) {
        setError(err.message || 'Unable to load product.');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [openAccordion, setOpenAccordion] = useState('fabric');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef(null);

  // Monitor scroll for sticky mobile bottom bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ctaRef.current) {
      observer.observe(ctaRef.current);
    }
    return () => observer.disconnect();
  }, [product]);

  const images = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.image_url) list.push(resolveImageUrl(product.image_url));
    if (product.default_image && !list.includes(resolveImageUrl(product.default_image))) {
      list.push(resolveImageUrl(product.default_image));
    }
    if (Array.isArray(product.variants) && product.variants.length) {
      product.variants.forEach(v => {
        if (v.image_url) {
          const resolved = resolveImageUrl(v.image_url);
          if (!list.includes(resolved)) list.push(resolved);
        }
      });
    }
    if (Array.isArray(product.images) && product.images.length) {
      product.images.forEach(img => {
        const resolved = resolveImageUrl(img);
        if (!list.includes(resolved)) list.push(resolved);
      });
    }
    return list.length ? list : ['/images/no-image.svg'];
  }, [product]);

  const stockCount = Number(product?.stock ?? 0);
  const isAvailable = stockCount > 0;
  const discount = product?.discount_percentage || 0;

  const handleSelectColor = (variantOrColor) => {
    if (typeof variantOrColor === 'object') {
      if (Number(variantOrColor.stock || 0) <= 0) return;
      setSelectedColor(variantOrColor.color_name);
      if (variantOrColor.image_url) {
        const resolved = resolveImageUrl(variantOrColor.image_url);
        const idx = images.indexOf(resolved);
        if (idx !== -1) setSelectedImageIndex(idx);
      }
    } else {
      setSelectedColor(variantOrColor);
      const colorName = getColorDisplayName(variantOrColor);
      if (product?.variants?.length) {
        const matchedVariant = product.variants.find(
          v => v.color_name === colorName || v.color_hex === getColorHexValue(variantOrColor)
        );
        if (matchedVariant && matchedVariant.image_url) {
          const resolved = resolveImageUrl(matchedVariant.image_url);
          const idx = images.indexOf(resolved);
          if (idx !== -1) setSelectedImageIndex(idx);
        }
      }
    }
  };

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const toggleAccordion = (name) => {
    setOpenAccordion(prev => prev === name ? '' : name);
  };

  const handleAddToCart = () => {
    if (!product || !isAvailable) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[selectedImageIndex] || product.image_url,
      stock: product.stock,
      brand: product.brand,
      selectedColor: getColorDisplayName(selectedColor),
      selectedSize,
    }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleToggleWishlist = async () => {
    setIsWishlisted(!isWishlisted);
    try {
      await api.post('/api/wishlist', { product_id: product.id });
    } catch {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) return;
    setSubmittingReview(true);
    try {
      const res = await api.post('/api/reviews', {
        product_id: product.id,
        user_name: reviewAuthor.trim(),
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviews(prev => [res.data, ...prev]);
      setReviewAuthor('');
      setReviewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="shopverse-pdp-skeleton">
        <div className="skeleton-shimmer" style={{ width: '100%', height: 600 }} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="shopverse-pdp-error">
        <h2>Piece Unavailable</h2>
        <p>{error || 'We could not locate this item.'}</p>
        <button type="button" className="shopverse-pdp-error__btn" onClick={() => navigate('/shop')}>
          Return to Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="shopverse-pdp">
      {/* Breadcrumb Navigation */}
      <nav className="shopverse-breadcrumb">
        <button type="button" onClick={() => navigate(-1)} className="shopverse-breadcrumb__back">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <span className="shopverse-breadcrumb__sep">/</span>
        <Link to="/shop">Shop</Link>
        <span className="shopverse-breadcrumb__sep">/</span>
        <Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
        <span className="shopverse-breadcrumb__sep">/</span>
        <span className="shopverse-breadcrumb__current">{product.name}</span>
      </nav>

      {/* Luxury 3-Column PDP Grid (Feature 2.2: 80px | 1fr | 400px) */}
      <div className="shopverse-pdp__3col-layout">
        {/* Column 1: Vertical Thumbnail Strip (80px) */}
        <div className="shopverse-pdp__thumb-strip">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              className={`shopverse-pdp__thumb-box ${idx === selectedImageIndex ? 'shopverse-pdp__thumb-box--active' : ''}`}
              onClick={() => setSelectedImageIndex(idx)}
              aria-label={`View angle ${idx + 1}`}
            >
              <img src={img} alt="" />
            </button>
          ))}
        </div>

        {/* Column 2: High-Resolution Center Showcase & Lightbox Trigger */}
        <div className="shopverse-pdp__center-showcase">
          <div
            className="shopverse-pdp__main-img-wrap"
            onClick={() => openLightbox(selectedImageIndex)}
            title="Click to expand high-resolution lightbox view"
          >
            <img
              src={images[selectedImageIndex] || '/images/no-image.svg'}
              alt={product.name}
              className="shopverse-pdp__main-img"
            />
            {discount > 0 && (
              <span className="shopverse-pdp__sale-badge">-{discount}% OFF</span>
            )}
            <div className="shopverse-pdp__zoom-hint">
              <Sparkles size={14} />
              <span>Expand Lightbox</span>
            </div>
          </div>
        </div>

        {/* Column 3: Product Details, Swatches, Sizing, CTA & Accordions */}
        <div className="shopverse-pdp__info">
          {product.brand && <span className="shopverse-pdp__brand">{product.brand}</span>}
          <h1 className="shopverse-pdp__title">{product.name}</h1>

          {/* Rating Summary */}
          <div className="shopverse-pdp__rating-row">
            <div className="shopverse-pdp__stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(product.rating || 5) ? 'var(--color-sage)' : 'none'}
                  stroke="var(--color-sage)"
                  strokeWidth={1.5}
                />
              ))}
            </div>
            <span className="shopverse-pdp__rating-val">{product.rating || '4.9'}</span>
            <span className="shopverse-pdp__reviews-count">({reviews.length || product.review_count || 12} Verified Reviews)</span>
          </div>

          {/* Price */}
          <div className="shopverse-pdp__price-row">
            <span className="shopverse-pdp__price">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="shopverse-pdp__original-price">
                ₹{Number(product.original_price).toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span className="shopverse-pdp__save-tag">
                Save ₹{Number(product.original_price - product.price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <p className="shopverse-pdp__desc">{product.description}</p>

          {/* Color Variants Swatches (Feature 2.2 & Feature 1.3) */}
          {((product.variants && product.variants.length > 0) || (product.colors && product.colors.length > 0)) && (
            <div className="shopverse-pdp__option-group">
              <span className="shopverse-pdp__option-label">
                Atelier Color: <strong>{getColorDisplayName(selectedColor)}</strong>
              </span>
              <div className="shopverse-pdp__swatches">
                {(product.variants && product.variants.length > 0 ? product.variants : product.colors).map(item => {
                  const isVariantObj = typeof item === 'object';
                  const colorName = isVariantObj ? item.color_name : getColorDisplayName(item);
                  const colorHex = isVariantObj ? (item.color_hex || getColorHexValue(colorName)) : getColorHexValue(item);
                  const isOutOfStock = isVariantObj && Number(item.stock || 0) <= 0;
                  const isSelected = getColorDisplayName(selectedColor) === colorName;

                  return (
                    <div key={isVariantObj ? item.id : colorName} className="shopverse-pdp__swatch-wrap">
                      <button
                        type="button"
                        className={`shopverse-pdp__swatch ${isSelected ? 'shopverse-pdp__swatch--active' : ''} ${isOutOfStock ? 'shopverse-pdp__swatch--disabled' : ''}`}
                        style={{ backgroundColor: colorHex }}
                        onClick={() => handleSelectColor(item)}
                        disabled={isOutOfStock}
                        title={colorName}
                        aria-label={`Select ${colorName} ${isOutOfStock ? '(Unavailable)' : ''}`}
                      />
                      {isOutOfStock && (
                        <span className="shopverse-pdp__swatch-tooltip">Currently not available</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="shopverse-pdp__option-group">
              <div className="shopverse-pdp__option-header">
                <span className="shopverse-pdp__option-label">
                  Architectural Size: <strong>{selectedSize}</strong>
                </span>
              </div>
              <div className="shopverse-pdp__sizes">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`shopverse-pdp__size-btn ${selectedSize === size ? 'shopverse-pdp__size-btn--active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="shopverse-pdp__purchase-stack" ref={ctaRef}>
            <div className="shopverse-pdp__qty-row">
              <div className="shopverse-pdp__qty-picker">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                  disabled={quantity >= stockCount}
                >
                  +
                </button>
              </div>

              <span className={`shopverse-pdp__stock-tag ${isAvailable ? '' : 'shopverse-pdp__stock-tag--out'}`}>
                {isAvailable ? `${stockCount} pieces in reserve` : 'Temporarily Out of Stock'}
              </span>
            </div>

            <div className="shopverse-pdp__btn-row">
              <button
                type="button"
                className={`shopverse-pdp__add-btn ${added ? 'shopverse-pdp__add-btn--success' : ''}`}
                onClick={handleAddToCart}
                disabled={!isAvailable}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    <span>Added to Shopping Bag</span>
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
                className={`shopverse-pdp__wishlist-btn ${isWishlisted ? 'shopverse-pdp__wishlist-btn--active' : ''}`}
                onClick={handleToggleWishlist}
                aria-label="Add to wishlist"
              >
                <Heart size={20} strokeWidth={1.5} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Collapsible Luxury Accordions (Feature 2.2) */}
          <div className="shopverse-pdp__accordions">
            <div className="shopverse-pdp__accordion">
              <button
                type="button"
                className="shopverse-pdp__accordion-header"
                onClick={() => toggleAccordion('fabric')}
              >
                <span>Fabric & Atelier Care</span>
                <ChevronRight size={16} className={`shopverse-pdp__accordion-icon ${openAccordion === 'fabric' ? 'shopverse-pdp__accordion-icon--open' : ''}`} />
              </button>
              {openAccordion === 'fabric' && (
                <div className="shopverse-pdp__accordion-body">
                  <p>
                    Crafted with premium natural fibers sourced through certified ethical partners.
                    Care: Specialized dry clean or gentle hand rinse in cool water. Lay flat in shade to dry.
                  </p>
                </div>
              )}
            </div>

            <div className="shopverse-pdp__accordion">
              <button
                type="button"
                className="shopverse-pdp__accordion-header"
                onClick={() => toggleAccordion('shipping')}
              >
                <span>Shipping & Carbon-Neutral Returns</span>
                <ChevronRight size={16} className={`shopverse-pdp__accordion-icon ${openAccordion === 'shipping' ? 'shopverse-pdp__accordion-icon--open' : ''}`} />
              </button>
              {openAccordion === 'shipping' && (
                <div className="shopverse-pdp__accordion-body">
                  <p>
                    Complimentary express dispatch across India within 2-4 business days.
                    Enjoy white-glove 30-day hassle-free doorstep returns in original archival packaging.
                  </p>
                </div>
              )}
            </div>

            <div className="shopverse-pdp__accordion">
              <button
                type="button"
                className="shopverse-pdp__accordion-header"
                onClick={() => toggleAccordion('fit')}
              >
                <span>Architectural Fit Guide</span>
                <ChevronRight size={16} className={`shopverse-pdp__accordion-icon ${openAccordion === 'fit' ? 'shopverse-pdp__accordion-icon--open' : ''}`} />
              </button>
              {openAccordion === 'fit' && (
                <div className="shopverse-pdp__accordion-body">
                  <p>
                    Tailored with relaxed draping and precise shoulder geometry.
                    Fits true to size. For an oversized editorial aesthetic, select one size up.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal (Feature 2.2) */}
      {lightboxOpen && (
        <div className="shopverse-lightbox" onClick={() => setLightboxOpen(false)}>
          <button
            type="button"
            className="shopverse-lightbox__close"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close Lightbox"
          >
            ×
          </button>
          <div className="shopverse-lightbox__content" onClick={e => e.stopPropagation()}>
            <img
              src={images[lightboxIndex] || images[0]}
              alt={product.name}
              className="shopverse-lightbox__img"
            />
          </div>
          {images.length > 1 && (
            <div className="shopverse-lightbox__nav" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="shopverse-lightbox__nav-btn"
                onClick={() => setLightboxIndex(prev => (prev - 1 + images.length) % images.length)}
              >
                ‹
              </button>
              <span>{lightboxIndex + 1} / {images.length}</span>
              <button
                type="button"
                className="shopverse-lightbox__nav-btn"
                onClick={() => setLightboxIndex(prev => (prev + 1) % images.length)}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky Add-to-Cart Bar (Feature 2.2) */}
      <div className={`shopverse-pdp__mobile-sticky-bar ${showStickyBar ? 'shopverse-pdp__mobile-sticky-bar--visible' : ''}`}>
        <div className="shopverse-pdp__mobile-sticky-inner">
          <img src={images[selectedImageIndex] || product.image_url} alt="" className="shopverse-pdp__mobile-sticky-thumb" />
          <div className="shopverse-pdp__mobile-sticky-meta">
            <strong>{product.name}</strong>
            <span>₹{Number(product.price).toLocaleString('en-IN')}</span>
          </div>
          <button
            type="button"
            className={`shopverse-pdp__mobile-sticky-btn ${added ? 'shopverse-pdp__mobile-sticky-btn--success' : ''}`}
            onClick={handleAddToCart}
            disabled={!isAvailable}
          >
            {added ? 'Added!' : 'Add to Bag'}
          </button>
        </div>
      </div>

      {/* Editorial Information Tabs */}
      <section className="shopverse-pdp__tabs-section">
        <div className="shopverse-pdp__tab-headers">
          <button
            type="button"
            className={`shopverse-pdp__tab-btn ${activeTab === 'description' ? 'shopverse-pdp__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Design & Details
          </button>
          <button
            type="button"
            className={`shopverse-pdp__tab-btn ${activeTab === 'specs' ? 'shopverse-pdp__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Materiality & Craft
          </button>
          <button
            type="button"
            className={`shopverse-pdp__tab-btn ${activeTab === 'reviews' ? 'shopverse-pdp__tab-btn--active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            Client Reviews ({reviews.length})
          </button>
        </div>

        <div className="shopverse-pdp__tab-body">
          {activeTab === 'description' && (
            <div className="shopverse-pdp__tab-pane">
              <p>{product.description}</p>
              <p>
                Each piece in our capsule is manufactured in limited editions under rigorous ethical conditions,
                combining artisanal heritage with clean, contemporary silhouettes.
              </p>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="shopverse-pdp__tab-pane">
              <table className="shopverse-pdp__specs-table">
                <tbody>
                  <tr>
                    <th>Category</th>
                    <td>{product.category}</td>
                  </tr>
                  <tr>
                    <th>Brand Atelier</th>
                    <td>{product.brand || 'Shopverse Collection'}</td>
                  </tr>
                  <tr>
                    <th>Available Palettes</th>
                    <td>{product.colors?.map(getColorDisplayName).join(', ') || 'Natural'}</td>
                  </tr>
                  <tr>
                    <th>Sizing</th>
                    <td>{product.sizes?.join(', ') || 'Universal'}</td>
                  </tr>
                  <tr>
                    <th>Care Instructions</th>
                    <td>Dry clean only or white-glove hand rinse in cool water.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="shopverse-pdp__tab-pane">
              {/* Review Submission Form */}
              <form onSubmit={handleReviewSubmit} className="shopverse-pdp__review-form">
                <h4>Share Your Experience</h4>
                <div className="shopverse-pdp__review-rating-select">
                  <span>Rating:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="shopverse-pdp__star-btn"
                    >
                      <Star
                        size={18}
                        fill={star <= reviewRating ? 'var(--color-sage)' : 'none'}
                        stroke="var(--color-sage)"
                      />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Your Name (e.g. Eleanor V.)"
                  required
                  value={reviewAuthor}
                  onChange={e => setReviewAuthor(e.target.value)}
                  className="shopverse-pdp__input"
                />

                <textarea
                  rows={3}
                  placeholder="Describe the fit, craftsmanship, and aesthetic feeling..."
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="shopverse-pdp__textarea"
                />

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="shopverse-pdp__submit-review-btn"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>

              {/* Reviews List */}
              <div className="shopverse-pdp__reviews-list">
                {reviews.length === 0 ? (
                  <p className="shopverse-pdp__no-reviews">No reviews submitted yet. Be the first to share your perspective.</p>
                ) : (
                  reviews.map((rev, idx) => (
                    <div key={idx} className="shopverse-pdp__review-item">
                      <div className="shopverse-pdp__review-header">
                        <div className="shopverse-pdp__stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < rev.rating ? 'var(--color-sage)' : 'none'}
                              stroke="var(--color-sage)"
                            />
                          ))}
                        </div>
                        <strong>{rev.user_name}</strong>
                        <span className="shopverse-badge shopverse-badge--sage">Verified Client</span>
                      </div>
                      <p className="shopverse-pdp__review-text">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="shopverse-section" style={{ marginTop: 80 }}>
          <div className="shopverse-section__header">
            <div>
              <span className="shopverse-section__eyebrow">Pair With</span>
              <h2 className="shopverse-section__title">Complete The Look</h2>
            </div>
          </div>
          <div className="shopverse-home__arrivals-grid">
            {recommendations.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Scroller */}
      {recentlyViewed.length > 0 && (
        <section className="shopverse-section" style={{ marginTop: 60 }}>
          <ProductScroller
            title="Recently Viewed"
            subtitle="Pieces you explored during this session"
            products={recentlyViewed}
          />
        </section>
      )}
    </div>
  );
}
