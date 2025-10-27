# GitHub Repository Setup Guide

## 🚀 Creating Your GitHub Repository

### Step 1: Create Repository on GitHub
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `socal-business-intelligence`
   - **Description**: `Southern California Business Intelligence Platform - AI-powered location recommendations for businesses`
   - **Visibility**: Private (recommended for business projects)
   - **Initialize**: Don't initialize with README (we already have one)

### Step 2: Connect Local Repository to GitHub
```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/socal-business-intelligence.git

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload
- Go to your GitHub repository
- Verify all files are uploaded correctly
- Check that no API keys are visible in the code

## 🔒 Security Checklist

### ✅ Before Pushing to GitHub:
- [ ] No `.env` files in the repository
- [ ] No API keys in code files
- [ ] All sensitive data in environment variables
- [ ] `.gitignore` properly configured
- [ ] Environment example files created

### ✅ Files to NEVER commit:
- `.env`
- `.env.local`
- `*.db` (database files)
- `venv/` (Python virtual environment)
- `node_modules/` (Node.js dependencies)
- Any file containing API keys

## 📁 Repository Structure
```
socal-business-intelligence/
├── .gitignore                 # Git ignore rules
├── README.md                  # Project documentation
├── GITHUB_SETUP.md           # This file
├── backend/                   # FastAPI backend
│   ├── main.py               # Main application
│   ├── models.py             # Database models
│   ├── db.py                 # Database configuration
│   ├── transportation.py     # Transportation data
│   ├── requirements.txt      # Python dependencies
│   └── env_example.txt       # Environment variables template
└── frontend/                  # Next.js frontend
    ├── src/                  # Source code
    ├── package.json          # Node.js dependencies
    └── env_example.txt       # Environment variables template
```

## 🚀 Next Steps After GitHub Setup

1. **Clone on other machines**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/socal-business-intelligence.git
   cd socal-business-intelligence
   ```

2. **Set up environment**:
   ```bash
   # Backend
   cd backend
   cp env_example.txt .env
   # Edit .env with your API keys
   
   # Frontend
   cd ../frontend
   cp env_example.txt .env.local
   # Edit .env.local with your configuration
   ```

3. **Install dependencies**:
   ```bash
   # Backend
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

## 🔄 Development Workflow

### Making Changes
```bash
# 1. Create a new branch
git checkout -b feature/new-feature

# 2. Make your changes
# ... edit files ...

# 3. Add changes
git add .

# 4. Commit changes
git commit -m "Add new feature: description"

# 5. Push to GitHub
git push origin feature/new-feature

# 6. Create Pull Request on GitHub
```

### Updating from GitHub
```bash
# Pull latest changes
git pull origin main
```

## 🛡️ Security Best Practices

1. **Never commit API keys** - Always use environment variables
2. **Use private repositories** - For business projects
3. **Regular security updates** - Keep dependencies updated
4. **Access control** - Limit who can access the repository
5. **Branch protection** - Use main branch protection rules

## 📝 Commit Message Guidelines

Use clear, descriptive commit messages:
- `feat: add OpenAI semantic search integration`
- `fix: resolve transportation score calculation bug`
- `docs: update README with new API endpoints`
- `refactor: improve search algorithm performance`
- `test: add unit tests for authentication`

## 🎯 Repository Settings

### Recommended Settings:
1. **Branch Protection**: Enable for main branch
2. **Issues**: Enable for bug tracking
3. **Projects**: Enable for project management
4. **Wiki**: Enable for documentation
5. **Discussions**: Enable for community

---

**🎉 Your repository is now ready for collaborative development!**
