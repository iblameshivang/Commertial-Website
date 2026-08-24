import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import './styles.css';

// WishlistProvider sits inside CartProvider: the wishlist reuses the cart's toast
// so both features share one notification UI instead of stacking two.
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <WishlistProvider>
          <App />
        </WishlistProvider>
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
