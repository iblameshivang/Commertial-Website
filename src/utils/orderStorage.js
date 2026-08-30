// Temporary order persistence layer: localStorage-backed order log used until a real backend/database is added.
// The saved order record is the source of truth for staff verification; the WhatsApp chat text is informational only.
// API-level protection is enforced by the staff token used in /api/orders, so a customer cannot directly query it.
import { getAuthHeaders, isStaffAuthenticated } from './staffAuth';

const STORAGE_KEY = 'chef_planet_orders_v1';

export function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CP-${ts}-${rand}`;
}

export async function fetchOrderRecords() {
  if (!isStaffAuthenticated()) {
    return [];
  }

  try {
    const response = await fetch('/api/orders', {
      headers: getAuthHeaders(),
      credentials: 'same-origin',
    });

    if (response.ok) {
      const payload = await response.json();
      if (Array.isArray(payload.orders)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.orders));
        return payload.orders;
      }
    }
  } catch (error) {
    console.error('Unable to load orders from backend, falling back to localStorage', error);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Unable to read order log from localStorage', error);
    return [];
  }
}

export function getOrderRecords() {
  if (!isStaffAuthenticated()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Unable to read order log from localStorage', error);
    return [];
  }
}

export function getOrderById(orderId) {
  if (!isStaffAuthenticated()) {
    return null;
  }

  return getOrderRecords().find((order) => order.id === orderId) || null;
}

export function saveOrderRecord(orderRecord) {
  const records = getOrderRecords();
  const nextRecords = [orderRecord, ...records].slice(0, 500);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords));
  } catch (error) {
    console.error('Unable to save order log to localStorage', error);
  }

  return orderRecord;
}
