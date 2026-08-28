import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from '../CartContext';
import { api, resolveImageUrl } from '../utils/api';
import { debounce } from '../utils/helpers';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, openDrawer } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartBounce, setCartBounce] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  // Fetch wishlist count
  useEffect(() => {
    api.get('/api/wishlist')
      .then(res => setWishlistCount(res.data?.length || 0))
      .catch(() => {});
  }, [location.pathname]);

  // Cart badge bounce on item addition
  const prevCartCount = React.useRef(cartCount);
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 400);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = React.useRef(null);

  const debouncedSearch = useMemo(() => debounce(async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get(`/api/products/search?q=${encodeURIComponent(q)}&limit=4`);
      setSuggestions(res.data || []);
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
  }, 250), []);

  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setSearchQuery(val);
    debouncedSearch(val);
  }, [debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setMobileSearchOpen(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('');
      setShowSuggestions(false);
      setIsSearchFocused(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const handleSelectSuggestion = (product) => {
    navigate(`/product/${product.id}`);
    setShowSuggestions(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className={`shopverse-navbar ${scrolled ? 'shopverse-navbar--scrolled' : ''}`}>
        <div className="shopverse-navbar__container">
          {/* Left: Brand Logo */}
          <Link to="/" className="shopverse-navbar__brand" aria-label="Shopverse Home">
            Shopverse
          </Link>

          {/* Center: Morphing Luxury Search Bar (Phase 3 - Feature 3.1) */}
          <div
            className={`shopverse-navbar__center ${
              isSearchFocused
                ? 'shopverse-navbar__center--focused'
                : searchQuery
                ? 'shopverse-navbar__center--has-text'
                : 'shopverse-navbar__center--collapsed'
            }`}
          >
            <form onSubmit={handleSearchSubmit} className="shopverse-navbar__search-form">
              <button
                type="button"
                className="shopverse-navbar__search-icon-btn"
                onClick={() => searchInputRef.current?.focus()}
                aria-label="Focus search"
              >
                <Search size={18} className="shopverse-navbar__search-icon" strokeWidth={1.5} />
              </button>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search atelier catalogue..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setIsSearchFocused(true);
                  if (searchQuery.length >= 2) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    setIsSearchFocused(false);
                    setShowSuggestions(false);
                  }, 200);
                }}
                onKeyDown={handleKeyDown}
                className="shopverse-navbar__search-input"
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="shopverse-navbar__search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  aria-label="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
            </form>

            {/* Suggestions Dropdown (Max 4 results) */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="shopverse-navbar__dropdown">
                {suggestions.slice(0, 4).map(product => (
                  <button
                    key={product.id}
                    type="button"
                    className="shopverse-navbar__dropdown-item"
                    onMouseDown={() => handleSelectSuggestion(product)}
                  >
                    <img
                      src={resolveImageUrl(product.image_url)}
                      alt={product.name}
                      className="shopverse-navbar__dropdown-thumb"
                      onError={e => { e.currentTarget.src = '/images/no-image.svg'; }}
                    />
                    <div className="shopverse-navbar__dropdown-info">
                      <span className="shopverse-navbar__dropdown-name">{product.name}</span>
                      <span className="shopverse-navbar__dropdown-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
                    </div>
                    <ChevronRight size={16} className="shopverse-navbar__dropdown-arrow" />
                  </button>
                ))}
                <button
                  type="button"
                  className="shopverse-navbar__dropdown-view-all"
                  onMouseDown={handleSearchSubmit}
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            )}
          </div>

          {/* Right: Navigation Cluster */}
          <div className="shopverse-navbar__right">
            <nav className="shopverse-navbar__links">
              <Link to="/" className={`shopverse-navbar__link ${isActive('/') ? 'shopverse-navbar__link--active' : ''}`}>
                Home
              </Link>
              <Link to="/shop" className={`shopverse-navbar__link ${isActive('/shop') ? 'shopverse-navbar__link--active' : ''}`}>
                Shop
              </Link>
            </nav>

            <div className="shopverse-navbar__icons">
              {/* Mobile Search Button */}
              <button
                className="shopverse-navbar__icon-btn shopverse-navbar__icon-btn--mobile-search"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                aria-label="Search"
              >
                <Search size={22} strokeWidth={1.5} />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="shopverse-navbar__icon-btn" aria-label="Watchlist">
                <Heart size={22} strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="shopverse-navbar__badge">{wishlistCount}</span>
                )}
              </Link>

              {/* Cart Toggle */}
              <button
                className="shopverse-navbar__icon-btn"
                onClick={openDrawer}
                aria-label={`Cart with ${cartCount} items`}
              >
                <ShoppingBag size={22} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className={`shopverse-navbar__badge ${cartBounce ? 'shopverse-navbar__badge--bounce' : ''}`}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Profile / Admin Link */}
              <Link to="/admin" className="shopverse-navbar__icon-btn" aria-label="Account / Admin">
                <User size={22} strokeWidth={1.5} />
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="shopverse-navbar__hamburger"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="shopverse-navbar__mobile-search">
            <form onSubmit={handleSearchSubmit} className="shopverse-navbar__search-form">
              <Search size={18} strokeWidth={1.5} className="shopverse-navbar__search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                autoFocus
                className="shopverse-navbar__search-input"
              />
              <button
                type="button"
                className="shopverse-navbar__search-clear"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Mobile Nav Menu Drawer */}
        {mobileMenuOpen && (
          <div className="shopverse-navbar__mobile-menu">
            <Link to="/" className="shopverse-navbar__mobile-link">Home</Link>
            <Link to="/shop" className="shopverse-navbar__mobile-link">Shop</Link>
            <Link to="/wishlist" className="shopverse-navbar__mobile-link">
              Watchlist {wishlistCount > 0 && `(${wishlistCount})`}
            </Link>
            <Link to="/admin" className="shopverse-navbar__mobile-link">Account / Admin</Link>
          </div>
        )}
      </header>

      {/* Spacer for sticky navbar */}
      <div className="shopverse-navbar-spacer" />
    </>
  );
}
