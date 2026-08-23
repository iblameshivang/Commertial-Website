const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MissionNepal';
const DEFAULT_PRODUCT_IMAGE = '/images/no-image.svg';
const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 499;
const DELIVERY_DAYS = 5;
const PHONE_PATTERN = /^[6-9]\d{9}$/;
const PINCODE_PATTERN = /^\d{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173';
const allowedOrigins = (process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean);

const isLocalOrigin = origin => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');

const sanitizeString = value => (typeof value === 'string' ? value.trim() : '');
const requireAdmin = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Admin access denied.' });
  }

  return next();
};

const normalizeImageUrl = value => {
  const trimmed = sanitizeString(value);
  if (!trimmed) {
    return DEFAULT_PRODUCT_IMAGE;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\.?\//, '')}`;
};

const getProductImages = (productId, fallbackImage) => {
  const rows = db.prepare(`
    SELECT image_url FROM product_images
    WHERE product_id = ?
    ORDER BY sort_order ASC, id ASC
  `).all(productId);

  const images = rows.map(row => normalizeImageUrl(row.image_url)).filter(Boolean);
  if (images.length > 0) {
    return images;
  }

  return [normalizeImageUrl(fallbackImage || DEFAULT_PRODUCT_IMAGE)];
};

const serializeProduct = product => {
  const imageUrl = normalizeImageUrl(product.image_url || DEFAULT_PRODUCT_IMAGE);
  const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(product.category_id);
  const productImages = getProductImages(product.id, imageUrl);

  return {
    ...product,
    description: product.description || '',
    image_url: productImages[0],
    images: productImages,
    category_name: category ? category.name : product.category_name || '',
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
  };
};

const saveProductImages = (productId, incomingImageUrls, fallbackImage) => {
  const normalizedUrls = Array.from(
    new Set(
      (Array.isArray(incomingImageUrls) ? incomingImageUrls : [])
        .map(value => normalizeImageUrl(value))
        .filter(Boolean)
    )
  );

  const primaryImage = normalizedUrls[0] || normalizeImageUrl(fallbackImage || DEFAULT_PRODUCT_IMAGE);

  db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);

  if (normalizedUrls.length === 0) {
    db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)')
      .run(productId, primaryImage, 0, 1);
    db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(primaryImage, productId);
    return;
  }

  normalizedUrls.forEach((imageUrl, index) => {
    db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)')
      .run(productId, imageUrl, index, index === 0 ? 1 : 0);
  });

  db.prepare('UPDATE products SET image_url = ? WHERE id = ?').run(primaryImage, productId);
};

const roundCurrency = value => Math.round(Number(value || 0) * 100) / 100;

const calculateDeliveryFee = subtotal => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);

const buildOrderCode = (orderId, orderedAt) => {
  const datePart = orderedAt.slice(0, 10).replace(/-/g, '');
  return `ORD-${datePart}-${String(orderId).padStart(4, '0')}`;
};

const serializeOrder = order => {
  const items = db.prepare(`
    SELECT id, product_id, product_name, image_url, unit_price, quantity, line_total
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
  `).all(order.id);

  return {
    ...order,
    subtotal: Number(order.subtotal || 0),
    delivery_fee: Number(order.delivery_fee || 0),
    total: Number(order.total || 0),
    items: items.map(item => ({
      ...item,
      image_url: normalizeImageUrl(item.image_url),
      unit_price: Number(item.unit_price || 0),
      quantity: Number(item.quantity || 0),
      line_total: Number(item.line_total || 0),
    })),
  };
};

// Returns { address } on success or { error } with the first problem found.
const validateAddress = body => {
  const address = {
    customer_name: sanitizeString(body?.customer_name),
    phone: sanitizeString(body?.phone).replace(/[\s-]/g, ''),
    email: sanitizeString(body?.email),
    address_line1: sanitizeString(body?.address_line1),
    address_line2: sanitizeString(body?.address_line2),
    city: sanitizeString(body?.city),
    state: sanitizeString(body?.state),
    pincode: sanitizeString(body?.pincode),
    payment_method: sanitizeString(body?.payment_method) || 'COD',
  };

  if (!address.customer_name) {
    return { error: 'Full name is required.' };
  }

  if (!PHONE_PATTERN.test(address.phone)) {
    return { error: 'Enter a valid 10-digit mobile number.' };
  }

  if (address.email && !EMAIL_PATTERN.test(address.email)) {
    return { error: 'Enter a valid email address, or leave it blank.' };
  }

  if (!address.address_line1) {
    return { error: 'Address is required.' };
  }

  if (!address.city) {
    return { error: 'City is required.' };
  }

  if (!address.state) {
    return { error: 'State is required.' };
  }

  if (!PINCODE_PATTERN.test(address.pincode)) {
    return { error: 'Enter a valid 6-digit pincode.' };
  }

  if (address.payment_method !== 'COD') {
    return { error: 'Only Cash on Delivery is supported right now.' };
  }

  return { address };
};

// Merges duplicate product_id entries and validates shape. Prices are ignored here on
// purpose — they are always read from the database when the order is priced.
const normalizeOrderItems = rawItems => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Your cart is empty.' };
  }

  const quantityByProductId = new Map();

  for (const rawItem of rawItems) {
    const productId = Number(rawItem?.product_id ?? rawItem?.id);
    const quantity = Number(rawItem?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      return { error: 'Cart contains an invalid product.' };
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { error: 'Cart quantities must be whole numbers greater than zero.' };
    }

    quantityByProductId.set(productId, (quantityByProductId.get(productId) || 0) + quantity);
  }

  return {
    items: [...quantityByProductId].map(([product_id, quantity]) => ({ product_id, quantity })),
  };
};

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb', strict: false }));
const uploadDirectory = path.join(__dirname, 'public', 'images', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
      const safeName = (file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
      callback(null, `${Date.now()}-${safeName}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!file || !file.mimetype || !file.mimetype.startsWith('image/')) {
      callback(new Error('Only image files are allowed.'));
      return;
    }

    callback(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

app.post('/api/admin/login', express.text({ type: '*/*' }), (req, res) => {
  let payload = {};

  try {
    const rawBody = typeof req.body === 'string' ? req.body : '';
    if (rawBody.trim()) {
      payload = JSON.parse(rawBody);
    }
  } catch (err) {
    const fallbackText = String(typeof req.body === 'string' ? req.body : '').trim();
    if (fallbackText) {
      const match = fallbackText.match(/password\s*[:=]\s*['"]?([^'"\s,}]+)['"]?/i);
      if (match && match[1]) {
        payload = { password: match[1] };
      }
    }
  }

  const password = sanitizeString(payload?.password || req.body?.password || req.query?.password || '');

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect admin password.' });
  }

  return res.json({ success: true });
});

app.post('/api/uploads', requireAdmin, upload.array('images', 10), (req, res) => {
  try {
    const uploadedFiles = Array.isArray(req.files) ? req.files : [];
    const imageUrls = uploadedFiles.map(file => `/images/uploads/${path.basename(file.path)}`);
    return res.status(201).json({ images: imageUrls });
  } catch (err) {
    console.error('Error uploading images', err);
    return res.status(500).json({ error: 'Failed to upload images.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/categories', (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
    res.json(rows);
  } catch (err) {
    console.error('Error fetching categories', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', requireAdmin, (req, res) => {
  try {
    const name = sanitizeString(req.body?.name);

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name);
    if (existing) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
    const category = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json(category);
  } catch (err) {
    console.error('Error creating category', err);
    return res.status(500).json({ error: 'Failed to create category' });
  }
});

app.put('/api/categories/:id', requireAdmin, (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const name = sanitizeString(req.body?.name);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const existingCategory = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const duplicate = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name, categoryId);
    if (duplicate) {
      return res.status(409).json({ error: 'Another category already uses that name.' });
    }

    db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, categoryId);
    const category = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(categoryId);

    return res.json(category);
  } catch (err) {
    console.error('Error updating category', err);
    return res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:id', requireAdmin, (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const { count } = db.prepare('SELECT COUNT(*) AS count FROM products WHERE category_id = ?').get(categoryId);
    if (count > 0) {
      return res.status(409).json({
        error: 'Cannot delete category containing products. Reassign or delete products first.'
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(categoryId);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting category', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

app.get('/api/products', (req, res) => {
  try {
    const categoryIdValue = sanitizeString(req.query.category_id);
    const categoryId = categoryIdValue ? Number(categoryIdValue) : null;

    let query = `
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url, p.description
      FROM products p
      JOIN categories c ON p.category_id = c.id
    `;
    const params = [];

    if (Number.isInteger(categoryId) && categoryId > 0) {
      query += ' WHERE p.category_id = ?';
      params.push(categoryId);
    }

    query += ' ORDER BY p.id';

    const rows = db.prepare(query).all(...params).map(serializeProduct);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url, p.description
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json(serializeProduct(product));
  } catch (err) {
    console.error('Error fetching product', err);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.get('/api/categories/:id/products', (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    return res.redirect(307, `/api/products?category_id=${categoryId}`);
  } catch (err) {
    console.error('Error fetching category products', err);
    return res.status(500).json({ error: 'Failed to fetch products for category' });
  }
});

app.post('/api/products', requireAdmin, (req, res) => {
  try {
    const name = sanitizeString(req.body?.name);
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const categoryId = Number(req.body?.category_id);
    const imageUrl = sanitizeString(req.body?.image_url);
    const description = sanitizeString(req.body?.description);
    const incomingImages = Array.isArray(req.body?.images)
      ? req.body.images
      : typeof req.body?.images === 'string'
        ? req.body.images.split(',')
        : [];

    if (!name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Product price must be a number greater than zero.' });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Product stock must be a non-negative integer.' });
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const primaryImage = imageUrl || incomingImages.find(item => typeof item === 'string' && item.trim()) || DEFAULT_PRODUCT_IMAGE;
    const finalImage = normalizeImageUrl(primaryImage);

    const result = db.prepare(`
      INSERT INTO products (name, price, stock, category_id, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, price, stock, categoryId, finalImage, description);

    const productId = Number(result.lastInsertRowid);
    saveProductImages(productId, incomingImages.length ? incomingImages : [finalImage], finalImage);

    const product = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url, p.description
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId);

    return res.status(201).json(serializeProduct(product));
  } catch (err) {
    console.error('Error creating product', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const productId = Number(req.params.id);
    const name = sanitizeString(req.body?.name);
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const categoryId = Number(req.body?.category_id);
    const imageUrl = sanitizeString(req.body?.image_url);
    const description = sanitizeString(req.body?.description);
    const incomingImages = Array.isArray(req.body?.images)
      ? req.body.images
      : typeof req.body?.images === 'string'
        ? req.body.images.split(',')
        : [];

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: 'Product price must be a number greater than zero.' });
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'Product stock must be a non-negative integer.' });
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const primaryImage = imageUrl || incomingImages.find(item => typeof item === 'string' && item.trim()) || DEFAULT_PRODUCT_IMAGE;
    const finalImage = normalizeImageUrl(primaryImage);

    db.prepare(`
      UPDATE products
      SET name = ?, price = ?, stock = ?, category_id = ?, image_url = ?, description = ?
      WHERE id = ?
    `).run(name, price, stock, categoryId, finalImage, description, productId);

    saveProductImages(productId, incomingImages.length ? incomingImages : [finalImage], finalImage);

    const updatedProduct = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url, p.description
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId);

    return res.json(serializeProduct(updatedProduct));
  } catch (err) {
    console.error('Error updating product', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare('DELETE FROM product_images WHERE product_id = ?').run(productId);
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const addressResult = validateAddress(req.body);
    if (addressResult.error) {
      return res.status(400).json({ error: addressResult.error });
    }

    const itemsResult = normalizeOrderItems(req.body?.items);
    if (itemsResult.error) {
      return res.status(400).json({ error: itemsResult.error });
    }

    const { address } = addressResult;
    const findProduct = db.prepare('SELECT id, name, price, stock, image_url FROM products WHERE id = ?');
    const pricedItems = [];

    for (const item of itemsResult.items) {
      const product = findProduct.get(item.product_id);

      if (!product) {
        return res.status(404).json({
          error: 'A product in your cart is no longer available. Please review your cart.',
          product_id: item.product_id,
        });
      }

      const availableStock = Number(product.stock || 0);
      if (availableStock < item.quantity) {
        return res.status(409).json({
          error: availableStock === 0
            ? `${product.name} just went out of stock.`
            : `Only ${availableStock} left of ${product.name}.`,
          product_id: product.id,
          available_stock: availableStock,
        });
      }

      const unitPrice = roundCurrency(product.price);
      pricedItems.push({
        product_id: product.id,
        product_name: product.name,
        image_url: normalizeImageUrl(product.image_url),
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: roundCurrency(unitPrice * item.quantity),
      });
    }

    const subtotal = roundCurrency(pricedItems.reduce((sum, item) => sum + item.line_total, 0));
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = roundCurrency(subtotal + deliveryFee);

    const orderedAtDate = new Date();
    const expectedDeliveryDate = new Date(orderedAtDate.getTime() + DELIVERY_DAYS * 24 * 60 * 60 * 1000);
    const orderedAt = orderedAtDate.toISOString();
    const expectedDeliveryAt = expectedDeliveryDate.toISOString();

    db.exec('BEGIN');

    let orderId;
    try {
      const insertResult = db.prepare(`
        INSERT INTO orders (
          order_code, customer_name, phone, email,
          address_line1, address_line2, city, state, pincode,
          payment_method, subtotal, delivery_fee, total, status,
          ordered_at, expected_delivery_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `PENDING-${orderedAt}`,
        address.customer_name,
        address.phone,
        address.email || null,
        address.address_line1,
        address.address_line2 || null,
        address.city,
        address.state,
        address.pincode,
        address.payment_method,
        subtotal,
        deliveryFee,
        total,
        'Confirmed',
        orderedAt,
        expectedDeliveryAt
      );

      orderId = Number(insertResult.lastInsertRowid);

      db.prepare('UPDATE orders SET order_code = ? WHERE id = ?')
        .run(buildOrderCode(orderId, orderedAt), orderId);

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      // Guarded on stock so a concurrent order cannot push stock negative.
      const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');

      for (const item of pricedItems) {
        insertItem.run(
          orderId,
          item.product_id,
          item.product_name,
          item.image_url,
          item.unit_price,
          item.quantity,
          item.line_total
        );

        const stockResult = reduceStock.run(item.quantity, item.product_id, item.quantity);
        if (stockResult.changes === 0) {
          throw Object.assign(new Error(`${item.product_name} just went out of stock.`), { statusCode: 409 });
        }
      }

      db.exec('COMMIT');
    } catch (transactionError) {
      db.exec('ROLLBACK');
      throw transactionError;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    return res.status(201).json(serializeOrder(order));
  } catch (err) {
    if (err && err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    console.error('Error creating order', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
});

app.get('/api/orders', requireAdmin, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT o.*, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.id DESC
    `).all();

    return res.json(rows.map(row => ({
      ...row,
      subtotal: Number(row.subtotal || 0),
      delivery_fee: Number(row.delivery_fee || 0),
      total: Number(row.total || 0),
      item_count: Number(row.item_count || 0),
    })));
  } catch (err) {
    console.error('Error fetching orders', err);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:orderCode', (req, res) => {
  try {
    const orderCode = sanitizeString(req.params.orderCode);

    if (!orderCode) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode);
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.json(serializeOrder(order));
  } catch (err) {
    console.error('Error fetching order', err);
    return res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
