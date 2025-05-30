import { describe, it, expect, beforeEach, afterEach } from 'jest'
import request from 'supertest'
import express from 'express'
import categoriesRouter from '../../routes/categories.js'
import { getDatabase } from '../../config/database.js'

const app = express()
app.use(express.json())
app.use('/api/categories', categoriesRouter)

describe('Categories Routes', () => {
  let db

  beforeEach(() => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:'
    db = getDatabase()
    
    // Create categories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        default_margin REAL DEFAULT 20,
        shipping_fee REAL DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories (id)
      )
    `)

    // Insert test categories
    db.run(`
      INSERT INTO categories (name, description, is_active) VALUES 
      ('Electronics', 'Electronic devices', 1),
      ('Clothing', 'Apparel and accessories', 1),
      ('Inactive Category', 'Not active', 0)
    `)
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe('GET /api/categories', () => {
    it('should return active categories by default', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.categories).toHaveLength(2)
      expect(response.body.categories.every(cat => cat.isActive)).toBe(true)
    })

    it('should include inactive categories when requested', async () => {
      const response = await request(app)
        .get('/api/categories?includeInactive=true')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.categories).toHaveLength(3)
    })

    it('should filter by search term', async () => {
      const response = await request(app)
        .get('/api/categories?search=Electronics')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.categories).toHaveLength(1)
      expect(response.body.categories[0].name).toBe('Electronics')
    })
  })

  describe('GET /api/categories/active', () => {
    it('should return only active categories', async () => {
      const response = await request(app)
        .get('/api/categories/active')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.categories).toHaveLength(2)
      expect(response.body.categories.every(cat => cat.isActive)).toBe(true)
    })
  })

  describe('GET /api/categories/:id', () => {
    it('should return category by id', async () => {
      const response = await request(app)
        .get('/api/categories/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.category.name).toBe('Electronics')
    })

    it('should return 404 for non-existent category', async () => {
      const response = await request(app)
        .get('/api/categories/999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Category not found')
    })
  })
})