import React, { useState } from 'react'
import { X, AlertCircle, User, Mail, Lock, Shield } from 'lucide-react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    bio: '',
    is_admin: false
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Create user data 
      const { confirmPassword, ...userData } = formData
      
      await adminAPI.createUser(userData)
      toast.success('User created successfully!')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        first_name: '',
        last_name: '',
        bio: '',
        is_admin: false
      })
      
    } catch (error) {
      toast.error('Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <User className="h-5 w-5 mr-2" />
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="input-primary w-full"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="input-primary w-full"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input-with-icon w-full ${errors.username ? 'border-red-500' : ''}`}
                  placeholder="Choose username"
                />
              </div>
              {errors.username && <p className="text-red-400 text-sm mt-1">{errors.username}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-with-icon w-full ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="user@company.com"
                />
              </div>
              {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="input-primary w-full"
                placeholder="Optional bio or description"
              />
            </div>
          </div>

          {/* Account Security */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-with-icon w-full ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Strong password"
                  />
                </div>
                {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-with-icon w-full ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Permissions</h3>
            
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_admin ? 'bg-red-600' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.is_admin ? 'translate-x-5' : ''}`} />
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-red-400 mr-2" />
                    <span className="text-sm font-medium text-gray-300">Administrator Access</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Grants full access to admin features including user management and challenge creation
                  </p>
                </div>
              </label>

              {formData.is_admin && (
                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-red-300">
                      <strong>Warning:</strong> Admin users have full access to all platform features, 
                      including the ability to create, modify, and delete challenges and manage other users.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateUserModal
