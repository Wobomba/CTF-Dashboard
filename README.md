# RENU-CERT CyberLab 🛡️

A comprehensive cybersecurity training platform by RENU-CERT, inspired by Blue Team Labs Online. Train your defensive security skills through hands-on challenges, investigations, and real-world scenarios.

![Platform Preview](https://via.placeholder.com/800x400/1e293b/3b82f6?text=RENU-CERT+CyberLab)

## ✨ Features

### 🎯 **Interactive Challenges**
- **Investigation Challenges**: Analyze logs, network traffic, and security incidents
- **CTF-Style Challenges**: Capture-the-flag format with various difficulty levels
- **Simulation Environments**: Real-world scenario practice
- **File Analysis**: Malware analysis, forensics, and threat intelligence

### 🏆 **Competitive Learning**
- Global leaderboard system
- User progress tracking and achievements
- Points-based scoring system
- Difficulty-based challenge progression

### 📚 **Comprehensive Domains**
- **Incident Response**: Learn to respond to and investigate security incidents
- **Threat Hunting**: Proactive threat detection and analysis
- **Digital Forensics**: Investigate digital evidence and artifacts
- **Threat Intelligence**: Analyze and understand cyber threats
- **Network Security**: Secure and monitor network infrastructure
- **Malware Analysis**: Reverse engineering and malware investigation
- **OSINT**: Open Source Intelligence gathering
- **CTF Challenges**: Competitive cybersecurity challenges

### 🎨 **Modern Interface**
- Dark theme optimized for security professionals
- Responsive design for all devices
- Real-time progress tracking
- Interactive challenge environments

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn
- SQLite (default) or PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CERT
   ```

2. **Set up the backend**
   ```bash
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp env.example .env
   # Edit .env with your configuration
   
   # Initialize the database with sample data
   cd backend
   python init_database.py
   ```

3. **Set up the frontend**
   ```bash
   # Install Node.js dependencies
   npm install
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Start the backend server
   cd backend
   python app.py
   
   # Terminal 2: Start the frontend development server
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Demo Account
- **Email**: admin@cyberlab.local
- **Password**: admin123

## 🏗️ Architecture

### Backend (Flask)
```
backend/
├── app.py                 # Main Flask application
├── models/                # Database models
│   ├── user.py           # User model and authentication
│   ├── challenge.py      # Challenge and submission models
│   └── progress.py       # Progress tracking and achievements
├── routes/               # API endpoints
│   ├── auth.py          # Authentication routes
│   ├── challenges.py    # Challenge management
│   ├── admin.py         # Admin functionality
│   └── progress.py      # Progress and leaderboard
└── init_database.py     # Database initialization script
```

### Frontend (React + Vite)
```
frontend/src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and API client
└── main.jsx           # Application entry point
```

## 🎮 Challenge Types

### 1. Investigation Challenges
Analyze security incidents using provided logs, network captures, and forensic artifacts.

**Example**: *Suspicious Login Investigation*
- Analyze login logs to determine if activity is legitimate or malicious
- Look for indicators of compromise
- Provide incident response recommendations

### 2. Analysis Challenges
Deep-dive technical analysis of security artifacts.

**Example**: *Network Traffic Analysis*
- Examine packet captures for data exfiltration
- Identify attack techniques and protocols used
- Determine impact and scope of incidents

### 3. CTF Challenges
Competitive format challenges with flags to capture.

**Example**: *YARA Rule Creation*
- Create detection rules for specific malware families
- Test understanding of malware signatures
- Apply threat intelligence concepts

### 4. Simulation Challenges
Interactive environments that simulate real-world scenarios.

**Example**: *Incident Response Simulation*
- Multi-step incident response scenario
- Make decisions that affect the outcome
- Learn proper IR procedures and best practices

## 🏆 Scoring System

### Points Calculation
- **Base Points**: Determined by challenge difficulty
  - Beginner: 100-200 points
  - Intermediate: 200-350 points
  - Advanced: 350-500 points
  - Expert: 500+ points

### Bonus/Penalty System
- **Speed Bonus**: +20% for completing within 50% of time limit
- **First Attempt Bonus**: +10% for correct answer on first try
- **Hint Penalty**: -10 points per hint used (max 30% penalty)

### Achievements
- **Category Master**: Complete all challenges in a category
- **Speed Demon**: Complete 10 challenges within time limit
- **Persistent**: Complete 5 challenges after using hints
- **Rising Star**: Reach top 100 on leaderboard

## 🔧 Configuration

### Environment Variables
```bash
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Database Configuration
DATABASE_URL=sqlite:///cyberlab.db
# For production, use PostgreSQL:
# DATABASE_URL=postgresql://username:password@localhost/cyberlab_academy

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Database Schema
The platform uses SQLAlchemy ORM with the following main models:
- **Users**: Authentication and profile management
- **Challenges**: Challenge content and metadata
- **Categories**: Challenge organization
- **Submissions**: User answers and scoring
- **Progress**: User progress tracking
- **Achievements**: Gamification elements

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Challenges
- `GET /api/challenges` - List challenges (with filtering)
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges/:id/start` - Start a challenge
- `POST /api/challenges/:id/submit` - Submit answer
- `POST /api/challenges/:id/hint` - Get hint

### Progress & Leaderboard
- `GET /api/progress/leaderboard` - Global leaderboard
- `GET /api/progress/user-stats` - User statistics
- `GET /api/challenges/my-progress` - User's challenge progress

### Admin (Admin only)
- `GET /api/admin/dashboard` - Admin dashboard stats
- `POST /api/admin/challenges` - Create challenge
- `PUT /api/admin/challenges/:id` - Update challenge
- `GET /api/admin/users` - List all users

## 🎨 UI Components

### Design System
- **Colors**: Blue primary (#3B82F6), with green success and red danger variants
- **Typography**: Inter font family with Fira Code for code elements
- **Dark Theme**: Optimized for long study sessions
- **Responsive**: Mobile-first design approach

### Key Components
- **Challenge Cards**: Preview challenges with difficulty and stats
- **Progress Indicators**: Visual progress bars and completion status
- **Code Editor**: Monaco editor for code challenges
- **Leaderboard**: Ranking display with user highlighting

## 🔒 Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (User/Admin)
- Session management

### Input Validation
- Server-side validation for all inputs
- SQL injection prevention
- XSS protection
- CSRF protection with Flask-WTF

### Data Protection
- Environment variable configuration
- Secure cookie settings
- HTTPS enforcement (production)
- Rate limiting on API endpoints

## 📊 Analytics & Monitoring

### User Analytics
- Challenge completion rates
- Time-to-completion tracking
- Hint usage statistics
- User engagement metrics

### Platform Health
- API response times
- Error tracking and logging
- Database performance monitoring
- User activity tracking

## 🚀 Deployment

### Production Deployment
1. **Set up environment variables**
2. **Configure PostgreSQL database**
3. **Set up Redis for caching**
4. **Use Gunicorn for Flask app**
5. **Configure Nginx reverse proxy**
6. **Set up SSL certificates**

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Cloud Deployment
The platform can be deployed on:
- **Heroku**: Easy deployment with Postgres addon
- **AWS**: EC2 instances with RDS database
- **DigitalOcean**: Droplets with managed database
- **Google Cloud**: App Engine with Cloud SQL

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ESLint configuration
- **Comments**: Document complex logic
- **Commits**: Use conventional commit messages

### Adding New Challenges
1. Create challenge content in admin panel
2. Test challenge thoroughly
3. Add appropriate hints and validation
4. Set difficulty and point values
5. Review with maintainers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Blue Team Labs Online](https://blueteamlabs.online)
- Built with Flask, React, and modern web technologies
- Icons from Lucide React
- UI components styled with Tailwind CSS

## 📞 Support

For support, questions, or suggestions:
- Create an issue on GitHub
- Join our Discord community
- Email: support@cyberlabacademy.com

---

**Happy Learning! 🛡️🎯**

*Master cybersecurity through hands-on practice and become a skilled cyber defender.*
