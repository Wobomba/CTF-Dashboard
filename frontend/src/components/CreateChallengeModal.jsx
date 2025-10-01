import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, Upload, FileText } from 'lucide-react'
import { adminAPI, challengesAPI } from '../utils/api'
import toast from 'react-hot-toast'

const CreateChallengeModal = ({ isOpen, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scenario: '',
    instructions: '',
    hints: [''],
    questions: [{
      id: 1,
      question: '',
      answer_format: 'text',
      correct_answer: '',
      points: 10,
      hints: ['']
    }],
    suggested_tools: [''],
    challenge_type: 'investigation',
    difficulty: 'beginner',
    author: '',
    series: '',
    points: 100,
    time_limit: '',
    operating_system: '',
    category_id: '',
    is_published: true,
    is_featured: false
  })
  const [errors, setErrors] = useState({})

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    try {
      setUploading(true)
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        // For now, we'll simulate file upload - in real implementation, this would upload to server
        // const response = await adminAPI.uploadFile(formData)
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: formatFileSize(file.size),
          password: '', // Can be set later
          url: URL.createObjectURL(file) // Temporary URL for preview
        }
      })

      const newFiles = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...newFiles])
      toast.success(`${files.length} file(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const updateFilePassword = (fileId, password) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, password } : f
    ))
  }

  const challengeTypes = [
    { value: 'investigation', label: 'Investigation' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'ctf', label: 'CTF' },
    { value: 'simulation', label: 'Simulation' }
  ]

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]

  const answerTypes = [
    { value: 'text', label: 'Text Answer' },
    { value: 'flag', label: 'Flag Format' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'file', label: 'File Upload' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  const fetchCategories = async () => {
    try {
      const response = await challengesAPI.getCategories()
      setCategories(response.data.categories)
      if (response.data.categories.length > 0) {
        setFormData(prev => ({ ...prev, category_id: response.data.categories[0].id }))
      }
    } catch (error) {
      toast.error('Failed to fetch categories')
    }
  }

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

  const handleHintChange = (index, value) => {
    const newHints = [...formData.hints]
    newHints[index] = value
    setFormData(prev => ({ ...prev, hints: newHints }))
  }

  const addHint = () => {
    setFormData(prev => ({
      ...prev,
      hints: [...prev.hints, '']
    }))
  }

  const removeHint = (index) => {
    if (formData.hints.length > 1) {
      const newHints = formData.hints.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, hints: newHints }))
    }
  }

  const addTool = () => {
    setFormData(prev => ({
      ...prev,
      suggested_tools: [...prev.suggested_tools, '']
    }))
  }

  const removeTool = (index) => {
    if (formData.suggested_tools.length > 1) {
      const newTools = formData.suggested_tools.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, suggested_tools: newTools }))
    }
  }

  // Question management functions
  const addQuestion = () => {
    const newId = Math.max(...formData.questions.map(q => q.id)) + 1
    const newQuestion = {
      id: newId,
      question: '',
      answer_format: 'text',
      correct_answer: '',
      points: 10,
      hints: ['']
    }
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const removeQuestion = (questionId) => {
    if (formData.questions.length > 1) {
      const newQuestions = formData.questions.filter(q => q.id !== questionId)
      setFormData(prev => ({ ...prev, questions: newQuestions }))
    }
  }

  const updateQuestion = (questionId, field, value) => {
    const newQuestions = formData.questions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    )
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  const addQuestionHint = (questionId) => {
    const newQuestions = formData.questions.map(q => 
      q.id === questionId ? { ...q, hints: [...q.hints, ''] } : q
    )
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  const removeQuestionHint = (questionId, hintIndex) => {
    const newQuestions = formData.questions.map(q => {
      if (q.id === questionId && q.hints.length > 1) {
        const newHints = q.hints.filter((_, i) => i !== hintIndex)
        return { ...q, hints: newHints }
      }
      return q
    })
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  const updateQuestionHint = (questionId, hintIndex, value) => {
    const newQuestions = formData.questions.map(q => {
      if (q.id === questionId) {
        const newHints = [...q.hints]
        newHints[hintIndex] = value
        return { ...q, hints: newHints }
      }
      return q
    })
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.scenario.trim()) newErrors.scenario = 'Scenario is required'
    if (!formData.instructions.trim()) newErrors.instructions = 'Instructions are required'
    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (formData.points < 1) newErrors.points = 'Points must be positive'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      setLoading(true)
      
      // Filter out empty hints and tools
      const cleanedHints = formData.hints.filter(hint => hint.trim() !== '')
      const cleanedTools = formData.suggested_tools.filter(tool => tool.trim() !== '')
      
      // Process questions - clean empty fields and calculate total points
      const cleanedQuestions = formData.questions.map(q => ({
        ...q,
        hints: q.hints.filter(hint => hint.trim() !== '')
      })).filter(q => q.question.trim() !== '' && q.correct_answer.trim() !== '')
      
      const challengeData = {
        ...formData,
        description: formData.scenario, // Use scenario as description
        hints: cleanedHints,
        questions: cleanedQuestions,
        suggested_tools: cleanedTools,
        time_limit: formData.time_limit ? parseInt(formData.time_limit) : null,
        points: parseInt(formData.points),
        category_id: parseInt(formData.category_id),
        file_attachments: uploadedFiles.map(file => ({
          name: file.name,
          size: file.size,
          password: file.password || null,
          url: file.url // In real implementation, this would be the server URL
        }))
      }

      await adminAPI.createChallenge(challengeData)
      toast.success('Challenge created successfully!')
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        scenario: '',
        instructions: '',
        hints: [''],
        questions: [{
          id: 1,
          question: '',
          answer_format: 'text',
          correct_answer: '',
          points: 10,
          hints: ['']
        }],
        suggested_tools: [''],
        challenge_type: 'investigation',
        difficulty: 'beginner',
        author: '',
        series: '',
        points: 100,
        time_limit: '',
        operating_system: '',
        category_id: categories.length > 0 ? categories[0].id : '',
        is_published: true,
        is_featured: false
      })
      setUploadedFiles([])
      
    } catch (error) {
      toast.error('Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create New Challenge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Challenge Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`input-primary w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter challenge title"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className={`input-primary w-full ${errors.category_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id}</p>}
            </div>
          </div>

          {/* Challenge Details */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type
              </label>
              <select
                name="challenge_type"
                value={formData.challenge_type}
                onChange={handleChange}
                className="input-primary w-full"
              >
                {challengeTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="input-primary w-full"
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operating System
              </label>
              <select
                name="operating_system"
                value={formData.operating_system}
                onChange={handleChange}
                className="input-primary w-full"
              >
                <option value="">Select OS</option>
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="macOS">macOS</option>
                <option value="Windows/Linux">Windows/Linux</option>
                <option value="Any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Points *
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleChange}
                min="1"
                className={`input-primary w-full ${errors.points ? 'border-red-500' : ''}`}
              />
              {errors.points && <p className="text-red-400 text-sm mt-1">{errors.points}</p>}
            </div>
          </div>

          {/* Author and Series */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="input-primary w-full"
                placeholder="Your name or organization"
              />
              <p className="text-gray-500 text-xs mt-1">This will be displayed as the challenge creator</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Series Name
              </label>
              <input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleChange}
                className="input-primary w-full"
                placeholder="e.g., Web Security Fundamentals, Network Analysis"
              />
              <p className="text-gray-500 text-xs mt-1">Group related challenges into a series</p>
            </div>
          </div>

          {/* Time Limit and Operating System */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleChange}
                className="input-primary w-full"
                placeholder="Optional time limit"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Operating System
              </label>
              <select
                name="operating_system"
                value={formData.operating_system}
                onChange={handleChange}
                className="input-primary w-full"
              >
                <option value="">Select OS</option>
                <option value="Windows">Windows</option>
                <option value="Linux">Linux</option>
                <option value="macOS">macOS</option>
                <option value="Web-based">Web-based</option>
                <option value="Any">Any</option>
              </select>
            </div>
          </div>

          {/* Scenario */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Scenario *
            </label>
            <textarea
              name="scenario"
              value={formData.scenario}
              onChange={handleChange}
              rows={4}
              className={`input-primary w-full ${errors.scenario ? 'border-red-500' : ''}`}
              placeholder="Describe the compromise or situation that occurred - this explains what the challenge is about"
            />
            {errors.scenario && <p className="text-red-400 text-sm mt-1">{errors.scenario}</p>}
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instructions *
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={5}
              className={`input-primary w-full ${errors.instructions ? 'border-red-500' : ''}`}
              placeholder="Detailed instructions for solving the challenge"
            />
            {errors.instructions && <p className="text-red-400 text-sm mt-1">{errors.instructions}</p>}
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Questions *
              </label>
              <button
                type="button"
                onClick={addQuestion}
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>
            <div className="space-y-6">
              {formData.questions.map((question, questionIndex) => (
                <div key={question.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Question {questionIndex + 1}</h4>
                    {formData.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                      rows={2}
                      className="input-primary w-full"
                      placeholder="What is the question you want to ask?"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Answer Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Answer Format *
                      </label>
                      <select
                        value={question.answer_format}
                        onChange={(e) => updateQuestion(question.id, 'answer_format', e.target.value)}
                        className="input-primary w-full"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="ip_address">IP Address</option>
                        <option value="url">URL</option>
                        <option value="email">Email</option>
                        <option value="hash">Hash/MD5</option>
                        <option value="flag">Flag Format</option>
                        <option value="date">Date</option>
                      </select>
                    </div>

                    {/* Points */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Points *
                      </label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => updateQuestion(question.id, 'points', parseInt(e.target.value) || 0)}
                        className="input-primary w-full"
                        min="1"
                        placeholder="10"
                      />
                    </div>

                    {/* Correct Answer */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Correct Answer *
                      </label>
                      <input
                        type="text"
                        value={question.correct_answer}
                        onChange={(e) => updateQuestion(question.id, 'correct_answer', e.target.value)}
                        className="input-primary w-full"
                        placeholder="The correct answer"
                      />
                    </div>
                  </div>

                  {/* Question Hints */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Hints for this Question
                      </label>
                      <button
                        type="button"
                        onClick={() => addQuestionHint(question.id)}
                        className="text-primary-400 hover:text-primary-300 text-xs flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Hint
                      </button>
                    </div>
                    <div className="space-y-2">
                      {question.hints.map((hint, hintIndex) => (
                        <div key={hintIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={hint}
                            onChange={(e) => updateQuestionHint(question.id, hintIndex, e.target.value)}
                            className="input-primary flex-1 text-sm"
                            placeholder={`Hint ${hintIndex + 1} for this question`}
                          />
                          {question.hints.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestionHint(question.id, hintIndex)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hints */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Hints
              </label>
              <button
                type="button"
                onClick={addHint}
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Hint
              </button>
            </div>
            <div className="space-y-2">
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    className="input-primary flex-1"
                    placeholder={`Hint ${index + 1}`}
                  />
                  {formData.hints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHint(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Tools */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                Suggested Tools
              </label>
              <button
                type="button"
                onClick={addTool}
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tool
              </button>
            </div>
            <div className="space-y-2">
              {formData.suggested_tools.map((tool, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => {
                      const newTools = [...formData.suggested_tools]
                      newTools[index] = e.target.value
                      setFormData(prev => ({ ...prev, suggested_tools: newTools }))
                    }}
                    className="input-primary flex-1"
                    placeholder={`Tool ${index + 1} (e.g., Wireshark, Grep, Excel)`}
                  />
                  {formData.suggested_tools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTool(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-300">
                Challenge Files
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                  accept=".zip,.rar,.7z,.tar,.gz,.pdf,.txt,.log,.pcap,.csv,.json,.xml"
                />
                <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors duration-200">
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </div>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-3 mb-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="border border-gray-700 rounded-lg p-5 bg-gray-700/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center flex-1 min-w-0 space-x-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-base mb-2 break-words">{file.name}</h4>
                          <p className="text-gray-400 text-sm">{file.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-400/10 transition-colors ml-4 flex-shrink-0"
                        title="Remove file"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-300 mb-2 font-medium">
                        Password (optional)
                      </label>
                      <input
                        type="text"
                        value={file.password}
                        onChange={(e) => updateFilePassword(file.id, e.target.value)}
                        className="input-primary w-full"
                        placeholder="Enter password for this file"
                      />
                      <p className="text-gray-500 text-xs mt-1">
                        If provided, users will need this password to extract/open the file
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-gray-500 text-xs">
              Upload files that users will need to complete this challenge. Supported formats: ZIP, RAR, PDF, text files, logs, etc.
            </p>
          </div>


          {/* Publishing Options */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Publishing Options</h3>
            
            <div className="flex gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_published ? 'bg-primary-600' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.is_published ? 'translate-x-5' : ''}`} />
                </div>
                <span className="ml-3 text-sm text-gray-300">Publish Immediately</span>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_featured ? 'bg-primary-600' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${formData.is_featured ? 'translate-x-5' : ''}`} />
                </div>
                <span className="ml-3 text-sm text-gray-300">Feature Challenge</span>
              </label>
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
                'Create Challenge'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateChallengeModal
