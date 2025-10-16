import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Shield } from 'lucide-react'
import { passwordResetAPI } from '../utils/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      await passwordResetAPI.forgotPassword(email.trim())
      setEmailSent(true)
      toast.success('Password reset instructions sent to your email')
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to send reset email'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">
              Check Your Email
            </h2>
            <p className="mt-2 text-gray-400">
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center space-y-4">
              <p className="text-gray-300">
                If you don't see the email in your inbox, please check your spam folder.
              </p>
              <p className="text-gray-400 text-sm">
                The reset link will expire in 24 hours.
              </p>
              
              <div className="pt-4 space-y-3">
                <button
                  onClick={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Send Another Email
                </button>
                
                <Link
                  to="/auth"
                  className="block w-full text-center text-primary-400 hover:text-primary-300 font-medium py-2 transition-colors duration-200"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-gray-400">
            No worries! Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-slate-800 border border-slate-700 input-with-icon w-full rounded-lg px-3 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    error ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/auth"
              className="flex items-center justify-center text-primary-400 hover:text-primary-300 font-medium transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
