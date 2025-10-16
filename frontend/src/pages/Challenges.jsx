import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { challengesAPI } from '../utils/api'
import { 
  Search, 
  Filter, 
  Target, 
  Clock, 
  Trophy, 
  Star,
  ChevronDown,
  Grid,
  List
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const Challenges = () => {
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)

  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert']
  const challengeTypes = ['investigation', 'analysis', 'ctf', 'simulation']

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchChallenges()
  }, [searchTerm, selectedCategory, selectedDifficulty, selectedType, featuredOnly])

  const fetchData = async () => {
    try {
      console.log('Fetching challenges and categories...')
      const [challengesResponse, categoriesResponse] = await Promise.all([
        challengesAPI.getChallenges(),
        challengesAPI.getCategories()
      ])
      
      console.log('Challenges response:', challengesResponse.data)
      console.log('Categories response:', categoriesResponse.data)
      
      setChallenges(challengesResponse.data.challenges || [])
      setCategories(categoriesResponse.data.categories || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      console.error('Error details:', error.response?.data)
      // Set empty arrays as fallback
      setChallenges([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const fetchChallenges = async () => {
    try {
      const params = {}
      
      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category_id = selectedCategory
      if (selectedDifficulty) params.difficulty = selectedDifficulty
      if (selectedType) params.type = selectedType
      if (featuredOnly) params.featured = true

      console.log('Fetching challenges with params:', params)
      const response = await challengesAPI.getChallenges(params)
      console.log('Challenges response:', response.data)
      setChallenges(response.data.challenges || [])
    } catch (error) {
      console.error('Failed to fetch challenges:', error)
      console.error('Error details:', error.response?.data)
      setChallenges([])
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


  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedDifficulty('')
    setSelectedType('')
    setFeaturedOnly(false)
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Cybersecurity Challenges
          </h1>
          <p className="text-gray-400">
            Test your skills with hands-on cybersecurity challenges across multiple domains
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-with-icon w-full"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center lg:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${showFilters || window.innerWidth >= 1024 ? '' : 'hidden lg:grid'}`}>
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-primary"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-primary"
            >
              <option value="">All Difficulties</option>
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-primary"
            >
              <option value="">All Types</option>
              {challengeTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>

            {/* Featured Toggle */}
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${featuredOnly ? 'bg-primary-600' : 'bg-gray-600'}`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${featuredOnly ? 'translate-x-5' : ''}`} />
              </div>
              <span className="ml-3 text-sm text-gray-300">Featured Only</span>
            </label>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="btn-secondary text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {challenges.length} challenge{challenges.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Challenges Grid/List */}
        {challenges.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {challenges.map(challenge => (
              <Link
                key={challenge.id}
                to={`/challenge/${challenge.slug}`}
                className={`card-hover p-6 block ${viewMode === 'list' ? 'flex items-center space-x-6' : ''}`}
              >
                {viewMode === 'grid' ? (
                  // Grid View
                  <>
                    {challenge.is_featured && (
                      <div className="flex justify-end mb-2">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white leading-tight">
                        {challenge.title}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)} flex-shrink-0`}>
                        {challenge.difficulty}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                      {challenge.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1" />
                          {challenge.points} pts
                        </div>
                        {challenge.time_limit && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {challenge.time_limit}m
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {challenge.success_rate}% success
                      </span>
                    </div>
                  </>
                ) : (
                  // List View
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-white truncate leading-tight">
                          {challenge.title}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDifficultyColor(challenge.difficulty)} flex-shrink-0`}>
                          {challenge.difficulty}
                        </span>
                        {challenge.is_featured && (
                          <Star className="h-4 w-4 text-yellow-400 fill-current flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-1" />
                          {challenge.points} pts
                        </div>
                        {challenge.time_limit && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {challenge.time_limit}m
                          </div>
                        )}
                        <span className="text-xs">
                          {challenge.success_rate}% success
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No challenges found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search criteria or filters
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Challenges
