import { getDatabase } from '../config/database.js';

export class Category {
  constructor(categoryData) {
    this.id = categoryData.id;
    this.name = categoryData.name;
    this.description = categoryData.description;
    this.icon = categoryData.icon;
    this.defaultMargin = parseFloat(categoryData.default_margin || categoryData.defaultMargin || 20);
    this.shippingFee = parseFloat(categoryData.shipping_fee || categoryData.shippingFee || 0);
    this.isActive = Boolean(categoryData.is_active !== undefined ? categoryData.is_active : categoryData.isActive !== undefined ? categoryData.isActive : true);
    this.sortOrder = parseInt(categoryData.sort_order || categoryData.sortOrder || 0);
    this.parentId = categoryData.parent_id || categoryData.parentId || null;
    this.createdAt = categoryData.created_at || categoryData.createdAt;
    this.updatedAt = categoryData.updated_at || categoryData.updatedAt;
    
    // For hierarchical data
    this.children = categoryData.children || [];
    this.level = categoryData.level || 0;
  }

  static async create(categoryData) {
    const db = getDatabase();
    
    const query = `
      INSERT INTO categories (name, description, icon, default_margin, shipping_fee, is_active, sort_order, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      categoryData.name,
      categoryData.description || null,
      categoryData.icon || null,
      categoryData.defaultMargin || 20,
      categoryData.shippingFee || 0,
      categoryData.isActive !== undefined ? categoryData.isActive : true,
      categoryData.sortOrder || 0,
      categoryData.parentId || null
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
        } else if (key === 'shippingFee') {
          updates.push('shipping_fee = ?');
          params.push(updateData[key]);
        } else if (key === 'isActive') {
          updates.push('is_active = ?');
          params.push(updateData[key]);
        } else if (key === 'sortOrder') {
          updates.push('sort_order = ?');
          params.push(updateData[key]);
        } else if (key === 'parentId') {
          updates.push('parent_id = ?');
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

    const categoryInstance = this;

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          Object.assign(categoryInstance, updateData);
          resolve(categoryInstance);
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
      shippingFee: this.shippingFee,
      isActive: this.isActive,
      sortOrder: this.sortOrder,
      parentId: this.parentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      children: this.children,
      level: this.level
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

  static async findAllHierarchical(filters = {}) {
    const categories = await Category.findAll(filters);
    return Category.buildHierarchy(categories);
  }

  static buildHierarchy(categories) {
    const categoryMap = new Map();
    const rootCategories = [];

    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
      if (!category.parentId) {
        rootCategories.push(categoryMap.get(category.id));
      }
    });

    // Second pass: build parent-child relationships
    categories.forEach(category => {
      if (category.parentId && categoryMap.has(category.parentId)) {
        const parent = categoryMap.get(category.parentId);
        const child = categoryMap.get(category.id);
        child.level = (parent.level || 0) + 1;
        parent.children.push(child);
      }
    });

    return rootCategories;
  }

  static async getChildren(parentId) {
    const db = getDatabase();
    const query = 'SELECT * FROM categories WHERE parent_id = ? ORDER BY sort_order ASC, name ASC';

    return new Promise((resolve, reject) => {
      db.all(query, [parentId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Category(row)));
        }
      });
    });
  }

  static async getDescendants(parentId) {
    const descendants = [];
    const children = await Category.getChildren(parentId);
    
    for (const child of children) {
      descendants.push(child);
      const childDescendants = await Category.getDescendants(child.id);
      descendants.push(...childDescendants);
    }
    
    return descendants;
  }

  static async getRootCategories() {
    const db = getDatabase();
    const query = 'SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order ASC, name ASC';

    return new Promise((resolve, reject) => {
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new Category(row)));
        }
      });
    });
  }

  async getPath() {
    const path = [this];
    let current = this;
    
    while (current.parentId) {
      current = await Category.findById(current.parentId);
      if (current) {
        path.unshift(current);
      } else {
        break;
      }
    }
    
    return path;
  }
}