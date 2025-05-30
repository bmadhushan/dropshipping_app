// Test setup for backend
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set NODE_ENV to test
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DB_PATH = ':memory:' // Use in-memory database for tests