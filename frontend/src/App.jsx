import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { useAuth } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Challenges from './pages/Challenges'
import ChallengeDetail from './pages/ChallengeDetail'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import AdminSetup from './pages/AdminSetup'
import AdminSetupCheck from './components/AdminSetupCheck'
import LoadingSpinner from './components/LoadingSpinner'

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  if (adminOnly && !user.is_admin) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  if (user) {
    return <Navigate to="/" replace />
  }
  
  return children
}

const AppContent = () => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  // If user is not authenticated, show auth page or admin setup
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />
        <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
        <Route path="/reset-password" element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        } />
        <Route path="/admin/setup" element={<AdminSetup />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    )
  }
  
  // If user is authenticated, show main app with navbar
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="pb-12">
        <Routes>
          {/* Protected Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/challenge/:slug" element={<ChallengeDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Catch all route */}
          <Route path="*" element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-100 mb-4">404</h1>
                <p className="text-gray-400 mb-8">Page not found</p>
                <a href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </a>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AdminSetupCheck>
        <AppContent />
      </AdminSetupCheck>
    </AuthProvider>
  )
}

export default App
