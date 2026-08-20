const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ensure data folder exists (should already be created)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'demo.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.prepare(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    image_url TEXT,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  )
`).run();

// Seed data only when categories table is empty
const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
if (count === 0) {
  const insertCategory = db.prepare('INSERT INTO categories (name) VALUES (?)');
  const insertProduct = db.prepare('INSERT INTO products (name, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?)');

  const skincareId = insertCategory.run('Skincare').lastInsertRowid;
  const snacksId = insertCategory.run('Snacks').lastInsertRowid;
  const clothesId = insertCategory.run('Clothes').lastInsertRowid;
  const electronicsId = insertCategory.run('Electronics').lastInsertRowid;

  // Use simple local svg placeholders served from /images
  insertProduct.run('Deodorant', 249, 15, skincareId, '/images/deodorant.svg');
  insertProduct.run('Face Wash', 199, 20, skincareId, '/images/face-wash.svg');
  insertProduct.run('Chips', 40, 50, snacksId, '/images/chips.svg');
  insertProduct.run('T-Shirt', 599, 10, clothesId, '/images/tshirt.svg');
  insertProduct.run('Wireless Mouse', 799, 8, electronicsId, '/images/wireless-mouse.svg');
}

module.exports = db;
