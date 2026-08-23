import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import ProductDetailPage from './ProductDetailPage';
import CartDrawer from './CartDrawer';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import OrderConfirmationPage from './OrderConfirmationPage';
import { useCart } from './CartContext';
import { API_BASE, resolveImageUrl } from './config';
import AdminDashboardView from './AdminDashboard';

const ADMIN_KEY = 'ecommerce-demo-admin';
const ADMIN_PASSWORD = 'MissionNepal';
const EMPTY_CATEGORY_FORM = { name: '' };
const EMPTY_PRODUCT_FORM = {
  name: '',
  price: '',
  stock: '',
  category_id: '',
  image_url: '',
  description: '',
  additional_images: '',
};

function AdminLoginScreen({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Incorrect password.');
      }

      sessionStorage.setItem(ADMIN_KEY, 'true');
      onUnlock();
    } catch (err) {
      setError(err.message || 'Unable to unlock admin access.');
    }
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <h2>Admin access</h2>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            aria-label="Admin password"
          />
          <p className="admin-demo-key-hint">
            💡 <strong>Demo Key:</strong> Use <code>MissionNepal</code> to unlock.
          </p>
          <button type="submit" className="primary-button">Unlock admin</button>
        </form>
        {error && <p className="status-message error">{error}</p>}
      </div>
    </div>
  );
}

function ProductListPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/products`),
      ]);

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error('Failed to load store data.');
      }

      const categoriesResult = await categoriesResponse.json();
      const productsResult = await productsResponse.json();

      setCategories(categoriesResult || []);
      setProducts(productsResult || []);
    } catch (err) {
      setError(err.message || 'Failed to load store data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displayedProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category_name === selectedCategory);

  return (
    <>
      {loading && <p className="info">Loading products...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <>
          <section className="categories">
            <h2>Categories</h2>
            <div className="category-list">
              <button
                type="button"
                className={`category-btn ${selectedCategory === 'All' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('All')}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>

          <section className="products">
            <h2>Products</h2>
            {displayedProducts.length === 0 ? (
              <p className="empty-state subtle">No products available in this category right now.</p>
            ) : (
              <div className="product-grid">
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <footer>
        <small>Reliable product browsing</small>
      </footer>
    </>
  );
}

function AdminDashboard() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [categoryError, setCategoryError] = useState('');
  const [categorySuccess, setCategorySuccess] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryDeleteId, setCategoryDeleteId] = useState(null);

  const [productFormVisible, setProductFormVisible] = useState(false);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDeleteId, setProductDeleteId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/products`),
      ]);

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error('Failed to load store data.');
      }

      const categoriesResult = await categoriesResponse.json();
      const productsResult = await productsResponse.json();

      setCategories(categoriesResult || []);
      setProducts(productsResult || []);
    } catch (err) {
      setError(err.message || 'Failed to load store data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetCategoryState = ({ keepMessage = false } = {}) => {
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setCategoryError('');
    if (!keepMessage) {
      setCategorySuccess('');
    }
    setEditingCategoryId(null);
    setCategoryDeleteId(null);
  };

  const resetProductState = ({ keepMessage = false } = {}) => {
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductError('');
    if (!keepMessage) {
      setProductSuccess('');
    }
    setProductFormVisible(false);
    setEditingProductId(null);
    setProductDeleteId(null);
  };

  const handleCategoryInputChange = event => {
    setCategoryForm({ name: event.target.value });
    setCategoryError('');
  };

  const handleCategorySubmit = async event => {
    event.preventDefault();

    const trimmedName = categoryForm.name.trim();
    if (!trimmedName) {
      setCategoryError('Category name is required.');
      return;
    }

    const isEditing = editingCategoryId !== null;
    const url = `${API_BASE}/api/categories${isEditing ? `/${editingCategoryId}` : ''}`;
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Password': ADMIN_PASSWORD },
      body: JSON.stringify({ name: trimmedName }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setCategoryError(data.error || 'Unable to save category.');
      return;
    }

    setCategorySuccess(isEditing ? 'Category updated successfully.' : 'Category added successfully.');
    resetCategoryState({ keepMessage: true });
    await fetchData();
  };

  const startCategoryEdit = category => {
    setEditingCategoryId(category.id);
    setCategoryDeleteId(null);
    setCategoryError('');
    setCategorySuccess('');
    setCategoryForm({ name: category.name });
  };

  const handleCategoryDelete = async categoryId => {
    if (categoryDeleteId !== categoryId) {
      setCategoryDeleteId(categoryId);
      setCategoryError('');
      return;
    }

    const response = await fetch(`${API_BASE}/api/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': ADMIN_PASSWORD },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setCategoryError(data.error || 'Unable to delete category.');
      setCategoryDeleteId(null);
      return;
    }

    setCategoryDeleteId(null);
    setCategoryError('');
    setCategorySuccess('Category deleted successfully.');
    resetCategoryState({ keepMessage: true });
    await fetchData();
  };

const openProductForm = (product = null) => {
    setProductError('');
    setProductSuccess('');
    setProductDeleteId(null);

    if (product) {
      setEditingProductId(product.id);
      const additionalImages = Array.isArray(product.images) ? product.images.slice(1).join(', ') : '';
      setProductForm({
        name: product.name || '',
        price: String(product.price ?? ''),
        stock: String(product.stock ?? ''),
        category_id: String(product.category_id ?? (categories[0]?.id || '')),
        image_url: product.image_url || '',
        description: product.description || '',
        additional_images: additionalImages,
      });
      setProductFormVisible(true);
      return;
    }

    setEditingProductId(null);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      category_id: categories[0] ? String(categories[0].id) : '',
    });
    setProductFormVisible(true);
  };

  const handleProductInputChange = event => {
    const { name, value } = event.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
    setProductError('');
  };

  const handleUploadFiles = async event => {
    const files = Array.from(event.target.files || []).filter(file => file && file.type.startsWith('image/'));
    setSelectedFiles(files);
    setProductError('');
  };

  const handleProductSubmit = async event => {
    event.preventDefault();

    const trimmedName = productForm.name.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const categoryId = Number(productForm.category_id);
    const imageUrl = productForm.image_url.trim();
    const description = productForm.description.trim();
    const additionalImages = productForm.additional_images
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);

    if (!trimmedName) {
      setProductError('Product name is required.');
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setProductError('Product price must be greater than zero.');
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setProductError('Product stock must be a non-negative integer.');
      return;
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setProductError('Please select a valid category.');
      return;
    }

    try {
      setUploadingImages(true);
      let uploadedImageUrls = [];

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('images', file));

        const uploadResponse = await fetch(`${API_BASE}/api/uploads`, {
          method: 'POST',
          headers: { 'X-Admin-Password': ADMIN_PASSWORD },
          body: formData,
        });

        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok) {
          throw new Error(uploadData.error || 'Image upload failed.');
        }

        uploadedImageUrls = Array.isArray(uploadData.images) ? uploadData.images : [];
      }

      const mergedImages = [...new Set([
        ...(imageUrl ? [imageUrl] : []),
        ...uploadedImageUrls,
        ...additionalImages,
      ].filter(Boolean))];

      const isEditing = editingProductId !== null;
      const url = `${API_BASE}/api/products${isEditing ? `/${editingProductId}` : ''}`;
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          name: trimmedName,
          price,
          stock,
          category_id: categoryId,
          image_url: imageUrl || uploadedImageUrls[0] || mergedImages[0] || '',
          description,
          images: mergedImages,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Unable to save product.');
      }

      setProductSuccess(isEditing ? 'Product updated successfully.' : 'Product added successfully.');
      setSelectedFiles([]);
      resetProductState({ keepMessage: true });
      await fetchData();
    } catch (err) {
      setProductError(err.message || 'Unable to save product.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleProductDelete = async productId => {
    if (productDeleteId !== productId) {
      setProductDeleteId(productId);
      setProductError('');
      return;
    }

    const response = await fetch(`${API_BASE}/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Password': ADMIN_PASSWORD },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setProductError(data.error || 'Unable to delete product.');
      setProductDeleteId(null);
      return;
    }

    setProductDeleteId(null);
    setProductError('');
    setProductSuccess('Product deleted successfully.');
    resetProductState({ keepMessage: true });
    await fetchData();
  };

  return (
    <div className="admin-dashboard">
      {loading && <p className="info">Loading dashboard metrics...</p>}
      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <AdminDashboardView products={products} categories={categories} />
      )}

      <section className="admin-section">
        <h2>Category Management</h2>
        <form className="admin-form" onSubmit={handleCategorySubmit}>
          <div className="form-row">
            <input
              type="text"
              value={categoryForm.name}
              onChange={handleCategoryInputChange}
              placeholder="Category name"
              aria-label="Category name"
            />
            <button type="submit" className="primary-button">
              {editingCategoryId !== null ? 'Save Category' : 'Add Category'}
            </button>
            {editingCategoryId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm(EMPTY_CATEGORY_FORM);
                  setCategoryError('');
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {categoryError && <p className="status-message error">{categoryError}</p>}
        {categorySuccess && <p className="status-message success">{categorySuccess}</p>}

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td className="action-cell">
                    <button type="button" className="secondary-button" onClick={() => startCategoryEdit(category)}>
                      Edit
                    </button>
                    {categoryDeleteId === category.id ? (
                      <>
                        <button type="button" className="danger-button" onClick={() => handleCategoryDelete(category.id)}>
                          Confirm Delete
                        </button>
                        <button type="button" className="secondary-button" onClick={() => setCategoryDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="danger-button" onClick={() => handleCategoryDelete(category.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-header">
          <h2>Product Management</h2>
          <button type="button" className="primary-button" onClick={() => openProductForm()}>
            {productFormVisible ? 'Close Form' : 'Add Product'}
          </button>
        </div>

        {productFormVisible && (
          <form className="admin-form product-form" onSubmit={handleProductSubmit}>
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input type="text" name="name" value={productForm.name} onChange={handleProductInputChange} />
              </label>
              <label>
                <span>Price (₹)</span>
                <input type="number" name="price" min="0" step="0.01" value={productForm.price} onChange={handleProductInputChange} />
              </label>
              <label>
                <span>Stock</span>
                <input type="number" name="stock" min="0" step="1" value={productForm.stock} onChange={handleProductInputChange} />
              </label>
              <label>
                <span>Category</span>
                <select name="category_id" value={productForm.category_id} onChange={handleProductInputChange}>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="full-width">
                <span>Main Image URL</span>
                <input type="text" name="image_url" value={productForm.image_url} onChange={handleProductInputChange} placeholder="Optional image URL" />
              </label>
              <label className="full-width">
                <span>Additional images</span>
                <input type="text" name="additional_images" value={productForm.additional_images} onChange={handleProductInputChange} placeholder="Comma separated image URLs" />
              </label>
              <label className="full-width">
                <span>Upload product images</span>
                <input type="file" accept="image/*" multiple onChange={handleUploadFiles} />
                {selectedFiles.length > 0 && (
                  <small className="file-list">Selected: {selectedFiles.map(file => file.name).join(', ')}</small>
                )}
              </label>
              <label className="full-width">
                <span>Description</span>
                <textarea name="description" rows="4" value={productForm.description} onChange={handleProductInputChange} placeholder="Product description" />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={uploadingImages}>
                {uploadingImages ? 'Uploading...' : (editingProductId !== null ? 'Save Product' : 'Add Product')}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setProductFormVisible(false);
                  setProductForm(EMPTY_PRODUCT_FORM);
                  setEditingProductId(null);
                  setProductError('');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {productError && <p className="status-message error">{productError}</p>}
        {productSuccess && <p className="status-message success">{productSuccess}</p>}

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <img
                      className="admin-product-thumb"
                      src={resolveImageUrl(product.image_url || product.images?.[0] || '/images/no-image.svg')}
                      alt={product.name}
                      onError={event => {
                        event.currentTarget.src = resolveImageUrl('/images/no-image.svg');
                      }}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category_name}</td>
                  <td>₹{Number(product.price).toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td className="action-cell">
                    <button type="button" className="secondary-button" onClick={() => openProductForm(product)}>
                      Edit
                    </button>
                    {productDeleteId === product.id ? (
                      <>
                        <button type="button" className="danger-button" onClick={() => handleProductDelete(product.id)}>
                          Confirm Delete
                        </button>
                        <button type="button" className="secondary-button" onClick={() => setProductDeleteId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button type="button" className="danger-button" onClick={() => handleProductDelete(product.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h2.5l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h9.4a1.5 1.5 0 0 0 1.5-1.2L21 7H5.2" />
    </svg>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, openDrawer, toast, notice, dismissNotice } = useCart();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_KEY) === 'true';
    } catch (err) {
      return false;
    }
  });

  const isAdminRoute = location.pathname === '/admin';

  return (
    <div className="container">
      <header className="site-header">
        <div className="header-row">
          <h1>
            <Link to="/" className="brand-link">eCommerce Demo</Link>
          </h1>
          {!isAdminRoute && (
            <button
              type="button"
              className="cart-toggle"
              onClick={openDrawer}
              aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            >
              <CartIcon />
              <span>Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          )}
        </div>

        <p className="tagline">Simple demo showing SQLite → Express → React</p>

        <div className="view-switcher">
          <button
            type="button"
            className={location.pathname === '/' ? 'view-button active' : 'view-button'}
            onClick={() => navigate('/')}
          >
            🛍️ Customer View
          </button>
          <button
            type="button"
            className={isAdminRoute ? 'view-button active' : 'view-button'}
            onClick={() => navigate('/admin')}
          >
            ⚙️ Admin View
          </button>
        </div>
      </header>

      {notice && (
        <div className="cart-notice" role="status">
          <span>{notice}</span>
          <button type="button" className="link-button" onClick={dismissNotice}>Dismiss</button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<ProductListPage />} />
        <Route
          path="/admin"
          element={
            isAdminAuthenticated ? (
              <AdminDashboard />
            ) : (
              <AdminLoginScreen onUnlock={() => setIsAdminAuthenticated(true)} />
            )
          }
        />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderCode" element={<OrderConfirmationPage />} />
        <Route path="*" element={<ProductListPage />} />
      </Routes>

      <CartDrawer />

      {toast && <div className="cart-toast" role="status">✓ {toast}</div>}
    </div>
  );
}
