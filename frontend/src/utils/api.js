import axios from 'axios'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Utility functions (defined early so they can be used in interceptors)
export const getAuthToken = () => {
  // Try localStorage first, then cookies as fallback
  return localStorage.getItem('auth_token') || Cookies.get('auth_token')
}

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token)
    Cookies.set('auth_token', token, { expires: 1 }) // 1 day
    api.defaults.headers.Authorization = `Bearer ${token}`
  } else {
    localStorage.removeItem('auth_token')
    Cookies.remove('auth_token')
    delete api.defaults.headers.Authorization
  }
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token')
      Cookies.remove('auth_token')
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
  validateToken: () => api.get('/auth/validate-token'),
}

// Challenges API
export const challengesAPI = {
  getCategories: () => api.get('/challenges/categories'),
  getChallenges: (params = {}) => api.get('/challenges', { params }),
  getChallenge: (id) => api.get(`/challenges/${id}`),
  startChallenge: (id) => api.post(`/challenges/${id}/start`),
  submitAnswer: (id, answerData) => api.post(`/challenges/${id}/submit`, answerData),
  getHint: (id) => api.post(`/challenges/${id}/hint`),
  getRecentSolves: (id) => api.get(`/challenges/${id}/recent-solves`),
  getChallengeLeaderboard: (id) => api.get(`/challenges/${id}/leaderboard`),
}

// Progress API
export const progressAPI = {
  getLeaderboard: (params = {}) => api.get('/progress/leaderboard', { params }),
  getUserStats: () => api.get('/progress/user-stats'),
  getBookmarks: () => api.get('/progress/bookmarks'),
  toggleBookmark: (challengeId) => api.post(`/progress/bookmarks/${challengeId}`),
  updateNotes: (challengeId, notes) => api.put(`/progress/notes/${challengeId}`, { notes }),
  getMyProgress: () => api.get('/challenges/my-progress'),
  getRecentSolves: (challengeId) => api.get(`/challenges/${challengeId}/recent-solves`),
}

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  createCategory: (categoryData) => api.post('/admin/categories', categoryData),
  createChallenge: (challengeData) => api.post('/admin/challenges', challengeData),
  updateChallenge: (id, challengeData) => api.put(`/admin/challenges/${id}`, challengeData),
  deleteChallenge: (id) => api.delete(`/admin/challenges/${id}`),
  getAllChallenges: (params = {}) => api.get('/admin/challenges', { params }),
  getAllUsers: (params = {}) => api.get('/admin/users', { params }),
  toggleUserActive: (userId) => api.post(`/admin/users/${userId}/toggle-active`),
  toggleUserAdmin: (userId) => api.post(`/admin/users/${userId}/toggle-admin`),
  createUser: (userData) => api.post('/admin/users', userData),
}


export const isAuthenticated = () => {
  return !!getAuthToken()
}

// Error handling utility
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.error) {
    return error.response.data.error
  } else if (error.message) {
    return error.message
  }
  return defaultMessage
}

export default api
