import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Send, 
  MapPin, 
  Utensils, 
  Car, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { RESTAURANT_INFO } from '../data/restaurantInfo';

export default function CartDrawer({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) {
  const [orderType, setOrderType] = useState('delivery'); // 'delivery', 'dinein', 'takeaway'
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [upiPayment, setUpiPayment] = useState(null);
  const [upiCopyStatus, setUpiCopyStatus] = useState('');

  const ownerUpiId = import.meta.env.VITE_OWNER_UPI_ID || '8679367460@ptyes';

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05); // 5% GST on restaurant food
  const deliveryFee = orderType === 'delivery' ? (subtotal > 499 ? 0 : 40) : 0;
  const grandTotal = subtotal + gst + deliveryFee;

  const renderMappedAddress = (address) => {
    if (!address) return 'N/A';
    const match = address.match(/https?:\/\/[^\s]+/i);
    if (!match) return address;
    const url = match[0];
    const before = address.slice(0, match.index).trim();
    const after = address.slice(match.index + url.length).trim();
    return (
      <>
        {before ? <span>{before}</span> : null}
        {before ? ' ' : null}
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-gold-300 underline underline-offset-2 break-all">{url}</a>
        {after ? <span> {after}</span> : null}
      </>
    );
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location access is not available on this device. Please type the delivery address manually.');
      return;
    }

    setIsFetchingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const mapLink = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}&z=18`;
        setDeliveryAddress(`Current live location: ${mapLink}`);
        setIsFetchingLocation(false);
      },
      () => {
        setIsFetchingLocation(false);
        setLocationError('Unable to fetch your current location. Please enter your Solan delivery address manually.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const isOrderReady = () => {
    if (!customerName.trim() || !customerPhone.trim()) return false;
    if (orderType === 'delivery') {
      return deliveryAddress.trim().length > 0;
    }
    return true;
  };

  const openWhatsAppOrder = (order) => {
    if (!order) return;

    let message = `🍽️ *NEW ORDER - CHEF'S PLANET SOLAN*\n`;
    message += `──────────────────────\n`;
    message += `🧾 *Order ID:* #${order.id}\n`;
    message += `✅ *Paid via UPI*\n`;
    if (order.orderType === 'delivery' && order.deliveryPin) {
      message += `🔐 *Delivery PIN:* ${order.deliveryPin}\n`;
    }
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

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(ownerUpiId);
      setUpiCopyStatus('UPI ID copied');
      setTimeout(() => setUpiCopyStatus(''), 1800);
    } catch {
      setUpiCopyStatus('Copy failed');
    }
  };

  const initiateUPIPayment = async () => {
    if (cartItems.length === 0) return;

    if (!isOrderReady()) {
      alert('Please fill in your name, phone number, and delivery address in Solan before paying and sending the WhatsApp booking.');
      return;
    }

    try {
      const response = await fetch('/api/create-upi-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          orderType,
          tableNumber: tableNumber.trim(),
          deliveryAddress: deliveryAddress.trim(),
          specialNotes: specialNotes.trim(),
          items: cartItems.map((item) => ({ id: item.id, quantity: item.quantity })),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        alert(payload?.message || 'Unable to create the UPI payment request. Please try again.');
        return;
      }

      setUpiPayment({
        orderId: payload.orderId,
        amount: payload.amount,
        upiId: payload.upiId,
        upiUrl: payload.upiUrl,
        qrDataUrl: payload.qrDataUrl,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        tableNumber: tableNumber.trim(),
        deliveryAddress: deliveryAddress.trim(),
        specialNotes: specialNotes.trim(),
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          isVeg: item.isVeg,
        })),
      });
    } catch (error) {
      console.error('UPI payment initiation failed:', error);
      alert('Unable to create the UPI payment request. Please try again.');
    }
  };

  const confirmUPIPayment = async () => {
    if (!upiPayment) return;

    try {
      const response = await fetch('/api/confirm-upi-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: upiPayment.orderId,
          amount: upiPayment.amount,
          customerName: upiPayment.customerName,
          customerPhone: upiPayment.customerPhone,
          orderType: upiPayment.orderType,
          tableNumber: upiPayment.tableNumber,
          deliveryAddress: upiPayment.deliveryAddress,
          specialNotes: upiPayment.specialNotes,
          items: upiPayment.items,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        alert(payload?.message || 'Unable to confirm the UPI payment. Please retry.');
        return;
      }

      // NOTE: for a plain UPI ID there is no gateway callback verification, so this trusts
      // the customer's confirmation tap until a verified gateway (Razorpay / PhonePe Business API)
      // replaces this step. The mark-upi payment logic is isolated so a real verification flow can
      // be swapped in without changing the rest of the order flow.
      const order = payload.order || null;
      setUpiPayment(null);
      if (order?.deliveryPin) {
        alert(`Payment confirmed. Give this PIN to the delivery person when your order arrives: ${order.deliveryPin}`);
      } else {
        alert('Payment confirmed. WhatsApp is opening with your order details.');
      }
      openWhatsAppOrder(order);
      onClose();
    } catch (error) {
      console.error('UPI confirmation failed:', error);
      alert('Unable to confirm payment completion. Please retry.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-noir-950/80 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 w-full max-w-[100vw] flex justify-end pl-0 sm:pl-10 box-border overflow-x-hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="w-full max-w-[100vw] sm:max-w-md bg-noir-900 border-l border-white/10 shadow-2xl flex flex-col justify-between box-border overflow-x-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-noir-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-white">Your Order</h2>
                    <p className="text-xs text-gold-400">
                      {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 min-w-0 shrink-0">
                  {cartItems.length > 0 && (
                    <button
                      onClick={onClearCart}
                      className="p-2 text-stone-400 hover:text-rose-400 transition-colors shrink-0"
                      title="Clear Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-stone-400 hover:text-white rounded-lg transition-colors shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body: Cart Items & Inputs */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6 min-w-0">
                {cartItems.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-noir-850 border border-white/10 flex items-center justify-center mx-auto text-stone-500">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-lg text-white">Your cart is currently empty</h3>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Explore our authentic North Indian delicacies and add your favourites to order.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-2 px-5 py-2.5 rounded-xl bg-gold-500/15 border border-gold-500/40 text-gold-300 text-xs font-bold uppercase tracking-wider hover:bg-gold-500 hover:text-noir-950 transition-colors"
                    >
                      Browse Menu
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    <div className="space-y-3 min-w-0">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-noir-850 border border-white/5 flex items-center justify-between gap-3 min-w-0"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-noir-950 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate font-serif">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-stone-400">
                              ₹{item.price} each
                            </p>
                          </div>

                          {/* Quantity Controller */}
                          <div className="flex items-center gap-2 bg-noir-950 rounded-lg p-1 border border-white/10 shrink-0">
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded bg-gold-500 text-noir-950 flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Type Toggle */}
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-stone-300">
                        Dining Preference:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setOrderType('delivery')}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                            orderType === 'delivery'
                              ? 'bg-gold-500/15 border-gold-500 text-gold-300 font-bold'
                              : 'bg-noir-950 border-white/10 text-stone-400 hover:text-white'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Delivery</span>
                        </button>
                        <button
                          onClick={() => setOrderType('dinein')}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                            orderType === 'dinein'
                              ? 'bg-gold-500/15 border-gold-500 text-gold-300 font-bold'
                              : 'bg-noir-950 border-white/10 text-stone-400 hover:text-white'
                          }`}
                        >
                          <Utensils className="w-4 h-4" />
                          <span>Dine-In</span>
                        </button>
                        <button
                          onClick={() => setOrderType('takeaway')}
                          className={`py-2 px-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                            orderType === 'takeaway'
                              ? 'bg-gold-500/15 border-gold-500 text-gold-300 font-bold'
                              : 'bg-noir-950 border-white/10 text-stone-400 hover:text-white'
                          }`}
                        >
                          <Car className="w-4 h-4" />
                          <span>Takeaway</span>
                        </button>
                      </div>
                    </div>

                    {/* Details Input Form */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] uppercase text-stone-400 block mb-1">Your Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ankit"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase text-stone-400 block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 98160 XXXXX"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      </div>

                      {orderType === 'dinein' && (
                        <div>
                          <label className="text-[10px] uppercase text-stone-400 block mb-1">Table Number (optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Table 4"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-400"
                          />
                        </div>
                      )}

                      {orderType === 'delivery' && (
                        <div>
                          <label className="text-[10px] uppercase text-stone-400 block mb-1">Delivery Address in Solan</label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Flat 302, Smart Homes / Mall Road"
                              value={deliveryAddress}
                              onChange={(e) => {
                                setDeliveryAddress(e.target.value);
                                if (locationError) setLocationError('');
                              }}
                              className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-400"
                            />
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              disabled={isFetchingLocation}
                              className="w-full px-3 py-2 rounded-xl border border-gold-500/40 bg-gold-500/10 text-gold-300 text-[10px] font-bold uppercase tracking-wider hover:bg-gold-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isFetchingLocation ? 'Fetching live location...' : 'Use current location'}
                            </button>
                            {deliveryAddress && (
                              <div className="rounded-xl border border-white/10 bg-noir-950/70 p-2 text-[10px] text-stone-300 break-words">
                                <span className="font-semibold text-stone-400 uppercase tracking-wider">Live location preview:</span>
                                <div className="mt-1">{renderMappedAddress(deliveryAddress)}</div>
                              </div>
                            )}
                            {locationError && (
                              <p className="text-[10px] text-rose-300">{locationError}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-[10px] uppercase text-stone-400 block mb-1">Special Cooking Request</label>
                        <input
                          type="text"
                          placeholder="e.g. Medium spicy, extra butter, less oil..."
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-noir-950 rounded-xl border border-white/10 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-gold-400"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer: Bill Summary & WhatsApp CTA */}
              {cartItems.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-noir-950/90 space-y-4">
                  {/* Bill Breakdown */}
                  <div className="space-y-1.5 text-xs text-stone-300 min-w-0">
                    <div className="flex justify-between items-start gap-3 min-w-0">
                      <span className="min-w-0 break-words">Subtotal</span>
                      <span className="text-right min-w-0 break-words">₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-start gap-3 min-w-0 text-stone-400">
                      <span className="min-w-0 break-words">GST (5%)</span>
                      <span className="text-right min-w-0 break-words">₹{gst}</span>
                    </div>
                    {orderType === 'delivery' && (
                      <div className="flex justify-between items-start gap-3 min-w-0 text-stone-400">
                        <span className="min-w-0 break-words">Delivery Fee</span>
                        <span className="text-right min-w-0 break-words">
                          {deliveryFee === 0 ? <span className="text-emerald-400 font-bold">FREE (Above ₹499)</span> : `₹${deliveryFee}`}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start gap-3 min-w-0 text-base font-serif font-bold text-white pt-2 border-t border-white/10">
                      <span className="min-w-0 break-words">Grand Total</span>
                      <span className="text-gold-400 text-right min-w-0 break-words">₹{grandTotal}</span>
                    </div>
                  </div>

                  {upiPayment ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-300">UPI payment</p>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">Locked amount</span>
                      </div>
                      <div className="flex items-center justify-center rounded-xl bg-white p-3">
                        {upiPayment.qrDataUrl ? (
                          <img src={upiPayment.qrDataUrl} alt="UPI QR code" className="h-32 w-32 object-contain" />
                        ) : null}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-stone-400">Amount to Pay</p>
                        <p className="mt-1 text-xl font-bold text-white">₹{upiPayment.amount}</p>
                      </div>
                      <a href={upiPayment.upiUrl} target="_blank" rel="noopener noreferrer" className="block w-full rounded-xl bg-emerald-600 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white">
                        Pay via UPI app
                      </a>
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-noir-950/60 p-2">
                        <span className="min-w-0 flex-1 break-all text-[10px] text-stone-200">{upiPayment.upiId}</span>
                        <button
                          type="button"
                          onClick={handleCopyUpiId}
                          className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-200"
                        >
                          Copy
                        </button>
                      </div>
                      {upiCopyStatus && <p className="text-center text-[10px] text-emerald-300">{upiCopyStatus}</p>}
                      <button
                        type="button"
                        onClick={confirmUPIPayment}
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-white"
                      >
                        I’ve Completed the Payment
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={initiateUPIPayment}
                      disabled={!isOrderReady()}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                      <span className="leading-tight text-center">Pay via UPI</span>
                    </button>
                  )}

                  <p className="text-[10px] text-center text-stone-500">
                    Direct confirmation from Chef’s Planet kitchen • 01792 220 224
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
