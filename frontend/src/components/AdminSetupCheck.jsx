import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { adminAPI } from '../utils/api'
import LoadingSpinner from './LoadingSpinner'

const AdminSetupCheck = ({ children }) => {
  const [loading, setLoading] = useState(true)
  const [setupRequired, setSetupRequired] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const checkAdminSetup = async () => {
      try {
        const response = await adminAPI.checkSetup()
        setSetupRequired(response.data.setup_required)
        
        // If setup is required and user is not on setup page, redirect to setup
        if (response.data.setup_required && location.pathname !== '/admin/setup') {
          navigate('/admin/setup')
        }
        // If setup is not required and user is on setup page, redirect to login
        else if (!response.data.setup_required && location.pathname === '/admin/setup') {
          navigate('/login')
        }
      } catch (error) {
        console.error('Error checking admin setup:', error)
        // On error, allow the app to continue (might be network issues)
      } finally {
        setLoading(false)
      }
    }

    checkAdminSetup()
  }, [navigate, location.pathname])

  if (loading) {
    return <LoadingSpinner />
  }

  // If setup is required and user is not on setup page, don't render children
  if (setupRequired && location.pathname !== '/admin/setup') {
    return null
  }

  return children
}

export default AdminSetupCheck
