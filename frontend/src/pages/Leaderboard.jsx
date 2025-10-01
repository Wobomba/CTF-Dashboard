import React, { useState, useEffect } from 'react'
import { progressAPI } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Calendar,
  Target,
  Star
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Leaderboard = () => {
  const { user, isAuthenticated } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('all')
  const [currentUserRank, setCurrentUserRank] = useState(null)

  const timeframes = [
    { value: 'all', label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week', label: 'This Week' }
  ]

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await progressAPI.getLeaderboard({ timeframe })
      setLeaderboard(response.data.leaderboard)
      
      // Find current user's rank if authenticated
      if (isAuthenticated && user) {
        const userEntry = response.data.leaderboard.find(entry => entry.id === user.id)
        setCurrentUserRank(userEntry)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-gray-400">#{rank}</span>
  }

  const getRankColors = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
    if (rank === 2) return 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30'
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30'
    return 'bg-gray-800 border-gray-700'
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-16 w-16 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Global Leaderboard
          </h1>
          <p className="text-gray-400">
            Top cybersecurity defenders ranked by their training achievements
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            {timeframes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTimeframe(value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeframe === value
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Current User Rank */}
        {isAuthenticated && currentUserRank && (
          <div className="card p-4 mb-8 bg-primary-900/20 border-primary-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 bg-primary-600 rounded-full">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Your Rank</h3>
                  <p className="text-gray-400">Keep climbing the leaderboard!</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-400">
                  #{currentUserRank.rank}
                </div>
                <div className="text-sm text-gray-400">
                  {currentUserRank.total_score} points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`card p-6 ${getRankColors(entry.rank)} ${
                isAuthenticated && user && entry.id === user.id ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-16 h-16">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">
                        {entry.username}
                      </h3>
                      {entry.rank <= 3 && (
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      )}
                      {isAuthenticated && user && entry.id === user.id && (
                        <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1" />
                        {entry.total_score} points
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {entry.challenges_completed} challenges
                      </div>
                    </div>

                    {/* Recent Points (for timeframe filtering) */}
                    {timeframe !== 'all' && entry.recent_points && (
                      <div className="mt-2">
                        <span className="text-xs text-primary-400">
                          +{entry.recent_points} points this {timeframe}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Display */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {entry.total_score}
                  </div>
                  <div className="text-sm text-gray-400">
                    points
                  </div>
                </div>
              </div>

              {/* Progress Bar for Top 3 */}
              {entry.rank <= 3 && leaderboard[0] && (
                <div className="mt-4">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        entry.rank === 1 ? 'bg-yellow-400' :
                        entry.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                      }`}
                      style={{
                        width: `${(entry.total_score / leaderboard[0].total_score) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No rankings available
            </h3>
            <p className="text-gray-500 mb-6">
              Complete challenges to appear on the leaderboard
            </p>
          </div>
        )}

        {/* Call to Action */}
        {(!isAuthenticated || (currentUserRank && currentUserRank.rank > 10)) && (
          <div className="mt-12 text-center">
            <div className="card p-8 bg-gradient-to-r from-primary-900/50 to-purple-900/50 border-primary-500/30">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to climb the ranks?
              </h2>
              <p className="text-gray-300 mb-6">
                Complete cybersecurity challenges to earn points and improve your ranking
              </p>
              {!isAuthenticated ? (
                <div className="space-x-4">
                  <a href="/register" className="btn-primary">
                    Sign Up Now
                  </a>
                  <a href="/challenges" className="btn-secondary">
                    View Challenges
                  </a>
                </div>
              ) : (
                <a href="/challenges" className="btn-primary">
                  Start Challenges
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Leaderboard
