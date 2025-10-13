import React, { useState, useEffect } from 'react'
import { Trophy, Clock, Target, User, TrendingUp, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { challengesAPI } from '../utils/api'

const ChallengeLeaderboard = ({ challengeId }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [timeline, setTimeline] = useState([])
  const [totalCompletions, setTotalCompletions] = useState(0)
  const [maxPoints, setMaxPoints] = useState(100)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('graph') 

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const response = await challengesAPI.getChallengeLeaderboard(challengeId)
        setLeaderboard(response.data.leaderboard || [])
        setTimeline(response.data.timeline || [])
        setTotalCompletions(response.data.total_completions || 0)
        setMaxPoints(response.data.max_points || 100)
        setTotalUsers(response.data.total_users || 0)
      } catch (err) {
        setError('Failed to load leaderboard')
        console.error('Error fetching challenge leaderboard:', err)
      } finally {
        setLoading(false)
      }
    }

    if (challengeId) {
      fetchLeaderboard()
    }
  }, [challengeId])

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />
      case 3:
        return <Trophy className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-gray-400 font-semibold text-sm">#{rank}</span>
    }
  }

  // Custom tooltip for the line chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const step = data.step
      
      return (
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="text-white font-medium mb-2">Step {step}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => {
              const userId = entry.dataKey.replace('user_', '').replace(/_points$/, '')
              const username = data[`user_${userId}_username`] || 'Unknown'
              const isCorrect = data[`user_${userId}_is_correct`]
              const submittedAt = data[`user_${userId}_submitted_at`]
              const points = entry.value || 0
              
              return (
                <div key={userId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-white text-sm">{username}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                      {points}/{maxPoints}
                    </span>
                    {submittedAt && (
                      <p className="text-gray-400 text-xs">
                        {new Date(submittedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Generate colors for users
  const userIds = [...new Set(timeline.map(entry => entry.user_id))]
  const userColors = {}
  const userNames = {}
  
  userIds.forEach((userId, index) => {
    userColors[userId] = `hsl(${(index * 137.5) % 360}, 70%, 60%)`
  })
  
  timeline.forEach(entry => {
    userNames[entry.user_id] = entry.username
  })

  // Group timeline data by user and create separate lines
  const userData = {}
  timeline.forEach(entry => {
    if (!userData[entry.user_id]) {
      userData[entry.user_id] = []
    }
    userData[entry.user_id].push({
      ...entry,
      step: entry.submission_number,
      points: entry.cumulative_points
    })
  })

  // Create chart data with all user lines
  const chartData = []
  const maxSteps = Math.max(...Object.values(userData).map(userSubmissions => userSubmissions.length), 1)
  
  // Create data points for each step, including all users
  for (let step = 1; step <= maxSteps; step++) {
    const stepData = { step }
    
    // Add data for each user at this step
    Object.keys(userData).forEach(userId => {
      const userSubmissions = userData[userId]
      const submissionAtStep = userSubmissions.find(sub => sub.step === step)
      
      if (submissionAtStep) {
        stepData[`user_${userId}`] = submissionAtStep.points
        stepData[`user_${userId}_username`] = submissionAtStep.username
        stepData[`user_${userId}_is_correct`] = submissionAtStep.is_correct
        stepData[`user_${userId}_submitted_at`] = submissionAtStep.submitted_at
      } else {
        // If user didn't submit at this step, use their last known points
        const lastSubmission = userSubmissions.filter(sub => sub.step < step).pop()
        stepData[`user_${userId}`] = lastSubmission ? lastSubmission.points : 0
      }
    })
    
    chartData.push(stepData)
  }

  // If no data, create empty chart
  if (chartData.length === 0) {
    chartData.push({ step: 0 })
  }

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Trophy className="h-5 w-5 text-primary-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Challenge Leaderboard</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 h-4 bg-gray-700 rounded"></div>
              <div className="w-16 h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Trophy className="h-5 w-5 text-primary-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Challenge Leaderboard</h3>
        </div>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Trophy className="h-5 w-5 text-primary-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Challenge Leaderboard</h3>
          {totalUsers > 0 && (
            <span className="ml-2 bg-primary-600 text-white px-2 py-1 rounded-full text-xs">
              {totalUsers} user{totalUsers > 1 ? 's' : ''} attempted
            </span>
          )}
        </div>

        {totalUsers > 0 && (
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'graph'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'list'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 inline mr-1" />
              Rankings
            </button>
          </div>
        )}
      </div>

      {totalUsers === 0 ? (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No one has completed this challenge yet!</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to solve it and claim the top spot.</p>
        </div>
      ) : (
        <>
          {activeTab === 'graph' && (
            <div className="mb-6">
              <div className="h-80 w-full bg-gray-900/30 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="step" 
                      stroke="#9CA3AF"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Submission Steps', position: 'insideBottom', offset: -10, style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: 'Points', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                      domain={[0, maxPoints]}
                      type="number"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {userIds.map((userId, index) => (
                      <Line
                        key={userId}
                        type="monotone"
                        dataKey={`user_${userId}`}
                        stroke={userColors[userId]}
                        strokeWidth={2}
                        dot={{ fill: userColors[userId], strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: userColors[userId] }}
                        connectNulls={false}
                        name={userNames[userId]}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                {/* User Legend */}
                {userIds.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-4 mb-4">
                    {userIds.map((userId) => (
                      <div key={userId} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: userColors[userId] }}
                        />
                        <span className="text-gray-300 text-sm">{userNames[userId]}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-center">
                  <p className="text-gray-400 text-sm">
                    Points progression showing how each user accumulated points from 0 to {maxPoints} through their submission attempts
                  </p>
                  {chartData.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      {chartData.length} step{chartData.length > 1 ? 's' : ''} from {userIds.length} user{userIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-3 mb-6">
              {leaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-gray-600/50'
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt={entry.username}
                          className="w-8 h-8 rounded-full border-2 border-gray-600"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-white font-medium text-sm">{entry.username}</p>
                        {entry.hint_count > 0 && (
                          <p className="text-gray-400 text-xs">
                            {entry.hint_count} hint{entry.hint_count > 1 ? 's' : ''} used
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-green-400">
                      <Target className="h-4 w-4 mr-1" />
                      <span className="font-medium">{entry.points_awarded}</span>
                    </div>
                    
                    <div className="flex items-center text-blue-400">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{entry.time_display}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              {activeTab === 'graph' 
                ? `Individual progress lines for ${totalUsers} user${totalUsers > 1 ? 's' : ''} who attempted this challenge`
                : `Top ${leaderboard.length} performer${leaderboard.length > 1 ? 's' : ''} ranked by speed and points`
              }
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default ChallengeLeaderboard
