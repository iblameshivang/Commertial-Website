const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, 'demo.db'));
db.exec('PRAGMA foreign_keys = ON');

const tableColumns = tableName => db.prepare(`PRAGMA table_info(${tableName})`).all();

const addColumnIfMissing = (tableName, columnName, definition) => {
  const columns = tableColumns(tableName);
  const exists = columns.some(column => column.name === columnName);

  if (!exists) {
    db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
  }
};

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    image_url TEXT,
    description TEXT,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )
`);

addColumnIfMissing('products', 'description', 'TEXT');

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

const ensureProductImages = () => {
  const missingImageRows = db.prepare(`
    SELECT p.id, p.image_url
    FROM products p
    LEFT JOIN product_images pi ON pi.product_id = p.id
    WHERE pi.id IS NULL AND p.image_url IS NOT NULL AND TRIM(p.image_url) != ''
  `).all();

  if (missingImageRows.length === 0) {
    return;
  }

  const insertImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
    VALUES (?, ?, ?, ?)
  `);

  missingImageRows.forEach((row, index) => {
    insertImage.run(row.id, row.image_url, index, index === 0 ? 1 : 0);
  });
};

const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const insertProduct = db.prepare(`
    INSERT INTO products (name, price, stock, category_id, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertProductImage = db.prepare(`
    INSERT INTO product_images (product_id, image_url, sort_order, is_primary)
    VALUES (?, ?, ?, ?)
  `);

  const skincareId = insertCategory.run('Skincare').lastInsertRowid;
  const snacksId = insertCategory.run('Snacks').lastInsertRowid;
  const clothesId = insertCategory.run('Clothes').lastInsertRowid;
  const electronicsId = insertCategory.run('Electronics').lastInsertRowid;

  const products = [
    {
      name: 'Deodorant',
      price: 249,
      stock: 15,
      category_id: skincareId,
      image_url: '/images/deodorant.svg',
      images: ['/images/deodorant.svg', '/images/deodorant-angle.svg', '/images/deodorant-detail.svg'],
      description: 'Long-lasting deodorant with a fresh scent and skin-friendly formula.'
    },
    {
      name: 'Face Wash',
      price: 199,
      stock: 20,
      category_id: skincareId,
      image_url: '/images/face-wash.svg',
      images: ['/images/face-wash.svg', '/images/face-wash-angle.svg', '/images/face-wash-detail.svg'],
      description: 'Gentle cleansing face wash that removes dirt without drying skin.'
    },
    {
      name: 'Chips',
      price: 40,
      stock: 50,
      category_id: snacksId,
      image_url: '/images/chips.svg',
      images: ['/images/chips.svg', '/images/chips-open.svg', '/images/chips-bag.svg'],
      description: 'Crunchy, lightly salted chips with a satisfying snack-time bite.'
    },
    {
      name: 'T-Shirt',
      price: 599,
      stock: 10,
      category_id: clothesId,
      image_url: '/images/tshirt.svg',
      images: ['/images/tshirt.svg', '/images/tshirt-back.svg', '/images/tshirt-detail.svg'],
      description: 'Comfort-fit cotton tee designed for everyday wear and easy layering.'
    },
    {
      name: 'Wireless Mouse',
      price: 799,
      stock: 8,
      category_id: electronicsId,
      image_url: '/images/wireless-mouse.svg',
      images: ['/images/wireless-mouse.svg', '/images/wireless-mouse-side.svg', '/images/wireless-mouse-top.svg'],
      description: 'Ergonomic wireless mouse with smooth tracking and a rechargeable battery.'
    }
  ];

  products.forEach(product => {
    const productImages = Array.isArray(product.images) && product.images.length ? product.images : [product.image_url];
    const primaryImage = productImages[0] || product.image_url || '/images/no-image.svg';

    const result = insertProduct.run(
      product.name,
      product.price,
      product.stock,
      product.category_id,
      primaryImage,
      product.description
    );

    productImages.forEach((imageUrl, index) => {
      insertProductImage.run(result.lastInsertRowid, imageUrl, index, index === 0 ? 1 : 0);
    });
  });
}

ensureProductImages();

module.exports = db;
