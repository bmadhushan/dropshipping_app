import { getDatabase } from '../config/database.js';

export class SellerProduct {
  constructor(data) {
    this.id = data.id;
    this.sellerId = data.seller_id || data.sellerId;
    this.productId = data.product_id || data.productId;
    this.customMargin = data.custom_margin || data.customMargin;
    this.customPrice = data.custom_price || data.customPrice;
    this.isSelected = Boolean(data.is_selected || data.isSelected);
    this.createdAt = data.created_at || data.createdAt;
    this.updatedAt = data.updated_at || data.updatedAt;
  }

  static async create(data) {
    const db = getDatabase();
    
    const query = `
      INSERT INTO seller_products (seller_id, product_id, custom_margin, custom_price, is_selected)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      data.sellerId || data.seller_id,
      data.productId || data.product_id,
      data.customMargin || data.custom_margin,
      data.customPrice || data.custom_price,
      data.isSelected || data.is_selected || false
    ];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new SellerProduct({ ...data, id: this.lastID }));
        }
      });
    });
  }

  static async findBySeller(sellerId) {
    const db = getDatabase();
    const query = `
      SELECT sp.*, p.sku, p.name, p.description, p.category, p.brand, 
             p.admin_price, p.stock, p.weight, p.dimensions, p.image, p.published
      FROM seller_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.seller_id = ?
      ORDER BY p.name
    `;

    return new Promise((resolve, reject) => {
      db.all(query, [sellerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...new SellerProduct(row),
            product: {
              id: row.product_id,
              sku: row.sku,
              name: row.name,
              description: row.description,
              category: row.category,
              brand: row.brand,
              adminPrice: parseFloat(row.admin_price),
              stock: parseInt(row.stock),
              weight: parseFloat(row.weight),
              dimensions: row.dimensions,
              image: row.image,
              published: Boolean(row.published)
            }
          })));
        }
      });
    });
  }

  static async findBySellerAndProduct(sellerId, productId) {
    const db = getDatabase();
    const query = 'SELECT * FROM seller_products WHERE seller_id = ? AND product_id = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [sellerId, productId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new SellerProduct(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async upsert(data) {
    const existing = await SellerProduct.findBySellerAndProduct(
      data.sellerId || data.seller_id,
      data.productId || data.product_id
    );

    if (existing) {
      return await existing.update(data);
    } else {
      return await SellerProduct.create(data);
    }
  }

  async update(updateData) {
    const db = getDatabase();
    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id' && key !== 'sellerId' && key !== 'productId') {
        if (key === 'customMargin') {
          updates.push('custom_margin = ?');
          params.push(updateData[key]);
        } else if (key === 'customPrice') {
          updates.push('custom_price = ?');
          params.push(updateData[key]);
        } else if (key === 'isSelected') {
          updates.push('is_selected = ?');
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

    const query = `UPDATE seller_products SET ${updates.join(', ')} WHERE id = ?`;

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
    const query = 'DELETE FROM seller_products WHERE id = ?';

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

  static async getSelectedProducts(sellerId) {
    const db = getDatabase();
    const query = `
      SELECT sp.*, p.sku, p.name, p.description, p.category, p.brand, 
             p.admin_price, p.stock, p.weight, p.dimensions, p.image, p.published
      FROM seller_products sp
      JOIN products p ON sp.product_id = p.id
      WHERE sp.seller_id = ? AND sp.is_selected = 1
      ORDER BY p.name
    `;

    return new Promise((resolve, reject) => {
      db.all(query, [sellerId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...new SellerProduct(row),
            product: {
              id: row.product_id,
              sku: row.sku,
              name: row.name,
              description: row.description,
              category: row.category,
              brand: row.brand,
              adminPrice: parseFloat(row.admin_price),
              stock: parseInt(row.stock),
              weight: parseFloat(row.weight),
              dimensions: row.dimensions,
              image: row.image,
              published: Boolean(row.published)
            }
          })));
        }
      });
    });
  }

  static async bulkUpdateSelection(sellerId, productIds, isSelected) {
    const db = getDatabase();
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE seller_products 
      SET is_selected = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE seller_id = ? AND product_id IN (${placeholders})
    `;

    const params = [isSelected, sellerId, ...productIds];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  static async bulkUpdatePricing(sellerId, productIds, marginAdjustment) {
    const db = getDatabase();
    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE seller_products 
      SET custom_margin = COALESCE(custom_margin, 0) + ?, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE seller_id = ? AND product_id IN (${placeholders})
    `;

    const params = [marginAdjustment, sellerId, ...productIds];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}