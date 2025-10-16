import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertCircle, Upload, FileText } from 'lucide-react'
import { adminAPI, challengesAPI, filesAPI } from '../utils/api'
import toast from 'react-hot-toast'

const EditChallengeModal = ({ isOpen, onClose, onSuccess, challenge }) => {
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

  useEffect(() => {
    if (isOpen && challenge) {
      // Load challenge data into form
      setFormData({
        title: challenge.title || '',
        description: challenge.description || '',
        scenario: challenge.scenario || '',
        instructions: challenge.instructions || '',
        hints: challenge.hints && challenge.hints.length > 0 ? challenge.hints : [''],
        questions: challenge.questions && challenge.questions.length > 0 ? challenge.questions : [{
          id: 1,
          question: '',
          answer_format: 'text',
          correct_answer: '',
          points: 10,
          hints: ['']
        }],
        suggested_tools: challenge.suggested_tools && challenge.suggested_tools.length > 0 ? challenge.suggested_tools : [''],
        challenge_type: challenge.challenge_type || 'investigation',
        difficulty: challenge.difficulty || 'beginner',
        author: challenge.author || '',
        series: challenge.series || '',
        points: challenge.points || 100,
        time_limit: challenge.time_limit || '',
        operating_system: challenge.operating_system || '',
        category_id: challenge.category_id || '',
        is_published: challenge.is_published || false,
        is_featured: challenge.is_featured || false
      })
      
      // Load existing files
      setUploadedFiles(challenge.file_attachments || [])
      
      // Load categories
      loadCategories()
    }
  }, [isOpen, challenge])

  const loadCategories = async () => {
    try {
      const response = await challengesAPI.getCategories()
      setCategories(response.data.categories || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleArrayInputChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => 
        i === index ? value : item
      )
    }))
  }

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleQuestionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const addQuestion = () => {
    const newId = Math.max(...formData.questions.map(q => q.id), 0) + 1
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, {
        id: newId,
        question: '',
        answer_format: 'text',
        correct_answer: '',
        points: 10,
        hints: ['']
      }]
    }))
  }

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    try {
      setUploading(true)
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        // Upload file to backend
        const response = await filesAPI.uploadFile(formData)
        return response.data.file
      })

      const newFiles = await Promise.all(uploadPromises)
      setUploadedFiles(prev => [...prev, ...newFiles])
      toast.success(`${files.length} file(s) uploaded successfully`)
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = 'Instructions are required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required'
    }

    // Validate each question
    formData.questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = 'Question text is required'
      }
      if (!question.correct_answer.trim()) {
        newErrors[`answer_${index}`] = 'Correct answer is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const challengeData = {
        ...formData,
        file_attachments: uploadedFiles,
        questions: formData.questions.filter(q => q.question.trim() && q.correct_answer.trim()),
        hints: formData.hints.filter(h => h.trim()),
        suggested_tools: formData.suggested_tools.filter(t => t.trim())
      }

      await adminAPI.updateChallenge(challenge.id, challengeData)
      
      toast.success('Challenge updated successfully!')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Challenge update error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to update challenge'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !challenge) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Edit Challenge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-primary w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Challenge title"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`input-primary w-full ${errors.category_id ? 'border-red-500' : ''}`}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-400 text-sm mt-1">{errors.category_id}</p>}
            </div>
          </div>

          {/* Challenge Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Challenge Type
              </label>
              <select
                name="challenge_type"
                value={formData.challenge_type}
                onChange={handleInputChange}
                className="input-primary w-full"
              >
                <option value="investigation">Investigation</option>
                <option value="forensics">Forensics</option>
                <option value="cryptography">Cryptography</option>
                <option value="web">Web Security</option>
                <option value="network">Network Security</option>
                <option value="reverse">Reverse Engineering</option>
                <option value="pwn">Binary Exploitation</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Difficulty
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="input-primary w-full"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Points
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="input-primary w-full"
                placeholder="100"
              />
            </div>
          </div>

          {/* Additional Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="input-primary w-full"
                placeholder="Your name or organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Series
              </label>
              <input
                type="text"
                name="series"
                value={formData.series}
                onChange={handleInputChange}
                className="input-primary w-full"
                placeholder="e.g., Web Security Fundamentals"
              />
            </div>
          </div>

          {/* Time Limit and OS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleInputChange}
                className="input-primary w-full"
                placeholder="Optional time limit"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Operating System
              </label>
              <select
                name="operating_system"
                value={formData.operating_system}
                onChange={handleInputChange}
                className="input-primary w-full"
              >
                <option value="">Select OS</option>
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
                <option value="macos">macOS</option>
                <option value="any">Any</option>
              </select>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-white">Published</span>
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-white">Featured</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`input-primary w-full ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Brief description of the challenge"
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Scenario
            </label>
            <textarea
              name="scenario"
              value={formData.scenario}
              onChange={handleInputChange}
              rows={4}
              className="input-primary w-full"
              placeholder="Describe the compromise or situation that occurred - this explains what the challenge is about"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Instructions *
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={5}
              className={`input-primary w-full ${errors.instructions ? 'border-red-500' : ''}`}
              placeholder="Detailed instructions for solving the challenge"
            />
            {errors.instructions && <p className="text-red-400 text-sm mt-1">{errors.instructions}</p>}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Challenge Files
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-gray-400">
                  {uploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                </span>
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="text-white">{file.name}</span>
                      <span className="text-gray-400 ml-2">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Questions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white">
                Questions *
              </label>
              <button
                type="button"
                onClick={addQuestion}
                className="btn-sm btn-primary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>
            
            {formData.questions.map((question, index) => (
              <div key={question.id} className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-semibold text-lg">Question {index + 1}</h4>
                  {formData.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Remove Question"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Question Text *
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                      className={`input-primary w-full ${errors[`question_${index}`] ? 'border-red-500' : ''}`}
                      rows={2}
                      placeholder="What is the question you want to ask?"
                    />
                    {errors[`question_${index}`] && (
                      <p className="text-red-400 text-sm mt-1">{errors[`question_${index}`]}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Answer Format
                      </label>
                      <select
                        value={question.answer_format}
                        onChange={(e) => handleQuestionChange(index, 'answer_format', e.target.value)}
                        className="input-primary w-full"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="flag">Flag</option>
                        <option value="file">File Upload</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        value={question.points}
                        onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value) || 0)}
                        className="input-primary w-full"
                        min="1"
                        max="100"
                        placeholder="10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Correct Answer *
                      </label>
                      <input
                        type="text"
                        value={question.correct_answer}
                        onChange={(e) => handleQuestionChange(index, 'correct_answer', e.target.value)}
                        className={`input-primary w-full ${errors[`answer_${index}`] ? 'border-red-500' : ''}`}
                        placeholder="The correct answer"
                      />
                      {errors[`answer_${index}`] && (
                        <p className="text-red-400 text-sm mt-1">{errors[`answer_${index}`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {errors.questions && (
              <p className="text-red-400 text-sm mt-1">{errors.questions}</p>
            )}
          </div>

          {/* Hints */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white">
                General Hints
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('hints')}
                className="btn-sm btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Hint
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.hints.map((hint, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={hint}
                    onChange={(e) => handleArrayInputChange('hints', index, e.target.value)}
                    className="input-primary flex-1"
                    placeholder={`Hint ${index + 1}`}
                  />
                  {formData.hints.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('hints', index)}
                      className="text-red-400 hover:text-red-300 p-1"
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
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white">
                Suggested Tools
              </label>
              <button
                type="button"
                onClick={() => addArrayItem('suggested_tools')}
                className="btn-sm btn-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Tool
              </button>
            </div>
            
            <div className="space-y-3">
              {formData.suggested_tools.map((tool, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={tool}
                    onChange={(e) => handleArrayInputChange('suggested_tools', index, e.target.value)}
                    className="input-primary flex-1"
                    placeholder={`Tool ${index + 1} (e.g., Wireshark, Grep, Excel)`}
                  />
                  {formData.suggested_tools.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('suggested_tools', index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
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
              className="btn-primary"
            >
              {loading ? 'Updating...' : 'Update Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditChallengeModal
