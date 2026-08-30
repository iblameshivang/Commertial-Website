import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { FULL_MENU } from '../src/data/menuData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

dotenv.config({ path: envPath });

console.log('DEBUG: Loading .env from:', envPath);
console.log('DEBUG: VITE_STAFF_PIN =', process.env.VITE_STAFF_PIN);
console.log('DEBUG: All env vars with STAFF:', Object.keys(process.env).filter(k => k.includes('STAFF')));

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4173';
const OWNER_UPI_ID = process.env.OWNER_UPI_ID || process.env.VITE_OWNER_UPI_ID || '8679367460@ptyes';
const STAFF_TOKENS = new Map();
const MENU_BY_ID = new Map(FULL_MENU.map((item) => [item.id, item]));

async function ensureDataFile(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf8');
  }
}

async function readJson(filePath, fallback = []) {
  await ensureDataFile(filePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Unable to read JSON from ${filePath}:`, error);
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await ensureDataFile(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function generateOrderId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `CP-${ts}-${rand}`;
}

function createTransactionId(provider = 'PhonePe') {
  const prefix = provider.toUpperCase().startsWith('PAY') ? 'PAYTM' : 'PHONEPE';
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function normalizeItems(items = []) {
  const result = [];

  for (const item of items) {
    const itemId = String(item?.id || '').trim();
    const quantity = Number(item?.quantity || 0);
    if (!itemId || !Number.isFinite(quantity) || quantity <= 0) continue;

    const product = MENU_BY_ID.get(itemId);
    if (!product) continue;

    result.push({
      id: product.id,
      name: product.name,
      quantity,
      price: Number(product.price),
      isVeg: Boolean(product.isVeg),
    });
  }

  return result;
}

function calculateTotals(items, orderType = 'delivery') {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gst = Math.round(subtotal * 0.05);
  const deliveryFee = orderType === 'delivery' ? (subtotal > 499 ? 0 : 40) : 0;
  const totalAmount = subtotal + gst + deliveryFee;

  return {
    subtotal,
    gst,
    deliveryFee,
    totalAmount,
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      isVeg: item.isVeg,
    })),
  };
}

function getProvider(providerName) {
  const normalized = String(providerName || 'PhonePe').toLowerCase();
  return normalized.includes('paytm') ? 'Paytm' : 'PhonePe';
}

function buildRedirectUrl({ provider, orderId, transactionId }) {
  const params = new URLSearchParams({
    provider,
    orderId,
    transactionId,
    status: 'SUCCESS',
    mock: 'true',
  });

  return `${FRONTEND_URL}/#/payment-status?${params.toString()}`;
}

function buildUPIUrl({ amount, orderId, upiId = OWNER_UPI_ID }) {
  const safeName = encodeURIComponent("Chef's Planet");
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${safeName}&am=${Number(amount).toFixed(2)}&tn=${encodeURIComponent(orderId)}&cu=INR`;
}

function verifySignature({ provider, body, signature }) {
  const key = provider === 'Paytm'
    ? process.env.PAYTM_MERCHANT_KEY
    : process.env.PHONEPE_MERCHANT_KEY;

  if (!key || !signature) {
    return true;
  }

  const expected = crypto.createHmac('sha256', key)
    .update(JSON.stringify(body))
    .digest('hex');

  return expected === signature;
}

function createStaffToken() {
  return crypto.randomBytes(24).toString('hex');
}

function createDeliveryPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function requireStaffSession(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Staff authentication required.' });
  }

  const session = STAFF_TOKENS.get(token);
  if (!session || session.expiresAt <= Date.now()) {
    STAFF_TOKENS.delete(token);
    return res.status(401).json({ ok: false, message: 'Staff session expired or invalid.' });
  }

  return next();
}

async function markUPIPaymentAsPaid({
  orderId,
  amount,
  customerName,
  customerPhone,
  orderType,
  tableNumber,
  deliveryAddress,
  specialNotes,
  items,
  paymentMethod = 'UPI',
}) {
  // NOTE: a plain UPI ID has no merchant callback verification, so this trusts the
  // customer's confirmation tap until a gateway API (Razorpay / PhonePe Business API)
  // replaces the trust step. Keep this function isolated so later verification logic can
  // replace it without changing the rest of the order flow.
  const normalizedItems = Array.isArray(items) ? items : [];
  const orders = await readJson(ORDERS_FILE, []);
  const existingOrder = orders.find((order) => order.id === orderId);
  const receivedAmount = Number(amount) || 0;
  const normalizedOrderType = String(orderType || 'delivery').trim().toLowerCase();
  const orderRecord = existingOrder || {
    id: orderId,
    createdAt: new Date().toISOString(),
    customerName: String(customerName || '').trim(),
    customerPhone: String(customerPhone || '').trim(),
    orderType: normalizedOrderType,
    tableNumber: String(tableNumber || '').trim(),
    deliveryAddress: String(deliveryAddress || '').trim(),
    specialNotes: String(specialNotes || '').trim(),
    items: normalizedItems,
    subtotal: 0,
    gst: 0,
    deliveryFee: 0,
    totalAmount: 0,
    source: 'upi-confirmed',
    paymentMethod,
    paymentStatus: 'Paid',
    paymentTransactionId: `UPI-${orderId}`,
    orderStatus: 'Incomplete',
  };

  const totals = calculateTotals(normalizedItems, normalizedOrderType || 'delivery');
  const nextDeliveryPin = normalizedOrderType === 'delivery' && !orderRecord.deliveryPin ? createDeliveryPin() : orderRecord.deliveryPin || null;

  orderRecord.customerName = orderRecord.customerName || String(customerName || '').trim();
  orderRecord.customerPhone = orderRecord.customerPhone || String(customerPhone || '').trim();
  orderRecord.orderType = normalizedOrderType;
  orderRecord.tableNumber = String(tableNumber || '').trim();
  orderRecord.deliveryAddress = String(deliveryAddress || '').trim();
  orderRecord.specialNotes = String(specialNotes || '').trim();
  orderRecord.items = normalizedItems;
  orderRecord.subtotal = totals.subtotal;
  orderRecord.gst = totals.gst;
  orderRecord.deliveryFee = totals.deliveryFee;
  orderRecord.totalAmount = Number(receivedAmount) > 0 ? Number(receivedAmount) : totals.totalAmount;
  orderRecord.paymentMethod = paymentMethod;
  orderRecord.paymentStatus = 'Paid';
  orderRecord.paymentTransactionId = `UPI-${orderId}`;
  orderRecord.paymentAmount = Number(receivedAmount) > 0 ? Number(receivedAmount) : totals.totalAmount;
  orderRecord.orderStatus = orderRecord.orderStatus || 'Incomplete';
  orderRecord.deliveryPin = nextDeliveryPin;
  orderRecord.deliveryVerified = Boolean(orderRecord.deliveryVerified);
  orderRecord.updatedAt = new Date().toISOString();

  if (!existingOrder) {
    orders.unshift(orderRecord);
  } else {
    const index = orders.findIndex((order) => order.id === orderId);
    orders[index] = { ...orders[index], ...orderRecord };
  }

  await writeJson(ORDERS_FILE, orders.slice(0, 500));
  return orderRecord;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'ready' });
});

app.post('/api/staff/login', (req, res) => {
  const pin = String(req.body?.pin || '').trim();
  const configuredPin = String(process.env.VITE_STAFF_PIN || '').trim();

  console.log('DEBUG LOGIN: Received pin:', JSON.stringify(pin), 'Type:', typeof pin, 'Length:', pin.length);
  console.log('DEBUG LOGIN: Configured pin:', JSON.stringify(configuredPin), 'Type:', typeof configuredPin, 'Length:', configuredPin.length);
  console.log('DEBUG LOGIN: Match?', pin === configuredPin);

  if (!configuredPin) {
    return res.status(500).json({ ok: false, message: 'No staff PIN is configured on the server.' });
  }

  if (pin !== configuredPin) {
    return res.status(401).json({ ok: false, message: 'Invalid staff PIN.' });
  }

  const token = createStaffToken();
  STAFF_TOKENS.set(token, {
    issuedAt: Date.now(),
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  });

  return res.json({
    ok: true,
    token,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  });
});

app.post('/api/create-payment', async (req, res) => {
  try {
    const body = req.body || {};
    const orderType = body.orderType || 'delivery';
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const deliveryAddress = String(body.deliveryAddress || '').trim();
    const tableNumber = String(body.tableNumber || '').trim();
    const specialNotes = String(body.specialNotes || '').trim();
    const paymentMethod = getProvider(body.paymentMethod || 'PhonePe');
    const normalizedItems = normalizeItems(body.items || []);

    if (!customerName || !customerPhone) {
      return res.status(400).json({ ok: false, message: 'Customer name and phone are required before payment.' });
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ ok: false, message: 'Delivery address is required.' });
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ ok: false, message: 'No valid items found in the order.' });
    }

    const totals = calculateTotals(normalizedItems, orderType);
    const orderId = generateOrderId();
    const transactionId = createTransactionId(paymentMethod);

    const paymentRecord = {
      transactionId,
      orderId,
      provider: paymentMethod,
      status: 'INITIATED',
      createdAt: new Date().toISOString(),
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      deliveryAddress,
      specialNotes,
      orderDraft: {
        ...totals,
        items: normalizedItems,
      },
    };

    const existingPayments = await readJson(PAYMENTS_FILE, []);
    await writeJson(PAYMENTS_FILE, [paymentRecord, ...existingPayments].slice(0, 500));

    const redirectUrl = buildRedirectUrl({ provider: paymentMethod, orderId, transactionId });

    return res.json({
      ok: true,
      paymentMethod: paymentMethod,
      payment: {
        transactionId,
        status: 'INITIATED',
        redirectUrl,
      },
      orderDraft: {
        id: orderId,
        customerName,
        customerPhone,
        orderType,
        tableNumber,
        deliveryAddress,
        specialNotes,
        ...totals,
        items: normalizedItems,
      },
    });
  } catch (error) {
    console.error('Payment creation failed:', error);
    return res.status(500).json({ ok: false, message: 'Unable to initiate payment.' });
  }
});

app.post('/api/payment/callback', async (req, res) => {
  try {
    const body = req.body || {};
    const { provider, orderId, transactionId, status, checksum, signature, mock } = body;
    const normalizedProvider = getProvider(provider || 'PhonePe');

    if (checksum || signature) {
      const valid = verifySignature({ provider: normalizedProvider, body, signature: checksum || signature });
      if (!valid) {
        return res.status(400).json({ ok: false, message: 'Payment signature verification failed.' });
      }
    }

    const existingPayments = await readJson(PAYMENTS_FILE, []);
    const paymentRecord = existingPayments.find((entry) => entry.transactionId === transactionId || entry.orderId === orderId) || null;

    if (!paymentRecord) {
      return res.status(404).json({ ok: false, message: 'Payment transaction not found.' });
    }

    const normalizedStatus = String(status || '').toUpperCase();
    const success = normalizedStatus === 'SUCCESS' || normalizedStatus === 'PAID' || mock === true;

    if (!success) {
      paymentRecord.status = 'FAILED';
      paymentRecord.failedAt = new Date().toISOString();
      await writeJson(PAYMENTS_FILE, existingPayments.map((entry) => entry.transactionId === transactionId ? paymentRecord : entry));
      return res.status(400).json({ ok: false, message: 'Payment failed or was not completed.', paymentStatus: 'Failed' });
    }

    paymentRecord.status = 'PAID';
    paymentRecord.paidAt = new Date().toISOString();
    paymentRecord.paymentStatus = 'Paid';
    paymentRecord.paymentTransactionId = transactionId;
    paymentRecord.paymentMethod = normalizedProvider;

    const orders = await readJson(ORDERS_FILE, []);
    const orderAlreadyExists = orders.some((order) => order.id === orderId || order.paymentTransactionId === transactionId);

    if (!orderAlreadyExists) {
      const orderRecord = {
        id: orderId,
        createdAt: new Date().toISOString(),
        customerName: paymentRecord.customerName,
        customerPhone: paymentRecord.customerPhone,
        orderType: paymentRecord.orderType,
        tableNumber: paymentRecord.tableNumber || '',
        deliveryAddress: paymentRecord.deliveryAddress || '',
        specialNotes: paymentRecord.specialNotes || '',
        items: paymentRecord.orderDraft.items,
        subtotal: paymentRecord.orderDraft.subtotal,
        gst: paymentRecord.orderDraft.gst,
        deliveryFee: paymentRecord.orderDraft.deliveryFee,
        totalAmount: paymentRecord.orderDraft.totalAmount,
        source: 'payment-confirmed-whatsapp-order',
        paymentMethod: normalizedProvider,
        paymentStatus: 'Paid',
        paymentTransactionId: transactionId,
      };

      await writeJson(ORDERS_FILE, [orderRecord, ...orders].slice(0, 500));
      paymentRecord.orderRecordId = orderRecord.id;
      await writeJson(PAYMENTS_FILE, existingPayments.map((entry) => entry.transactionId === transactionId ? paymentRecord : entry));

      return res.json({ ok: true, order: orderRecord, paymentStatus: 'Paid', message: 'Payment verified and order created.' });
    }

    await writeJson(PAYMENTS_FILE, existingPayments.map((entry) => entry.transactionId === transactionId ? paymentRecord : entry));

    return res.json({ ok: true, paymentStatus: 'Paid', message: 'Payment verified; order already exists.' });
  } catch (error) {
    console.error('Payment callback processing failed:', error);
    return res.status(500).json({ ok: false, message: 'Unable to process payment callback.' });
  }
});

app.post('/api/create-upi-payment', async (req, res) => {
  try {
    const body = req.body || {};
    const orderType = body.orderType || 'delivery';
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const deliveryAddress = String(body.deliveryAddress || '').trim();
    const tableNumber = String(body.tableNumber || '').trim();
    const specialNotes = String(body.specialNotes || '').trim();
    const normalizedItems = normalizeItems(body.items || []);

    if (!customerName || !customerPhone) {
      return res.status(400).json({ ok: false, message: 'Customer name and phone are required.' });
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ ok: false, message: 'Delivery address is required.' });
    }

    if (!normalizedItems.length) {
      return res.status(400).json({ ok: false, message: 'No valid items found in the order.' });
    }

    const totals = calculateTotals(normalizedItems, orderType);
    const orderId = generateOrderId();
    const upiUrl = buildUPIUrl({ amount: totals.totalAmount, orderId, upiId: OWNER_UPI_ID });
    const qrDataUrl = await QRCode.toDataURL(upiUrl);

    const paymentRecord = {
      orderId,
      paymentMethod: 'UPI',
      status: 'INITIATED',
      createdAt: new Date().toISOString(),
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      deliveryAddress,
      specialNotes,
      orderDraft: {
        ...totals,
        items: normalizedItems,
      },
      amountLocked: totals.totalAmount,
      upiId: OWNER_UPI_ID,
    };

    const existingPayments = await readJson(PAYMENTS_FILE, []);
    await writeJson(PAYMENTS_FILE, [paymentRecord, ...existingPayments].slice(0, 500));

    return res.json({
      ok: true,
      orderId,
      amount: totals.totalAmount,
      upiId: OWNER_UPI_ID,
      upiUrl,
      qrDataUrl,
      message: 'UPI payment request created. The amount is locked server-side and cannot be edited by the customer.',
    });
  } catch (error) {
    console.error('Unable to create UPI payment request:', error);
    return res.status(500).json({ ok: false, message: 'Unable to create UPI payment request.' });
  }
});

app.post('/api/confirm-upi-payment', async (req, res) => {
  try {
    const body = req.body || {};
    const orderId = String(body.orderId || '').trim();
    const amount = Number(body.amount || 0);
    const orderType = String(body.orderType || 'delivery');
    const customerName = String(body.customerName || '').trim();
    const customerPhone = String(body.customerPhone || '').trim();
    const deliveryAddress = String(body.deliveryAddress || '').trim();
    const tableNumber = String(body.tableNumber || '').trim();
    const specialNotes = String(body.specialNotes || '').trim();
    const items = normalizeItems(body.items || []);

    if (!orderId) {
      return res.status(400).json({ ok: false, message: 'Order ID is required for UPI confirmation.' });
    }

    if (!items.length) {
      return res.status(400).json({ ok: false, message: 'No valid items found for UPI order confirmation.' });
    }

    const orderRecord = await markUPIPaymentAsPaid({
      orderId,
      amount,
      customerName,
      customerPhone,
      orderType,
      tableNumber,
      deliveryAddress,
      specialNotes,
      items,
      paymentMethod: 'UPI',
    });

    return res.json({ ok: true, order: orderRecord, paymentStatus: 'Paid' });
  } catch (error) {
    console.error('Unable to confirm UPI payment:', error);
    return res.status(500).json({ ok: false, message: 'Unable to confirm UPI payment.' });
  }
});

app.get('/api/orders', requireStaffSession, async (_req, res) => {
  try {
    const orders = await readJson(ORDERS_FILE, []);
    return res.json({ ok: true, orders });
  } catch (error) {
    console.error('Unable to fetch order list:', error);
    return res.status(500).json({ ok: false, message: 'Unable to list orders.' });
  }
});

app.patch('/api/orders/:orderId', requireStaffSession, async (req, res) => {
  try {
    const { orderId } = req.params;
    const patch = req.body || {};
    const orders = await readJson(ORDERS_FILE, []);
    const index = orders.findIndex((order) => order.id === orderId);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: 'Order not found.' });
    }

    const nextOrder = {
      ...orders[index],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    if (patch.orderStatus === 'Complete' && nextOrder.orderType === 'delivery') {
      nextOrder.deliveryVerified = true;
    }

    if (patch.orderStatus) {
      nextOrder.orderStatus = patch.orderStatus;
    }

    if (patch.deliveryVerified === true) {
      nextOrder.deliveryVerified = true;
      nextOrder.orderStatus = 'Complete';
    }

    orders[index] = nextOrder;
    await writeJson(ORDERS_FILE, orders.slice(0, 500));
    return res.json({ ok: true, order: nextOrder });
  } catch (error) {
    console.error('Unable to update order:', error);
    return res.status(500).json({ ok: false, message: 'Unable to update order.' });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`Chef Planet payment API listening on http://localhost:${port}`);
});
