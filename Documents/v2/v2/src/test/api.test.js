import { describe, it, expect, vi, beforeEach } from 'vitest'
import ApiService from '../services/api.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication', () => {
    it('should set token on successful login', async () => {
      const mockResponse = {
        success: true,
        token: 'test-token',
        user: { id: 1, username: 'testuser' }
      }

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await ApiService.login('testuser', 'password')

      expect(result).toEqual(mockResponse)
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'test-token')
    })

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials'
      }

      fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse
      })

      await expect(ApiService.login('wrong', 'credentials')).rejects.toThrow()
    })
  })

  describe('Categories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', isActive: true },
        { id: 2, name: 'Clothing', isActive: true }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, categories: mockCategories })
      })

      const result = await ApiService.getCategories()

      expect(result.success).toBe(true)
      expect(result.categories).toEqual(mockCategories)
    })
  })
})