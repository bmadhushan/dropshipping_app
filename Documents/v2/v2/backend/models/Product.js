import { getDatabase } from '../config/database.js';

export class Product {
  constructor(productData) {
    this.id = productData.id;
    this.sku = productData.sku;
    this.name = productData.name;
    this.description = productData.description;
    this.category = productData.category;
    this.brand = productData.brand;
    this.basePrice = parseFloat(productData.base_price || productData.basePrice || 0);
    this.adminPrice = parseFloat(productData.admin_price || productData.adminPrice || 0);
    this.stock = parseInt(productData.stock || 0);
    this.weight = parseFloat(productData.weight || 0);
    this.dimensions = productData.dimensions;
    this.image = productData.image;
    this.published = Boolean(productData.published);
    this.createdAt = productData.created_at || productData.createdAt;
    this.updatedAt = productData.updated_at || productData.updatedAt;
  }

  static async create(productData) {
    const db = getDatabase();
    
    const query = `
      INSERT INTO products (
        sku, name, description, category, brand, base_price, admin_price, 
        stock, weight, dimensions, image, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      productData.sku,
      productData.name,
      productData.description,
      productData.category,
      productData.brand,
      productData.basePrice || productData.base_price || productData.adminPrice || productData.admin_price || 0,
      productData.adminPrice || productData.admin_price,
      productData.stock || 0,
      productData.weight || 0,
      productData.dimensions,
      productData.image,
      productData.published !== undefined ? productData.published : true
    ];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new Product({ ...productData, id: this.lastID }));
        }
      });
    });
  }

  static async findById(id) {
    const db = getDatabase();
    const query = 'SELECT * FROM products WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Product(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findBySku(sku) {
    const db = getDatabase();
    const query = 'SELECT * FROM products WHERE sku = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [sku], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Product(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (filters.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.brand) {
      query += ' AND brand = ?';
      params.push(filters.brand);
    }

    if (filters.published !== undefined) {
      query += ' AND published = ?';
      params.push(filters.published);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR sku LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.priceMin) {
      query += ' AND admin_price >= ?';
      params.push(filters.priceMin);
    }

    if (filters.priceMax) {
      query += ' AND admin_price <= ?';
      params.push(filters.priceMax);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Product(row)));
        }
      });
    });
  }

  static async getCategories() {
    const db = getDatabase();
    const query = 'SELECT DISTINCT category FROM products WHERE published = 1 ORDER BY category';

    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.category));
        }
      });
    });
  }

  static async getBrands() {
    const db = getDatabase();
    const query = 'SELECT DISTINCT brand FROM products WHERE published = 1 ORDER BY brand';

    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => row.brand));
        }
      });
    });
  }

  async update(updateData) {
    const db = getDatabase();
    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        if (key === 'adminPrice') {
          updates.push('admin_price = ?');
          params.push(updateData[key]);
        } else {
          updates.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      }
    });

    if (updates.length === 0) {
      return this;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(this.id);

    const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          Object.assign(this, updateData);
          resolve(this);
        }
      });
    });
  }

  async delete() {
    const db = getDatabase();
    const query = 'DELETE FROM products WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.run(query, [this.id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async bulkCreate(products) {
    const db = getDatabase();
    const query = `
      INSERT INTO products (
        sku, name, description, category, brand, admin_price, 
        stock, weight, dimensions, image, published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(query);
        const results = [];
        let completed = 0;

        products.forEach((product, index) => {
          const params = [
            product.sku,
            product.name,
            product.description,
            product.category,
            product.brand,
            product.adminPrice || product.admin_price,
            product.stock || 0,
            product.weight || 0,
            product.dimensions,
            product.image,
            product.published !== undefined ? product.published : true
          ];

          stmt.run(params, function(err) {
            if (err) {
              console.error(`Error inserting product ${index + 1}:`, err);
            } else {
              results.push(new Product({ ...product, id: this.lastID }));
            }
            
            completed++;
            if (completed === products.length) {
              stmt.finalize();
              resolve(results);
            }
          });
        });
      });
    });
  }

  static async countProducts() {
    const db = getDatabase();
    const query = 'SELECT COUNT(*) as count FROM products';

    return new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  static async countActiveProducts() {
    const db = getDatabase();
    const query = 'SELECT COUNT(*) as count FROM products WHERE published = 1';

    return new Promise((resolve, reject) => {
      db.get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.count);
        }
      });
    });
  }

  static async getRecentProducts(limit = 5) {
    const db = getDatabase();
    const query = `
      SELECT id, sku, name, category, brand, admin_price, stock, published, created_at
      FROM products 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Product(row)));
        }
      });
    });
  }
}