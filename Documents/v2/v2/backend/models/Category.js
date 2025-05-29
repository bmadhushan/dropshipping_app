import { getDatabase } from '../config/database.js';

export class Category {
  constructor(categoryData) {
    this.id = categoryData.id;
    this.name = categoryData.name;
    this.description = categoryData.description;
    this.icon = categoryData.icon;
    this.defaultMargin = parseFloat(categoryData.default_margin || categoryData.defaultMargin || 20);
    this.isActive = Boolean(categoryData.is_active !== undefined ? categoryData.is_active : categoryData.isActive !== undefined ? categoryData.isActive : true);
    this.sortOrder = parseInt(categoryData.sort_order || categoryData.sortOrder || 0);
    this.createdAt = categoryData.created_at || categoryData.createdAt;
    this.updatedAt = categoryData.updated_at || categoryData.updatedAt;
  }

  static async create(categoryData) {
    const db = getDatabase();
    
    const query = `
      INSERT INTO categories (name, description, icon, default_margin, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      categoryData.name,
      categoryData.description || null,
      categoryData.icon || null,
      categoryData.defaultMargin || 20,
      categoryData.isActive !== undefined ? categoryData.isActive : true,
      categoryData.sortOrder || 0
    ];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new Category({ ...categoryData, id: this.lastID }));
        }
      });
    });
  }

  static async findById(id) {
    const db = getDatabase();
    const query = 'SELECT * FROM categories WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Category(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findByName(name) {
    const db = getDatabase();
    const query = 'SELECT * FROM categories WHERE name = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [name], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Category(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM categories WHERE 1=1';
    const params = [];

    if (filters.isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(filters.isActive);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ' ORDER BY sort_order ASC, name ASC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Category(row)));
        }
      });
    });
  }

  static async getActiveCategories() {
    return await Category.findAll({ isActive: true });
  }

  async update(updateData) {
    const db = getDatabase();
    const updates = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && key !== 'id') {
        if (key === 'defaultMargin') {
          updates.push('default_margin = ?');
          params.push(updateData[key]);
        } else if (key === 'isActive') {
          updates.push('is_active = ?');
          params.push(updateData[key]);
        } else if (key === 'sortOrder') {
          updates.push('sort_order = ?');
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

    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;

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
    const query = 'DELETE FROM categories WHERE id = ?';

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

  static async reorderCategories(categoryOrders) {
    const db = getDatabase();
    const query = 'UPDATE categories SET sort_order = ? WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const stmt = db.prepare(query);
        let completed = 0;

        categoryOrders.forEach(({ id, sortOrder }) => {
          stmt.run([sortOrder, id], function(err) {
            if (err) {
              console.error(`Error updating category ${id}:`, err);
            }
            
            completed++;
            if (completed === categoryOrders.length) {
              stmt.finalize();
              resolve(true);
            }
          });
        });
      });
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon: this.icon,
      defaultMargin: this.defaultMargin,
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  static async countCategories() {
    const db = getDatabase();
    const query = 'SELECT COUNT(*) as count FROM categories';

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

  static async getTopCategories(limit = 5) {
    const db = getDatabase();
    // Get categories with product count
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.icon,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.name = p.category AND p.published = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY product_count DESC, c.name
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            id: row.id,
            name: row.name,
            icon: row.icon,
            productCount: row.product_count
          })));
        }
      });
    });
  }
}