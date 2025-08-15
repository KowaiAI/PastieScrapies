import { createContext, useContext, useState, useEffect } from 'react'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        if (apiService.token) {
          const userData = await apiService.getCurrentUser()
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        apiService.logout()
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await apiService.login(email, password)
      setUser(response.user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email, password, username, fullName) => {
    setIsLoading(true)
    try {
      // For demo purposes, registration uses the same endpoint as login
      const response = await apiService.login(email, password)
      setUser(response.user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: error.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const loginWithGitHub = async () => {
    setIsLoading(true)
    try {
      // Mock GitHub OAuth for demo - in real app this would handle OAuth flow
      const response = await apiService.login('github@example.com', 'github_oauth')
      setUser(response.user)
      setIsAuthenticated(true)
      return { success: true }
    } catch (error) {
      console.error('GitHub login error:', error)
      return { success: false, error: error.message || 'GitHub login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    apiService.logout()
    setUser(null)
    setIsAuthenticated(false)
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    loginWithGitHub,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

