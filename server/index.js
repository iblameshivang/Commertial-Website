const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;
const CLIENT_ORIGIN = 'http://localhost:5173';
const DEFAULT_PRODUCT_IMAGE = '/images/deodorant.svg';

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

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

app.post('/api/categories', (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

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

app.put('/api/categories/:id', (req, res) => {
  try {
    const categoryId = Number(req.params.id);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

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

app.delete('/api/categories/:id', (req, res) => {
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
    // Join to obtain category name
    const rows = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name as category_name, p.image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.id
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const categoryId = Number(req.body?.category_id);
    const imageUrl = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : '';

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

    const image = imageUrl || DEFAULT_PRODUCT_IMAGE;
    const result = db.prepare(
      'INSERT INTO products (name, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?)'
    ).run(name, price, stock, categoryId, image);

    const product = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const price = Number(req.body?.price);
    const stock = Number(req.body?.stock);
    const categoryId = Number(req.body?.category_id);
    const imageUrl = typeof req.body?.image_url === 'string' ? req.body.image_url.trim() : '';

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

    const image = imageUrl || DEFAULT_PRODUCT_IMAGE;
    db.prepare(
      'UPDATE products SET name = ?, price = ?, stock = ?, category_id = ?, image_url = ? WHERE id = ?'
    ).run(name, price, stock, categoryId, image, productId);

    const updatedProduct = db.prepare(`
      SELECT p.id, p.name, p.price, p.stock, p.category_id, c.name AS category_name, p.image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(productId);

    return res.json(updatedProduct);
  } catch (err) {
    console.error('Error updating product', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Basic JSON error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
