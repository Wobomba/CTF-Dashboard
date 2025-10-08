import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, setAuthToken, getAuthToken, handleApiError } from '../utils/api'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken()
      if (token) {
        try {
          const response = await authAPI.validateToken()
          setUser(response.data.user)
          setAuthToken(token)
        } catch (error) {
          setAuthToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authAPI.login(credentials)
      const { access_token, user: userData } = response.data
      
      setAuthToken(access_token)
      setUser(userData)
      
      toast.success(`Welcome back, ${userData.username}!`)
      return { success: true }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Login failed')
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authAPI.register(userData)
      const { access_token, user: newUser } = response.data
      
      setAuthToken(access_token)
      setUser(newUser)
      
      toast.success(`Welcome to RENU-CERT CyberLab, ${newUser.username}!`)
      return { success: true }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Registration failed')
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setAuthToken(null)
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to update profile')
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData)
      toast.success('Password changed successfully')
      return { success: true }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to change password')
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile()
      setUser(response.data.user)
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin || false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
