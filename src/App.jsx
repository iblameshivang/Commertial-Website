import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import SignatureDishes from './components/SignatureDishes';
import ServicesBanner from './components/ServicesBanner';
import MenuSection from './components/MenuSection';
import ReviewsSection from './components/ReviewsSection';
import LocationSection from './components/LocationSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ReservationModal from './components/ReservationModal';
import DishDetailModal from './components/DishDetailModal';
import MobileStickyBar from './components/MobileStickyBar';
import AdminOrdersModal from './components/AdminOrdersModal';
import AdminLoginScreen from './components/AdminLoginScreen';
import { RESTAURANT_INFO } from './data/restaurantInfo';
import { isStaffAuthenticated, logoutStaff } from './utils/staffAuth';

const getRouteHash = () => window.location.hash || '';

export default function App() {
  // Cart state stored in localStorage for persistence
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('chefs_planet_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [adminOrdersOpen, setAdminOrdersOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [staffLoggedIn, setStaffLoggedIn] = useState(() => isStaffAuthenticated());
  const [adminRoute, setAdminRoute] = useState(() => {
    const route = getRouteHash();
    return route.startsWith('#/admin') ? route : '';
  });

  useEffect(() => {
    const syncRoute = () => {
      const hash = getRouteHash();
      const nextRoute = hash.startsWith('#/admin') ? hash : '';
      setAdminRoute(nextRoute);

      if (hash.startsWith('#/payment-status')) {
        const parse = new URLSearchParams(hash.split('?')[1] || '');
        const provider = parse.get('provider');
        const orderId = parse.get('orderId');
        const transactionId = parse.get('transactionId');
        const status = parse.get('status');
        const mock = parse.get('mock') === 'true';

        if (provider && orderId && transactionId) {
          fetch('/api/payment/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              orderId,
              transactionId,
              status: status || 'SUCCESS',
              mock,
            }),
          })
            .then(async (response) => {
              const payload = await response.json();
              if (!response.ok || !payload.ok) {
                showToast(payload?.message || 'Payment failed. Please retry.');
                window.location.hash = '';
                return;
              }

              if (payload.order) {
                openWhatsAppOrder(payload.order);
              }

              showToast('Payment verified. WhatsApp order opened.');
              window.location.hash = '';
            })
            .catch(() => {
              showToast('Payment could not be verified. Please retry.');
              window.location.hash = '';
            });
        }
      }
    };

    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  useEffect(() => {
    setStaffLoggedIn(isStaffAuthenticated());
  }, [adminRoute]);

  useEffect(() => {
    if (staffLoggedIn && (adminRoute === '#/admin' || adminRoute === '#/admin/login')) {
      window.location.hash = '#/admin/orders';
    }
  }, [adminRoute, staffLoggedIn]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('chefs_planet_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  // Toast auto-hide
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg) => {
    setToastMessage(msg);
  };

  const openWhatsAppOrder = (order) => {
    if (!order) return;

    let message = `🍽️ *NEW ORDER - CHEF'S PLANET SOLAN*\n`;
    message += `──────────────────────\n`;
    message += `🧾 *Order ID:* #${order.id}\n`;
    message += `✅ *Payment Received via ${order.paymentMethod || 'Payment Gateway'}*\n`;
    message += `👤 *Customer Name:* ${order.customerName}\n`;
    message += `📞 *Phone:* ${order.customerPhone}\n`;
    message += `📍 *Order Type:* ${order.orderType === 'dinein' ? `Dine-In (Table #${order.tableNumber || 'To be assigned'})` : order.orderType === 'takeaway' ? 'Drive-Through / Takeaway (Rajgarh Rd)' : 'No-Contact Home Delivery'}\n`;

    if (order.orderType === 'delivery' && order.deliveryAddress) {
      message += `🏠 *Address:* ${order.deliveryAddress}\n`;
      message += `📍 *Service Area:* Solan, HP\n`;
    }

    message += `──────────────────────\n`;
    message += `📝 *ITEMS ORDERED:*\n`;
    (order.items || []).forEach((item, index) => {
      message += `${index + 1}. ${item.name} (${item.isVeg ? '🟢 Veg' : '🔴 Non-Veg'}) x ${item.quantity} = ₹${(item.price || 0) * item.quantity}\n`;
    });

    if (order.specialNotes) {
      message += `\n💬 *Cooking Instructions:* ${order.specialNotes}\n`;
    }

    message += `──────────────────────\n`;
    message += `💵 *Subtotal:* ₹${order.subtotal}\n`;
    message += `🧾 *GST (5%):* ₹${order.gst}\n`;
    if (order.orderType === 'delivery') {
      message += `🛵 *Delivery:* ${order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}\n`;
    }
    message += `💰 *TOTAL AMOUNT:* ₹${order.totalAmount}\n`;
    message += `──────────────────────\n`;
    message += `✨ _Order placed via Chef's Planet Website_`;

    const whatsappUrl = `https://wa.me/${RESTAURANT_INFO.contact.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.location.href = whatsappUrl;
  };

  const handleOpenAdmin = () => {
    if (staffLoggedIn) {
      setAdminOrdersOpen(true);
      window.location.hash = '#/admin/orders';
      return;
    }

    window.location.hash = '#/admin/login';
    setAdminOrdersOpen(false);
  };

  const handleCloseAdmin = () => {
    setAdminOrdersOpen(false);
    if (window.location.hash.startsWith('#/admin')) {
      window.location.hash = '';
    }
  };

  const handleStaffLogin = () => {
    setStaffLoggedIn(true);
    setAdminOrdersOpen(true);
    window.location.hash = '#/admin/orders';
  };

  const handleStaffLogout = () => {
    logoutStaff();
    setStaffLoggedIn(false);
    setAdminOrdersOpen(false);
    window.location.hash = '';
  };

  const isAdminRouteProtected = adminRoute.startsWith('#/admin');
  const shouldShowAdminLogin = isAdminRouteProtected && !staffLoggedIn;
  const shouldShowAdminOrders = staffLoggedIn && (adminOrdersOpen || adminRoute === '#/admin/orders');

  // Cart operations
  const handleAddToCart = (dish) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
    showToast(`Added "${dish.name}" to your order!`);
  };

  const handleUpdateQuantity = (dishId, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== dishId));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === dishId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  const handleRemoveItem = (dishId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== dishId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Get selected dish quantity in cart for modal
  const selectedDishCartQty = selectedDish
    ? (cartItems.find((ci) => ci.id === selectedDish.id)?.quantity || 0)
    : 0;

  return (
    <div className="min-h-screen bg-noir-950 text-stone-100 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce">
          <div className="px-4 py-2.5 rounded-xl bg-noir-900 border border-gold-500/50 shadow-2xl text-xs font-semibold text-gold-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Transparent Sticky Navigation */}
      <Navbar
        cartCount={totalCartCount}
        isStaffLoggedIn={staffLoggedIn}
        onOpenCart={() => setCartOpen(true)}
        onOpenReservation={() => setReservationOpen(true)}
        onOpenAdminOrders={handleOpenAdmin}
        onLogoutStaff={handleStaffLogout}
      />

      {/* Cinematic Hero Section */}
      <Hero
        onExploreMenu={scrollToMenu}
        onOpenReservation={() => setReservationOpen(true)}
      />

      {/* Story / About Section */}
      <AboutSection
        onOpenReservation={() => setReservationOpen(true)}
      />

      {/* Signature Highlight Dishes */}
      <SignatureDishes
        onSelectDish={(dish) => setSelectedDish(dish)}
        onAddToCart={handleAddToCart}
        onExploreFullMenu={scrollToMenu}
      />

      {/* Services Banner */}
      <ServicesBanner
        onOpenReservation={() => setReservationOpen(true)}
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Full Menu Section */}
      <MenuSection
        cartItems={cartItems}
        onSelectDish={(dish) => setSelectedDish(dish)}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* Customer Reviews & Google Rating */}
      <ReviewsSection />

      {/* Location, Google Map & Hours */}
      <LocationSection
        onOpenCart={() => setCartOpen(true)}
      />

      {/* Footer */}
      <Footer
        onExploreMenu={scrollToMenu}
        onOpenReservation={() => setReservationOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenAdminOrders={handleOpenAdmin}
        isStaffLoggedIn={staffLoggedIn}
        onLogoutStaff={handleStaffLogout}
      />

      {/* Sticky Quick-Action Bar for Mobile */}
      <MobileStickyBar
        cartCount={totalCartCount}
        onOpenCart={() => setCartOpen(true)}
        onExploreMenu={scrollToMenu}
      />

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Table Reservation Modal */}
      <ReservationModal
        isOpen={reservationOpen}
        onClose={() => setReservationOpen(false)}
      />

      {/* Dish Detailed Inspection Modal */}
      <DishDetailModal
        dish={selectedDish}
        onClose={() => setSelectedDish(null)}
        onAddToCart={handleAddToCart}
        cartQuantity={selectedDishCartQty}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {shouldShowAdminLogin && (
        <AdminLoginScreen
          onLoggedIn={handleStaffLogin}
          onBackToSite={() => {
            window.location.hash = '';
            setAdminOrdersOpen(false);
          }}
        />
      )}

      {shouldShowAdminOrders && (
        <AdminOrdersModal
          isOpen={shouldShowAdminOrders}
          onClose={handleCloseAdmin}
          isStaffLoggedIn={staffLoggedIn}
          onLogout={handleStaffLogout}
        />
      )}
    </div>
  );
}
