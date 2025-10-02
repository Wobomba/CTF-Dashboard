import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Navigate } from 'react-router-dom'
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Activity, 
  Plus, 
  UserPlus,
  Target,
  Clock,
  Shield,
  TrendingUp,
  Trash2,
  Eye,
  Settings
} from 'lucide-react'
import { adminAPI } from '../utils/api'
import CreateChallengeModal from '../components/CreateChallengeModal'
import CreateUserModal from '../components/CreateUserModal'
import UserManagementModal from '../components/UserManagementModal'
import ChallengeManagementModal from '../components/ChallengeManagementModal'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [recentUsers, setRecentUsers] = useState([])
  const [recentChallenges, setRecentChallenges] = useState([])
  const [showChallengeManagement, setShowChallengeManagement] = useState(false)
  const [allChallenges, setAllChallenges] = useState([])
  const [challengesLoading, setChallengesLoading] = useState(false)

  // Redirect non-admin users
  if (!isAuthenticated || !user?.is_admin) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    fetchDashboardData()
    fetchRecentData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getDashboard()
      setDashboardData(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentData = async () => {
    try {
      const [usersResponse, challengesResponse] = await Promise.all([
        adminAPI.getAllUsers({ per_page: 5, sort: 'created_at', order: 'desc' }),
        adminAPI.getAllChallenges({ per_page: 5, sort: 'created_at', order: 'desc' })
      ])
      
      setRecentUsers(usersResponse.data.users || [])
      setRecentChallenges(challengesResponse.data.challenges || [])
    } catch (error) {
      console.error('Failed to fetch recent data:', error)
    }
  }

  const handleChallengeCreated = () => {
    fetchDashboardData()
    fetchRecentData()
  }

  const handleUserCreated = () => {
    fetchDashboardData()
    fetchRecentData()
  }

  const fetchAllChallenges = async () => {
    try {
      setChallengesLoading(true)
      const response = await adminAPI.getAllChallenges()
      setAllChallenges(response.data.challenges || [])
    } catch (error) {
      toast.error('Failed to fetch challenges')
      console.error('Error fetching challenges:', error)
    } finally {
      setChallengesLoading(false)
    }
  }

  const handleDeleteChallenge = async (challengeId, challengeTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${challengeTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await adminAPI.deleteChallenge(challengeId)
      toast.success('Challenge deleted successfully')
      fetchAllChallenges()
      fetchDashboardData()
      fetchRecentData()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete challenge'
      toast.error(errorMessage)
      console.error('Error deleting challenge:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const stats = dashboardData ? {
    total_users: dashboardData.users?.total || 0,
    total_challenges: dashboardData.challenges?.total || 0,
    active_submissions: dashboardData.submissions?.total || 0,
    avg_completion_rate: dashboardData.submissions?.success_rate || 0
  } : {
    total_users: 0,
    total_challenges: 0,
    active_submissions: 0,
    avg_completion_rate: 0
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Shield className="h-8 w-8 mr-3 text-primary-400" />
                Admin Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                Manage users, challenges, and platform administration
              </p>
            </div>
            
                 <div className="flex space-x-4">
                   <button
                     onClick={() => {
                       setShowChallengeManagement(true)
                       fetchAllChallenges()
                     }}
                     className="btn-secondary flex items-center"
                   >
                     <Settings className="h-4 w-4 mr-2" />
                     Manage Challenges
                   </button>
                   <button
                     onClick={() => setShowUserManagement(true)}
                     className="btn-secondary flex items-center"
                   >
                     <Users className="h-4 w-4 mr-2" />
                     Manage Users
                   </button>
                   <button
                     onClick={() => setShowCreateUser(true)}
                     className="btn-secondary flex items-center"
                   >
                     <UserPlus className="h-4 w-4 mr-2" />
                     Add User
                   </button>
                   <button
                     onClick={() => setShowCreateChallenge(true)}
                     className="btn-primary flex items-center"
                   >
                     <Plus className="h-4 w-4 mr-2" />
                     Create Challenge
                   </button>
                 </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats.total_users}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-500/20">
                <BookOpen className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Challenges</p>
                <p className="text-2xl font-bold text-white">{stats.total_challenges}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Activity className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Submissions</p>
                <p className="text-2xl font-bold text-white">{stats.active_submissions}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <TrendingUp className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-white">{stats.avg_completion_rate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Quick Actions Card */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => setShowCreateChallenge(true)}
                className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center"
              >
                <Target className="h-5 w-5 text-primary-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Create New Challenge</p>
                  <p className="text-gray-400 text-sm">Add a new cybersecurity challenge</p>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowChallengeManagement(true)
                  fetchAllChallenges()
                }}
                className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center"
              >
                <Settings className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Manage Challenges</p>
                  <p className="text-gray-400 text-sm">View, edit, and delete existing challenges</p>
                </div>
              </button>
              
              <button
                onClick={() => setShowUserManagement(true)}
                className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center"
              >
                <Users className="h-5 w-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Manage Users</p>
                  <p className="text-gray-400 text-sm">Promote users to admin and manage accounts</p>
                </div>
              </button>
              
              <button
                onClick={() => setShowCreateUser(true)}
                className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center"
              >
                <UserPlus className="h-5 w-5 text-green-400 mr-3" />
                <div>
                  <p className="text-white font-medium">Onboard New User</p>
                  <p className="text-gray-400 text-sm">Add a new user to the platform</p>
                </div>
              </button>

              <button className="w-full text-left p-4 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors flex items-center">
                <Activity className="h-5 w-5 text-green-400 mr-3" />
                <div>
                  <p className="text-white font-medium">View Analytics</p>
                  <p className="text-gray-400 text-sm">Platform usage and performance</p>
                </div>
              </button>
            </div>
          </div>

          {/* Platform Status */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Platform Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">System Health</span>
                <span className="text-green-400 font-medium">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Database</span>
                <span className="text-green-400 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">API Status</span>
                <span className="text-green-400 font-medium">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Last Backup</span>
                <span className="text-gray-400">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Users</h2>
            <div className="space-y-3">
              {recentUsers.length > 0 ? recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-white font-medium">{user.username}</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    {user.is_admin && (
                      <span className="inline-block px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No recent users</p>
              )}
            </div>
          </div>

          {/* Recent Challenges */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Recent Challenges</h2>
            <div className="space-y-3">
              {recentChallenges.length > 0 ? recentChallenges.map((challenge) => (
                <div key={challenge.id} className="p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">{challenge.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        challenge.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        challenge.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        challenge.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-gray-400 text-sm">{challenge.points} pts</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {challenge.description?.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-500 text-xs">
                      {challenge.category_name || 'Uncategorized'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(challenge.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">No recent challenges</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateChallengeModal
        isOpen={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onSuccess={handleChallengeCreated}
      />
      
      <CreateUserModal
        isOpen={showCreateUser}
        onClose={() => setShowCreateUser(false)}
        onSuccess={handleUserCreated}
      />
      
      <UserManagementModal
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
        onSuccess={() => {
          fetchDashboardData()
          fetchRecentData()
        }}
      />
      
      <ChallengeManagementModal
        isOpen={showChallengeManagement}
        onClose={() => setShowChallengeManagement(false)}
        onSuccess={() => {
          fetchDashboardData()
          fetchRecentData()
        }}
      />
    </div>
  )
}

export default AdminDashboard