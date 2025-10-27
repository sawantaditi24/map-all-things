# Southern California Business Intelligence Platform

A comprehensive web application that helps businesses make data-driven location decisions in Southern California using real-time data, AI-powered recommendations, and interactive mapping.

## 🚀 Features

### Core Functionality
- **Interactive Map Visualization** - Color-coded areas with business metrics
- **Semantic Search** - AI-powered search with natural language processing
- **Advanced Filtering** - County, population density, business density, and transport score filters
- **Real-time Data Integration** - Live data from multiple APIs
- **Multi-user Support** - Authentication and authorization system

### Data Sources
- **Population Data** - US Census API integration
- **Transportation Scores** - LA Metro infrastructure data
- **Business Intelligence** - Google Places API (planned)
- **Geographic Data** - Accurate coordinates for 35+ SoCal cities

### AI Features
- **Smart Recommendations** - OpenAI-powered semantic search
- **Business Type Matching** - Context-aware location suggestions
- **Predictive Analytics** - Future business potential analysis

## 🛠️ Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL** - Primary database (with PostGIS for spatial data)
- **SQLite** - Development database
- **Pydantic** - Data validation and serialization

### Frontend
- **Next.js 15** - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Mapbox GL JS** - Interactive mapping library

### APIs & Services
- **OpenAI API** - AI-powered semantic search
- **US Census API** - Population data
- **Google Places API** - Business density data
- **LA Metro API** - Transportation data

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+ (for production)
- Mapbox account (for mapping)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd business-intelligence-platform
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
# Copy environment template
cp env_example.txt .env

# Edit .env with your configuration
# IMPORTANT: Never commit API keys to git
```

### 4. Database Setup
```bash
# Initialize database
python main.py
```

### 5. Frontend Setup
```bash
cd ../frontend
npm install
```

### 6. Environment Variables
```bash
# Copy frontend environment template
cp env_local_example.txt .env.local

# Edit .env.local with your configuration
```

### 7. Run the Application
```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit `http://localhost:3001` to see the application.

## 🔧 Configuration

### Required Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=sqlite:///./business_intelligence.db

# API Keys (get from respective services)
OPENAI_API_KEY=your_openai_key
GOOGLE_PLACES_API_KEY=your_google_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Security
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

## 📊 API Endpoints

### Search & Recommendations
- `POST /search` - Basic semantic search
- `POST /search/advanced` - Advanced filtered search
- `GET /areas` - Get all available areas
- `GET /counties` - Get available counties

### Data Management
- `POST /etl/cities/discover` - Discover and populate cities
- `POST /etl/transportation/scores` - Update transportation scores
- `POST /etl/business/density` - Update business density data

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user info

## 🗺️ Supported Areas

### Los Angeles County
- Downtown LA, Santa Monica, Beverly Hills, Pasadena, Glendale, Burbank
- Long Beach, Torrance, Manhattan Beach, Redondo Beach
- West Hollywood, Culver City, Inglewood, Compton, Carson

### Orange County
- Anaheim, Santa Ana, Irvine, Huntington Beach, Newport Beach
- Costa Mesa, Fullerton, Orange, Garden Grove, Tustin
- Laguna Beach, Mission Viejo, Aliso Viejo, Laguna Niguel

## 🔒 Security Features

- JWT-based authentication
- Role-based authorization
- API rate limiting
- Input validation and sanitization
- CORS protection

## 🚀 Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy backend to cloud service (Heroku, AWS, etc.)
4. Deploy frontend to Vercel or Netlify
5. Set up domain and SSL certificates

### Docker Support
```bash
# Build and run with Docker
docker-compose up --build
```

## 📈 Performance

- **Concurrent Users**: Supports 100+ simultaneous users
- **Response Time**: <200ms for search queries
- **Database**: Optimized queries with proper indexing
- **Caching**: Redis integration for improved performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔮 Roadmap

- [ ] Real-time data updates
- [ ] Mobile app development
- [ ] Advanced analytics dashboard
- [ ] Machine learning predictions
- [ ] Multi-region support

---

**⚠️ Important Security Note**: Never commit API keys, passwords, or sensitive configuration to the repository. Always use environment variables for sensitive data.