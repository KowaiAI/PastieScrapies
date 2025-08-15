# 🔍 Pastie Scrapie

**A modern multi-pastebin crawler and scraper at scale**

Monitor pastebins for security threats, leaked credentials, and sensitive data with our powerful, ethical scraping platform designed for security professionals.

![Pastie Scrapie Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/Frontend-React-61dafb)
![Flask](https://img.shields.io/badge/Backend-Flask-000000)

## ✨ Features

### 🚀 **Multi-Service Search**
- Search across **50+ pastebin services** simultaneously
- Intelligent rate limiting and ethical scraping practices
- Support for major platforms: Pastebin.com, GitHub Gist, paste.ee, dpaste.org, and more

### 📊 **Real-time Analytics**
- Monitor search progress with live dashboards
- Comprehensive analytics and visualizations
- Track performance metrics and success rates

### 🔒 **Secure & Ethical**
- Respects robots.txt and service terms
- Adaptive rate limiting to protect services
- Secure authentication with JWT tokens

### 💻 **Live Terminal Interface**
- Real-time scraping session logs
- Terminal-style interface for monitoring
- Detailed progress tracking and error reporting

### 🔍 **Advanced Filtering**
- Filter by file types, search terms, and regex patterns
- Custom criteria and advanced search options
- Export results in multiple formats

### 📈 **Search History & Analytics**
- Complete search history tracking
- Advanced filtering and data analysis
- Export capabilities for further analysis

## 🏗️ Architecture

### Frontend (React + Vite)
- **Modern Dark UI/UX** - Professional interface optimized for security professionals
- **Responsive Design** - Works perfectly on desktop and mobile
- **Real-time Updates** - Live terminal logs and progress monitoring
- **Authentication** - Email/password and GitHub OAuth integration

### Backend (Flask + SQLAlchemy)
- **Modular Scraper Architecture** - Easily extensible for new pastebin services
- **Rate Limiting** - Intelligent throttling to respect service limits
- **Database Management** - SQLite with comprehensive schema
- **API-First Design** - RESTful API for all operations

### Supported Pastebin Services (50+)
- Pastebin.com (API + Web scraping)
- GitHub Gist (API)
- paste.ee, dpaste.org, nekobin.com
- rentry.co, hastebin.com, GitLab Snippets
- paste.ubuntu.com, justpaste.it, controlc.com
- ideone.com, and 38+ more services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.8+ and pip
- Git

### Frontend Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
python src/main.py
```

### Environment Configuration
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

## 📱 User Interface

### 🏠 **Landing Page**
- Modern dark theme with feature showcase
- Call-to-action buttons for registration
- Live terminal demo showing scraping in action

### 🔐 **Authentication**
- Email/password registration and login
- GitHub OAuth integration
- Secure JWT token management

### 📊 **Dashboard**
- Analytics overview with charts and metrics
- Active search monitoring
- Quick access to recent searches and results

### 🔍 **Scraper Interface**
- Create new search sessions
- Select target pastebin services
- Configure search terms and file type filters
- Real-time terminal logs with color-coded output

### 📚 **History & Results**
- Complete search history with filtering
- Detailed result analysis
- Export functionality for data analysis

## 🛡️ Security & Ethics

### Ethical Scraping Practices
- **Respects robots.txt** - Automatically checks and follows robots.txt rules
- **Rate Limiting** - Intelligent throttling to prevent service overload
- **User-Agent Identification** - Proper identification in requests
- **Terms of Service Compliance** - Designed to respect service terms

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Input Validation** - Comprehensive input sanitization
- **CORS Protection** - Proper cross-origin request handling
- **SQL Injection Prevention** - Parameterized queries and ORM usage

## 🔧 API Documentation

### Authentication Endpoints
```
POST /api/register     - User registration
POST /api/login        - User login
POST /api/auth/github  - GitHub OAuth
GET  /api/me          - Get current user
```

### Scraper Endpoints
```
GET    /api/services        - List available pastebin services
POST   /api/sessions        - Create new search session
GET    /api/sessions        - List user's search sessions
GET    /api/sessions/:id    - Get session details
POST   /api/sessions/:id/start - Start scraping session
POST   /api/sessions/:id/stop  - Stop scraping session
```

### Health & Status
```
GET /api/health - API health check
```

## 🚀 Deployment

### Production Deployment
The application is designed for easy deployment on modern platforms:

1. **Frontend**: Static site deployment (Vercel, Netlify, etc.)
2. **Backend**: Container deployment (Docker, Railway, etc.)
3. **Database**: SQLite for development, PostgreSQL for production

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies (React, Flask, SQLAlchemy)
- UI components powered by shadcn/ui and Tailwind CSS
- Icons by Lucide React
- Charts by Recharts

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/KowaiAI/PastieScrapies/issues)
- **Documentation**: [Wiki](https://github.com/KowaiAI/PastieScrapies/wiki)
- **Security**: Report security issues privately to security@kowaiai.com

---

**⚠️ Disclaimer**: This tool is designed for legitimate security research and monitoring purposes. Users are responsible for ensuring compliance with applicable laws and service terms of use.
