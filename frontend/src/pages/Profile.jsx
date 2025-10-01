import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Calendar, Trophy, Target, Edit3, Save, X } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Profile = () => {
  const { user, updateProfile, changePassword, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || ''
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [errors, setErrors] = useState({})

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    const result = await updateProfile(profileData)
    if (result.success) {
      setIsEditing(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match' })
      return
    }

    const result = await changePassword({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password
    })
    
    if (result.success) {
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordForm(false)
      setErrors({})
    }
  }

  const handleCancel = () => {
    setProfileData({
      username: user?.username || '',
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      bio: user?.bio || ''
    })
    setIsEditing(false)
    setErrors({})
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-6">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                      disabled={!isEditing}
                      className={`input-primary w-full ${!isEditing ? 'opacity-60' : ''}`}
                    />
                  </div>

                  {/* Name */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                        disabled={!isEditing}
                        className={`input-primary w-full ${!isEditing ? 'opacity-60' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                        disabled={!isEditing}
                        className={`input-primary w-full ${!isEditing ? 'opacity-60' : ''}`}
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input-primary w-full opacity-60"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      disabled={!isEditing}
                      rows={4}
                      className={`input-primary w-full ${!isEditing ? 'opacity-60' : ''}`}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {/* Action Buttons */}
                  {isEditing && (
                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            {/* Password Change */}
            <div className="card p-8 mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Change Password</h2>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn-secondary"
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                        className="input-primary w-full"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        className="input-primary w-full"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className={`input-primary w-full ${errors.confirm_password ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.confirm_password && (
                        <p className="text-red-400 text-sm mt-1">{errors.confirm_password}</p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center"
                      >
                        {loading ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
                          setErrors({})
                        }}
                        className="btn-secondary flex items-center"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* User Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
                    <span className="text-gray-300">Total Score</span>
                  </div>
                  <span className="text-white font-semibold">{user.total_score || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-gray-300">Challenges Completed</span>
                  </div>
                  <span className="text-white font-semibold">{user.challenges_completed || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-blue-400 mr-2" />
                    <span className="text-gray-300">Global Rank</span>
                  </div>
                  <span className="text-white font-semibold">#{user.rank_position || 'Unranked'}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Account Info</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-300">Email</p>
                    <p className="text-white">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-300">Member Since</p>
                    <p className="text-white">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {user.last_login && (
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-300">Last Login</p>
                      <p className="text-white">
                        {new Date(user.last_login).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
