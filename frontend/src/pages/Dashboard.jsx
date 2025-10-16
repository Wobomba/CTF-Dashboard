import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { progressAPI, challengesAPI } from '../utils/api'
import { 
  Target, 
  Trophy, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  TrendingUp,
  Star,
  Calendar,
  ArrowRight
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [recentProgress, setRecentProgress] = useState([])
  const [featuredChallenges, setFeaturedChallenges] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch user stats and recent progress
      const [statsResponse, progressResponse, challengesResponse] = await Promise.all([
        progressAPI.getUserStats(),
        progressAPI.getMyProgress(),
        challengesAPI.getChallenges({ featured: true, per_page: 6 })
      ])

      setStats(statsResponse.data)
      setRecentProgress(progressResponse.data.progress.slice(0, 5))
      setFeaturedChallenges(challengesResponse.data.challenges)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: 'text-green-400 bg-green-500/20',
      intermediate: 'text-yellow-400 bg-yellow-500/20',
      advanced: 'text-orange-400 bg-orange-500/20',
      expert: 'text-red-400 bg-red-500/20'
    }
    return colors[difficulty] || colors.beginner
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-400 bg-green-500/20',
      in_progress: 'text-blue-400 bg-blue-500/20',
      not_started: 'text-gray-400 bg-gray-500/20'
    }
    return colors[status] || colors.not_started
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-400">
            Continue your cybersecurity training journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Score</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.user_stats?.total_score || 0}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Challenges Completed</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.user_stats?.challenges_completed || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Global Rank</p>
                <p className="text-2xl font-bold text-white">
                  #{stats?.user_stats?.rank_position || 'Unranked'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Activity Streak</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.activity_streak || 0} days
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Progress */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Progress</h2>
                <Link 
                  to="/challenges" 
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  View All Challenges
                </Link>
              </div>

              {recentProgress.length > 0 ? (
                <div className="space-y-4">
                  {recentProgress.map((progress) => (
                    <div key={progress.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Target className="h-8 w-8 text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {progress.challenge?.title || 'Unknown Challenge'}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(progress.challenge?.difficulty)}`}>
                              {progress.challenge?.difficulty}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(progress.status)}`}>
                              {progress.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">
                          {progress.challenge?.points} points
                        </p>
                        {progress.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400 mt-1 ml-auto" />
                        ) : (
                          <Link 
                            to={`/challenge/${progress.challenge_id}`}
                            className="text-primary-400 hover:text-primary-300 text-sm flex items-center mt-1"
                          >
                            Continue
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">
                    No challenges started yet. Begin your journey!
                  </p>
                  <Link to="/challenges" className="btn-primary mt-4 inline-flex items-center">
                    Browse Challenges
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Featured Challenges */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Featured Challenges</h2>
                <Star className="h-5 w-5 text-yellow-400" />
              </div>

              <div className="space-y-4">
                {featuredChallenges.map((challenge) => (
                  <Link
                    key={challenge.id}
                    to={`/challenge/${challenge.slug}`}
                    className="block p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <h3 className="font-medium text-white mb-2">
                      {challenge.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty}
                      </span>
                      <span className="text-sm text-gray-400">
                        {challenge.points} pts
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              <Link
                to="/challenges?featured=true"
                className="block text-center mt-6 text-primary-400 hover:text-primary-300 font-medium"
              >
                View All Featured
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="card p-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
              
              <div className="space-y-3">
                <Link
                  to="/challenges"
                  className="block w-full text-left p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-3" />
                    Browse Challenges
                  </div>
                </Link>

                <Link
                  to="/leaderboard"
                  className="block w-full text-left p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-3" />
                    View Leaderboard
                  </div>
                </Link>

                <Link
                  to="/profile"
                  className="block w-full text-left p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <Target className="h-5 w-5 mr-3" />
                    Update Profile
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
