const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./db');
const { suggestAiColors, LUXURY_COLOR_PRESETS } = require('./colors');

// ── Startup Guards: crash immediately if critical secrets are missing ──
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error('FATAL: JWT_SECRET environment variable is required. Server cannot start.');
    process.exit(1);
  }
  console.warn('WARNING: JWT_SECRET not set — using insecure default. Set JWT_SECRET env var before deploying.');
}

if (!process.env.ADMIN_PASSWORD) {
  if (IS_PRODUCTION) {
    console.error('FATAL: ADMIN_PASSWORD environment variable is required. Server cannot start.');
    process.exit(1);
  }
  console.warn('WARNING: ADMIN_PASSWORD not set — using insecure default. Set ADMIN_PASSWORD env var before deploying.');
}

const app = express();
const PORT = Number(process.env.PORT) || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'ShopverseSecretKey2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'MissionNepal';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (IS_PRODUCTION ? undefined : true);
const DEFAULT_PRODUCT_IMAGE = '/images/no-image.svg';
const DELIVERY_FEE = 49;
const FREE_DELIVERY_THRESHOLD = 499;
const MAX_ITEM_QUANTITY = 99;

// ── Helpers ──
const sanitizeString = v => (typeof v === 'string' ? v.trim() : '');
const roundCurrency = v => Math.round(Number(v || 0) * 100) / 100;
const calculateDeliveryFee = subtotal => (subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE);
const getSessionId = req => sanitizeString(req.headers['x-session-id']) || 'anonymous';

const normalizeImageUrl = value => {
  const trimmed = sanitizeString(value);
  if (!trimmed) return DEFAULT_PRODUCT_IMAGE;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed.replace(/^\.?\//, '')}`;
};

const parseJsonField = (val) => {
  if (!val) return [];
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
};

const getProductVariants = (productId) => {
  try {
    const rows = db.prepare(`
      SELECT id, product_id, color_name, color_hex, image_url, stock, display_order
      FROM product_color_variants
      WHERE product_id = ?
      ORDER BY display_order ASC, id ASC
    `).all(productId);
    return rows.map(r => ({
      id: r.id,
      product_id: r.product_id,
      color_name: r.color_name,
      color_hex: r.color_hex || '#355E58',
      image_url: normalizeImageUrl(r.image_url),
      stock: Number(r.stock ?? 0),
      display_order: Number(r.display_order ?? 0)
    }));
  } catch (err) {
    return [];
  }
};

const getProductImages = (productId, fallbackImage) => {
  try {
    const rows = db.prepare(`SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC`).all(productId);
    const images = rows.map(r => normalizeImageUrl(r.image_url)).filter(Boolean);
    return images.length > 0 ? images : [normalizeImageUrl(fallbackImage || DEFAULT_PRODUCT_IMAGE)];
  } catch (err) {
    return [normalizeImageUrl(fallbackImage || DEFAULT_PRODUCT_IMAGE)];
  }
};

const serializeProduct = product => {
  const imageUrl = normalizeImageUrl(product.image_url || DEFAULT_PRODUCT_IMAGE);
  const productImages = getProductImages(product.id, imageUrl);
  const variants = getProductVariants(product.id);

  return {
    id: product.id,
    seller_id: product.seller_id,
    name: product.name,
    description: product.description || '',
    price: Number(product.price || 0),
    original_price: product.original_price ? Number(product.original_price) : null,
    discount_percentage: Number(product.discount_percentage || 0),
    category: product.category || 'clothing',
    category_id: product.category_id,
    brand: product.brand || '',
    stock: Number(product.stock || 0),
    image_url: variants[0]?.image_url || productImages[0],
    default_image: normalizeImageUrl(product.default_image || imageUrl),
    images: productImages.length > 1 ? productImages : (variants.length > 1 ? variants.map(v => v.image_url) : productImages),
    variants,
    video_url: product.video_url || null,
    rating: Number(product.rating || 0),
    review_count: Number(product.review_count || 0),
    colors: parseJsonField(product.colors).length ? parseJsonField(product.colors) : variants.map(v => v.color_name),
    materials: parseJsonField(product.materials),
    sizes: parseJsonField(product.sizes),
    gender: product.gender || null,
    style: product.style || null,
    features: parseJsonField(product.features),
    shape: product.shape || null,
    created_at: product.created_at || null,
    updated_at: product.updated_at || null,
    is_active: product.is_active !== 0,
  };
};

// ── Authentication Middleware ──
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, data: null, message: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, data: null, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireSeller = (req, res, next) => {
  if (!req.user || (req.user.role !== 'seller' && req.user.role !== 'admin')) {
    return res.status(403).json({ success: false, data: null, message: 'Seller or admin privilege required' });
  }
  next();
};

// ── Express Middleware ──

// Security headers (X-Content-Type-Options, X-Frame-Options, HSTS, CSP, etc.)
app.use(helmet({
  contentSecurityPolicy: IS_PRODUCTION ? undefined : false, // Disable CSP in dev for hot-reload
  crossOriginEmbedderPolicy: false, // Allow loading external images (Unsplash)
}));
if (IS_PRODUCTION) {
  app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
}

// CORS — restrict to specific origin in production
if (!ALLOWED_ORIGIN && IS_PRODUCTION) {
  console.error('FATAL: ALLOWED_ORIGIN environment variable is required in production for CORS.');
  process.exit(1);
}
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

app.use(express.json({ limit: '10mb' }));

// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: { success: false, data: null, message: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: { success: false, data: null, message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload with type validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime'
];

const uploadDirectory = path.join(__dirname, 'public', 'images', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDirectory),
    filename: (_req, file, cb) => {
      const safeName = (file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '-');
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for photos and videos
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Only images and videos are accepted.`), false);
    }
  },
});

// Serve uploaded images with restrictive headers to prevent XSS via SVG/HTML uploads
app.use('/images', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
  next();
}, express.static(path.join(__dirname, 'public', 'images')));

// ══════════════════════════════════════════
// AUTHENTICATION API
// ══════════════════════════════════════════
app.post('/api/auth/register', registrationLimiter, (req, res) => {
  try {
    const { username, password, email, role = 'customer', brand_name } = req.body;
    const cleanUser = sanitizeString(username);
    const cleanPass = sanitizeString(password);
    const cleanEmail = sanitizeString(email);

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, data: null, message: 'Username and password required' });
    }
    if (role === 'seller' && !sanitizeString(brand_name)) {
      return res.status(400).json({ success: false, data: null, message: 'Brand name is required for seller accounts' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUser, cleanEmail);
    if (existing) {
      return res.status(409).json({ success: false, data: null, message: 'Username or email already registered' });
    }

    const password_hash = bcrypt.hashSync(cleanPass, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash, email, role, brand_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanUser, password_hash, cleanEmail || null, role, brand_name || null);

    const user = db.prepare('SELECT id, username, email, role, brand_name, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ success: true, data: { user, token }, message: 'Registration successful' });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = sanitizeString(username);
    const cleanPass = sanitizeString(password);

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, data: null, message: 'Username and password required' });
    }

    const user = db.prepare('SELECT id, username, email, role, brand_name, password_hash, created_at FROM users WHERE username = ? OR email = ?').get(cleanUser, cleanUser);
    if (!user || !bcrypt.compareSync(cleanPass, user.password_hash)) {
      return res.status(401).json({ success: false, data: null, message: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...userProfile } = user;

    res.json({ success: true, data: { user: userProfile, token }, message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, email, role, brand_name, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ success: false, data: null, message: 'User not found' });
    res.json({ success: true, data: user, message: 'Current user profile' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to retrieve profile' });
  }
});

// Legacy admin login endpoint removed for security.
// All authentication now goes through /api/auth/login with JWT.

// ══════════════════════════════════════════
// PRODUCTS API
// ══════════════════════════════════════════
app.get('/api/products', (req, res) => {
  try {
    const {
      category, brand, minPrice, maxPrice, inStock, colors, materials,
      gender, style, features, q, search, sortBy = 'featured', page = 1, limit = 24
    } = req.query;

    let query = `SELECT p.* FROM products p WHERE p.is_active = 1`;
    const params = [];

    const searchTerm = q || search;
    if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) {
      const cleanTerm = `%${searchTerm.trim().toLowerCase()}%`;
      query += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.brand) LIKE ? OR LOWER(p.category) LIKE ?)`;
      params.push(cleanTerm, cleanTerm, cleanTerm, cleanTerm);
    }

    if (category && category !== 'all') {
      query += ` AND LOWER(p.category) = LOWER(?)`;
      params.push(category);
    }

    if (brand) {
      const brands = brand.split(',').map(b => b.trim().toLowerCase());
      query += ` AND LOWER(p.brand) IN (${brands.map(() => '?').join(',')})`;
      params.push(...brands);
    }

    if (minPrice) { query += ` AND p.price >= ?`; params.push(Number(minPrice)); }
    if (maxPrice) { query += ` AND p.price <= ?`; params.push(Number(maxPrice)); }
    if (inStock === 'true') { query += ` AND p.stock > 0`; }
    if (inStock === 'false') { query += ` AND p.stock = 0`; }
    if (gender && gender !== 'all') { query += ` AND (p.gender = ? OR p.gender = 'unisex')`; params.push(gender); }
    if (style) { query += ` AND p.style = ?`; params.push(style); }

    if (colors) {
      const colorList = colors.split(',');
      const colorClauses = colorList.map(() => `p.colors LIKE ?`);
      query += ` AND (${colorClauses.join(' OR ')})`;
      params.push(...colorList.map(c => `%"${c.trim()}"%`));
    }

    if (materials) {
      const matList = materials.split(',');
      const matClauses = matList.map(() => `p.materials LIKE ?`);
      query += ` AND (${matClauses.join(' OR ')})`;
      params.push(...matList.map(m => `%"${m.trim()}"%`));
    }

    if (features) {
      const featList = features.split(',');
      const featClauses = featList.map(() => `p.features LIKE ?`);
      query += ` AND (${featClauses.join(' OR ')})`;
      params.push(...featList.map(f => `%"${f.trim()}"%`));
    }

    // Count Total
    const countQuery = query.replace('SELECT p.* FROM products p', 'SELECT COUNT(*) as total FROM products p');
    const { total } = db.prepare(countQuery).get(...params);

    // Sorting
    switch (sortBy) {
      case 'price-asc': query += ` ORDER BY p.price ASC`; break;
      case 'price-desc': query += ` ORDER BY p.price DESC`; break;
      case 'newest': query += ` ORDER BY p.created_at DESC`; break;
      case 'rating': query += ` ORDER BY p.rating DESC`; break;
      case 'name-asc': query += ` ORDER BY p.name ASC`; break;
      case 'best-selling': query += ` ORDER BY p.review_count DESC`; break;
      default: query += ` ORDER BY p.rating DESC, p.id DESC`;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    query += ` LIMIT ? OFFSET ?`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const products = db.prepare(query).all(...params).map(serializeProduct);

    res.json({
      success: true,
      data: products,
      message: 'Products fetched successfully',
      meta: { total, page: pageNum, limit: limitNum }
    });
  } catch (err) {
    console.error('Products fetch error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch products' });
  }
});

app.get('/api/products/search', (req, res) => {
  try {
    const q = sanitizeString(req.query.q);
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 8));
    if (!q || q.length < 1) {
      return res.json({ success: true, data: [], message: 'No search term provided', meta: { total: 0 } });
    }

    const rows = db.prepare(`
      SELECT p.* FROM products p
      WHERE p.is_active = 1 AND (
        p.name LIKE ? OR p.brand LIKE ? OR p.category LIKE ? OR p.description LIKE ?
      )
      ORDER BY
        CASE WHEN LOWER(p.name) LIKE LOWER(?) THEN 0 ELSE 1 END,
        p.rating DESC
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `${q}%`, limit).map(serializeProduct);

    res.json({ success: true, data: rows, message: 'Search results', meta: { total: rows.length } });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Search failed' });
  }
});

// Best sellers algorithm: Top products by sales volume in last 30 days
app.get('/api/products/best-sellers', (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const rows = db.prepare(`
      SELECT p.*, COALESCE(SUM(s.quantity), 0) as volume 
      FROM products p 
      LEFT JOIN sales s ON p.id = s.product_id AND s.sale_date >= datetime('now', '-30 days')
      WHERE p.is_active = 1
      GROUP BY p.id 
      ORDER BY volume DESC, p.rating DESC 
      LIMIT ?
    `).all(limit).map(serializeProduct);

    res.json({ success: true, data: rows, message: 'Best sellers', meta: { total: rows.length } });
  } catch (err) {
    console.error('Best sellers error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch best sellers' });
  }
});

// New Launches: Latest 10 active products
app.get('/api/products/new-launches', (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, Number(req.query.limit) || 10));
    const rows = db.prepare(`
      SELECT * FROM products
      WHERE is_active = 1
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `).all(limit).map(serializeProduct);

    res.json({ success: true, data: rows, message: 'New launches', meta: { total: rows.length } });
  } catch (err) {
    console.error('New launches error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch new launches' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ success: false, data: null, message: 'Product not found' });

    const reviews = db.prepare('SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 20').all(productId);
    const serialized = serializeProduct(product);
    serialized.reviews = reviews;

    // Track recently viewed
    const sessionId = getSessionId(req);
    if (sessionId !== 'anonymous') {
      db.prepare('DELETE FROM recently_viewed WHERE session_id = ? AND product_id = ?').run(sessionId, productId);
      db.prepare('INSERT INTO recently_viewed (session_id, product_id) VALUES (?, ?)').run(sessionId, productId);
    }

    res.json({ success: true, data: serialized, message: 'Product details' });
  } catch (err) {
    console.error('Product details error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch product' });
  }
});

app.get('/api/products/:id/variants', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const variants = getProductVariants(productId);
    res.json({ success: true, data: variants, message: 'Product variants' });
  } catch (err) {
    res.status(500).json({ success: false, data: [], message: 'Failed to fetch variants' });
  }
});

// Dynamic color filter querying active filtered products context
app.get('/api/filters/colors', (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, gender, style } = req.query;
    let query = `
      SELECT DISTINCT cv.color_name as name, cv.color_hex as hex
      FROM product_color_variants cv
      JOIN products p ON cv.product_id = p.id
      WHERE p.is_active = 1
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND LOWER(p.category) = LOWER(?)`;
      params.push(sanitizeString(category));
    }
    if (brand) {
      const brandList = brand.split(',').map(b => b.trim()).filter(Boolean);
      if (brandList.length) {
        query += ` AND LOWER(p.brand) IN (${brandList.map(() => '?').join(',')})`;
        params.push(...brandList.map(b => b.toLowerCase()));
      }
    }
    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(Number(maxPrice));
    }
    if (gender && gender !== 'all') {
      query += ` AND LOWER(p.gender) = LOWER(?)`;
      params.push(sanitizeString(gender));
    }
    if (style) {
      const styleList = style.split(',').map(s => s.trim()).filter(Boolean);
      if (styleList.length) {
        query += ` AND LOWER(p.style) IN (${styleList.map(() => '?').join(',')})`;
        params.push(...styleList.map(s => s.toLowerCase()));
      }
    }

    query += ` ORDER BY cv.display_order ASC, cv.color_name ASC`;
    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows, message: 'Filtered colors fetched' });
  } catch (err) {
    console.error('Filter colors error:', err.message);
    res.status(500).json({ success: false, data: [], message: 'Failed to fetch colors' });
  }
});

// Dynamic category filters
app.get('/api/filters/:category', (req, res) => {
  try {
    const category = sanitizeString(req.params.category);
    const hasCatFilter = category && category !== 'all';
    const catFilter = hasCatFilter ? 'AND LOWER(p.category) = LOWER(?)' : '';
    const catParams = hasCatFilter ? [category] : [];

    const brands = db.prepare(`SELECT brand as name, COUNT(*) as count FROM products p WHERE is_active = 1 AND brand != '' ${catFilter} GROUP BY LOWER(brand) ORDER BY count DESC`).all(...catParams);
    const priceRange = db.prepare(`SELECT MIN(price) as min, MAX(price) as max FROM products p WHERE is_active = 1 ${catFilter}`).get(...catParams);

    const products = db.prepare(`SELECT colors, materials, sizes, gender, style, features FROM products p WHERE is_active = 1 ${catFilter}`).all(...catParams);

    const colorSet = new Set();
    const materialSet = new Set();
    const sizeSet = new Set();
    const genderSet = new Set();
    const styleSet = new Set();
    const featureSet = new Set();

    products.forEach(p => {
      parseJsonField(p.colors).forEach(c => colorSet.add(c));
      parseJsonField(p.materials).forEach(m => materialSet.add(m));
      parseJsonField(p.sizes).forEach(s => sizeSet.add(s));
      if (p.gender) genderSet.add(p.gender);
      if (p.style) styleSet.add(p.style);
      parseJsonField(p.features).forEach(f => featureSet.add(f));
    });

    res.json({
      success: true,
      data: {
        brands,
        priceRange: { min: priceRange.min || 0, max: Math.ceil(priceRange.max || 100000) },
        colors: [...colorSet],
        materials: [...materialSet],
        sizes: [...sizeSet],
        genders: [...genderSet],
        styles: [...styleSet],
        features: [...featureSet],
      },
      message: 'Filters fetched'
    });
  } catch (err) {
    console.error('Filters error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch filters' });
  }
});

// AI Color Palette Suggester for Products
app.post('/api/ai/suggest-colors', (req, res) => {
  try {
    const { name, description, category, image_url } = req.body || {};
    const suggested = suggestAiColors({
      name: sanitizeString(name),
      description: sanitizeString(description),
      category: sanitizeString(category),
      image_url: sanitizeString(image_url),
    });

    res.json({
      success: true,
      data: {
        colors: suggested,
        presets: LUXURY_COLOR_PRESETS,
      },
      message: 'AI color palette analyzed successfully'
    });
  } catch (err) {
    console.error('AI Color Suggester Error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to generate color suggestions' });
  }
});

// Categories & Brands list
app.get('/api/categories', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT c.id, c.name, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      GROUP BY c.id
      ORDER BY c.name
    `).all();
    res.json({ success: true, data: rows, message: 'Categories fetched' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch categories' });
  }
});

// ══════════════════════════════════════════
// ADVERTISEMENTS
// ══════════════════════════════════════════
app.get('/api/advertisements', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM advertisements
      WHERE is_active = 1
      ORDER BY display_order ASC, id DESC
    `).all();

    // If no active ads, fall back to auto-generated best sellers
    if (rows.length === 0) {
      const bestSellers = db.prepare(`
        SELECT p.* FROM products p
        WHERE p.is_active = 1
        ORDER BY p.rating DESC, p.id DESC
        LIMIT 3
      `).all();

      const autoAds = bestSellers.map((p, idx) => ({
        id: `auto-${p.id}`,
        title: p.name,
        subtitle: p.description ? p.description.slice(0, 80) + '...' : 'Explore our featured selection',
        image_url: p.image_url,
        target_type: 'product',
        target_id: p.id,
        cta_text: 'Discover Now',
        display_order: idx + 1,
      }));

      return res.json({ success: true, data: autoAds, message: 'Auto-generated advertisements' });
    }

    res.json({ success: true, data: rows, message: 'Advertisements fetched' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch advertisements' });
  }
});

app.post('/api/advertisements', authenticateToken, requireSeller, (req, res) => {
  try {
    const { title, subtitle, image_url, target_type, target_id, target_brand, target_category, cta_text, display_order } = req.body;
    if (!title || !image_url) return res.status(400).json({ success: false, data: null, message: 'Title and image URL required' });

    const result = db.prepare(`
      INSERT INTO advertisements (seller_id, title, subtitle, image_url, target_type, target_id, target_brand, target_category, cta_text, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(req.user.id, title, subtitle || null, image_url, target_type || null, target_id || null, target_brand || null, target_category || null, cta_text || 'Explore Collection', display_order || 0);

    const ad = db.prepare('SELECT * FROM advertisements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: ad, message: 'Advertisement created' });
  } catch (err) {
    console.error('Ad creation error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to create advertisement' });
  }
});

// ══════════════════════════════════════════
// SELLER PROTECTED ENDPOINTS
// ══════════════════════════════════════════
app.get('/api/seller/products', authenticateToken, requireSeller, (req, res) => {
  try {
    // Admin can see all products, sellers only see their own
    const condition = req.user.role === 'admin' ? '' : 'WHERE seller_id = ?';
    const params = req.user.role === 'admin' ? [] : [req.user.id];

    const products = db.prepare(`SELECT * FROM products ${condition} ORDER BY id DESC`).all(...params).map(serializeProduct);
    res.json({ success: true, data: products, message: 'Seller products fetched' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch seller products' });
  }
});

app.post('/api/seller/products', authenticateToken, requireSeller, (req, res) => {
  try {
    const incoming = Array.isArray(req.body) ? req.body : [req.body];
    const inserted = [];

    const insertStmt = db.prepare(`
      INSERT INTO products (
        seller_id, name, price, original_price, discount_percentage, category, brand, stock, image_url, description,
        rating, review_count, colors, materials, sizes, gender, style, features, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const item of incoming) {
      const name = sanitizeString(item.name);
      if (!name) continue;
      const price = Number(item.price || 0);
      const originalPrice = item.original_price ? Number(item.original_price) : null;
      const discount = item.discount_percentage ? Number(item.discount_percentage) : 0;
      const brand = sanitizeString(item.brand) || req.user.brand_name || 'Artisan';
      const category = sanitizeString(item.category) || 'clothing';
      const stock = Number(item.stock || 10);
      const imageUrl = normalizeImageUrl(item.image_url);
      const desc = sanitizeString(item.description);

      const resInsert = insertStmt.run(
        req.user.id, name, price, originalPrice, discount, category, brand, stock, imageUrl, desc,
        5.0, JSON.stringify(item.colors || []), JSON.stringify(item.materials || []),
        JSON.stringify(item.sizes || []), item.gender || null, item.style || 'minimal', JSON.stringify(item.features || [])
      );

      const prodId = Number(resInsert.lastInsertRowid);
      db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, 0, 1)').run(prodId, imageUrl);

      // Handle item variants if provided
      if (Array.isArray(item.variants) && item.variants.length > 0) {
        const insertVarStmt = db.prepare(`
          INSERT INTO product_color_variants (product_id, color_name, color_hex, image_url, stock, display_order)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        item.variants.forEach((v, idx) => {
          insertVarStmt.run(
            prodId,
            sanitizeString(v.color_name || v.name || 'Default'),
            sanitizeString(v.color_hex || v.hex || '#355E58'),
            normalizeImageUrl(v.image_url || v.image || imageUrl),
            Number(v.stock ?? stock),
            idx
          );
        });
      } else {
        // Create default variant
        db.prepare(`
          INSERT INTO product_color_variants (product_id, color_name, color_hex, image_url, stock, display_order)
          VALUES (?, ?, ?, ?, ?, 0)
        `).run(prodId, item.colors?.[0] || 'Default', '#355E58', imageUrl, stock);
      }

      inserted.push(prodId);
    }

    res.status(201).json({ success: true, data: { count: inserted.length, product_ids: inserted }, message: `Successfully created ${inserted.length} products` });
  } catch (err) {
    console.error('Bulk product creation error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to create products' });
  }
});

// Update / Replace Product Color Variants
const handleUpdateVariants = (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ success: false, data: null, message: 'Product not found' });

    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, data: null, message: 'Permission denied for this product' });
    }

    const variants = Array.isArray(req.body) ? req.body : req.body?.variants || [];
    
    // Replace existing variants
    db.prepare('DELETE FROM product_color_variants WHERE product_id = ?').run(productId);

    const insertStmt = db.prepare(`
      INSERT INTO product_color_variants (product_id, color_name, color_hex, image_url, stock, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    variants.forEach((v, idx) => {
      const colorName = sanitizeString(v.color_name || v.name || 'Default');
      const colorHex = sanitizeString(v.color_hex || v.hex || '#355E58');
      const imageUrl = normalizeImageUrl(v.image_url || v.image || product.image_url);
      const stock = Number(v.stock ?? 10);
      insertStmt.run(productId, colorName, colorHex, imageUrl, stock, idx);
    });

    const updated = getProductVariants(productId);
    res.json({ success: true, data: updated, message: 'Variants updated successfully' });
  } catch (err) {
    console.error('Update variants error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to update variants' });
  }
};

app.post('/api/admin/products/:id/variants', authenticateToken, requireSeller, handleUpdateVariants);
app.post('/api/seller/products/:id/variants', authenticateToken, requireSeller, handleUpdateVariants);

app.post('/api/seller/products/:id/media', authenticateToken, requireSeller, upload.array('media', 6), (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ success: false, data: null, message: 'Product not found' });

    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, data: null, message: 'Permission denied for this product' });
    }

    const files = req.files || [];
    const mediaUrls = files.map(f => `/images/uploads/${path.basename(f.path)}`);

    mediaUrls.forEach((url, idx) => {
      db.prepare('INSERT INTO product_images (product_id, image_url, sort_order, is_primary) VALUES (?, ?, ?, ?)').run(productId, url, idx + 1, 0);
    });

    res.status(201).json({ success: true, data: { uploaded: mediaUrls }, message: 'Media uploaded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Media upload failed' });
  }
});

app.put('/api/seller/products/:id/discount', authenticateToken, requireSeller, (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { discount_percentage, original_price } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ success: false, data: null, message: 'Product not found' });

    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, data: null, message: 'Permission denied for this product' });
    }

    const discount = Math.max(0, Math.min(100, Number(discount_percentage || 0)));
    const origPrice = original_price ? Number(original_price) : product.original_price || product.price;
    const newPrice = discount > 0 ? origPrice * (1 - discount / 100) : origPrice;

    db.prepare('UPDATE products SET discount_percentage = ?, original_price = ?, price = ? WHERE id = ?').run(discount, origPrice, newPrice, productId);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    res.json({ success: true, data: serializeProduct(updated), message: 'Discount updated' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to update discount' });
  }
});

app.put('/api/seller/products/:id/colors', authenticateToken, requireSeller, (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { colors } = req.body;
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ success: false, data: null, message: 'Product not found' });

    if (req.user.role !== 'admin' && product.seller_id !== req.user.id) {
      return res.status(403).json({ success: false, data: null, message: 'Permission denied for this product' });
    }

    const colorList = Array.isArray(colors) ? colors : (typeof colors === 'string' ? colors.split(',').map(c => c.trim()).filter(Boolean) : []);
    db.prepare('UPDATE products SET colors = ? WHERE id = ?').run(JSON.stringify(colorList), productId);

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    res.json({ success: true, data: serializeProduct(updated), message: 'Colors updated successfully' });
  } catch (err) {
    console.error('Colors update error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to update colors' });
  }
});

// Seller promo codes
app.get('/api/seller/promo-codes', authenticateToken, requireSeller, (req, res) => {
  try {
    const condition = req.user.role === 'admin' ? '' : 'WHERE seller_id = ?';
    const params = req.user.role === 'admin' ? [] : [req.user.id];
    const codes = db.prepare(`SELECT * FROM promo_codes ${condition} ORDER BY id DESC`).all(...params);
    res.json({ success: true, data: codes, message: 'Promo codes fetched' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch promo codes' });
  }
});

app.post('/api/seller/promo-codes', authenticateToken, requireSeller, (req, res) => {
  try {
    const { code, discount_type = 'percentage', discount_value, min_order_value = 0, max_uses = 500, expiry_date } = req.body;
    const cleanCode = sanitizeString(code).toUpperCase();
    if (!cleanCode || !discount_value) {
      return res.status(400).json({ success: false, data: null, message: 'Code and discount value required' });
    }

    const result = db.prepare(`
      INSERT INTO promo_codes (seller_id, code, discount_type, discount_value, min_order_value, max_uses, expiry_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `).run(req.user.id, cleanCode, discount_type, Number(discount_value), Number(min_order_value), Number(max_uses), expiry_date || null);

    const created = db.prepare('SELECT * FROM promo_codes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: created, message: 'Promo code created' });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ success: false, data: null, message: 'Promo code already exists' });
    }
    res.status(500).json({ success: false, data: null, message: 'Failed to create promo code' });
  }
});

// ══════════════════════════════════════════
// CART & PROMO CODE VALIDATION
// ══════════════════════════════════════════
app.post('/api/cart/apply-promo', (req, res) => {
  try {
    const { code, subtotal = 0 } = req.body;
    const cleanCode = sanitizeString(code).toUpperCase();
    if (!cleanCode) return res.status(400).json({ success: false, data: null, message: 'Promo code is required' });

    const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(cleanCode);
    if (!promo) {
      return res.status(404).json({ success: false, data: null, message: 'Invalid promo code' });
    }

    if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
      return res.status(400).json({ success: false, data: null, message: 'This promo code has expired' });
    }

    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return res.status(400).json({ success: false, data: null, message: 'Promo code usage limit reached' });
    }

    if (promo.min_order_value && Number(subtotal) < promo.min_order_value) {
      return res.status(400).json({ success: false, data: null, message: `Minimum order value of ₹${promo.min_order_value} required` });
    }

    let discountAmount = 0;
    if (promo.discount_type === 'percentage') {
      discountAmount = roundCurrency((Number(subtotal) * promo.discount_value) / 100);
    } else {
      discountAmount = Math.min(Number(subtotal), Number(promo.discount_value));
    }

    res.json({
      success: true,
      data: {
        promo_code_id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        discount_amount: discountAmount,
      },
      message: 'Promo code applied successfully'
    });
  } catch (err) {
    console.error('Promo code error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to apply promo code' });
  }
});

app.get('/api/cart', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const rows = db.prepare(`
      SELECT c.id, c.product_id, c.quantity, p.name, p.price, p.original_price, p.stock, p.image_url, p.brand
      FROM carts c JOIN products p ON c.product_id = p.id
      WHERE c.session_id = ?
    `).all(sessionId);

    const items = rows.map(r => ({
      id: r.id,
      product_id: r.product_id,
      quantity: r.quantity,
      name: r.name,
      price: Number(r.price),
      original_price: r.original_price ? Number(r.original_price) : null,
      stock: Number(r.stock),
      image_url: normalizeImageUrl(r.image_url),
      brand: r.brand
    }));

    res.json({ success: true, data: items, message: 'Cart items' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch cart' });
  }
});

app.post('/api/cart', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { product_id, quantity = 1 } = req.body;
    const existing = db.prepare('SELECT id, quantity FROM carts WHERE session_id = ? AND product_id = ?').get(sessionId, product_id);

    if (existing) {
      db.prepare('UPDATE carts SET quantity = ? WHERE id = ?').run(existing.quantity + Number(quantity), existing.id);
    } else {
      db.prepare('INSERT INTO carts (session_id, product_id, quantity) VALUES (?, ?, ?)').run(sessionId, product_id, Number(quantity));
    }

    res.json({ success: true, data: null, message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to add to cart' });
  }
});

app.delete('/api/cart/:id', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    db.prepare('DELETE FROM carts WHERE id = ? AND session_id = ?').run(Number(req.params.id), sessionId);
    res.json({ success: true, data: null, message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to remove from cart' });
  }
});

// ══════════════════════════════════════════
// WISHLIST & RECENTLY VIEWED
// ══════════════════════════════════════════
app.get('/api/wishlist', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const rows = db.prepare(`
      SELECT w.id, w.product_id, p.name, p.price, p.original_price, p.stock, p.image_url, p.brand, p.rating, p.discount_percentage
      FROM wishlists w JOIN products p ON w.product_id = p.id
      WHERE w.session_id = ?
      ORDER BY w.added_at DESC
    `).all(sessionId);

    const items = rows.map(r => ({
      ...r,
      price: Number(r.price),
      stock: Number(r.stock),
      image_url: normalizeImageUrl(r.image_url),
      original_price: r.original_price ? Number(r.original_price) : null,
    }));

    res.json({ success: true, data: items, message: 'Wishlist items' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch wishlist' });
  }
});

app.post('/api/wishlist', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const { product_id } = req.body;

    const existing = db.prepare('SELECT id FROM wishlists WHERE session_id = ? AND product_id = ?').get(sessionId, product_id);
    if (existing) {
      db.prepare('DELETE FROM wishlists WHERE id = ?').run(existing.id);
      return res.json({ success: true, data: { wishlisted: false }, message: 'Removed from wishlist' });
    }

    db.prepare('INSERT INTO wishlists (session_id, product_id) VALUES (?, ?)').run(sessionId, product_id);
    res.json({ success: true, data: { wishlisted: true }, message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to toggle wishlist' });
  }
});

app.get('/api/recently-viewed', (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const rows = db.prepare(`
      SELECT p.* FROM recently_viewed rv
      JOIN products p ON rv.product_id = p.id
      WHERE rv.session_id = ? AND p.is_active = 1
      ORDER BY rv.viewed_at DESC LIMIT 8
    `).all(sessionId).map(serializeProduct);

    res.json({ success: true, data: rows, message: 'Recently viewed items' });
  } catch (err) {
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch recently viewed' });
  }
});

// ══════════════════════════════════════════
// ORDERS & CHECKOUT
// ══════════════════════════════════════════
app.post('/api/orders', (req, res) => {
  try {
    const {
      customer_name, phone, email, address_line1, address_line2,
      city, state, pincode, payment_method = 'COD', items, promo_code
    } = req.body;

    if (!customer_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ success: false, data: null, message: 'All required address fields must be provided' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, data: null, message: 'Order must contain items' });
    }

    // Validate item quantities to prevent abuse
    for (const item of items) {
      if (!item.product_id || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) {
        return res.status(400).json({ success: false, data: null, message: `Invalid quantity. Each item must be between 1 and ${MAX_ITEM_QUANTITY}.` });
      }
    }

    const pricedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const prod = db.prepare('SELECT id, name, price, stock, image_url FROM products WHERE id = ?').get(item.product_id);
      if (!prod || prod.stock < item.quantity) {
        return res.status(409).json({ success: false, data: null, message: `${prod?.name || 'Product'} is out of stock` });
      }
      const lineTotal = roundCurrency(Number(prod.price) * item.quantity);
      subtotal += lineTotal;
      pricedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        image_url: prod.image_url,
        unit_price: Number(prod.price),
        quantity: item.quantity,
        line_total: lineTotal
      });
    }

    let discountAmount = 0;
    if (promo_code) {
      const promo = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(promo_code.toUpperCase());
      if (promo && (!promo.min_order_value || subtotal >= promo.min_order_value)) {
        if (promo.discount_type === 'percentage') {
          discountAmount = roundCurrency((subtotal * promo.discount_value) / 100);
        } else {
          discountAmount = Math.min(subtotal, promo.discount_value);
        }
        db.prepare('UPDATE promo_codes SET used_count = used_count + 1 WHERE id = ?').run(promo.id);
      }
    }

    const deliveryFee = calculateDeliveryFee(subtotal - discountAmount);
    const total = roundCurrency(subtotal - discountAmount + deliveryFee);
    const orderedAt = new Date().toISOString();
    const expectedDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    db.exec('BEGIN');
    let orderId;
    try {
      const insertOrder = db.prepare(`
        INSERT INTO orders (
          order_code, customer_name, phone, email, address_line1, address_line2,
          city, state, pincode, payment_method, subtotal, discount_amount, delivery_fee, total,
          status, ordered_at, expected_delivery_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)
      `).run(
        `ORD-${Date.now()}`, customer_name, phone, email || null, address_line1, address_line2 || null,
        city, state, pincode, payment_method, subtotal, discountAmount, deliveryFee, total,
        orderedAt, expectedDelivery
      );

      orderId = Number(insertOrder.lastInsertRowid);
      const orderCode = `ORD-${orderedAt.slice(0, 10).replace(/-/g, '')}-${String(orderId).padStart(4, '0')}`;
      db.prepare('UPDATE orders SET order_code = ? WHERE id = ?').run(orderCode, orderId);

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, image_url, unit_price, quantity, line_total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const reduceStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
      const insertSale = db.prepare('INSERT INTO sales (product_id, quantity) VALUES (?, ?)');

      for (const item of pricedItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.image_url, item.unit_price, item.quantity, item.line_total);
        reduceStock.run(item.quantity, item.product_id);
        insertSale.run(item.product_id, item.quantity);
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({
      success: true,
      data: { ...order, items: orderItems },
      message: 'Order placed successfully',
      order_code: order.order_code
    });
  } catch (err) {
    console.error('Order placement error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to place order' });
  }
});

app.get('/api/orders/:orderCode', (req, res) => {
  try {
    const orderCode = sanitizeString(req.params.orderCode);
    if (!orderCode) return res.status(400).json({ success: false, data: null, message: 'Order code is required' });

    const order = db.prepare('SELECT * FROM orders WHERE order_code = ?').get(orderCode);
    if (!order) return res.status(404).json({ success: false, data: null, message: 'Order not found' });

    // Redact sensitive PII fields — only return what's needed for the confirmation page
    const safeOrder = {
      id: order.id,
      order_code: order.order_code,
      customer_name: order.customer_name,
      city: order.city,
      state: order.state,
      pincode: order.pincode,
      payment_method: order.payment_method,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount,
      delivery_fee: order.delivery_fee,
      total: order.total,
      status: order.status,
      ordered_at: order.ordered_at,
      expected_delivery_at: order.expected_delivery_at,
      // Partially redact PII
      phone: order.phone ? order.phone.slice(0, 2) + '****' + order.phone.slice(-2) : null,
      email: order.email ? order.email.replace(/(.{2})(.*)(@.*)/, '$1****$3') : null,
      address_line1: order.address_line1 ? order.address_line1.slice(0, 10) + '...' : null,
      address_line2: order.address_line2 ? '...' : null,
    };

    const items = db.prepare('SELECT id, order_id, product_id, product_name, image_url, unit_price, quantity, line_total FROM order_items WHERE order_id = ?').all(order.id);
    res.json({ success: true, data: { ...safeOrder, items }, message: 'Order details' });
  } catch (err) {
    console.error('Order lookup error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to fetch order' });
  }
});

// ══════════════════════════════════════════
// REVIEWS
// ══════════════════════════════════════════
app.post('/api/reviews', (req, res) => {
  try {
    const { product_id, rating, comment, reviewer_name } = req.body;
    if (!product_id || !rating) return res.status(400).json({ success: false, data: null, message: 'Product ID and rating required' });

    // Sanitize text inputs to prevent stored XSS (strip HTML tags)
    const stripHtml = str => (typeof str === 'string' ? str.replace(/<[^>]*>/g, '').trim() : '');
    const safeComment = stripHtml(comment) || null;
    const safeName = stripHtml(sanitizeString(reviewer_name)) || 'Anonymous';

    db.prepare(`
      INSERT INTO reviews (product_id, rating, comment, reviewer_name)
      VALUES (?, ?, ?, ?)
    `).run(product_id, Math.min(5, Math.max(1, Number(rating))), safeComment, safeName);

    // Update product rating and review count
    const stats = db.prepare('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ?').get(product_id);
    db.prepare('UPDATE products SET rating = ?, review_count = ? WHERE id = ?').run(Math.round(stats.avg_rating * 10) / 10, stats.count, product_id);

    res.status(201).json({ success: true, data: null, message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Review submission error:', err.message);
    res.status(500).json({ success: false, data: null, message: 'Failed to submit review' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shopverse Server running on http://localhost:${PORT}`);
});
