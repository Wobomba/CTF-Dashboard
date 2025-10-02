import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Shield, 
  Target, 
  Users, 
  Trophy, 
  Clock, 
  BookOpen,
  Search,
  Code,
  Brain,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'

const Home = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Target,
      title: 'Interactive Challenges',
      description: 'Hands-on cybersecurity challenges across multiple domains including incident response, forensics, and threat hunting.',
      color: 'text-blue-400'
    },
    {
      icon: Brain,
      title: 'Real-World Scenarios',
      description: 'Practice with realistic attack scenarios and learn to defend against actual threats used by cybercriminals.',
      color: 'text-green-400'
    },
    {
      icon: Trophy,
      title: 'Competitive Learning',
      description: 'Compete with other cybersecurity enthusiasts on the global leaderboard and track your progress.',
      color: 'text-yellow-400'
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Learning',
      description: 'Learn defensive security across incident response, threat intelligence, digital forensics, and more.',
      color: 'text-purple-400'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Join a community of cybersecurity professionals and enthusiasts sharing knowledge and experiences.',
      color: 'text-pink-400'
    },
    {
      icon: Zap,
      title: 'Progressive Difficulty',
      description: 'Start with beginner-friendly challenges and advance to expert-level scenarios at your own pace.',
      color: 'text-orange-400'
    }
  ]

  const categories = [
    {
      icon: Search,
      name: 'Threat Hunting',
      description: 'Learn to proactively search for threats in your environment',
      color: 'bg-blue-500/20 border-blue-500/30'
    },
    {
      icon: Shield,
      name: 'Incident Response',
      description: 'Master the art of responding to security incidents',
      color: 'bg-green-500/20 border-green-500/30'
    },
    {
      icon: Code,
      name: 'Digital Forensics',
      description: 'Investigate digital artifacts and uncover evidence',
      color: 'bg-purple-500/20 border-purple-500/30'
    },
    {
      icon: Brain,
      name: 'Threat Intelligence',
      description: 'Analyze and understand cyber threats and actors',
      color: 'bg-orange-500/20 border-orange-500/30'
    }
  ]


  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-green-400 bg-clip-text text-transparent mb-6">
              Master Cybersecurity
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Train like a cyber defender with hands-on challenges, real-world scenarios, and competitive learning in a gamified environment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-3 inline-flex items-center">
                  Continue Learning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3 inline-flex items-center">
                    Start Training
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/challenges" className="btn-secondary text-lg px-8 py-3">
                    Explore Challenges
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform provides comprehensive cybersecurity training through practical, hands-on learning experiences.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card p-6 hover:border-primary-500/50 transition-all duration-300"
                >
                  <Icon className={`h-12 w-12 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Training Categories
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive cybersecurity training across all defensive security domains.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon
              return (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`p-6 rounded-lg border ${category.color} hover:scale-105 transition-all duration-300 cursor-pointer`}
                >
                  <Icon className="h-10 w-10 text-white mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {category.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="card p-12 bg-gradient-to-r from-primary-900/50 to-purple-900/50 border-primary-500/30"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Begin Your Cybersecurity Journey?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of cybersecurity professionals who are advancing their skills through practical, hands-on training.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary text-lg px-8 py-3 inline-flex items-center">
                  Get Started Free
                  <CheckCircle className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/challenges" className="btn-secondary text-lg px-8 py-3">
                  View Challenges
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Home
