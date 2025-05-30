import { describe, it, expect, beforeEach, afterEach } from 'jest'
import { Category } from '../../models/Category.js'
import { getDatabase } from '../../config/database.js'

describe('Category Model', () => {
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
  })

  afterEach(() => {
    if (db) {
      db.close()
    }
  })

  describe('create', () => {
    it('should create a new category', async () => {
      const categoryData = {
        name: 'Electronics',
        description: 'Electronic devices',
        defaultMargin: 25,
        isActive: true
      }

      const category = await Category.create(categoryData)

      expect(category).toBeInstanceOf(Category)
      expect(category.name).toBe('Electronics')
      expect(category.description).toBe('Electronic devices')
      expect(category.defaultMargin).toBe(25)
      expect(category.isActive).toBe(true)
      expect(category.id).toBeDefined()
    })

    it('should create category with default values', async () => {
      const categoryData = {
        name: 'Basic Category'
      }

      const category = await Category.create(categoryData)

      expect(category.defaultMargin).toBe(20)
      expect(category.shippingFee).toBe(0)
      expect(category.isActive).toBe(true)
      expect(category.sortOrder).toBe(0)
    })
  })

  describe('findById', () => {
    it('should find category by id', async () => {
      const created = await Category.create({ name: 'Test Category' })
      const found = await Category.findById(created.id)

      expect(found).toBeInstanceOf(Category)
      expect(found.id).toBe(created.id)
      expect(found.name).toBe('Test Category')
    })

    it('should return null for non-existent id', async () => {
      const result = await Category.findById(999)
      expect(result).toBeNull()
    })
  })

  describe('update', () => {
    it('should update category successfully', async () => {
      const category = await Category.create({ 
        name: 'Original Name',
        defaultMargin: 20
      })

      const updated = await category.update({
        name: 'Updated Name',
        defaultMargin: 30
      })

      expect(updated.name).toBe('Updated Name')
      expect(updated.defaultMargin).toBe(30)
    })

    it('should not update with empty data', async () => {
      const category = await Category.create({ name: 'Test' })
      const result = await category.update({})

      expect(result).toBe(category)
    })
  })

  describe('findAll', () => {
    it('should return all categories', async () => {
      await Category.create({ name: 'Category 1' })
      await Category.create({ name: 'Category 2' })

      const categories = await Category.findAll()

      expect(categories).toHaveLength(2)
      expect(categories[0]).toBeInstanceOf(Category)
    })

    it('should filter by active status', async () => {
      await Category.create({ name: 'Active', isActive: true })
      await Category.create({ name: 'Inactive', isActive: false })

      const activeCategories = await Category.findAll({ isActive: true })

      expect(activeCategories).toHaveLength(1)
      expect(activeCategories[0].name).toBe('Active')
    })
  })
})