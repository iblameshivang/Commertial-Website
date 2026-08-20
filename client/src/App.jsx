import React, { useEffect, useState } from 'react'
import { API_BASE } from './config'

const EMPTY_CATEGORY_FORM = { name: '' }
const EMPTY_PRODUCT_FORM = { name: '', price: '', stock: '', category_id: '', image_url: '' }

function ProductCard({ product }) {
  const imageSrc = product.image_url?.startsWith('http') ? product.image_url : `${API_BASE}${product.image_url}`

  return (
    <div className="card">
      <img className="product-image" src={imageSrc} alt={product.name} />
      <div className="card-body">
        <h3>{product.name}</h3>
        <p className="price">₹{product.price}</p>
        <p className="stock">Stock: {product.stock}</p>
        <p className="category">{product.category_name}</p>
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('customer')
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM)
  const [categoryError, setCategoryError] = useState('')
  const [categorySuccess, setCategorySuccess] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryDeleteId, setCategoryDeleteId] = useState(null)

  const [productFormVisible, setProductFormVisible] = useState(false)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM)
  const [productError, setProductError] = useState('')
  const [productSuccess, setProductSuccess] = useState('')
  const [editingProductId, setEditingProductId] = useState(null)
  const [productDeleteId, setProductDeleteId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/categories`),
        fetch(`${API_BASE}/api/products`)
      ])

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error('Failed to load store data.')
      }

      const categoriesResult = await categoriesResponse.json()
      const productsResult = await productsResponse.json()

      setCategories(categoriesResult)
      setProducts(productsResult)
    } catch (err) {
      setError(err.message || 'Failed to load store data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (view === 'customer' || view === 'admin') {
      fetchData()
    }
  }, [view])

  const resetCategoryState = ({ keepMessage = false } = {}) => {
    setCategoryForm(EMPTY_CATEGORY_FORM)
    setCategoryError('')
    if (!keepMessage) {
      setCategorySuccess('')
    }
    setEditingCategoryId(null)
    setCategoryDeleteId(null)
  }

  const resetProductState = ({ keepMessage = false } = {}) => {
    setProductForm(EMPTY_PRODUCT_FORM)
    setProductError('')
    if (!keepMessage) {
      setProductSuccess('')
    }
    setProductFormVisible(false)
    setEditingProductId(null)
    setProductDeleteId(null)
  }

  const handleViewChange = nextView => {
    if (nextView === view) {
      return
    }

    setView(nextView)
    resetCategoryState()
    resetProductState()
  }

  const handleCategoryInputChange = event => {
    setCategoryForm({ name: event.target.value })
    setCategoryError('')
  }

  const handleCategorySubmit = async event => {
    event.preventDefault()

    const trimmedName = categoryForm.name.trim()
    if (!trimmedName) {
      setCategoryError('Category name is required.')
      return
    }

    const isEditing = editingCategoryId !== null
    const url = `${API_BASE}/api/categories${isEditing ? `/${editingCategoryId}` : ''}`
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName })
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setCategoryError(data.error || 'Unable to save category.')
      return
    }

    setCategorySuccess(isEditing ? 'Category updated successfully.' : 'Category added successfully.')
    resetCategoryState({ keepMessage: true })
    await fetchData()
  }

  const startCategoryEdit = category => {
    setEditingCategoryId(category.id)
    setCategoryDeleteId(null)
    setCategoryError('')
    setCategorySuccess('')
    setCategoryForm({ name: category.name })
  }

  const handleCategoryDelete = async categoryId => {
    if (categoryDeleteId !== categoryId) {
      setCategoryDeleteId(categoryId)
      setCategoryError('')
      return
    }

    const response = await fetch(`${API_BASE}/api/categories/${categoryId}`, { method: 'DELETE' })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setCategoryError(data.error || 'Unable to delete category.')
      setCategoryDeleteId(null)
      return
    }

    setCategoryDeleteId(null)
    setCategoryError('')
    setCategorySuccess('Category deleted successfully.')
    resetCategoryState({ keepMessage: true })
    await fetchData()
  }

  const openProductForm = (product = null) => {
    setProductError('')
    setProductSuccess('')
    setProductDeleteId(null)

    if (product) {
      setEditingProductId(product.id)
      setProductForm({
        name: product.name,
        price: String(product.price),
        stock: String(product.stock),
        category_id: String(product.category_id),
        image_url: product.image_url || ''
      })
      setProductFormVisible(true)
      return
    }

    setEditingProductId(null)
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      category_id: categories[0] ? String(categories[0].id) : ''
    })
    setProductFormVisible(true)
  }

  const handleProductInputChange = event => {
    const { name, value } = event.target
    setProductForm(prev => ({ ...prev, [name]: value }))
    setProductError('')
  }

  const handleProductSubmit = async event => {
    event.preventDefault()

    const trimmedName = productForm.name.trim()
    const price = Number(productForm.price)
    const stock = Number(productForm.stock)
    const categoryId = Number(productForm.category_id)
    const imageUrl = productForm.image_url.trim()

    if (!trimmedName) {
      setProductError('Product name is required.')
      return
    }

    if (!Number.isFinite(price) || price <= 0) {
      setProductError('Product price must be greater than zero.')
      return
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setProductError('Product stock must be a non-negative integer.')
      return
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      setProductError('Please select a valid category.')
      return
    }

    const isEditing = editingProductId !== null
    const url = `${API_BASE}/api/products${isEditing ? `/${editingProductId}` : ''}`
    const response = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: trimmedName,
        price,
        stock,
        category_id: categoryId,
        image_url: imageUrl
      })
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setProductError(data.error || 'Unable to save product.')
      return
    }

    setProductSuccess(isEditing ? 'Product updated successfully.' : 'Product added successfully.')
    resetProductState({ keepMessage: true })
    await fetchData()
  }

  const handleProductDelete = async productId => {
    if (productDeleteId !== productId) {
      setProductDeleteId(productId)
      setProductError('')
      return
    }

    const response = await fetch(`${API_BASE}/api/products/${productId}`, { method: 'DELETE' })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setProductError(data.error || 'Unable to delete product.')
      setProductDeleteId(null)
      return
    }

    setProductDeleteId(null)
    setProductError('')
    setProductSuccess('Product deleted successfully.')
    resetProductState({ keepMessage: true })
    await fetchData()
  }

  const displayedProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category_name === selectedCategory)

  const renderCustomerView = () => (
    <>
      {loading && <p className="info">Loading data...</p>}
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
            <div className="product-grid">
              {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </>
      )}

      <footer>
        <small>Stage 1 Demo</small>
      </footer>
    </>
  )

  const renderAdminView = () => (
    <div className="admin-dashboard">
      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Categories</span>
          <strong>{categories.length}</strong>
        </div>
        <div className="summary-card">
          <span>Total Products</span>
          <strong>{products.length}</strong>
        </div>
      </div>

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
                  setEditingCategoryId(null)
                  setCategoryForm(EMPTY_CATEGORY_FORM)
                  setCategoryError('')
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
                <span>Image URL</span>
                <input type="text" name="image_url" value={productForm.image_url} onChange={handleProductInputChange} placeholder="Optional image URL" />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="primary-button">
                {editingProductId !== null ? 'Save Product' : 'Add Product'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setProductFormVisible(false)
                  setProductForm(EMPTY_PRODUCT_FORM)
                  setEditingProductId(null)
                  setProductError('')
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
                      src={product.image_url?.startsWith('http') ? product.image_url : `${API_BASE}${product.image_url}`}
                      alt={product.name}
                    />
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category_name}</td>
                  <td>₹{product.price}</td>
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
  )

  return (
    <div className="container">
      <header className="site-header">
        <h1>eCommerce Demo</h1>
        <p className="tagline">Simple demo showing SQLite → Express → React</p>
        <div className="view-switcher">
          <button
            type="button"
            className={view === 'customer' ? 'view-button active' : 'view-button'}
            onClick={() => handleViewChange('customer')}
          >
            🛍️ Customer View
          </button>
          <button
            type="button"
            className={view === 'admin' ? 'view-button active' : 'view-button'}
            onClick={() => handleViewChange('admin')}
          >
            ⚙️ Admin View
          </button>
        </div>
      </header>

      {view === 'customer' ? renderCustomerView() : renderAdminView()}
    </div>
  )
}
