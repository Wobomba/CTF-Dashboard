import React, { useState, useEffect } from 'react'
import { X, Shield, Users, Settings, Eye, EyeOff, User as UserIcon } from 'lucide-react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'

const UserManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all') // all, admin, regular

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllUsers({ per_page: 50 })
      setUsers(response.data.users || [])
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAdmin = async (userId, currentStatus) => {
    try {
      const response = await adminAPI.toggleUserAdmin(userId)
      toast.success(response.data.message)
      
      // Update user in the list
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !currentStatus }
          : user
      ))
      
      if (onSuccess) onSuccess()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user privileges'
      toast.error(errorMessage)
    }
  }

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const response = await adminAPI.toggleUserActive(userId)
      toast.success(response.data.message)
      
      // Update user in the list
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ))
      
      if (onSuccess) onSuccess()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to update user status'
      toast.error(errorMessage)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    switch (selectedFilter) {
      case 'admin':
        return user.is_admin
      case 'regular':
        return !user.is_admin
      default:
        return true
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Users className="h-5 w-5 mr-2" />
            User Management
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-primary w-full"
              />
            </div>
            <div className="sm:w-48">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="input-primary w-full"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins Only</option>
                <option value="regular">Regular Users</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          <div className="overflow-auto max-h-96">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No users found matching your criteria
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-white font-medium">{user.username}</h3>
                            {user.is_admin && (
                              <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs flex items-center">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </span>
                            )}
                            {!user.is_active && (
                              <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded text-xs">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                            {user.last_login && (
                              <span>Last login: {new Date(user.last_login).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Toggle Active Status */}
                        <button
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            user.is_active
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                          }`}
                          title={user.is_active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.is_active ? (
                            <>
                              <Eye className="h-3 w-3 mr-1 inline" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1 inline" />
                              Inactive
                            </>
                          )}
                        </button>

                        {/* Toggle Admin Status */}
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            user.is_admin
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                          }`}
                          title={user.is_admin ? 'Remove admin privileges' : 'Grant admin privileges'}
                        >
                          {user.is_admin ? (
                            <>
                              <Shield className="h-3 w-3 mr-1 inline" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Settings className="h-3 w-3 mr-1 inline" />
                              Make Admin
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Total Users: {filteredUsers.length}</span>
              <span>Admins: {filteredUsers.filter(u => u.is_admin).length}</span>
              <span>Active: {filteredUsers.filter(u => u.is_active).length}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserManagementModal
