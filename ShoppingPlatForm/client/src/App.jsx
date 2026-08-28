import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import WishlistPage from './WishlistPage';
import ProductDetailPage from './ProductDetailPage';
import CartDrawer from './CartDrawer';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import OrderConfirmationPage from './OrderConfirmationPage';
import AdminDashboard from './AdminDashboard';
import LoginScreen from './components/Admin/LoginScreen';
import { useCart } from './CartContext';
import { api } from './utils/api';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, notice, dismissNotice } = useCart();

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Validate session / token on mount
  useEffect(() => {
    const token = localStorage.getItem('shopverse_token');
    const legacyAdmin = sessionStorage.getItem('ecommerce-demo-admin') === 'true';

    if (token) {
      api.get('/api/auth/me')
        .then(res => {
          if (res.data?.user) {
            setCurrentUser(res.data.user);
            setIsAdminAuthenticated(true);
          } else {
            localStorage.removeItem('shopverse_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('shopverse_token');
        })
        .finally(() => setAuthChecking(false));
    } else if (legacyAdmin) {
      setCurrentUser({ username: 'admin', role: 'admin', brand_name: 'Master Admin' });
      setIsAdminAuthenticated(true);
      setAuthChecking(false);
    } else {
      setAuthChecking(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('shopverse_token');
    sessionStorage.removeItem('ecommerce-demo-admin');
    setCurrentUser(null);
    setIsAdminAuthenticated(false);
    navigate('/');
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-container">
      {/* 1. Frosted Glass Luxury Navbar */}
      <Navbar />

      <div className="app-main-content">
        {notice && (
          <div className="cart-notice" role="status">
            <span>{notice}</span>
            <button type="button" className="link-button" onClick={dismissNotice}>Dismiss</button>
          </div>
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route
            path="/admin"
            element={
              authChecking ? (
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="skeleton-shimmer" style={{ width: 240, height: 24, borderRadius: 4 }} />
                </div>
              ) : isAdminAuthenticated ? (
                <AdminDashboard user={currentUser} onLogout={handleLogout} />
              ) : (
                <LoginScreen
                  onLoginSuccess={(user) => {
                    setCurrentUser(user);
                    setIsAdminAuthenticated(true);
                  }}
                />
              )
            }
          />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-confirmation/:orderCode" element={<OrderConfirmationPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>

      {/* 2. Slide-In Cart Drawer */}
      <CartDrawer />

      {/* 3. Toast Notifications */}
      {toast && (
        <div className="cart-toast" role="status">
          <span>{toast}</span>
        </div>
      )}

      {/* 4. Luxury Dark Spruce/Peacock Editorial Footer */}
      {!isAdminRoute && (
        <footer className="shopverse-footer">
          <div className="shopverse-footer__inner">
            <div className="shopverse-footer__brand-col">
              <span className="shopverse-footer__logo">Shopverse</span>
              <p className="shopverse-footer__tagline">
                Curated luxury for modern living. Tailored garments, acoustic masterworks, and sculptural homeware.
              </p>
            </div>

            <div className="shopverse-footer__links-col">
              <span className="shopverse-footer__heading">Navigation</span>
              <Link to="/">Home Capsule</Link>
              <Link to="/shop">Complete Store</Link>
              <Link to="/wishlist">Saved Watchlist</Link>
              <Link to="/admin">Merchant Portal</Link>
            </div>

            <div className="shopverse-footer__links-col">
              <span className="shopverse-footer__heading">Collections</span>
              <Link to="/shop?category=clothing">Tailored Apparel</Link>
              <Link to="/shop?category=electronics">Acoustics & Studio</Link>
              <Link to="/shop?category=home">Sculptural Living</Link>
              <Link to="/shop?category=beauty">Botanical Grooming</Link>
            </div>

            <div className="shopverse-footer__links-col">
              <span className="shopverse-footer__heading">Client Care</span>
              <a href="#shipping">Complimentary Express Shipping</a>
              <a href="#returns">White-Glove Returns</a>
              <a href="#contact">Private Concierge</a>
            </div>
          </div>

          <div className="shopverse-footer__bottom">
            <span>&copy; {new Date().getFullYear()} Shopverse International Ltd. All rights reserved.</span>
            <div className="shopverse-footer__legal">
              <a href="#privacy">Privacy Notice</a>
              <a href="#terms">Terms of Service</a>
              <a href="#sustainability">Ethical Sourcing</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
