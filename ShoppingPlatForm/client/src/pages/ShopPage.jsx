import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal, X, Search, ChevronDown, ChevronUp, ChevronRight,
  Sparkles, ShieldCheck, Check, RotateCcw
} from 'lucide-react';
import ProductCard from '../components/Home/ProductCard';
import QuickViewModal from '../components/Product/QuickViewModal';
import { api } from '../utils/api';
import { debounce } from '../utils/helpers';
import { getColorDisplayName, getColorHexValue } from '../utils/colors';
import './ShopPage.css';

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'rating', label: 'Highest Rated' },
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [filterData, setFilterData] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Active Filter state from URL
  const activeCategory = searchParams.get('category') || '';
  const activeBrand = searchParams.get('brand') || '';
  const activeSort = searchParams.get('sortBy') || 'featured';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeInStock = searchParams.get('inStock') !== 'false'; // default true
  const activeColors = searchParams.get('colors') || '';
  const activeMaterials = searchParams.get('materials') || '';
  const activeGender = searchParams.get('gender') || 'all';
  const activeStyle = searchParams.get('style') || '';
  const activeDeals = searchParams.get('onSale') === 'true';

  // Section collapse states
  const [expanded, setExpanded] = useState({
    category: true,
    price: true,
    brand: true,
    colors: true,
    gender: true,
    style: true,
    materials: true,
  });

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateParam = useCallback((key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const toggleMultiSelect = useCallback((key, item) => {
    const current = searchParams.get(key) ? searchParams.get(key).split(',') : [];
    const index = current.indexOf(item);
    let next;
    if (index >= 0) {
      next = current.filter(x => x !== item);
    } else {
      next = [...current, item];
    }
    updateParam(key, next.join(','));
  }, [searchParams, updateParam]);

  const clearAllFilters = () => {
    setSearchParams({});
  };

  // Fetch Categories
  useEffect(() => {
    api.get('/api/categories').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  // Fetch Dynamic Filter metadata & Live Color Palette (Feature 1.4)
  useEffect(() => {
    const cat = activeCategory || 'all';
    Promise.all([
      api.get(`/api/filters/${cat}`),
      api.get(`/api/filters/colors${activeCategory ? `?category=${encodeURIComponent(activeCategory)}` : ''}`)
    ]).then(([filterRes, colorRes]) => {
      const data = filterRes.data || {};
      if (colorRes.data && Array.isArray(colorRes.data) && colorRes.data.length > 0) {
        data.colorObjects = colorRes.data;
        data.colors = colorRes.data.map(c => c.name);
      }
      setFilterData(data);
    }).catch(() => {});
  }, [activeCategory]);

  // Fetch Products based on URL query
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams);
    if (!params.has('limit')) params.set('limit', '24');
    if (!params.has('inStock')) params.set('inStock', 'true');

    api.get(`/api/products?${params.toString()}`)
      .then(res => {
        setProducts(res.data || []);
        setTotalCount(res.meta?.total || (res.data?.length || 0));
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Active filter count
  const activeFilterList = useMemo(() => {
    const list = [];
    if (activeCategory) list.push({ key: 'category', label: `Category: ${activeCategory}`, value: '' });
    if (activeBrand) {
      activeBrand.split(',').forEach(b => list.push({ key: 'brand', multi: true, label: `Brand: ${b}`, value: b }));
    }
    if (activeMinPrice || activeMaxPrice) {
      list.push({ key: 'price', label: `Price: ₹${activeMinPrice || '0'} - ₹${activeMaxPrice || 'Max'}`, clearKeys: ['minPrice', 'maxPrice'] });
    }
    if (activeColors) {
      activeColors.split(',').forEach(c => list.push({
        key: 'colors',
        multi: true,
        label: `Color: ${getColorDisplayName(c)}`,
        colorSwatch: getColorHexValue(c),
        value: c
      }));
    }
    if (activeGender && activeGender !== 'all') list.push({ key: 'gender', label: `Gender: ${activeGender}`, value: '' });
    if (activeStyle) {
      activeStyle.split(',').forEach(s => list.push({ key: 'style', multi: true, label: `Style: ${s}`, value: s }));
    }
    if (activeDeals) list.push({ key: 'onSale', label: 'On Sale', value: '' });
    if (searchParams.get('q')) list.push({ key: 'q', label: `Search: "${searchParams.get('q')}"`, value: '' });
    return list;
  }, [activeCategory, activeBrand, activeMinPrice, activeMaxPrice, activeColors, activeGender, activeStyle, activeDeals, searchParams]);

  return (
    <div className="shopverse-shop">
      <div className="shopverse-shop__layout">
        {/* Toggleable Flush Filter Sidebar (Desktop) */}
        <aside className={`shopverse-sidebar ${sidebarOpen ? 'shopverse-sidebar--open' : 'shopverse-sidebar--collapsed'}`}>
          {sidebarOpen ? (
            <div className="shopverse-sidebar__inner">
              <div className="shopverse-sidebar__top">
                <span className="shopverse-sidebar__heading">Filter Products</span>
                <button
                  type="button"
                  className="shopverse-sidebar__collapse-btn"
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse filters"
                >
                  <SlidersHorizontal size={18} strokeWidth={1.5} />
                </button>
              </div>

              {activeFilterList.length > 0 && (
                <button type="button" className="shopverse-sidebar__clear-all" onClick={clearAllFilters}>
                  <RotateCcw size={14} />
                  <span>Reset All Filters</span>
                </button>
              )}

              {/* Category Filter */}
              <div className="shopverse-filter-group">
                <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('category')}>
                  <span>Category</span>
                  {expanded.category ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.category && (
                  <div className="shopverse-filter-group__body">
                    <label className={`shopverse-radio ${!activeCategory ? 'shopverse-radio--active' : ''}`}>
                      <input type="radio" name="cat" checked={!activeCategory} onChange={() => updateParam('category', '')} />
                      <span>All Categories</span>
                    </label>
                    {categories.map(c => (
                      <label key={c.id} className={`shopverse-radio ${activeCategory.toLowerCase() === c.name.toLowerCase() ? 'shopverse-radio--active' : ''}`}>
                        <input
                          type="radio"
                          name="cat"
                          checked={activeCategory.toLowerCase() === c.name.toLowerCase()}
                          onChange={() => updateParam('category', c.name.toLowerCase())}
                        />
                        <span>{c.name}</span>
                        <span className="shopverse-filter-count">{c.product_count}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Stock Status Toggle */}
              <div className="shopverse-filter-group">
                <label className="shopverse-toggle-row">
                  <span>In Stock Only</span>
                  <input
                    type="checkbox"
                    className="shopverse-toggle-input"
                    checked={activeInStock}
                    onChange={e => updateParam('inStock', e.target.checked ? 'true' : 'false')}
                  />
                  <span className="shopverse-toggle-slider" />
                </label>
              </div>

              {/* Price Range */}
              <div className="shopverse-filter-group">
                <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('price')}>
                  <span>Price Range (₹)</span>
                  {expanded.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.price && (
                  <div className="shopverse-filter-group__body">
                    <div className="shopverse-price-inputs">
                      <input
                        type="number"
                        placeholder="Min"
                        value={activeMinPrice}
                        onChange={e => updateParam('minPrice', e.target.value)}
                        className="shopverse-price-input"
                      />
                      <span>—</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={activeMaxPrice}
                        onChange={e => updateParam('maxPrice', e.target.value)}
                        className="shopverse-price-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Brand Filter */}
              {filterData?.brands && filterData.brands.length > 0 && (
                <div className="shopverse-filter-group">
                  <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('brand')}>
                    <span>Brand</span>
                    {expanded.brand ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded.brand && (
                    <div className="shopverse-filter-group__body">
                      {filterData.brands.map(b => {
                        const isChecked = activeBrand.split(',').includes(b.name);
                        return (
                          <label key={b.name} className="shopverse-checkbox">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMultiSelect('brand', b.name)}
                            />
                            <span className="shopverse-checkbox__custom" />
                            <span>{b.name}</span>
                            <span className="shopverse-filter-count">{b.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Color Swatches */}
              {((filterData?.colorObjects && filterData.colorObjects.length > 0) || (filterData?.colors && filterData.colors.length > 0)) && (
                <div className="shopverse-filter-group">
                  <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('colors')}>
                    <span>Color Swatches</span>
                    {expanded.colors ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded.colors && (
                    <div className="shopverse-swatch-grid">
                      {(filterData.colorObjects || filterData.colors).map(colorItem => {
                        const colorName = typeof colorItem === 'object' ? colorItem.name : colorItem;
                        const colorHex = typeof colorItem === 'object' ? (colorItem.hex || getColorHexValue(colorName)) : getColorHexValue(colorItem);
                        const isSelected = activeColors.split(',').includes(colorName);
                        return (
                          <button
                            key={colorName}
                            type="button"
                            className={`shopverse-swatch-btn ${isSelected ? 'shopverse-swatch-btn--active' : ''}`}
                            style={{ backgroundColor: colorHex }}
                            onClick={() => toggleMultiSelect('colors', colorName)}
                            title={getColorDisplayName(colorName)}
                            aria-label={`Filter by ${getColorDisplayName(colorName)}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Gender Segmented Control */}
              <div className="shopverse-filter-group">
                <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('gender')}>
                  <span>Gender</span>
                  {expanded.gender ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                {expanded.gender && (
                  <div className="shopverse-segmented-control">
                    {GENDER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`shopverse-segmented-btn ${activeGender === opt.value ? 'shopverse-segmented-btn--active' : ''}`}
                        onClick={() => updateParam('gender', opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Style Pills */}
              {filterData?.styles && filterData.styles.length > 0 && (
                <div className="shopverse-filter-group">
                  <button type="button" className="shopverse-filter-group__header" onClick={() => toggleSection('style')}>
                    <span>Aesthetic / Style</span>
                    {expanded.style ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded.style && (
                    <div className="shopverse-pill-grid">
                      {filterData.styles.map(style => {
                        const isSelected = activeStyle.split(',').includes(style);
                        return (
                          <button
                            key={style}
                            type="button"
                            className={`shopverse-pill ${isSelected ? 'shopverse-pill--active' : ''}`}
                            onClick={() => toggleMultiSelect('style', style)}
                          >
                            {style}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Icon Bar (60px) */
            <div className="shopverse-sidebar__collapsed-bar">
              <button
                type="button"
                className="shopverse-sidebar__expand-btn"
                onClick={() => setSidebarOpen(true)}
                title="Expand filters"
              >
                <SlidersHorizontal size={20} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </aside>

        {/* 3. Main Product Area */}
        <main className="shopverse-shop__main">
          {/* Top Bar: Controls & Active Chips */}
          <div className="shopverse-shop__top-bar">
            <div className="shopverse-shop__top-left">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                className="shopverse-shop__mobile-filter-btn"
                onClick={() => setMobileDrawerOpen(true)}
              >
                <SlidersHorizontal size={18} />
                <span>Filters</span>
                {activeFilterList.length > 0 && (
                  <span className="shopverse-shop__filter-badge">{activeFilterList.length}</span>
                )}
              </button>

              <span className="shopverse-shop__product-count">
                Showing {products.length} of {totalCount} products
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="shopverse-shop__sort-wrap">
              <select
                className="shopverse-shop__sort-select"
                value={activeSort}
                onChange={e => updateParam('sortBy', e.target.value)}
                aria-label="Sort products"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilterList.length > 0 && (
            <div className="shopverse-active-chips">
              {activeFilterList.map((chip, idx) => (
                <div key={idx} className="shopverse-chip">
                  {chip.colorSwatch && (
                    <span className="shopverse-chip__swatch" style={{ backgroundColor: chip.colorSwatch }} />
                  )}
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    className="shopverse-chip__remove"
                    onClick={() => {
                      if (chip.clearKeys) {
                        chip.clearKeys.forEach(k => updateParam(k, ''));
                      } else if (chip.multi) {
                        toggleMultiSelect(chip.key, chip.value);
                      } else {
                        updateParam(chip.key, '');
                      }
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button type="button" className="shopverse-chip__clear-link" onClick={clearAllFilters}>
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="shopverse-shop__grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shopverse-shop__skeleton-card">
                  <div className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '3/4' }} />
                  <div style={{ padding: '20px 16px' }}>
                    <div className="skeleton-shimmer" style={{ width: '40%', height: 12, marginBottom: 12 }} />
                    <div className="skeleton-shimmer" style={{ width: '85%', height: 18, marginBottom: 12 }} />
                    <div className="skeleton-shimmer" style={{ width: '35%', height: 18 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="shopverse-shop__empty">
              <h2 className="shopverse-shop__empty-title">No matching pieces found</h2>
              <p className="shopverse-shop__empty-text">
                Try loosening your filter selections or explore our complete catalogue.
              </p>
              <button type="button" className="shopverse-shop__empty-btn" onClick={clearAllFilters}>
                <span>Reset All Filters</span>
                <RotateCcw size={16} />
              </button>
            </div>
          ) : (
            <div className="shopverse-shop__grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="shopverse-drawer-overlay" onClick={() => setMobileDrawerOpen(false)}>
          <div className="shopverse-drawer" onClick={e => e.stopPropagation()}>
            <div className="shopverse-drawer__header">
              <span className="shopverse-drawer__title">Refine Search</span>
              <button type="button" className="shopverse-drawer__close" onClick={() => setMobileDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {/* Same filter items inside drawer */}
            <div className="shopverse-drawer__body">
              {/* Category */}
              <div className="shopverse-filter-group">
                <span className="shopverse-filter-group__heading">Category</span>
                <div className="shopverse-filter-group__body">
                  <label className={`shopverse-radio ${!activeCategory ? 'shopverse-radio--active' : ''}`}>
                    <input type="radio" name="m-cat" checked={!activeCategory} onChange={() => { updateParam('category', ''); setMobileDrawerOpen(false); }} />
                    <span>All Categories</span>
                  </label>
                  {categories.map(c => (
                    <label key={c.id} className={`shopverse-radio ${activeCategory.toLowerCase() === c.name.toLowerCase() ? 'shopverse-radio--active' : ''}`}>
                      <input
                        type="radio"
                        name="m-cat"
                        checked={activeCategory.toLowerCase() === c.name.toLowerCase()}
                        onChange={() => { updateParam('category', c.name.toLowerCase()); setMobileDrawerOpen(false); }}
                      />
                      <span>{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
