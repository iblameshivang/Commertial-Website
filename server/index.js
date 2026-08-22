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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
