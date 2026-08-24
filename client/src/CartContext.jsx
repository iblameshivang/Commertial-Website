import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE } from './config';

const CART_KEY = 'ecommerce-demo-cart';

// These must stay in sync with DELIVERY_FEE / FREE_DELIVERY_THRESHOLD in server/index.js.
// The server is the source of truth — it recalculates every total when the order is placed.
export const DELIVERY_FEE = 49;
export const FREE_DELIVERY_THRESHOLD = 499;

const CartContext = createContext(null);

const readStoredCart = () => {
  try {
    const storedValue = localStorage.getItem(CART_KEY);
    const parsed = storedValue ? JSON.parse(storedValue) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && item.id) : [];
  } catch (err) {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [notice, setNotice] = useState('');

  const itemsRef = useRef(items);
  const toastTimer = useRef(null);

  useEffect(() => {
    itemsRef.current = items;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => () => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
  }, []);

  const showToast = useCallback(message => {
    setToast(message);

    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    toastTimer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    const stockLimit = Number(product?.stock ?? 0);
    if (!product?.id || stockLimit <= 0) {
      return;
    }

    const requestedQuantity = Number(quantity) > 0 ? Math.floor(Number(quantity)) : 1;

    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === product.id);

      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + requestedQuantity, stockLimit);
        return currentItems.map(item => (item.id === product.id
          ? { ...item, quantity: nextQuantity, price: Number(product.price ?? item.price), stock: stockLimit }
          : item));
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          image: product.image_url || product.images?.[0] || '',
          price: Number(product.price || 0),
          stock: stockLimit,
          quantity: Math.min(requestedQuantity, stockLimit),
        },
      ];
    });

    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const updateQuantity = useCallback((productId, nextQuantity) => {
    const requestedQuantity = Number(nextQuantity);
    if (!Number.isFinite(requestedQuantity)) {
      return;
    }

    // Dropping to zero removes the line, so the "-" button can empty a row.
    if (requestedQuantity <= 0) {
      setItems(currentItems => currentItems.filter(item => item.id !== productId));
      return;
    }

    setItems(currentItems => currentItems.map(item => {
      if (item.id !== productId) {
        return item;
      }

      const stockLimit = Math.max(Number(item.stock || 1), 1);
      return { ...item, quantity: Math.min(Math.floor(requestedQuantity), stockLimit) };
    }));
  }, []);

  const removeItem = useCallback(productId => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Cart lives in localStorage, so its prices and stock go stale as soon as an admin
  // edits a product. Sync against the live catalogue whenever the app mounts.
  const revalidateCart = useCallback(async () => {
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
    let removedCount = 0;
    let adjustedCount = 0;

    for (const item of currentItems) {
      const product = productById.get(item.id);
      const stockLimit = Number(product?.stock ?? 0);

      if (!product || stockLimit <= 0) {
        removedCount += 1;
        continue;
      }

      const price = Number(product.price || 0);
      const quantity = Math.min(item.quantity, stockLimit);

      if (quantity !== item.quantity || price !== Number(item.price)) {
        adjustedCount += 1;
      }

      nextItems.push({
        id: product.id,
        name: product.name,
        image: product.image_url || product.images?.[0] || item.image || '',
        price,
        stock: stockLimit,
        quantity,
      });
    }

    if (removedCount === 0 && adjustedCount === 0) {
      return;
    }

    setItems(nextItems);

    const messages = [];
    if (removedCount > 0) {
      messages.push(`${removedCount} item${removedCount > 1 ? 's' : ''} removed (no longer available)`);
    }
    if (adjustedCount > 0) {
      messages.push(`${adjustedCount} item${adjustedCount > 1 ? 's' : ''} updated (price or stock changed)`);
    }
    setNotice(`Your cart was refreshed: ${messages.join(' • ')}.`);
  }, []);

  useEffect(() => {
    revalidateCart();
  }, [revalidateCart]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const dismissNotice = useCallback(() => setNotice(''), []);

  const cartCount = useMemo(
    () => items.reduce((count, item) => count + Number(item.quantity || 0), 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );

  const deliveryFee = items.length > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0;
  const freeDeliveryRemaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  const value = useMemo(() => ({
    items,
    cartCount,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    freeDeliveryRemaining,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    revalidateCart,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toast,
    // Exposed so the wishlist can reuse this toast rather than run a second,
    // visually overlapping one of its own.
    showToast,
    notice,
    dismissNotice,
  }), [
    items,
    cartCount,
    subtotal,
    deliveryFee,
    freeDeliveryRemaining,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    revalidateCart,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toast,
    showToast,
    notice,
    dismissNotice,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside a CartProvider.');
  }

  return context;
}
