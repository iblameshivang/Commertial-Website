import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import ProductImageGallery from './ProductImageGallery';
import { API_BASE, resolveImageUrl } from './config';

export default function ProductDetailPage({ onAddToCart }) {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length) {
      return product.images.map(resolveImageUrl);
    }
    return [resolveImageUrl(product.image_url)];
  }, [product]);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [productId]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/api/products/${productId}`);
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load this product.');
        }

        setProduct(data);

        if (data?.category_id) {
          const recommendationResponse = await fetch(`${API_BASE}/api/products?category_id=${data.category_id}`);
          const recommendationData = await recommendationResponse.json().catch(() => []);
          if (recommendationResponse.ok) {
            setRecommendations(
              (recommendationData || []).filter(item => item.id !== Number(productId)).slice(0, 4)
            );
          }
        }
      } catch (err) {
        setError(err.message || 'Unable to load this product.');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const stockCount = Number(product?.stock ?? 0);
  const isAvailable = stockCount > 0;

  const updateQuantity = nextValue => {
    if (!product) {
      return;
    }

    const safeValue = Number(nextValue);
    if (!Number.isFinite(safeValue)) {
      return;
    }

    const clampedValue = Math.min(Math.max(1, safeValue), Math.max(stockCount, 1));
    setQuantity(clampedValue);
  };

  const handleAddToCart = () => {
    if (!product) {
      return;
    }

    if (!isAvailable) {
      return;
    }

    if (typeof onAddToCart === 'function') {
      onAddToCart(product, quantity);
    }
  };

  if (loading) {
    return <p className="info">Loading product...</p>;
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Product unavailable</h2>
        <p>{error}</p>
        <Link to="/" className="secondary-link">Return to products</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state">
        <h2>Product not found</h2>
        <p>We couldn’t find the product you were looking for.</p>
        <Link to="/" className="secondary-link">Browse all products</Link>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button type="button" className="back-link" onClick={() => navigate(-1)}>
        ← Back to products
      </button>

      <div className="product-detail-layout">
        <div className="gallery-panel">
          <ProductImageGallery images={images} productName={product.name} />
        </div>

        <div className="detail-info">
          <span className="category-pill">{product.category_name}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">₹{Number(product.price ?? 0).toFixed(2)}</p>
          <p className={`stock-status ${isAvailable ? 'in-stock' : 'out-of-stock'}`}>
            {isAvailable ? `In stock: ${stockCount} available` : 'Out of stock'}
          </p>

          <p className="description">{product.description || 'No product description available yet.'}</p>

          <div className="quantity-row">
            <span>Quantity</span>
            <div className="quantity-picker">
              <button type="button" onClick={() => updateQuantity(quantity - 1)}>-</button>
              <input type="number" min="1" max={Math.max(stockCount, 1)} value={quantity} onChange={event => updateQuantity(event.target.value)} />
              <button type="button" onClick={() => updateQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <div className="purchase-actions">
            <button type="button" className="primary-button add-to-cart-button large" onClick={handleAddToCart} disabled={!isAvailable}>
              {isAvailable ? 'Add to Cart' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>

      <section className="recommendations-section">
        <h2>You Might Also Like</h2>
        {recommendations.length > 0 ? (
          <div className="recommendation-grid">
            {recommendations.map(item => (
              <ProductCard key={item.id} product={item} onAddToCart={onAddToCart} />
            ))}
          </div>
        ) : (
          <p className="empty-state subtle">No similar products found for this category right now.</p>
        )}
      </section>
    </div>
  );
}
