import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Trophy, 
  CheckCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Target,
  Download,
  FileText,
  User,
  Calendar,
  Flag,
  Settings,
  Trash2
} from 'lucide-react'
import { challengesAPI, progressAPI, adminAPI, filesAPI } from '../utils/api'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import ChallengeLeaderboard from '../components/ChallengeLeaderboard'

const ChallengeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [challenge, setChallenge] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({}) // For multi-question challenges
  const [questionSubmissions, setQuestionSubmissions] = useState({}) // Track individual question submissions
  const [showHints, setShowHints] = useState(false)
  const [usedHints, setUsedHints] = useState([])
  const [visibleQuestionHints, setVisibleQuestionHints] = useState({})
  const [submission, setSubmission] = useState(null)
  const [recentSolves, setRecentSolves] = useState([])

  useEffect(() => {
    fetchChallenge()
    fetchRecentSolves()
  }, [id])

  const fetchChallenge = async () => {
    try {
      setLoading(true)
      const response = await challengesAPI.getChallenge(id)
      setChallenge(response.data.challenge)
      
      // Check if user has an existing submission
      if (response.data.challenge.user_submission) {
        setSubmission(response.data.challenge.user_submission)
        // Initialize answers for multi-question format
        if (response.data.challenge.user_submission.answer) {
          try {
            const parsedAnswers = JSON.parse(response.data.challenge.user_submission.answer)
            setAnswers(parsedAnswers)
            // Initialize question submissions based on existing answers
            if (response.data.challenge.questions) {
              const submissions = {}
              response.data.challenge.questions.forEach(q => {
                const questionKey = `question_${q.id}`
                if (parsedAnswers[questionKey]) {
                  submissions[questionKey] = {
                    submitted: true,
                    correct: response.data.challenge.user_submission.is_correct,
                    answer: parsedAnswers[questionKey]
                  }
                }
              })
              setQuestionSubmissions(submissions)
            }
          } catch {
            setAnswers({ answer: response.data.challenge.user_submission.answer })
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load challenge')
      navigate('/challenges')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentSolves = async () => {
    try {
      const response = await challengesAPI.getRecentSolves(id)
      setRecentSolves(response.data.recent_solves || [])
    } catch (error) {
      console.error('Failed to fetch recent solves:', error)
      // Fallback to empty array if API fails
      setRecentSolves([])
    }
  }

  const handleDeleteChallenge = async () => {
    if (!window.confirm(`Are you sure you want to delete "${challenge?.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await adminAPI.deleteChallenge(id)
      toast.success('Challenge deleted successfully')
      navigate('/admin')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to delete challenge'
      toast.error(errorMessage)
      console.error('Error deleting challenge:', error)
    }
  }

  const handleAnswerChange = (questionKey, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionKey]: value
    }))
  }

  const toggleQuestionHint = (questionId) => {
    setVisibleQuestionHints(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const handleQuestionSubmit = async (questionKey) => {
    const answer = answers[questionKey]?.trim()
    if (!answer) {
      toast.error('Please enter an answer')
      return
    }

    try {
      setSubmitting(true)
      const submissionData = { 
        answer: JSON.stringify({ [questionKey]: answer }),
        question_key: questionKey
      }
      const response = await challengesAPI.submitAnswer(id, submissionData)
      
      // Update question submission state
      setQuestionSubmissions(prev => ({
        ...prev,
        [questionKey]: {
          submitted: true,
          correct: response.data.is_correct,
          answer: answer,
          feedback: response.data.message
        }
      }))
      
      if (response.data.is_correct) {
        toast.success('Correct! Well done!')
        // Check if all questions are now correct
        const questions = getQuestions()
        const allCorrect = questions.every(q => 
          questionSubmissions[q.key]?.correct || (q.key === questionKey && response.data.is_correct)
        )
        
        if (allCorrect) {
          setSubmission(response.data.submission)
          setChallenge(prev => ({
            ...prev,
            user_submission: response.data.submission,
            solves: prev.solves + 1
          }))
        }
      } else {
        toast.error('Incorrect answer. Try again!')
      }
    } catch (error) {
      toast.error('Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleHintRequest = async (hintIndex) => {
    if (usedHints.includes(hintIndex)) return
    
    try {
      await progressAPI.useHint(id, hintIndex)
      setUsedHints([...usedHints, hintIndex])
      toast.info('Hint revealed!')
    } catch (error) {
      toast.error('Failed to get hint')
    }
  }

  const handleFileDownload = async (filename, originalName) => {
    try {
      const response = await filesAPI.downloadFile(filename)
      
      // Create blob and download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = originalName || filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('File downloaded successfully')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20'
      case 'advanced': return 'text-orange-400 bg-orange-500/20'
      case 'expert': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  // Get questions from challenge data
  const getQuestions = () => {
    // Use new questions structure 
    if (challenge?.questions && challenge.questions.length > 0) {
      return challenge.questions.map(q => ({
        key: `question_${q.id}`,
        id: q.id,
        number: q.id,
        question: q.question,
        format: q.answer_format || 'text',
        points: q.points || 0,
        hints: q.hints || []
      }))
    }
    
    
    const questions = []
    if (challenge?.instructions) {
      const lines = challenge.instructions.split('\n')
      lines.forEach((line, index) => {
        const questionMatch = line.match(/Question\s+(\d+)\)\s*(.+?)(?:\(Format:\s*(.+?)\))?\s*(?:\((\d+)\s*points?\))?/i)
        if (questionMatch) {
          const [, number, question, format, points] = questionMatch
          questions.push({
            key: `question_${number}`,
            number: parseInt(number),
            question: question.trim(),
            format: format || 'Text',
            points: parseInt(points) || 0,
            hints: []
          })
        }
      })
    }
    
    if (questions.length === 0) {
      questions.push({
        key: 'answer',
        number: 1,
        question: 'Your Answer',
        format: challenge?.answer_format || 'Text',
        points: challenge?.points || 0,
        hints: []
      })
    }
    
    return questions
  }

  
  const tools = challenge?.suggested_tools?.map(toolName => {
    console.log('Processing tool:', toolName)
    const iconMap = {
      'grep': '🔍', 'wireshark': '🦈', 'excel': '📊', 'text editor': '📝',
      'notepad': '📝', 'vim': '📝', 'nano': '📝', 'burp suite': '🛡️',
      'nmap': '🎯', 'metasploit': '💥', 'john': '🔓', 'hashcat': '🔐',
      'sqlmap': '💉', 'ffuf': '🔍', 'gobuster': '📂', 'nikto': '🕷️'
    }
    const icon = iconMap[toolName.toLowerCase()] || '🔧'
    return { name: toolName, icon }
  }) || []

  console.log('Challenge suggested_tools:', challenge?.suggested_tools)
  console.log('Processed tools:', tools)

  const files = challenge?.file_attachments || []

  const isCompleted = submission?.is_correct
  const canSubmit = !isCompleted
  const questions = getQuestions()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Challenge not found</h1>
          <button onClick={() => navigate('/challenges')} className="btn-primary">
            Back to Challenges
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/challenges')}
              className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challenges
            </button>
            
            {/* Admin Controls */}
            {user?.is_admin && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDeleteChallenge}
                  className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Challenge
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Challenge Title */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h1 className="text-2xl font-bold text-white mb-2">{challenge.title}</h1>
                <p className="text-gray-400 text-sm mb-4">{challenge.scenario || challenge.description}</p>
                
                {/* Challenge Stats */}
                <div className="space-y-3 text-sm border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Points</span>
                    <span className="text-yellow-400 font-semibold">{challenge.points}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Difficulty</span>
                    <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Solves</span>
                    <span className="text-green-400">{challenge.solves || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">OS</span>
                    <span className="text-white">{challenge.operating_system || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Suggested Tools</h3>
                <div className="space-y-2">
                  {tools.length > 0 ? (
                    tools.map((tool, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-700/30 rounded-lg">
                        <span className="text-lg mr-3">{tool.icon}</span>
                        <span className="text-gray-300">{tool.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-sm italic">
                      No suggested tools for this challenge
                    </div>
                  )}
                </div>
              </div>


              {/* Series & Creator */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="space-y-4">
                  {challenge.series && (
                    <div>
                      <div className="flex items-center text-blue-400 mb-2">
                        <Flag className="h-4 w-4 mr-2" />
                        <span className="font-semibold">Series</span>
                      </div>
                      <div className="text-gray-300 text-sm">
                        {challenge.series}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center text-yellow-400 mb-2">
                      <Trophy className="h-4 w-4 mr-2" />
                      <span className="font-semibold">Created By</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">
                          {(challenge.author || 'System').substring(0, 1).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{challenge.author || 'System'}</div>
                        <div className="text-gray-400 text-xs">
                          {new Date(challenge.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Solves */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Solves</h3>
                <div className="space-y-3">
                  {recentSolves.map((solve, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">
                          {solve.username.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{solve.username}</div>
                        <div className="text-gray-400 text-xs">{solve.timeAgo}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">

              {/* Challenge Leaderboard */}
              <ChallengeLeaderboard challengeId={id} />

              {/* Scenario */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Scenario</h2>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">Scenario</span>
                </div>
                
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4 mb-4">
                  <h3 className="text-blue-400 font-semibold mb-2">
                    Challenge Instructions
                  </h3>
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {challenge.instructions || "No detailed instructions provided for this challenge."}
                  </div>
                </div>
              </div>

              {/* Challenge Files */}
              {files.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                    <FileText className="h-6 w-6 text-blue-400 mr-3" />
                    Challenge Files
                  </h3>
                  <div className="grid gap-4">
                    {files.map((file, index) => (
                      <div key={index} className="border border-gray-700 rounded-lg p-6 bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                              <FileText className="h-8 w-8 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-bold text-xl mb-3 break-words">{file.name}</h4>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-4 text-gray-300">
                                  <span className="font-medium">Size:</span>
                                  <span className="text-blue-400 font-mono">{file.size}</span>
                                </div>
                                {file.password && (
                                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 text-gray-300">
                                    <span className="font-medium">Password:</span>
                                    <code className="bg-gray-600 px-4 py-2 rounded-lg text-gray-100 font-mono text-base inline-block">
                                      {file.password}
                                    </code>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleFileDownload(file.filename, file.name)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-base flex items-center justify-center transition-colors duration-200 lg:flex-shrink-0"
                          >
                            <Download className="h-5 w-5 mr-3" />
                            Download File
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Challenge Submission */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Challenge Submission</h2>
                
                {isCompleted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Challenge Completed!</h3>
                    <p className="text-gray-400 mb-4">You've successfully solved this challenge.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question) => (
                      <div key={question.key} className="space-y-3">
                        <div className="flex items-start justify-between">
                          <label className="block text-sm font-medium text-white flex-1">
                            <span className="text-blue-400">Question {question.number})</span>{' '}
                            {question.question}
                            {question.points > 0 && (
                              <span className="text-gray-500 ml-2">({question.points} points)</span>
                            )}
                          </label>
                        </div>
                        
                        {/* Display hints if visible */}
                        {visibleQuestionHints[question.id] && question.hints && question.hints.length > 0 && (
                          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-3">
                            <h4 className="text-yellow-400 font-medium mb-2">💡 Hints:</h4>
                            <ul className="space-y-1">
                              {question.hints.map((hint, hintIndex) => (
                                <li key={hintIndex} className="text-yellow-200 text-sm">
                                  • {hint}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={answers[question.key] || ''}
                            onChange={(e) => handleAnswerChange(question.key, e.target.value)}
                            className={`bg-gray-700 border text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-200 flex-1 ${
                              questionSubmissions[question.key]?.submitted
                                ? questionSubmissions[question.key]?.correct
                                  ? 'border-green-500 focus:ring-green-500'
                                  : 'border-red-500 focus:ring-red-500'
                                : 'border-gray-600 focus:ring-primary-500'
                            }`}
                            placeholder="Enter your answer"
                            disabled={submitting || questionSubmissions[question.key]?.correct}
                            readOnly={questionSubmissions[question.key]?.correct}
                          />
                          {question.hints && question.hints.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleQuestionHint(question.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                              disabled={questionSubmissions[question.key]?.correct}
                            >
                              💡 Hint
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleQuestionSubmit(question.key)}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors duration-200 ${
                              questionSubmissions[question.key]?.correct
                                ? 'bg-green-600 text-white cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            disabled={!answers[question.key]?.trim() || submitting || questionSubmissions[question.key]?.correct}
                          >
                            {questionSubmissions[question.key]?.correct ? '✓ Correct' : 'Submit'}
                          </button>
                        </div>
                        
                        {/* Submission feedback */}
                        {questionSubmissions[question.key]?.submitted && (
                          <div className={`mt-2 p-3 rounded-lg text-sm ${
                            questionSubmissions[question.key]?.correct
                              ? 'bg-green-900/20 border border-green-600/30 text-green-400'
                              : 'bg-red-900/20 border border-red-600/30 text-red-400'
                          }`}>
                            {questionSubmissions[question.key]?.correct ? (
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Correct answer!
                              </div>
                            ) : (
                              <div>
                                Incorrect. Try again!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
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

export default ChallengeDetail