import React, { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Package, Tag, Megaphone, BarChart3, Plus, Trash2,
  Edit, Upload, Check, LogOut, Image, Film, AlertCircle, Sparkles, Palette, X
} from 'lucide-react';
import { api, resolveImageUrl } from './utils/api';
import { LUXURY_COLOR_PRESETS, getColorDisplayName, getColorHexValue, suggestAiColors } from './utils/colors';
import './AdminDashboard.css';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [ads, setAds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  // Bulk Product Form (3-5 Dynamic Rows with AI color support)
  const [bulkRows, setBulkRows] = useState([
    { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Deep Spruce', 'Warm Ivory'] },
    { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Obsidian Black'] },
    { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Alpine Teal', 'Midnight Peacock'] },
  ]);

  // Promo Code Form
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '0',
    max_uses: '500',
    expiry_date: '',
  });

  // Ad Form
  const [adForm, setAdForm] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    target_category: 'clothing',
    cta_text: 'Explore Collection',
  });

  // Discount Manager State
  const [discountModalProduct, setDiscountModalProduct] = useState(null);
  const [discountValue, setDiscountValue] = useState(0);

  // Bulk row deletion animation state
  const [removingRowIndex, setRemovingRowIndex] = useState(null);

  // Color Manager & Multi-Photo Variant Manager State
  const [colorModalProduct, setColorModalProduct] = useState(null);
  const [productVariants, setProductVariants] = useState([]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#355E58');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const fetchSellerData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, promoRes, adRes, catRes] = await Promise.all([
        api.get('/api/seller/products'),
        api.get('/api/seller/promo-codes'),
        api.get('/api/advertisements'),
        api.get('/api/categories'),
      ]);

      setProducts(prodRes.data || []);
      setPromoCodes(promoRes.data || []);
      setAds(adRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Failed to load seller portal', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  const showStatus = (msg, isError = false) => {
    setStatusMessage({ text: msg, isError });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Bulk Product Creation
  const handleBulkChange = (index, field, value) => {
    setBulkRows(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleBulkAiColors = (index) => {
    const row = bulkRows[index];
    const aiColors = suggestAiColors({
      name: row.name,
      category: row.category,
      image_url: row.image_url,
    });
    const colorNames = aiColors.map(c => c.name);
    handleBulkChange(index, 'colors', colorNames);
    showStatus(`AI detected palette for Item #${index + 1}: ${colorNames.join(', ')}`);
  };

  const addBulkRow = () => {
    setBulkRows(prev => [
      ...prev,
      { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Warm Ivory'] }
    ]);
  };

  const handleRemoveBulkRow = (index) => {
    setRemovingRowIndex(index);
    setTimeout(() => {
      setBulkRows(prev => prev.filter((_, i) => i !== index));
      setRemovingRowIndex(null);
    }, 250);
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const validRows = bulkRows.filter(r => r.name.trim() && Number(r.price) > 0);
    if (validRows.length === 0) {
      showStatus('Please enter at least one product with name and price', true);
      return;
    }

    try {
      await api.post('/api/seller/products', validRows);
      showStatus(`Successfully published ${validRows.length} products to catalogue`);
      setBulkRows([
        { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Deep Spruce'] },
        { name: '', price: '', category: 'clothing', stock: '10', image_url: '', discount_percentage: '0', colors: ['Warm Ivory'] }
      ]);
      fetchSellerData();
    } catch (err) {
      showStatus(err.message || 'Failed to publish products', true);
    }
  };

  // Promo Code Creation
  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoForm.code.trim() || !promoForm.discount_value) {
      showStatus('Code and discount value required', true);
      return;
    }

    try {
      await api.post('/api/seller/promo-codes', promoForm);
      showStatus(`Promo code ${promoForm.code.toUpperCase()} created successfully`);
      setPromoForm({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_value: '0',
        max_uses: '500',
        expiry_date: '',
      });
      fetchSellerData();
    } catch (err) {
      showStatus(err.message || 'Failed to create promo code', true);
    }
  };

  // Ad Creation
  const handleAdSubmit = async (e) => {
    e.preventDefault();
    if (!adForm.title.trim() || !adForm.image_url.trim()) {
      showStatus('Title and image URL required', true);
      return;
    }

    try {
      await api.post('/api/advertisements', adForm);
      showStatus('Campaign advertisement submitted successfully');
      setAdForm({
        title: '',
        subtitle: '',
        image_url: '',
        target_category: 'clothing',
        cta_text: 'Explore Collection',
      });
      fetchSellerData();
    } catch (err) {
      showStatus(err.message || 'Failed to create advertisement', true);
    }
  };

  // Discount Update
  const handleUpdateDiscount = async (e) => {
    e.preventDefault();
    if (!discountModalProduct) return;

    try {
      await api.put(`/api/seller/products/${discountModalProduct.id}/discount`, {
        discount_percentage: discountValue,
        original_price: discountModalProduct.original_price || discountModalProduct.price,
      });
      showStatus(`Discount for ${discountModalProduct.name} updated to ${discountValue}%`);
      setDiscountModalProduct(null);
      fetchSellerData();
    } catch (err) {
      showStatus(err.message || 'Failed to update discount', true);
    }
  };

  // Multi-Photo Color Variant Manager Actions (Feature 1.1)
  const openColorModal = async (product) => {
    setColorModalProduct(product);
    try {
      const res = await api.get(`/api/products/${product.id}/variants`);
      if (res.data?.length > 0) {
        setProductVariants(res.data.map(v => ({
          color_name: v.color_name,
          color_hex: v.color_hex || getColorHexValue(v.color_name),
          image_url: v.image_url,
          stock: v.stock ?? 10
        })));
      } else {
        setProductVariants([
          {
            color_name: 'Midnight Black',
            color_hex: '#1A1A1A',
            image_url: product.image_url || '',
            stock: product.stock || 10
          }
        ]);
      }
    } catch {
      setProductVariants([
        {
          color_name: 'Midnight Black',
          color_hex: '#1A1A1A',
          image_url: product.image_url || '',
          stock: product.stock || 10
        }
      ]);
    }
  };

  const handleVariantChange = (index, field, value) => {
    setProductVariants(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'color_name') {
        const hex = getColorHexValue(value);
        if (hex && hex !== '#355E58') {
          copy[index].color_hex = hex;
        }
      }
      return copy;
    });
  };

  const handleAddVariantRow = () => {
    setProductVariants(prev => [
      ...prev,
      {
        color_name: 'Arctic White',
        color_hex: '#FFFFFF',
        image_url: colorModalProduct?.image_url || '',
        stock: 10
      }
    ]);
  };

  const handleRemoveVariantRow = (index) => {
    if (productVariants.length <= 1) {
      showStatus('Product must have at least 1 color variant', true);
      return;
    }
    setProductVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiAutoDetectColors = async () => {
    if (!colorModalProduct) return;
    setIsAiAnalyzing(true);

    try {
      const res = await api.post('/api/ai/suggest-colors', {
        name: colorModalProduct.name,
        description: colorModalProduct.description,
        category: colorModalProduct.category,
        image_url: colorModalProduct.image_url,
      });

      const detected = res.data?.colors || [];
      if (detected.length > 0) {
        setProductVariants(detected.map((c, i) => ({
          color_name: c.name,
          color_hex: c.hex,
          image_url: colorModalProduct.image_url,
          stock: 10 + i * 2
        })));
        showStatus(`AI detected and created ${detected.length} color variants!`);
      }
    } catch (err) {
      const fallback = suggestAiColors({
        name: colorModalProduct.name,
        description: colorModalProduct.description,
        category: colorModalProduct.category,
        image_url: colorModalProduct.image_url,
      });
      setProductVariants(fallback.map((c, i) => ({
        color_name: c.name,
        color_hex: c.hex,
        image_url: colorModalProduct.image_url,
        stock: 10 + i * 2
      })));
      showStatus(`AI generated palette variants: ${fallback.map(f => f.name).join(', ')}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleSaveVariants = async () => {
    if (!colorModalProduct) return;
    const validVariants = productVariants.filter(v => v.color_name && v.image_url);
    if (validVariants.length === 0) {
      showStatus('Please specify at least one valid color variant with image', true);
      return;
    }

    try {
      await api.post(`/api/seller/products/${colorModalProduct.id}/variants`, { variants: validVariants });
      await api.put(`/api/seller/products/${colorModalProduct.id}/colors`, {
        colors: validVariants.map(v => v.color_name)
      });
      showStatus(`Saved ${validVariants.length} color variants for ${colorModalProduct.name}`);
      setColorModalProduct(null);
      fetchSellerData();
    } catch (err) {
      showStatus(err.message || 'Failed to save variants', true);
    }
  };

  return (
    <div className="shopverse-admin">
      {/* Sidebar Navigation */}
      <aside className="shopverse-admin__sidebar">
        <div className="shopverse-admin__brand-box">
          <span className="shopverse-admin__brand-logo">Shopverse</span>
          <span className="shopverse-admin__brand-role">
            {user?.role === 'admin' ? 'Master Admin' : user?.brand_name || 'Merchant Atelier'}
          </span>
        </div>

        <nav className="shopverse-admin__nav">
          <button
            type="button"
            className={`shopverse-admin__nav-item ${activeTab === 'dashboard' ? 'shopverse-admin__nav-item--active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`shopverse-admin__nav-item ${activeTab === 'products' ? 'shopverse-admin__nav-item--active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>Catalogue ({products.length})</span>
          </button>

          <button
            type="button"
            className={`shopverse-admin__nav-item ${activeTab === 'bulk' ? 'shopverse-admin__nav-item--active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            <Upload size={18} />
            <span>Bulk Upload</span>
          </button>

          <button
            type="button"
            className={`shopverse-admin__nav-item ${activeTab === 'promos' ? 'shopverse-admin__nav-item--active' : ''}`}
            onClick={() => setActiveTab('promos')}
          >
            <Tag size={18} />
            <span>Promo Codes ({promoCodes.length})</span>
          </button>

          <button
            type="button"
            className={`shopverse-admin__nav-item ${activeTab === 'ads' ? 'shopverse-admin__nav-item--active' : ''}`}
            onClick={() => setActiveTab('ads')}
          >
            <Megaphone size={18} />
            <span>Carousel Ads ({ads.length})</span>
          </button>
        </nav>

        <div className="shopverse-admin__user-box">
          <div className="shopverse-admin__user-info">
            <span className="shopverse-admin__username">{user?.username || 'Merchant'}</span>
            <span className="shopverse-admin__user-email">{user?.email || 'authenticated'}</span>
          </div>
          <button type="button" className="shopverse-admin__logout-btn" onClick={onLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="shopverse-admin__main">
        {statusMessage && (
          <div className={`shopverse-admin__status-toast ${statusMessage.isError ? 'shopverse-admin__status-toast--error' : ''}`}>
            {statusMessage.isError ? <AlertCircle size={18} /> : <Check size={18} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div className="shopverse-admin__tab-pane">
            <div className="shopverse-admin__header">
              <h1 className="shopverse-admin__title">Merchant Overview</h1>
              <p className="shopverse-admin__subtitle">Real-time inventory and sales metrics</p>
            </div>

            <div className="shopverse-metrics-grid">
              <div className="shopverse-metric-card">
                <span className="shopverse-metric-card__label">Active Catalogue</span>
                <strong className="shopverse-metric-card__value">{products.length}</strong>
                <span className="shopverse-metric-card__hint">Published items</span>
              </div>
              <div className="shopverse-metric-card">
                <span className="shopverse-metric-card__label">Active Promo Codes</span>
                <strong className="shopverse-metric-card__value">{promoCodes.length}</strong>
                <span className="shopverse-metric-card__hint">Live vouchers</span>
              </div>
              <div className="shopverse-metric-card">
                <span className="shopverse-metric-card__label">Campaign Ads</span>
                <strong className="shopverse-metric-card__value">{ads.length}</strong>
                <span className="shopverse-metric-card__hint">Carousel banners</span>
              </div>
              <div className="shopverse-metric-card">
                <span className="shopverse-metric-card__label">Total Reserve Stock</span>
                <strong className="shopverse-metric-card__value">
                  {products.reduce((acc, p) => acc + Number(p.stock || 0), 0)}
                </strong>
                <span className="shopverse-metric-card__hint">Available units</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products Catalogue Table */}
        {activeTab === 'products' && (
          <div className="shopverse-admin__tab-pane">
            <div className="shopverse-admin__header shopverse-admin__header--between">
              <div>
                <h1 className="shopverse-admin__title">Catalogue Inventory</h1>
                <p className="shopverse-admin__subtitle">Manage products, multi-photo color variants, and discounts</p>
              </div>
              <button
                type="button"
                className="shopverse-admin__btn shopverse-admin__btn--primary"
                onClick={() => setActiveTab('bulk')}
              >
                <Plus size={16} />
                <span>Add Products</span>
              </button>
            </div>

            <div className="shopverse-admin__card">
              <div className="shopverse-table-container">
                <table className="shopverse-admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Color Variants</th>
                      <th>Discount</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="admin-product-cell">
                            <img src={resolveImageUrl(p.image_url)} alt="" className="admin-product-thumb" />
                            <div>
                              <strong>{p.name}</strong>
                              <small>{p.brand}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="shopverse-badge shopverse-badge--sage">{p.category}</span></td>
                        <td><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong></td>
                        <td>
                          <div className="admin-swatch-list">
                            {(p.variants?.length ? p.variants : (p.colors || [])).map((c, i) => (
                              <span
                                key={i}
                                className="admin-swatch-dot"
                                style={{ backgroundColor: c.color_hex || getColorHexValue(typeof c === 'object' ? c.color_name : c) }}
                                title={typeof c === 'object' ? `${c.color_name} (${c.stock} in stock)` : getColorDisplayName(c)}
                              />
                            ))}
                            <span className="admin-swatch-count">
                              ({p.variants?.length || (p.colors || []).length})
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="shopverse-badge shopverse-badge--sale">
                            {p.discount_percentage}%
                          </span>
                        </td>
                        <td>{p.stock}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="shopverse-admin__action-btn shopverse-admin__action-btn--color"
                              onClick={() => openColorModal(p)}
                              title="Manage multi-photo color variants with AI detection"
                            >
                              <Palette size={14} />
                              <span>Variants / Photos</span>
                            </button>
                            <button
                              type="button"
                              className="shopverse-admin__action-btn"
                              onClick={() => {
                                setDiscountModalProduct(p);
                                setDiscountValue(p.discount_percentage || 0);
                              }}
                              title="Set Discount %"
                            >
                              <Tag size={14} />
                              <span>Discount</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Bulk Product Multi-Add Form with Row Deletion & Animations (Feature 1.2) */}
        {activeTab === 'bulk' && (
          <div className="shopverse-admin__tab-pane">
            <div className="shopverse-admin__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 className="shopverse-admin__title">Multi-Product Bulk Upload</h1>
                <p className="shopverse-admin__subtitle">Batch-create catalogue items with dynamic row addition, row removal, and AI palette detection</p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="shopverse-admin__btn shopverse-admin__btn--secondary"
                  onClick={addBulkRow}
                >
                  <Plus size={16} />
                  <span>Add New Product Row</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleBulkSubmit} className="shopverse-admin__card">
              {bulkRows.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--color-spruce)' }}>
                  <p style={{ fontSize: 16, marginBottom: 16 }}>No items in bulk queue.</p>
                  <button
                    type="button"
                    className="shopverse-admin__btn shopverse-admin__btn--primary"
                    onClick={addBulkRow}
                  >
                    <Plus size={16} />
                    <span>Add First Product Row</span>
                  </button>
                </div>
              ) : (
                <div className="shopverse-bulk-grid">
                  {bulkRows.map((row, idx) => (
                    <div
                      key={idx}
                      className={`shopverse-bulk-row ${removingRowIndex === idx ? 'shopverse-bulk-row--removing' : ''}`}
                    >
                      <div className="shopverse-bulk-row__header">
                        <span className="shopverse-bulk-row__index">Item #{idx + 1} of {bulkRows.length}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            type="button"
                            className="admin-ai-palette-btn"
                            onClick={() => handleBulkAiColors(idx)}
                            title="Auto-detect colors based on title and category using AI"
                          >
                            <Sparkles size={14} />
                            <span>AI Auto-Detect</span>
                          </button>
                          <button
                            type="button"
                            className="admin-bulk-delete-row-btn"
                            onClick={() => handleRemoveBulkRow(idx)}
                            title="Remove this row"
                            aria-label={`Remove Item ${idx + 1}`}
                          >
                            <Trash2 size={14} />
                            <span>Remove Row</span>
                          </button>
                        </div>
                      </div>

                      <div className="shopverse-form-row">
                        <label className="shopverse-form-field flex-2">
                          <span>Product Title *</span>
                          <input
                            type="text"
                            required
                            value={row.name}
                            onChange={e => handleBulkChange(idx, 'name', e.target.value)}
                            placeholder="e.g. Structured Wool Overshirt"
                          />
                        </label>

                        <label className="shopverse-form-field flex-1">
                          <span>Price (₹) *</span>
                          <input
                            type="number"
                            required
                            min="1"
                            value={row.price}
                            onChange={e => handleBulkChange(idx, 'price', e.target.value)}
                            placeholder="3499"
                          />
                        </label>

                        <label className="shopverse-form-field flex-1">
                          <span>Category</span>
                          <select
                            value={row.category}
                            onChange={e => handleBulkChange(idx, 'category', e.target.value)}
                          >
                            <option value="clothing">Clothing</option>
                            <option value="electronics">Electronics</option>
                            <option value="home">Home</option>
                            <option value="beauty">Beauty</option>
                          </select>
                        </label>

                        <label className="shopverse-form-field flex-1">
                          <span>Stock Units</span>
                          <input
                            type="number"
                            min="0"
                            value={row.stock}
                            onChange={e => handleBulkChange(idx, 'stock', e.target.value)}
                          />
                        </label>

                        <label className="shopverse-form-field flex-2">
                          <span>Image URL</span>
                          <input
                            type="text"
                            value={row.image_url}
                            onChange={e => handleBulkChange(idx, 'image_url', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                          />
                        </label>

                        <label className="shopverse-form-field flex-2">
                          <span>Colors (comma separated)</span>
                          <input
                            type="text"
                            value={Array.isArray(row.colors) ? row.colors.join(', ') : row.colors}
                            onChange={e => handleBulkChange(idx, 'colors', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="e.g. Deep Spruce, Warm Ivory"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bulkRows.length > 0 && (
                <div className="shopverse-admin__form-footer">
                  <button
                    type="button"
                    className="shopverse-admin__btn shopverse-admin__btn--secondary"
                    onClick={addBulkRow}
                  >
                    <Plus size={16} />
                    <span>Add Another Row</span>
                  </button>

                  <button
                    type="submit"
                    className="shopverse-admin__btn shopverse-admin__btn--primary"
                  >
                    <Check size={16} />
                    <span>Publish All ({bulkRows.length}) Products to Catalogue</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab 4: Promo Codes Manager */}
        {activeTab === 'promos' && (
          <div className="shopverse-admin__tab-pane">
            <div className="shopverse-admin__header">
              <h1 className="shopverse-admin__title">Promo Code Management</h1>
              <p className="shopverse-admin__subtitle">Create and monitor customer discount vouchers</p>
            </div>

            <div className="shopverse-admin__grid-layout">
              {/* Promo Code Form */}
              <form onSubmit={handlePromoSubmit} className="shopverse-admin__card">
                <h2 className="shopverse-admin__card-title">Generate New Promo Voucher</h2>
                <div className="shopverse-form-stack">
                  <label className="shopverse-form-field">
                    <span>Coupon Code * (e.g. WINTER30)</span>
                    <input
                      type="text"
                      required
                      value={promoForm.code}
                      onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    />
                  </label>

                  <div className="shopverse-form-row">
                    <label className="shopverse-form-field flex-1">
                      <span>Discount Type</span>
                      <select
                        value={promoForm.discount_type}
                        onChange={e => setPromoForm({ ...promoForm, discount_type: e.target.value })}
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount (₹)</option>
                      </select>
                    </label>

                    <label className="shopverse-form-field flex-1">
                      <span>Discount Value *</span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={promoForm.discount_value}
                        onChange={e => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                        placeholder={promoForm.discount_type === 'percentage' ? '20' : '500'}
                      />
                    </label>
                  </div>

                  <div className="shopverse-form-row">
                    <label className="shopverse-form-field flex-1">
                      <span>Min Order Value (₹)</span>
                      <input
                        type="number"
                        min="0"
                        value={promoForm.min_order_value}
                        onChange={e => setPromoForm({ ...promoForm, min_order_value: e.target.value })}
                      />
                    </label>

                    <label className="shopverse-form-field flex-1">
                      <span>Max Usage Limit</span>
                      <input
                        type="number"
                        min="1"
                        value={promoForm.max_uses}
                        onChange={e => setPromoForm({ ...promoForm, max_uses: e.target.value })}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="shopverse-admin__btn shopverse-admin__btn--primary"
                    style={{ marginTop: 12 }}
                  >
                    <Plus size={16} />
                    <span>Create Promo Voucher</span>
                  </button>
                </div>
              </form>

              {/* Existing Promos List */}
              <div className="shopverse-admin__card">
                <h2 className="shopverse-admin__card-title">Live Promo Vouchers</h2>
                <div className="shopverse-admin__promo-list">
                  {promoCodes.map(promo => (
                    <div key={promo.id} className="shopverse-promo-card">
                      <div className="shopverse-promo-card__header">
                        <code>{promo.code}</code>
                        <span className="shopverse-badge shopverse-badge--sage">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `₹${promo.discount_value} OFF`}
                        </span>
                      </div>
                      <div className="shopverse-promo-card__body">
                        <span>Min Order: ₹{promo.min_order_value}</span>
                        <span>Used: {promo.used_count || 0} / {promo.max_uses || '∞'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Advertisements & Carousel Banners */}
        {activeTab === 'ads' && (
          <div className="shopverse-admin__tab-pane">
            <div className="shopverse-admin__header">
              <h1 className="shopverse-admin__title">Carousel Banner Campaigns</h1>
              <p className="shopverse-admin__subtitle">Manage full-screen hero slides and promotional banners</p>
            </div>

            <div className="shopverse-admin__grid-layout">
              {/* Ad Creation Form */}
              <form onSubmit={handleAdSubmit} className="shopverse-admin__card">
                <h2 className="shopverse-admin__card-title">New Hero Campaign Banner</h2>
                <div className="shopverse-form-stack">
                  <label className="shopverse-form-field">
                    <span>Campaign Headline *</span>
                    <input
                      type="text"
                      required
                      value={adForm.title}
                      onChange={e => setAdForm({ ...adForm, title: e.target.value })}
                      placeholder="e.g. The Winter Wool Atelier"
                    />
                  </label>

                  <label className="shopverse-form-field">
                    <span>Subtitle Narrative</span>
                    <input
                      type="text"
                      value={adForm.subtitle}
                      onChange={e => setAdForm({ ...adForm, subtitle: e.target.value })}
                      placeholder="e.g. Mongolian cashmere tailored to architectural precision"
                    />
                  </label>

                  <label className="shopverse-form-field">
                    <span>Image URL * (1600x900 recommended)</span>
                    <input
                      type="text"
                      required
                      value={adForm.image_url}
                      onChange={e => setAdForm({ ...adForm, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                    />
                  </label>

                  <div className="shopverse-form-row">
                    <label className="shopverse-form-field flex-1">
                      <span>Target Category</span>
                      <select
                        value={adForm.target_category}
                        onChange={e => setAdForm({ ...adForm, target_category: e.target.value })}
                      >
                        <option value="clothing">Clothing</option>
                        <option value="electronics">Electronics</option>
                        <option value="home">Home</option>
                        <option value="beauty">Beauty</option>
                      </select>
                    </label>

                    <label className="shopverse-form-field flex-1">
                      <span>Button CTA Text</span>
                      <input
                        type="text"
                        value={adForm.cta_text}
                        onChange={e => setAdForm({ ...adForm, cta_text: e.target.value })}
                        placeholder="Explore Collection"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="shopverse-admin__btn shopverse-admin__btn--primary"
                    style={{ marginTop: 12 }}
                  >
                    <Megaphone size={16} />
                    <span>Publish Banner Campaign</span>
                  </button>
                </div>
              </form>

              {/* Existing Ads List */}
              <div className="shopverse-admin__card">
                <h2 className="shopverse-admin__card-title">Live Carousel Banners</h2>
                <div className="shopverse-admin__ads-list">
                  {ads.map(ad => (
                    <div key={ad.id} className="shopverse-ad-card">
                      <img src={resolveImageUrl(ad.image_url)} alt="" className="shopverse-ad-card__img" />
                      <div className="shopverse-ad-card__body">
                        <h4>{ad.title}</h4>
                        <p>{ad.subtitle}</p>
                        <span className="shopverse-badge shopverse-badge--sage">{ad.cta_text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Multi-Photo Color Assignment & Variant Manager Modal (Feature 1.1) */}
      {colorModalProduct && (
        <div className="shopverse-modal-overlay" onClick={() => setColorModalProduct(null)}>
          <div className="shopverse-modal shopverse-modal--wide" onClick={e => e.stopPropagation()}>
            <div className="shopverse-modal__header">
              <div>
                <span className="shopverse-modal__eyebrow">Multi-Photo Color Assignment</span>
                <h2 className="shopverse-modal__title">{colorModalProduct.name}</h2>
              </div>
              <button type="button" className="shopverse-modal__close" onClick={() => setColorModalProduct(null)}>
                <X size={18} />
              </button>
            </div>

            {/* AI Auto-Detect Palette Banner */}
            <div className="admin-ai-box">
              <div className="admin-ai-box__info">
                <Sparkles size={20} color="var(--color-sage)" />
                <div>
                  <strong>AI Color Assistant</strong>
                  <p>Automatically analyze product visual aesthetics and generate matching luxury color variants with dedicated photo assignments.</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-ai-box__btn"
                onClick={handleAiAutoDetectColors}
                disabled={isAiAnalyzing}
              >
                <Sparkles size={15} />
                <span>{isAiAnalyzing ? 'Analyzing Aesthetics...' : 'Auto-Detect with AI'}</span>
              </button>
            </div>

            {/* Vertical List of Variant Rows (Feature 1.1: Thumbnail | Name | Hex | Stock | X) */}
            <div className="admin-variant-list-section">
              <label className="admin-color-section__label">
                Color Variants & Dedicated Images ({productVariants.length})
              </label>

              <div className="admin-variant-rows">
                {productVariants.map((v, i) => (
                  <div key={i} className="admin-variant-row">
                    {/* 80px Thumbnail Preview */}
                    <div className="admin-variant-row__thumb-wrap">
                      <img
                        src={resolveImageUrl(v.image_url)}
                        alt={v.color_name}
                        className="admin-variant-row__thumb"
                        onError={e => { e.currentTarget.src = '/images/no-image.svg'; }}
                      />
                    </div>

                    {/* Color Name Dropdown / Input */}
                    <div className="admin-variant-row__field flex-2">
                      <label>Color Name</label>
                      <input
                        type="text"
                        value={v.color_name}
                        onChange={e => handleVariantChange(i, 'color_name', e.target.value)}
                        placeholder="e.g. Midnight Black, Sage Green"
                        list="preset-color-options"
                        required
                      />
                      <datalist id="preset-color-options">
                        {LUXURY_COLOR_PRESETS.map(preset => (
                          <option key={preset.name} value={preset.name} />
                        ))}
                      </datalist>
                    </div>

                    {/* Color Hex & Swatch */}
                    <div className="admin-variant-row__field" style={{ width: 90 }}>
                      <label>Hex Swatch</label>
                      <div className="admin-variant-hex-group">
                        <input
                          type="color"
                          value={v.color_hex || '#355E58'}
                          onChange={e => handleVariantChange(i, 'color_hex', e.target.value)}
                          className="admin-variant-color-picker"
                        />
                        <span className="admin-variant-hex-label">{v.color_hex || '#355E58'}</span>
                      </div>
                    </div>

                    {/* Image URL */}
                    <div className="admin-variant-row__field flex-3">
                      <label>Dedicated Image URL</label>
                      <input
                        type="text"
                        value={v.image_url}
                        onChange={e => handleVariantChange(i, 'image_url', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        required
                      />
                    </div>

                    {/* Stock Units */}
                    <div className="admin-variant-row__field" style={{ width: 80 }}>
                      <label>Stock</label>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={e => handleVariantChange(i, 'stock', Number(e.target.value))}
                      />
                    </div>

                    {/* Remove Row Button */}
                    <button
                      type="button"
                      className="admin-variant-row__delete-btn"
                      onClick={() => handleRemoveVariantRow(i)}
                      title="Remove variant"
                      aria-label="Remove variant"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="shopverse-admin__btn shopverse-admin__btn--secondary"
                  onClick={handleAddVariantRow}
                >
                  <Plus size={15} />
                  <span>Add Another Color Variant / Image</span>
                </button>
              </div>
            </div>

            <div className="shopverse-modal__actions" style={{ marginTop: 28 }}>
              <button
                type="button"
                className="shopverse-admin__btn shopverse-admin__btn--secondary"
                onClick={() => setColorModalProduct(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="shopverse-admin__btn shopverse-admin__btn--primary"
                onClick={handleSaveVariants}
              >
                <Check size={16} />
                <span>Save Variants to Product</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Manager Modal */}
      {discountModalProduct && (
        <div className="shopverse-modal-overlay" onClick={() => setDiscountModalProduct(null)}>
          <div className="shopverse-modal" onClick={e => e.stopPropagation()}>
            <h2 className="shopverse-modal__title">Set Markdown for {discountModalProduct.name}</h2>
            <form onSubmit={handleUpdateDiscount} className="shopverse-form-stack">
              <label className="shopverse-form-field">
                <span>Discount Percentage (0% - 90%)</span>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={discountValue}
                  onChange={e => setDiscountValue(Number(e.target.value))}
                />
              </label>

              <div className="shopverse-discount-preview">
                <div>Original Price: <strong>₹{discountModalProduct.original_price || discountModalProduct.price}</strong></div>
                <div>Markdown Price: <strong>₹{Math.round((discountModalProduct.original_price || discountModalProduct.price) * (1 - discountValue / 100))}</strong></div>
              </div>

              <div className="shopverse-modal__actions">
                <button
                  type="button"
                  className="shopverse-admin__btn shopverse-admin__btn--secondary"
                  onClick={() => setDiscountModalProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="shopverse-admin__btn shopverse-admin__btn--primary"
                >
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
