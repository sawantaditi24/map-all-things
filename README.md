# LA 2028 Olympics + Business Intelligence Integration

A comprehensive web application that combines Olympic sports venues mapping with business intelligence for Southern California, helping users find optimal business locations near Olympic venues.

## Project Overview

This project integrates two powerful mapping systems:
- **Olympic Venues Map**: Interactive map showing LA 2028 Olympic sports venues
- **Business Intelligence**: AI-powered location analysis for business opportunities

## Features

### Olympic Venues Integration
- Interactive map of LA 2028 Olympic sports venues
- Sport category visualization with color-coded markers
- Detailed venue information and locations

### Business Intelligence
- AI-powered semantic search for business locations
- Advanced filtering by county, population density, business density, and transport scores
- Real-time recommendations with scoring system
- Heat map visualization for business metrics

### Unified Map Experience
- Single map showing both Olympic venues and business intelligence data
- Compact, informative legend
- Interactive popups for both datasets
- Responsive design for all screen sizes

## Tech Stack

### Frontend (Professor's Base + Our Integration)
- **React 19** - Frontend framework
- **Leaflet** - Olympic venues mapping
- **Mapbox GL** - Business intelligence mapping
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend (Your Business Intelligence)
- **FastAPI** - Python web framework
- **SQLAlchemy** - Database ORM
- **PostgreSQL/SQLite** - Database
- **OpenAI API** - AI-powered search
- **Google Places API** - Business data

## Project Structure

```
/Applications/part-time/
├── my-map-app/                    # Professor's React app (enhanced)
│   ├── src/
│   │   ├── bi/                   # Business intelligence components
│   │   │   ├── AdvancedFiltersContent.jsx
│   │   │   ├── EnhancedMapComponent.jsx
│   │   │   └── mapbox.css
│   │   ├── components/
│   │   │   └── SportsVenuesMap.jsx  # Enhanced with business data
│   │   └── pages/
│   │       └── BusinessIntegration.jsx  # Main integration page
│   └── package.json              # Updated with mapbox-gl
└── socal-business-intelligence/   # Your original project
    ├── backend/                  # FastAPI backend
    └── frontend/                 # Original Next.js frontend
```

## Quick Start

### 1. Start the Backend API
```bash
cd /Applications/part-time/my-map-app/socal-business-intelligence/backend
pip install -r requirements.txt
cp env_example.txt .env
# Edit .env with your API keys
python3 main.py
```

### 2. Start the Frontend
```bash
cd /Applications/part-time/my-map-app
npm install
echo "REACT_APP_API_URL=http://localhost:8000" > .env
echo "REACT_APP_MAPBOX_ACCESS_TOKEN=your_token" >> .env
npm start
```

### 3. Access the Application
- **Professor's Website**: http://localhost:3000
- **Backend API**: http://localhost:8000

## User Interface

### Layout Structure
- **Left Panel (25%)**: Search interface and advanced filters
- **Center Panel (50%)**: Unified map with Olympic venues + business data
- **Right Panel (25%)**: Recommendations list

### Available Tabs
1. **🏅 LA 2028 Olympics**: Iframe integration (backup approach)
2. **🏢 Business Intelligence**: Component integration (unified map)

## Configuration

### Required Environment Variables

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

#### Backend (.env)
```
OPENAI_API_KEY=your_openai_key
GOOGLE_PLACES_API_KEY=your_google_key
MAPBOX_ACCESS_TOKEN=your_mapbox_token
DATABASE_URL=sqlite:///./business_intelligence.db
```

## Data Sources

- **Olympic Venues**: LA 2028 Olympic sports venues data
- **Business Intelligence**: 
  - US Census API (population data)
  - Google Places API (business density)
  - LA Metro API (transportation scores)
  - OpenAI API (AI-powered recommendations)

## Integration Approaches

### Approach 1: Iframe Integration
- Embeds your business intelligence website
- Quick implementation
- Maintains separate user experiences

### Approach 2: Component Integration (Recommended)
- Unified map experience
- Single interface for both datasets
- Better user experience and performance

## Contributing

This project combines:
- Professor's Olympic venues mapping system
- Your business intelligence platform
- Integrated user experience

## License

This project integrates multiple components with their respective licenses.

## Support

For issues or questions:
- Check the browser console for errors
- Ensure both backend (port 8000) and frontend (port 3000) are running
- Verify API keys are properly configured

---

**Built with ❤️ for LA 2028 Olympics and Southern California business intelligence**
