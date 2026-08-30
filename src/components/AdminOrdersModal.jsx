import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Search,
  PackageCheck,
  ShieldCheck,
  Clock3,
  MapPin,
  LogOut,
  CheckCircle2,
  CircleDashed,
  ArrowUpDown,
} from 'lucide-react';
import { fetchOrderRecords } from '../utils/orderStorage';
import { getAuthHeaders, isStaffAuthenticated } from '../utils/staffAuth';

const TAB_OPTIONS = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'dinein', label: 'Dine-In' },
  { key: 'other', label: 'Other' },
];
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'Complete', label: 'Complete' },
  { key: 'Incomplete', label: 'Incomplete' },
];
const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
];

const getOrderGroup = (orderType) => {
  if (orderType === 'delivery') return 'delivery';
  if (orderType === 'dinein') return 'dinein';
  return 'other';
};

const getOrderStatus = (order) => order?.orderStatus || 'Incomplete';

const renderAddressLink = (value) => {
  if (!value) return 'N/A';
  const urlMatch = value.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) return value;

  const url = urlMatch[0];
  const before = value.slice(0, urlMatch.index).trim();
  const after = value.slice(urlMatch.index + url.length).trim();

  return (
    <>
      {before ? <span>{before}</span> : null}
      {before ? ' ' : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-gold-300 underline underline-offset-2 break-all">{url}</a>
      {after ? <span> {after}</span> : null}
    </>
  );
};

export default function AdminOrdersModal({ isOpen, onClose, isStaffLoggedIn, onLogout }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('delivery');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const load = async () => {
      const records = await fetchOrderRecords();
      setOrders(records);
      if (!selectedOrderId && records.length) {
        setSelectedOrderId(records[0].id);
      }
    };

    load();

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!selectedOrderId && orders.length) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  if (!isOpen || !isStaffLoggedIn || !isStaffAuthenticated()) return null;

  const persistOrderUpdate = async (orderId, updates) => {
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(updates),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.ok) {
        console.warn('Unable to sync staff update to backend:', payload?.message || response.statusText);
      }
    } catch (error) {
      console.warn('Unable to persist order update to backend:', error);
    }

    setOrders((current) => {
      const next = current.map((order) => order.id === orderId ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order);
      try {
        localStorage.setItem('chef_planet_orders_v1', JSON.stringify(next));
      } catch (error) {
        console.warn('Unable to persist order updates locally.', error);
      }
      return next;
    });
  };

  const visibleOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const matchesGroup = getOrderGroup(order.orderType) === activeTab;
      const matchesStatus = statusFilter === 'all' || getOrderStatus(order) === statusFilter;
      const matchesSearch = !term ||
        order.id?.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.customerPhone?.toLowerCase().includes(term);

      return matchesGroup && matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return sortMode === 'newest' ? bDate - aDate : aDate - bDate;
    });
  }, [orders, activeTab, statusFilter, searchTerm, sortMode]);

  const tabCounts = useMemo(() => {
    return TAB_OPTIONS.reduce((acc, tab) => {
      acc[tab.key] = orders.filter((order) => getOrderGroup(order.orderType) === tab.key).length;
      return acc;
    }, {});
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return visibleOrders.find((order) => order.id === selectedOrderId) || visibleOrders[0] || null;
  }, [visibleOrders, selectedOrderId]);

  const updateSelectedOrder = async (updates) => {
    if (!selectedOrder?.id) return;
    await persistOrderUpdate(selectedOrder.id, updates);
    setPinInput('');
    setPinError('');
  };

  const handleToggleComplete = async () => {
    if (!selectedOrder?.id) return;
    const nextStatus = getOrderStatus(selectedOrder) === 'Complete' ? 'Incomplete' : 'Complete';
    await persistOrderUpdate(selectedOrder.id, { orderStatus: nextStatus });
  };

  const handleVerifyDeliveryPin = async () => {
    if (!selectedOrder?.id) return;
    if (String(selectedOrder.deliveryPin || '').trim() !== String(pinInput || '').trim()) {
      setPinError('PIN does not match the saved delivery PIN.');
      return;
    }

    setPinError('');
    await persistOrderUpdate(selectedOrder.id, {
      orderStatus: 'Complete',
      deliveryVerified: true,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-noir-950/85 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl border border-gold-500/30 bg-noir-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-noir-950/80 px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Order verification</p>
                <h3 className="font-serif text-xl text-white">Admin Order Log</h3>
              </div>
              <div className="flex items-center gap-2">
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-200 hover:text-red-100"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-full border border-white/10 bg-noir-850 text-stone-300 hover:text-white"
                  aria-label="Close admin order log"
                >
                  <X className="mx-auto h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-noir-950 px-3 py-3 md:flex-1">
                  <Search className="h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Order ID, name, or phone"
                    className="w-full bg-transparent text-sm text-white placeholder-stone-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-noir-950 px-2 py-1.5 text-[10px] uppercase tracking-wider text-stone-300">
                    <ArrowUpDown className="h-3.5 w-3.5 text-gold-300" />
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value)}
                      className="bg-transparent text-white outline-none"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.key} value={option.key} className="bg-noir-900 text-white">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {!orders.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-noir-950/60 p-6 text-center text-stone-400">
                  No saved orders found yet. Orders are logged locally until the restaurant adds a production backend.
                </div>
              ) : (
                <>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {TAB_OPTIONS.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          activeTab === tab.key
                            ? 'border-gold-500/40 bg-gold-500/10 text-gold-300'
                            : 'border-white/10 bg-noir-950 text-stone-400 hover:text-white'
                        }`}
                      >
                        {tab.label} {tabCounts[tab.key] ? `(${tabCounts[tab.key]})` : '(0)'}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.key}
                        type="button"
                        onClick={() => setStatusFilter(filter.key)}
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          statusFilter === filter.key
                            ? 'border-gold-500/40 bg-gold-500/10 text-gold-300'
                            : 'border-white/10 bg-noir-950 text-stone-400 hover:text-white'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.4fr]">
                    <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                      {visibleOrders.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-noir-950/60 p-4 text-center text-sm text-stone-400">
                          No matching orders in this view.
                        </div>
                      ) : (
                        visibleOrders.map((order) => {
                          const orderStatus = getOrderStatus(order);
                          return (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setPinInput('');
                                setPinError('');
                              }}
                              className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                                selectedOrder?.id === order.id
                                  ? 'border-gold-500/50 bg-gold-500/10'
                                  : 'border-white/10 bg-noir-950/60 hover:border-gold-500/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-xs text-gold-300">#{String(order.id).slice(0, 12)}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                                  orderStatus === 'Complete'
                                    ? 'bg-emerald-500/10 text-emerald-300'
                                    : 'bg-amber-500/10 text-amber-300'
                                }`}>
                                  {orderStatus}
                                </span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-white">{order.customerName}</p>
                              <p className="text-[11px] text-stone-400">{order.customerPhone}</p>
                              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider">
                                <span className="font-semibold text-emerald-400">₹{order.totalAmount}</span>
                                <span className={`rounded-full px-2 py-0.5 ${order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
                                  {order.paymentStatus || 'Pending'}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {selectedOrder && (
                      <div className="rounded-2xl border border-white/10 bg-noir-950/60 p-4 sm:p-5">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Source of truth</p>
                            <h4 className="mt-2 font-mono text-lg text-white">#{selectedOrder.id}</h4>
                          </div>
                          <button
                            type="button"
                            onClick={handleToggleComplete}
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              getOrderStatus(selectedOrder) === 'Complete'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                            }`}
                          >
                            {getOrderStatus(selectedOrder) === 'Complete' ? 'Complete' : 'Mark as Complete'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-stone-500 uppercase tracking-wider">Customer</p>
                            <p className="mt-1 text-white font-medium">{selectedOrder.customerName}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-stone-500 uppercase tracking-wider">Phone</p>
                            <p className="mt-1 text-white font-medium">{selectedOrder.customerPhone}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-stone-500 uppercase tracking-wider">Order Type</p>
                            <p className="mt-1 text-white font-medium capitalize">{selectedOrder.orderType}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-stone-500 uppercase tracking-wider">Payment Status</p>
                            <p className={`mt-1 font-medium ${selectedOrder.paymentStatus === 'Paid' ? 'text-emerald-300' : 'text-red-300'}`}>
                              {selectedOrder.paymentStatus || 'Pending'}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-stone-500 uppercase tracking-wider">Payment Method</p>
                            <p className="mt-1 text-white font-medium">{selectedOrder.paymentMethod || 'N/A'}</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-noir-900 p-3">
                            <div className="flex items-center gap-2 text-gold-300 font-semibold uppercase tracking-wider">
                              <Clock3 className="h-3.5 w-3.5" />
                              <span>Created</span>
                            </div>
                            <p className="mt-2 text-white font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                          </div>
                        </div>

                        {selectedOrder.orderType === 'delivery' && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-noir-900 p-3">
                            <p className="text-[10px] uppercase tracking-wider text-gold-300">Delivery PIN verification</p>
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={pinInput}
                                onChange={(event) => setPinInput(event.target.value)}
                                placeholder="Enter delivery PIN"
                                className="w-full rounded-xl border border-white/10 bg-noir-950 px-3 py-2 text-sm text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyDeliveryPin}
                                className="rounded-xl bg-gold-500 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-noir-950"
                              >
                                Verify
                              </button>
                            </div>
                            {pinError && <p className="mt-2 text-xs text-red-300">{pinError}</p>}
                            {selectedOrder.deliveryPin && (
                              <p className="mt-2 text-[11px] text-stone-300">Delivery PIN on file: {selectedOrder.deliveryPin}</p>
                            )}
                          </div>
                        )}

                        <div className="mt-4 rounded-xl border border-white/10 bg-noir-900 p-3">
                          <div className="flex items-center gap-2 text-gold-300 font-semibold text-xs uppercase tracking-wider">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Delivery / address</span>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-200">{renderAddressLink(selectedOrder.deliveryAddress || 'N/A')}</p>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-noir-900 p-3">
                          <div className="flex items-center gap-2 text-gold-300 font-semibold text-xs uppercase tracking-wider">
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Items</span>
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-stone-200">
                            {selectedOrder.items?.map((item) => (
                              <div key={`${selectedOrder.id}-${item.id}`} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <span>{item.name} × {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
                              </div>
                            )) || <p className="text-stone-400">No items saved.</p>}
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-white/10 bg-noir-900 p-3 space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-stone-400">Subtotal</span>
                            <span className="text-white">₹{selectedOrder.subtotal}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-stone-400">GST (5%)</span>
                            <span className="text-white">₹{selectedOrder.gst}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-stone-400">Delivery Fee</span>
                            <span className="text-white">₹{selectedOrder.deliveryFee}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2 text-base font-bold text-gold-300">
                            <span>Grand Total</span>
                            <span>₹{selectedOrder.totalAmount}</span>
                          </div>
                        </div>

                        {selectedOrder.specialNotes && (
                          <div className="mt-4 rounded-xl border border-white/10 bg-noir-900 p-3">
                            <div className="flex items-center gap-2 text-gold-300 font-semibold text-xs uppercase tracking-wider">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span>Instructions</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-stone-200">{selectedOrder.specialNotes}</p>
                          </div>
                        )}

                        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200">
                          This saved order record is the authoritative billing source. The WhatsApp message is only a convenience copy for the customer and can be edited before sending.
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
