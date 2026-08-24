import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from './config';

const WISHLIST_KEY = 'ecommerce-demo-wishlist';

const WishlistContext = createContext(null);

// Items are kept product-shaped (image_url / category_name rather than a custom schema)
// so the stored object can be handed straight to <ProductCard> and to addToCart().
const toWishlistItem = product => ({
  id: product.id,
  name: product.name,
  price: Number(product.price || 0),
  stock: Number(product.stock ?? 0),
  image_url: product.image_url || product.images?.[0] || '',
  category_name: product.category_name || '',
});

const readStoredWishlist = () => {
  try {
    const storedValue = localStorage.getItem(WISHLIST_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.id) : [];
  } catch (err) {
    return [];
  }
};

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readStoredWishlist);

  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }, [items]);

  const isWishlisted = useCallback(
    productId => items.some(item => item.id === productId),
    [items]
  );

  const addToWishlist = useCallback(product => {
    if (!product?.id) {
      return;
    }

    setItems(currentItems => (currentItems.some(item => item.id === product.id)
      ? currentItems
      : [...currentItems, toWishlistItem(product)]));
  }, []);

  const removeFromWishlist = useCallback(productId => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  // Returns 'added' | 'removed' | null so the caller decides which toast to show — the
  // context stays out of the notification business. Both writers are idempotent, so a
  // rapid double click can repeat a toast but can never corrupt the list.
  const toggleWishlist = useCallback(product => {
    if (!product?.id) {
      return null;
    }

    if (itemsRef.current.some(item => item.id === product.id)) {
      removeFromWishlist(product.id);
      return 'removed';
    }

    addToWishlist(product);
    return 'added';
  }, [addToWishlist, removeFromWishlist]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  // Same staleness problem as the cart: localStorage holds a snapshot that any admin edit
  // invalidates. Unlike the cart, an out-of-stock item is KEPT here — saving something to
  // buy later is the whole point of a wishlist. Only products that left the catalogue go.
  const revalidateWishlist = useCallback(async () => {
    const currentItems = itemsRef.current;
    if (currentItems.length === 0) {
      return;
    }

    let products;
    try {
      const response = await fetch(`${API_BASE}/api/products`);
      if (!response.ok) {
        return;
      }
      products = await response.json();
    } catch (err) {
      return;
    }

    if (!Array.isArray(products)) {
      return;
    }

    const productById = new Map(products.map(product => [product.id, product]));
    const nextItems = [];
    let changed = false;

    for (const item of currentItems) {
      const product = productById.get(item.id);

      if (!product) {
        changed = true;
        continue;
      }

      const refreshed = toWishlistItem(product);
      const isUnchanged = refreshed.name === item.name
        && refreshed.price === Number(item.price)
        && refreshed.stock === Number(item.stock)
        && refreshed.image_url === item.image_url
        && refreshed.category_name === item.category_name;

      if (!isUnchanged) {
        changed = true;
      }

      nextItems.push(refreshed);
    }

    if (changed) {
      setItems(nextItems);
    }
  }, []);

  useEffect(() => {
    revalidateWishlist();
  }, [revalidateWishlist]);

  const value = useMemo(() => ({
    items,
    wishlistCount: items.length,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    revalidateWishlist,
  }), [
    items,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    revalidateWishlist,
  ]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error('useWishlist must be used inside a WishlistProvider.');
  }

  return context;
}
