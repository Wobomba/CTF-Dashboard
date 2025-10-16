import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { adminAPI } from '../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from './LoadingSpinner'
import EditChallengeModal from './EditChallengeModal'
import { 
  Trophy, 
  Eye, 
  Trash2, 
  Search, 
  Clock, 
  Target, 
  Users,
  AlertTriangle,
  ExternalLink,
  Edit
} from 'lucide-react'

const ChallengeManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'published', 'unpublished'
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [editingChallenge, setEditingChallenge] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchChallenges()
    }
  }, [isOpen])

  const fetchChallenges = async () => {
    setLoading(true)
    try {
      const response = await adminAPI.getAllChallenges()
      setChallenges(response.data.challenges || [])
    } catch (error) {
      toast.error('Failed to fetch challenges')
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChallenge = async (challenge) => {
    const confirmMessage = challenge.total_attempts > 0 
      ? `"${challenge.title}" has ${challenge.total_attempts} submission(s). Are you sure you want to delete it? This action cannot be undone.`
      : `Are you sure you want to delete "${challenge.title}"? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      await adminAPI.deleteChallenge(challenge.id)
      toast.success('Challenge deleted successfully')
      fetchChallenges()
      onSuccess()
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete challenge'
      toast.error(errorMessage)
      console.error('Error deleting challenge:', error)
    }
  }

  const viewChallenge = (challengeId) => {
    window.open(`/challenge/${challengeId}`, '_blank')
  }

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge)
  }

  const handleEditSuccess = () => {
    fetchChallenges()
    onSuccess()
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20'
      case 'advanced': return 'text-orange-400 bg-orange-400/20'
      case 'expert': return 'text-red-400 bg-red-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && challenge.is_published) ||
                         (filterStatus === 'unpublished' && !challenge.is_published)
    
    const matchesDifficulty = filterDifficulty === 'all' || challenge.difficulty === filterDifficulty

    return matchesSearch && matchesStatus && matchesDifficulty
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Manage Challenges</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search challenges..."
              className="input-primary w-full pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-primary"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
          <select
            className="input-primary"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </select>
        </div>

        {/* Challenge List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">
              {challenges.length === 0 ? 'No challenges created yet.' : 'No challenges match your filters.'}
            </p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              {filteredChallenges.map(challenge => (
                <div key={challenge.id} className="card p-4 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-white font-semibold text-lg truncate">{challenge.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                          {challenge.difficulty}
                        </span>
                        {!challenge.is_published && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-600/50">
                            Draft
                          </span>
                        )}
                        {challenge.is_featured && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-400 bg-purple-400/20">
                            Featured
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{challenge.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400">
                        <div className="flex items-center">
                          <Target className="h-3 w-3 mr-1" />
                          {challenge.points} pts
                        </div>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {challenge.total_attempts || 0} attempts
                        </div>
                        {challenge.time_limit && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {challenge.time_limit}m
                          </div>
                        )}
                        <div className="flex items-center">
                          <span>By: {challenge.author || 'System'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => viewChallenge(challenge.id)}
                        className="btn-sm btn-secondary flex items-center"
                        title="View Challenge"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditChallenge(challenge)}
                        className="btn-sm btn-primary flex items-center"
                        title="Edit Challenge"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(challenge)}
                        className="btn-sm btn-danger flex items-center"
                        title="Delete Challenge"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {challenge.total_attempts > 0 && (
                    <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded flex items-center text-yellow-400 text-xs">
                      <AlertTriangle className="h-3 w-3 mr-2" />
                      This challenge has submissions. Deletion may be restricted.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Total: {challenges.length} challenges</span>
            <span>Showing: {filteredChallenges.length} challenges</span>
          </div>
        </div>
        </div>
      </div>
      
      {/* Edit Challenge Modal */}
      <EditChallengeModal
        isOpen={!!editingChallenge}
        onClose={() => setEditingChallenge(null)}
        onSuccess={handleEditSuccess}
        challenge={editingChallenge}
      />
    </div>
  )
}

export default ChallengeManagementModal
