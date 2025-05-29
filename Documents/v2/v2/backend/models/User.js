import { getDatabase } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.password = userData.password;
    this.role = userData.role || 'seller';
    this.status = userData.status || 'pending';
    this.name = userData.name;
    this.businessName = userData.business_name || userData.businessName;
    this.contactPerson = userData.contact_person || userData.contactPerson;
    this.phone = userData.phone;
    this.businessAddress = userData.business_address || userData.businessAddress;
    this.businessType = userData.business_type || userData.businessType;
    this.categoryInterests = typeof userData.category_interests === 'string' 
      ? JSON.parse(userData.category_interests) 
      : userData.categoryInterests || [];
    this.taxId = userData.tax_id || userData.taxId;
    this.description = userData.description;
    this.registrationDate = userData.registration_date || userData.registrationDate;
    this.approvedDate = userData.approved_date || userData.approvedDate;
    this.lastLogin = userData.last_login || userData.lastLogin;
    this.createdAt = userData.created_at || userData.createdAt;
    this.updatedAt = userData.updated_at || userData.updatedAt;
  }

  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async create(userData) {
    const db = getDatabase();
    const hashedPassword = await User.hashPassword(userData.password);
    
    const categoryInterests = Array.isArray(userData.categoryInterests) 
      ? JSON.stringify(userData.categoryInterests) 
      : userData.categoryInterests || '[]';

    const query = `
      INSERT INTO users (
        username, email, password, role, status, name, business_name, 
        contact_person, phone, business_address, business_type, 
        category_interests, tax_id, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userData.username,
      userData.email,
      hashedPassword,
      userData.role || 'seller',
      userData.status || 'pending',
      userData.name || userData.contactPerson,
      userData.businessName,
      userData.contactPerson,
      userData.phone,
      userData.businessAddress,
      userData.businessType,
      categoryInterests,
      userData.taxId,
      userData.description
    ];

    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(new User({ ...userData, id: this.lastID }));
        }
      });
    });
  }

  static async findById(id) {
    const db = getDatabase();
    const query = 'SELECT * FROM users WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findByUsername(username) {
    const db = getDatabase();
    const query = 'SELECT * FROM users WHERE username = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [username], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findByEmail(email) {
    const db = getDatabase();
    const query = 'SELECT * FROM users WHERE email = ?';

    return new Promise((resolve, reject) => {
      db.get(query, [email], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new User(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  static async findAll(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => new User(row)));
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
        if (key === 'categoryInterests') {
          updates.push('category_interests = ?');
          params.push(JSON.stringify(updateData[key]));
        } else if (key === 'businessName') {
          updates.push('business_name = ?');
          params.push(updateData[key]);
        } else if (key === 'contactPerson') {
          updates.push('contact_person = ?');
          params.push(updateData[key]);
        } else if (key === 'businessAddress') {
          updates.push('business_address = ?');
          params.push(updateData[key]);
        } else if (key === 'businessType') {
          updates.push('business_type = ?');
          params.push(updateData[key]);
        } else if (key === 'taxId') {
          updates.push('tax_id = ?');
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

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

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
    const query = 'DELETE FROM users WHERE id = ?';

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

  async authenticate(password) {
    return await User.verifyPassword(password, this.password);
  }

  toJSON() {
    const obj = { ...this };
    delete obj.password; // Never return password in JSON
    return obj;
  }

  static async updateLastLogin(userId) {
    const db = getDatabase();
    const query = 'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?';

    return new Promise((resolve, reject) => {
      db.run(query, [userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async countSellers() {
    const db = getDatabase();
    const query = "SELECT COUNT(*) as count FROM users WHERE role = 'seller'";

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

  static async countPendingSellers() {
    const db = getDatabase();
    const query = "SELECT COUNT(*) as count FROM users WHERE role = 'seller' AND status = 'pending'";

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

  static async getRecentSellers(limit = 5) {
    const db = getDatabase();
    const query = `
      SELECT id, username, email, name, business_name, status, created_at, registration_date 
      FROM users 
      WHERE role = 'seller' 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

    return new Promise((resolve, reject) => {
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map(row => ({
            ...row,
            registrationDate: row.registration_date || row.created_at
          })));
        }
      });
    });
  }
}