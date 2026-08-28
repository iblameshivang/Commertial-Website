const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'demo.db'));
db.exec('PRAGMA foreign_keys = ON');

const addColumnIfMissing = (tableName, columnName, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (!columns.some(c => c.name === columnName)) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
};

// ──────────────────────────────────────────
// CORE TABLES (Users, Products, Sales, Promo Codes, Ads, Cart, Wishlist, Reviews, Recently Viewed)
// ──────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'customer',
    brand_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    original_price REAL,
    category TEXT NOT NULL DEFAULT 'clothing',
    category_id INTEGER,
    brand TEXT NOT NULL DEFAULT '',
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    video_url TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    colors TEXT,
    materials TEXT,
    sizes TEXT,
    gender TEXT,
    style TEXT,
    features TEXT,
    shape TEXT,
    discount_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )
`);

addColumnIfMissing('products', 'seller_id', 'INTEGER');
addColumnIfMissing('products', 'default_image', 'TEXT');
addColumnIfMissing('products', 'video_url', 'TEXT');
addColumnIfMissing('products', 'discount_percentage', 'INTEGER DEFAULT 0');
addColumnIfMissing('products', 'is_active', 'BOOLEAN DEFAULT 1');
addColumnIfMissing('products', 'updated_at', 'DATETIME');

db.exec(`
  CREATE TABLE IF NOT EXISTS product_color_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    color_name TEXT NOT NULL,
    color_hex TEXT,
    image_url TEXT NOT NULL,
    stock INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS product_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    title TEXT NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    target_brand TEXT,
    target_category TEXT,
    cta_text TEXT DEFAULT 'Explore Collection',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS promo_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    min_order_value REAL DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    expiry_date DATETIME,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
  )
`);
addColumnIfMissing('promo_codes', 'updated_at', 'DATETIME');
addColumnIfMissing('advertisements', 'updated_at', 'DATETIME');

db.exec(`
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    product_id INTEGER,
    color_variant_id INTEGER DEFAULT NULL,
    quantity INTEGER DEFAULT 1,
    promo_code_id INTEGER,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (color_variant_id) REFERENCES product_color_variants(id) ON DELETE SET NULL,
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id)
  )
`);
addColumnIfMissing('carts', 'color_variant_id', 'INTEGER DEFAULT NULL');

db.exec(`
  CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    product_id INTEGER,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    user_id INTEGER,
    reviewer_name TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS recently_viewed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    product_id INTEGER,
    viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'COD',
    subtotal REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    delivery_fee REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'Confirmed',
    ordered_at TEXT NOT NULL,
    expected_delivery_at TEXT NOT NULL
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    image_url TEXT,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    line_total REAL NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
  )
`);

// Performance Indexes
db.exec('CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date)');
db.exec('CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_wishlists_session ON wishlists(session_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON recently_viewed(session_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)');
db.exec('CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand)');
db.exec('CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id)');
db.exec('CREATE INDEX IF NOT EXISTS idx_color_variants_product ON product_color_variants(product_id)');

// ──────────────────────────────────────────
// SEED DATA INITIALIZATION (Development/Demo only)
// ──────────────────────────────────────────
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0 && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: Database is empty but seeding is disabled in production. Create users manually or set NODE_ENV=development.');
} else if (userCount === 0) {
  // Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, email, role, brand_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminHash = bcrypt.hashSync('MissionNepal', 10);
  const sellerHash = bcrypt.hashSync('seller123', 10);
  const customerHash = bcrypt.hashSync('customer123', 10);

  const adminId = Number(insertUser.run('admin', adminHash, 'admin@shopverse.com', 'admin', 'Shopverse Official').lastInsertRowid);
  const seller1Id = Number(insertUser.run('urban_seller', sellerHash, 'urban@shopverse.com', 'seller', 'Urban Edge').lastInsertRowid);
  const seller2Id = Number(insertUser.run('tech_seller', sellerHash, 'tech@shopverse.com', 'seller', 'TechNova').lastInsertRowid);
  const seller3Id = Number(insertUser.run('lumi_seller', sellerHash, 'lumi@shopverse.com', 'seller', 'LumiCraft').lastInsertRowid);
  insertUser.run('customer', customerHash, 'alex@example.com', 'customer', null);

  // Seed Categories
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  const catClothesId = Number(insertCategory.run('Clothing').lastInsertRowid || 1);
  const catElectronicsId = Number(insertCategory.run('Electronics').lastInsertRowid || 2);
  const catHomeId = Number(insertCategory.run('Home').lastInsertRowid || 3);
  const catBeautyId = Number(insertCategory.run('Beauty').lastInsertRowid || 4);

  // Seed Promo Codes
  const insertPromo = db.prepare(`
    INSERT INTO promo_codes (seller_id, code, discount_type, discount_value, min_order_value, max_uses, used_count, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 0, 1)
  `);
  insertPromo.run(adminId, 'WELCOME10', 'percentage', 10, 500, 1000);
  insertPromo.run(adminId, 'SUMMER20', 'percentage', 20, 1500, 500);
  insertPromo.run(adminId, 'FLAT500', 'fixed', 500, 2999, 200);

  // Seed Products
  const insertProduct = db.prepare(`
    INSERT INTO products (
      seller_id, name, price, original_price, stock, category_id, category, brand, image_url, description,
      rating, review_count, colors, materials, sizes, gender, style, features, discount_percentage, is_active, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now', ?))
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
    VALUES (?, ?, ?, ?)
  `);

  const insertSale = db.prepare(`
    INSERT INTO sales (product_id, quantity, sale_date)
    VALUES (?, ?, datetime('now', ?))
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, user_id, reviewer_name, rating, comment, created_at)
    VALUES (?, NULL, ?, ?, ?, datetime('now', ?))
  `);

  const productsData = [
    // ── Clothing (8 Items) ──
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Urban Edge',
      name: 'Structured Wool Overshirt', price: 3499, originalPrice: 4999, discount: 30, stock: 28,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
      desc: 'Crafted from a refined heavyweight wool blend, this structured overshirt provides effortless layering and tailored warmth.',
      rating: 4.8, reviews: 114, colors: '["#355E58", "#053229", "#FFEDD1"]', materials: '["Wool Blend", "Organic Cotton"]',
      sizes: '["S", "M", "L", "XL"]', gender: 'unisex', style: 'minimal', features: '["Thermal Insulation", "Hidden Placket"]',
      salesVolume: 320, daysAgo: '-2 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Urban Edge',
      name: 'Relaxed Tailored Chino Trousers', price: 2199, originalPrice: 2999, discount: 26, stock: 35,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85',
      desc: 'Straight leg cut with pressed front creases. Made from durable Italian twill for day-to-evening transition.',
      rating: 4.6, reviews: 88, colors: '["#BCDDDC", "#355E58", "#053229"]', materials: '["Italian Cotton Twill"]',
      sizes: '["30", "32", "34", "36"]', gender: 'male', style: 'modern', features: '["Crease Resistant", "Deep Pockets"]',
      salesVolume: 240, daysAgo: '-5 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Heritage Studio',
      name: 'Silk Blend Midi Wrap Dress', price: 4299, originalPrice: 5999, discount: 28, stock: 18,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=85',
      desc: 'Flowing silhouette with an adjustable waist tie and asymmetric hemline. Drapes elegantly with subtle lustre.',
      rating: 4.9, reviews: 76, colors: '["#FDC1B4", "#72B0AB", "#FFEDD1"]', materials: '["Mulberry Silk", "Viscose"]',
      sizes: '["XS", "S", "M", "L"]', gender: 'female', style: 'vintage', features: '["Self-tie Belt", "Lined Bodice"]',
      salesVolume: 195, daysAgo: '-1 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Sartorial',
      name: 'Double-Breasted Cashmere Coat', price: 12999, originalPrice: 16999, discount: 23, stock: 10,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
      desc: 'Expertly tailored in pure Mongolian cashmere with peak lapels, horn buttons, and handcrafted interior stitching.',
      rating: 5.0, reviews: 42, colors: '["#053229", "#355E58"]', materials: '["100% Cashmere", "Cupro Lining"]',
      sizes: '["S", "M", "L", "XL"]', gender: 'unisex', style: 'minimal', features: '["Interior Passport Pocket", "Hand Stitched"]',
      salesVolume: 85, daysAgo: '-7 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'VeloStride',
      name: 'Minimalist Monolith Sneakers', price: 4599, originalPrice: 5999, discount: 23, stock: 40,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85',
      desc: 'Full-grain calfskin leather upper with custom ergonomic cupsoles designed for supreme all-day comfort.',
      rating: 4.7, reviews: 260, colors: '["#FFFFFF", "#053229", "#FFEDD1"]', materials: '["Calfskin Leather", "Recycled Rubber"]',
      sizes: '["7", "8", "9", "10", "11"]', gender: 'unisex', style: 'modern', features: '["Orthotic Footbed", "Water Resistant"]',
      salesVolume: 410, daysAgo: '-1 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Heritage Studio',
      name: 'Artisanal Suede Field Jacket', price: 8499, originalPrice: 10999, discount: 22, stock: 12,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85',
      desc: 'Supple goat suede jacket with antiqued brass hardware, dual storm pockets, and a soft flannel check lining.',
      rating: 4.8, reviews: 39, colors: '["#CFB97E", "#355E58"]', materials: '["Goat Suede", "Cotton Flannel"]',
      sizes: '["M", "L", "XL"]', gender: 'male', style: 'vintage', features: '["Antiqued Hardware", "Internal Drawcord"]',
      salesVolume: 110, daysAgo: '-4 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Urban Edge',
      name: 'Heavyweight Loopback Sweatshirt', price: 1899, originalPrice: 2499, discount: 24, stock: 55,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85',
      desc: '450 GSM French terry cotton with flatlock seams and raglan sleeves for relaxed leisurewear.',
      rating: 4.5, reviews: 190, colors: '["#BCDDDC", "#053229", "#FFEDD1"]', materials: '["100% French Terry"]',
      sizes: '["S", "M", "L", "XL", "XXL"]', gender: 'unisex', style: 'minimal', features: '["Pre-shrunk", "Reinforced Ribbing"]',
      salesVolume: 350, daysAgo: '-3 days'
    },
    {
      sellerId: seller1Id, catId: catClothesId, cat: 'clothing', brand: 'Sartorial',
      name: 'Camp Collar Linen Resort Shirt', price: 2499, originalPrice: 3299, discount: 24, stock: 30,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=85',
      desc: 'Woven from airy Normandy flax linen with mother-of-pearl buttons and a retro camp collar silhouette.',
      rating: 4.7, reviews: 82, colors: '["#FFEDD1", "#72B0AB", "#FDC1B4"]', materials: '["100% Normandy Linen"]',
      sizes: '["S", "M", "L", "XL"]', gender: 'male', style: 'bohemian', features: '["Natural Slub Texture", "Breathable"]',
      salesVolume: 180, daysAgo: '-2 days'
    },

    // ── Electronics (8 Items) ──
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'Acoustic Studio Wireless Headphones', price: 14999, originalPrice: 18999, discount: 21, stock: 25,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
      desc: 'Audiophile planar magnetic drivers with active hybrid noise cancellation and 45-hour playback time.',
      rating: 4.9, reviews: 210, colors: '["#053229", "#FFEDD1", "#72B0AB"]', materials: '["Anodized Aluminum", "Memory Foam"]',
      sizes: null, gender: null, style: 'modern', features: '["Planar Magnetic", "Hybrid ANC", "45h Battery", "Lossless Bluetooth"]',
      salesVolume: 490, daysAgo: '-1 days'
    },
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'ProBook Studio 14" OLED Laptop', price: 84999, originalPrice: 99999, discount: 15, stock: 12,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85',
      desc: 'Precision machined unibody chassis with 2.8K 120Hz OLED display, latest-gen silicon, and whisper-quiet cooling.',
      rating: 4.8, reviews: 95, colors: '["#355E58", "#BCDDDC"]', materials: '["CNC Aluminum"]',
      sizes: null, gender: null, style: 'minimal', features: '["2.8K 120Hz OLED", "32GB RAM", "1TB NVMe", "Thunderbolt 4"]',
      salesVolume: 160, daysAgo: '-3 days'
    },
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'Horizon Minimal Smartwatch', price: 8999, originalPrice: 11999, discount: 25, stock: 30,
      image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=85',
      desc: 'Sapphire crystal display with titanium casing, continuous biometric sensors, and 10-day battery life.',
      rating: 4.7, reviews: 140, colors: '["#053229", "#CFB97E", "#355E58"]', materials: '["Grade 5 Titanium", "Fluoroelastomer"]',
      sizes: null, gender: null, style: 'minimal', features: '["Sapphire Glass", "ECG Sensor", "50m Waterproof", "10-day Battery"]',
      salesVolume: 290, daysAgo: '-2 days'
    },
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'Spatial Portable Speaker', price: 4999, originalPrice: 6499, discount: 23, stock: 45,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85',
      desc: '360-degree cylindrical speaker with room calibration, passive radiators, and IP67 weather resistance.',
      rating: 4.6, reviews: 175, colors: '["#355E58", "#FFEDD1", "#72B0AB"]', materials: '["Acoustic Fabric", "Silicone"]',
      sizes: null, gender: null, style: 'modern', features: '["IP67 Waterproof", "Room Calibration", "24h Battery", "USB-C PD"]',
      salesVolume: 380, daysAgo: '-1 days'
    },
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'Precision Wireless Mechanical Keyboard', price: 6499, originalPrice: 7999, discount: 18, stock: 22,
      image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=85',
      desc: 'Low-profile tactile mechanical switches, solid aluminum top plate, and sound-dampening acoustic foams.',
      rating: 4.8, reviews: 120, colors: '["#053229", "#FFEDD1"]', materials: '["Anodized Aluminum", "PBT Keycaps"]',
      sizes: null, gender: null, style: 'minimal', features: '["Hot-swappable", "Tri-mode Connectivity", "Gasket Mounted"]',
      salesVolume: 210, daysAgo: '-4 days'
    },
    {
      sellerId: seller2Id, catId: catElectronicsId, cat: 'electronics', brand: 'TechNova',
      name: 'Magnetic Wireless Power Dock', price: 2999, originalPrice: 3999, discount: 25, stock: 60,
      image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=800&q=85',
      desc: '3-in-1 weighted desktop dock with MagSafe fast charging for phone, watch, and earbuds simultaneously.',
      rating: 4.5, reviews: 230, colors: '["#FFEDD1", "#355E58"]', materials: '["Cast Zinc Alloy", "Vegan Suede"]',
      sizes: null, gender: null, style: 'minimal', features: '["15W MagSafe", "Weighted Anti-slip Base", "Braided Cable"]',
      salesVolume: 440, daysAgo: '-1 days'
    },

    // ── Home & Living (8 Items) ──
    {
      sellerId: seller3Id, catId: catHomeId, cat: 'home', brand: 'LumiCraft',
      name: 'Sculptural Travertine Table Lamp', price: 5499, originalPrice: 7299, discount: 25, stock: 20,
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=85',
      desc: 'Solid carved natural travertine base with warm dimmable LED ambiance and linen drum lampshade.',
      rating: 4.9, reviews: 68, colors: '["#FFEDD1", "#CFB97E"]', materials: '["Natural Travertine", "Belgian Linen"]',
      sizes: null, gender: null, style: 'minimal', features: '["Warm Dimming 2200K-3000K", "Solid Stone Base"]',
      salesVolume: 220, daysAgo: '-2 days'
    },
    {
      sellerId: seller3Id, catId: catHomeId, cat: 'home', brand: 'LumiCraft',
      name: 'Hand-Thrown Ceramic Coffee Set', price: 2499, originalPrice: 3299, discount: 24, stock: 35,
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85',
      desc: 'Pair of artisanal stoneware pour-over carafes and matching mugs featuring a reactive earth glaze.',
      rating: 4.8, reviews: 92, colors: '["#BCDDDC", "#FFEDD1", "#355E58"]', materials: '["High-fire Stoneware"]',
      sizes: null, gender: null, style: 'bohemian', features: '["Microwave Safe", "Dishwasher Safe", "Lead-free Glaze"]',
      salesVolume: 310, daysAgo: '-3 days'
    },
    {
      sellerId: seller3Id, catId: catHomeId, cat: 'home', brand: 'LumiCraft',
      name: 'Geometric Walnut Bookshelf', price: 18999, originalPrice: 24999, discount: 24, stock: 8,
      image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=85',
      desc: 'Solid American black walnut joinery with asymmetrical shelving tiers, hand-rubbed oil finish.',
      rating: 5.0, reviews: 29, colors: '["#355E58", "#053229"]', materials: '["Solid American Walnut"]',
      sizes: null, gender: null, style: 'modern', features: '["Mortise & Tenon Joinery", "Organic Wax Finish"]',
      salesVolume: 65, daysAgo: '-6 days'
    },
    {
      sellerId: seller3Id, catId: catHomeId, cat: 'home', brand: 'ZenSpace',
      name: 'Botanical Cold-Air Aroma Diffuser', price: 3299, originalPrice: 4299, discount: 23, stock: 40,
      image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=85',
      desc: 'Waterless cold-air nebulizing technology preserves the pure integrity of pure botanical oils.',
      rating: 4.7, reviews: 110, colors: '["#053229", "#FFEDD1"]', materials: '["Ceramic", "Recycled Aluminum"]',
      sizes: null, gender: null, style: 'minimal', features: '["Waterless Nebulization", "Smart Timer", "Coverage 800 sq ft"]',
      salesVolume: 270, daysAgo: '-2 days'
    },
    {
      sellerId: seller3Id, catId: catHomeId, cat: 'home', brand: 'ZenSpace',
      name: 'Soy Wax Amber Candle Trio', price: 1499, originalPrice: 1999, discount: 25, stock: 70,
      image: 'https://images.unsplash.com/photo-1602607404890-4fef18483853?w=800&q=85',
      desc: 'Hand-poured 100% natural soy wax candles infused with Cedarwood & Fig, Oud & Amber, and Neroli Bloom.',
      rating: 4.6, reviews: 180, colors: '["#CFB97E", "#FFEDD1"]', materials: '["100% Soy Wax", "Cotton Wick"]',
      sizes: null, gender: null, style: 'minimal', features: '["50hr Clean Burn", "Non-toxic", "Reusable Glass Jar"]',
      salesVolume: 520, daysAgo: '-1 days'
    },

    // ── Beauty & Grooming (6 Items) ──
    {
      sellerId: seller3Id, catId: catBeautyId, cat: 'beauty', brand: 'Aura Botanics',
      name: 'Restorative Botanical Facial Oil', price: 2199, originalPrice: 2899, discount: 24, stock: 50,
      image: 'https://images.unsplash.com/photo-1608248597359-59367d32efee?w=800&q=85',
      desc: 'Formulated with cold-pressed rosehip seed, squalane, and blue tansy to deeply hydrate and soothe skin barrier.',
      rating: 4.9, reviews: 160, colors: '["#72B0AB"]', materials: '["Organic Botanicals"]',
      sizes: '["30ml", "50ml"]', gender: 'unisex', style: 'minimal', features: '["Cold-pressed", "Vegan", "Fragrance Free"]',
      salesVolume: 430, daysAgo: '-1 days'
    },
    {
      sellerId: seller3Id, catId: catBeautyId, cat: 'beauty', brand: 'Aura Botanics',
      name: 'Nourishing Sea Kelp Body Polish', price: 1699, originalPrice: 2199, discount: 23, stock: 45,
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=85',
      desc: 'Micro-fine Pacific sea salt crystals suspended in nourishing jojoba oil and wild-harvested sea kelp extract.',
      rating: 4.7, reviews: 98, colors: '["#BCDDDC"]', materials: '["Dead Sea Salt", "Jojoba"]',
      sizes: '["250g"]', gender: 'unisex', style: 'minimal', features: '["Gentle Exfoliation", "Cruelty Free"]',
      salesVolume: 290, daysAgo: '-3 days'
    }
  ];

  const reviewerNames = [
    'Elena Rostova', 'Julian Thorne', 'Siddharth Roy', 'Amara Vance', 'Oliver Chen',
    'Kavya Sharma', 'Felix Sterling', 'Chloe Dubois', 'Aditya Nair', 'Seraphina Holt'
  ];

  const reviewComments = [
    'The craftsmanship is extraordinary. Flawless materials and remarkable attention to detail.',
    'Exceeded expectations. Minimalist packaging and rapid delivery. Truly elevated experience.',
    'Such high quality for the price point. Highly recommend to anyone seeking understated luxury.',
    'Sublime texture and beautiful presentation. Will certainly be ordering again.',
    'Clean, editorial, and functional. An essential addition to my daily routine.'
  ];

  productsData.forEach((p) => {
    const res = insertProduct.run(
      p.sellerId, p.name, p.price, p.originalPrice, p.stock, p.catId, p.cat, p.brand,
      p.image, p.desc, p.rating, p.reviews, p.colors, p.materials, p.sizes, p.gender,
      p.style, p.features, p.discount, p.daysAgo
    );

    const prodId = Number(res.lastInsertRowid);
    insertImage.run(prodId, p.image, 0, 1);

    // Seed realistic 30-day sales volume for best-seller algorithms
    const numSalesBatches = Math.floor(p.salesVolume / 15);
    for (let s = 0; s < Math.min(numSalesBatches, 25); s++) {
      const daysBack = `-${Math.floor(Math.random() * 28)} days`;
      const qty = Math.floor(Math.random() * 4) + 1;
      insertSale.run(prodId, qty, daysBack);
    }

    // Seed reviews
    const revCount = Math.floor(Math.random() * 3) + 3;
    for (let r = 0; r < revCount; r++) {
      const reviewer = reviewerNames[Math.floor(Math.random() * reviewerNames.length)];
      const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];
      const rating = Math.max(4, Math.min(5, Math.round(p.rating + (Math.random() - 0.3))));
      const daysBack = `-${Math.floor(Math.random() * 45)} days`;
      insertReview.run(prodId, reviewer, rating, comment, daysBack);
    }
  });

  // Seed Advertisements
  const insertAd = db.prepare(`
    INSERT INTO advertisements (seller_id, title, subtitle, image_url, target_type, target_category, target_brand, cta_text, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertAd.run(
    seller1Id,
    'Timeless Tailoring & Minimal Wear',
    'Discover our curated winter capsule crafted from pure Mongolian cashmere and organic Italian twills.',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=90',
    'category', 'clothing', null, 'Explore Collection', 1
  );

  insertAd.run(
    seller2Id,
    'Acoustic Precision & Spatial Sound',
    'Studio-grade planar magnetic headphones and minimal electronics designed for pure acoustic clarity.',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=90',
    'category', 'electronics', null, 'Listen Now', 2
  );

  insertAd.run(
    seller3Id,
    'The Sculptural Living Space',
    'Natural travertine lamps, hand-thrown ceramics, and walnut joinery built to inspire quiet contemplation.',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=90',
    'category', 'home', null, 'Shop Interior', 3
  );
}

// ──────────────────────────────────────────
// COLOR VARIANTS SEED POPULATION (If Missing)
// ──────────────────────────────────────────
const variantCount = db.prepare('SELECT COUNT(*) as c FROM product_color_variants').get().c;
if (variantCount === 0) {
  const insertVariant = db.prepare(`
    INSERT INTO product_color_variants (product_id, color_name, color_hex, image_url, stock, display_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
    VALUES (?, ?, ?, ?)
  `);

  const products = db.prepare('SELECT id, name, category, image_url, colors FROM products').all();

  const curatedPaletteImages = {
    // Clothing images
    'Deep Spruce': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85',
    'Midnight Peacock': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85',
    'Warm Ivory': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=85',
    'Frosted Arctic': 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85',
    'Blush Peach': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=85',
    'Alpine Teal': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85',
    'Obsidian Black': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85',
    'Antique Sage': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=85',

    // Electronics images
    'Audio Charcoal': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85',
    'Studio Silver': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85',
    'Titanium Matte': 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&q=85',
    'Acoustic Bronze': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85',
    'Mechanical Slate': 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=85',
    'MagSafe Pure': 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=800&q=85',

    // Home images
    'Travertine Sand': 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=85',
    'Artisanal Earth': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85',
    'American Walnut': 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=85',
    'Ceramic Mist': 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&q=85',
    'Amber Glow': 'https://images.unsplash.com/photo-1602607404890-4fef18483853?w=800&q=85',

    // Beauty images
    'Botanical Azure': 'https://images.unsplash.com/photo-1608248597359-59367d32efee?w=800&q=85',
    'Sea Kelp Mineral': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=85'
  };

  const defaultHexMap = {
    'Deep Spruce': '#355E58',
    'Midnight Peacock': '#053229',
    'Warm Ivory': '#FFEDD1',
    'Frosted Arctic': '#BCDDDC',
    'Blush Peach': '#FDC1B4',
    'Alpine Teal': '#72B0AB',
    'Obsidian Black': '#1A1A1A',
    'Antique Sage': '#CFB97E',
    'Audio Charcoal': '#242B2E',
    'Studio Silver': '#E0E5EC',
    'Titanium Matte': '#7D8285',
    'Acoustic Bronze': '#8C6239',
    'Mechanical Slate': '#333A42',
    'MagSafe Pure': '#F5F5F7',
    'Travertine Sand': '#D7C4B7',
    'Artisanal Earth': '#A67B5B',
    'American Walnut': '#5C4033',
    'Ceramic Mist': '#D1DCDD',
    'Amber Glow': '#FFBF00',
    'Botanical Azure': '#4A7C59',
    'Sea Kelp Mineral': '#688B87'
  };

  const categoryFallbackVariants = {
    clothing: [
      { name: 'Deep Spruce', hex: '#355E58', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=85', stock: 15 },
      { name: 'Midnight Peacock', hex: '#053229', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=85', stock: 12 },
      { name: 'Warm Ivory', hex: '#FFEDD1', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=85', stock: 0 }, // 1 out-of-stock for verification
      { name: 'Frosted Arctic', hex: '#BCDDDC', img: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85', stock: 20 },
    ],
    electronics: [
      { name: 'Audio Charcoal', hex: '#242B2E', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85', stock: 18 },
      { name: 'Studio Silver', hex: '#E0E5EC', img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85', stock: 10 },
      { name: 'Alpine Teal', hex: '#72B0AB', img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=85', stock: 0 },
    ],
    home: [
      { name: 'Travertine Sand', hex: '#D7C4B7', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=800&q=85', stock: 14 },
      { name: 'American Walnut', hex: '#5C4033', img: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&q=85', stock: 8 },
      { name: 'Warm Ivory', hex: '#FFEDD1', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=85', stock: 22 },
    ],
    beauty: [
      { name: 'Botanical Azure', hex: '#4A7C59', img: 'https://images.unsplash.com/photo-1608248597359-59367d32efee?w=800&q=85', stock: 25 },
      { name: 'Sea Kelp Mineral', hex: '#688B87', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=85', stock: 16 },
      { name: 'Frosted Arctic', hex: '#BCDDDC', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=85', stock: 0 },
    ]
  };

  products.forEach(p => {
    // Ensure default_image is set
    db.prepare('UPDATE products SET default_image = COALESCE(default_image, image_url) WHERE id = ?').run(p.id);

    const variants = categoryFallbackVariants[p.category] || categoryFallbackVariants.clothing;
    
    // First variant uses product's primary image
    insertVariant.run(p.id, variants[0].name, variants[0].hex, p.image_url, 15, 0);

    // Remaining variants use alternate high-def images
    for (let i = 1; i < variants.length; i++) {
      const v = variants[i];
      insertVariant.run(p.id, v.name, v.hex, v.img, v.stock, i);
      // Also add to product_images table if not present
      insertImage.run(p.id, v.img, i, 0);
    }
  });
}

module.exports = db;
