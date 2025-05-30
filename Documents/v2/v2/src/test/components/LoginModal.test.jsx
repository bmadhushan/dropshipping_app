import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LoginModal from '../../components/LoginModal.jsx'
import { AuthProvider } from '../../contexts/AuthContext.jsx'

// Mock the API service
vi.mock('../../services/api.js', () => ({
  default: {
    login: vi.fn()
  }
}))

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('LoginModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSwitchToRegister: vi.fn()
  }

  it('renders login form when open', () => {
    renderWithProviders(<LoginModal {...mockProps} />)
    
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderWithProviders(<LoginModal {...mockProps} isOpen={false} />)
    
    expect(screen.queryByPlaceholderText('Enter your username')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    renderWithProviders(<LoginModal {...mockProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /×/i }))
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('validates required fields', async () => {
    renderWithProviders(<LoginModal {...mockProps} />)
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
    })
  })
})