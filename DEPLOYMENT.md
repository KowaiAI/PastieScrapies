# 🚀 Deployment Guide for Pastie Scrapie

This guide covers various deployment options for Pastie Scrapie, from local development to production deployment.

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Python 3.8+ and pip
- Git
- (Optional) Docker for containerized deployment

## 🏠 Local Development

### Frontend Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Access at http://localhost:5173
```

### Backend Development
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

# Access at http://localhost:5000
```

## 🌐 Production Deployment

### Option 1: Static Frontend + Backend API

#### Frontend (Static Deployment)
Deploy to platforms like Vercel, Netlify, or GitHub Pages:

```bash
# Build for production
pnpm run build

# Deploy the dist/ folder to your static hosting provider
```

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Netlify Deployment:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Backend (API Deployment)
Deploy to platforms like Railway, Render, or Heroku:

**Railway Deployment:**
1. Connect your GitHub repository to Railway
2. Set environment variables:
   ```
   SECRET_KEY=your-secret-key
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```
3. Railway will automatically deploy from the backend directory

**Render Deployment:**
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && pip install -r requirements.txt`
4. Set start command: `cd backend && python src/main.py`
5. Add environment variables

### Option 2: Docker Deployment

#### Create Dockerfile for Backend
```dockerfile
# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "src/main.py"]
```

#### Create Dockerfile for Frontend
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - SECRET_KEY=your-secret-key
      - GITHUB_CLIENT_ID=your-github-client-id
      - GITHUB_CLIENT_SECRET=your-github-client-secret
    volumes:
      - ./backend/src/database:/app/src/database
```

Deploy with:
```bash
docker-compose up -d
```

### Option 3: Full-Stack Platform Deployment

#### Railway (Recommended)
1. Connect your GitHub repository
2. Railway will auto-detect both frontend and backend
3. Set environment variables in Railway dashboard
4. Deploy with automatic CI/CD

#### Render
1. Create separate services for frontend and backend
2. Configure build and start commands
3. Set environment variables
4. Deploy with automatic deployments from GitHub

## 🔧 Environment Configuration

### Frontend Environment Variables
Create `.env` file in root directory:
```env
VITE_API_BASE_URL=https://your-backend-url.com/api
```

### Backend Environment Variables
Create `.env` file in backend directory:
```env
SECRET_KEY=your-secret-key-here
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
DATABASE_URL=sqlite:///app.db  # or PostgreSQL URL for production
CORS_ORIGINS=https://your-frontend-url.com
```

## 🔒 Security Considerations

### Production Security Checklist
- [ ] Use strong SECRET_KEY (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] Set up proper CORS origins
- [ ] Use HTTPS in production
- [ ] Set up proper GitHub OAuth app with correct callback URLs
- [ ] Use environment variables for all secrets
- [ ] Set up database backups
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts

### GitHub OAuth Setup
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL to: `https://your-domain.com/auth/github/callback`
4. Copy Client ID and Client Secret to environment variables

## 📊 Monitoring & Logging

### Application Monitoring
- Set up health check endpoints
- Monitor API response times
- Track error rates
- Monitor database performance

### Logging Configuration
```python
# backend/src/config/logging.py
import logging
import os

logging.basicConfig(
    level=logging.INFO if os.getenv('FLASK_ENV') == 'production' else logging.DEBUG,
    format='%(asctime)s %(levelname)s %(name)s %(message)s'
)
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: pnpm install
      - run: pnpm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
```

## 🆘 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend CORS_ORIGINS includes your frontend URL
- Check that API_BASE_URL in frontend matches backend URL

**Database Issues:**
- Ensure database directory exists and is writable
- For production, consider using PostgreSQL instead of SQLite

**Authentication Issues:**
- Verify GitHub OAuth app settings
- Check that callback URLs match exactly
- Ensure environment variables are set correctly

**Build Failures:**
- Check Node.js and Python versions
- Ensure all dependencies are listed in package.json/requirements.txt
- Verify build commands are correct

### Getting Help
- Check the [Issues](https://github.com/KowaiAI/PastieScrapies/issues) page
- Review application logs
- Test locally first before deploying to production

## 📈 Scaling Considerations

### Database Scaling
- Migrate from SQLite to PostgreSQL for production
- Set up database connection pooling
- Consider read replicas for high traffic

### Application Scaling
- Use load balancers for multiple backend instances
- Implement caching (Redis) for frequently accessed data
- Consider microservices architecture for large scale

### Monitoring & Performance
- Set up APM (Application Performance Monitoring)
- Monitor database query performance
- Track user analytics and usage patterns

