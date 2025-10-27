from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import logging
from dotenv import load_dotenv
# import redis
import json

from sqlalchemy.orm import Session
from database import get_db, Base, engine, create_tables
from models import Area, AreaMetric, User, SearchHistory
from seed import seed
from sqlalchemy import func
from transportation import TransportationCalculator
from openai_service import openai_service, SearchContext, AIRecommendation

# Import authentication modules
from auth_service import auth_service
from oauth_service import google_oauth_service
from auth_middleware import get_current_user, get_current_active_user, get_current_user_optional
from schemas import (
    UserCreate, UserLogin, UserResponse, LoginResponse, 
    PasswordResetRequest, PasswordReset, TokenRefresh,
    GoogleAuthResponse, GoogleCallbackResponse,
    SearchHistoryCreate, SearchHistoryResponse
)

# Load environment variables
load_dotenv()

# Set up logging
logger = logging.getLogger(__name__)

# Initialize database tables first
create_tables()

# Initialize FastAPI app
app = FastAPI(
    title="Southern California Business Intelligence API",
    description="API for business location intelligence and recommendations",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3002",
        "https://*.netlify.app",  # Allow all Netlify domains
        "https://socal-business-intelligence.netlify.app",  # Your specific Netlify domain
        "https://*.vercel.app",  # Allow all Vercel domains (for future use)
        "https://*.railway.app",  # Allow all Railway domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# County mapping for SoCal cities
COUNTY_MAPPING = {
    # Los Angeles County
    "Downtown LA": "Los Angeles County",
    "Santa Monica": "Los Angeles County", 
    "Beverly Hills": "Los Angeles County",
    "Pasadena": "Los Angeles County",
    "Glendale": "Los Angeles County",
    "Burbank": "Los Angeles County",
    "Long Beach": "Los Angeles County",
    "Torrance": "Los Angeles County",
    "Manhattan Beach": "Los Angeles County",
    "Redondo Beach": "Los Angeles County",
    "West Hollywood": "Los Angeles County",
    "Culver City": "Los Angeles County",
    "Inglewood": "Los Angeles County",
    "Compton": "Los Angeles County",
    "Carson": "Los Angeles County",
    
    # Orange County
    "Anaheim": "Orange County",
    "Santa Ana": "Orange County",
    "Irvine": "Orange County",
    "Huntington Beach": "Orange County",
    "Newport Beach": "Orange County",
    "Costa Mesa": "Orange County",
    "Fullerton": "Orange County",
    "Orange": "Orange County",
    "Garden Grove": "Orange County",
    "Tustin": "Orange County",
    "Laguna Beach": "Orange County",
    "Mission Viejo": "Orange County",
    "Aliso Viejo": "Orange County",
    "Laguna Niguel": "Orange County",
    "Lake Forest": "Orange County",
    "Yorba Linda": "Orange County",
    "Brea": "Orange County",
    "Placentia": "Orange County",
    "La Habra": "Orange County",
    "Buena Park": "Orange County"
}

# Create tables and seed data
Base.metadata.create_all(bind=engine)
seed()

# Pydantic models
class SearchQuery(BaseModel):
    query: str
    business_type: Optional[str] = "restaurant"
    filters: Optional[dict] = {}

class AdvancedFilters(BaseModel):
    counties: Optional[List[str]] = None
    population_density_min: Optional[int] = None
    population_density_max: Optional[int] = None
    business_density_min: Optional[int] = None
    business_density_max: Optional[int] = None
    transport_score_min: Optional[float] = None
    transport_score_max: Optional[float] = None
    map_bounds: Optional[dict] = None  # {north, south, east, west}

class LocationRecommendation(BaseModel):
    area: str
    score: float
    reasons: List[str]
    coordinates: List[float]
    business_density: int
    population_density: int
    transport_score: float

class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None

# Remove the old get_current_user function - using the one from auth_middleware

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Southern California Business Intelligence API", "status": "running"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "business-intelligence-api"}

# Quick seed endpoint for debugging
@app.post("/seed-db")
async def seed_database(db: Session = Depends(get_db)):
    """Quick endpoint to seed the database for testing."""
    try:
        # Call the existing seed function
        seed()
        return {"message": "Database seeded successfully", "status": "success"}
    except Exception as e:
        return {"message": f"Failed to seed database: {str(e)}", "status": "error"}

# Areas list
@app.get("/areas", response_model=APIResponse)
async def list_areas(db: Session = Depends(get_db)):
    areas = db.query(Area).all()
    payload = [
        {
            "id": a.id,
            "name": a.name,
            "city": a.city,
            "county": a.county,
            "latitude": a.latitude,
            "longitude": a.longitude,
        }
        for a in areas
    ]
    return APIResponse(success=True, data={"areas": payload}, message="Areas retrieved")

# --- ETL: Major SoCal Cities Discovery ---
@app.post("/etl/cities/discover", response_model=APIResponse)
async def discover_major_socal_cities(db: Session = Depends(get_db)):
    """
    Discover and populate major SoCal cities for business intelligence.
    Phase 1: 20-30 most important business hubs.
    """
    # Major SoCal cities with coordinates and basic data
    major_cities = [
        # Los Angeles County
        {"name": "Downtown LA", "city": "Los Angeles", "state": "CA", "county": "Los Angeles", 
         "latitude": 34.0522, "longitude": -118.2437, "population": 3898747, "area_sq_mi": 502.7},
        {"name": "Santa Monica", "city": "Santa Monica", "state": "CA", "county": "Los Angeles",
         "latitude": 34.0195, "longitude": -118.4912, "population": 93076, "area_sq_mi": 8.4},
        {"name": "Beverly Hills", "city": "Beverly Hills", "state": "CA", "county": "Los Angeles",
         "latitude": 34.0736, "longitude": -118.4004, "population": 33792, "area_sq_mi": 5.7},
        {"name": "Pasadena", "city": "Pasadena", "state": "CA", "county": "Los Angeles",
         "latitude": 34.1478, "longitude": -118.1445, "population": 138699, "area_sq_mi": 22.9},
        {"name": "Glendale", "city": "Glendale", "state": "CA", "county": "Los Angeles",
         "latitude": 34.1425, "longitude": -118.2551, "population": 196543, "area_sq_mi": 30.4},
        {"name": "Burbank", "city": "Burbank", "state": "CA", "county": "Los Angeles",
         "latitude": 34.1808, "longitude": -118.3090, "population": 107337, "area_sq_mi": 17.3},
        {"name": "Long Beach", "city": "Long Beach", "state": "CA", "county": "Los Angeles",
         "latitude": 33.7701, "longitude": -118.1937, "population": 466742, "area_sq_mi": 50.3},
        {"name": "Torrance", "city": "Torrance", "state": "CA", "county": "Los Angeles",
         "latitude": 33.8358, "longitude": -118.3406, "population": 141181, "area_sq_mi": 20.5},
        {"name": "Manhattan Beach", "city": "Manhattan Beach", "state": "CA", "county": "Los Angeles",
         "latitude": 33.8847, "longitude": -118.4109, "population": 35006, "area_sq_mi": 3.9},
        {"name": "Redondo Beach", "city": "Redondo Beach", "state": "CA", "county": "Los Angeles",
         "latitude": 33.8492, "longitude": -118.3884, "population": 71417, "area_sq_mi": 6.2},
        {"name": "West Hollywood", "city": "West Hollywood", "state": "CA", "county": "Los Angeles",
         "latitude": 34.0900, "longitude": -118.3617, "population": 35098, "area_sq_mi": 1.9},
        {"name": "Culver City", "city": "Culver City", "state": "CA", "county": "Los Angeles",
         "latitude": 34.0211, "longitude": -118.3965, "population": 40190, "area_sq_mi": 5.1},
        {"name": "Inglewood", "city": "Inglewood", "state": "CA", "county": "Los Angeles",
         "latitude": 33.9617, "longitude": -118.3531, "population": 107762, "area_sq_mi": 9.1},
        {"name": "Compton", "city": "Compton", "state": "CA", "county": "Los Angeles",
         "latitude": 33.8958, "longitude": -118.2201, "population": 95897, "area_sq_mi": 10.0},
        {"name": "Carson", "city": "Carson", "state": "CA", "county": "Los Angeles",
         "latitude": 33.8314, "longitude": -118.2822, "population": 95174, "area_sq_mi": 19.0},
        
        # Orange County
        {"name": "Anaheim", "city": "Anaheim", "state": "CA", "county": "Orange",
         "latitude": 33.8366, "longitude": -117.9143, "population": 346824, "area_sq_mi": 50.8},
        {"name": "Santa Ana", "city": "Santa Ana", "state": "CA", "county": "Orange",
         "latitude": 33.7455, "longitude": -117.8677, "population": 334217, "area_sq_mi": 27.3},
        {"name": "Irvine", "city": "Irvine", "state": "CA", "county": "Orange",
         "latitude": 33.6846, "longitude": -117.8265, "population": 307670, "area_sq_mi": 66.1},
        {"name": "Huntington Beach", "city": "Huntington Beach", "state": "CA", "county": "Orange",
         "latitude": 33.6595, "longitude": -117.9988, "population": 198711, "area_sq_mi": 26.7},
        {"name": "Newport Beach", "city": "Newport Beach", "state": "CA", "county": "Orange",
         "latitude": 33.6189, "longitude": -117.9298, "population": 85887, "area_sq_mi": 23.1},
        {"name": "Costa Mesa", "city": "Costa Mesa", "state": "CA", "county": "Orange",
         "latitude": 33.6411, "longitude": -117.9187, "population": 111918, "area_sq_mi": 15.7},
        {"name": "Fullerton", "city": "Fullerton", "state": "CA", "county": "Orange",
         "latitude": 33.8703, "longitude": -117.9253, "population": 135161, "area_sq_mi": 22.4},
        {"name": "Orange", "city": "Orange", "state": "CA", "county": "Orange",
         "latitude": 33.7879, "longitude": -117.8531, "population": 139911, "area_sq_mi": 25.7},
        {"name": "Garden Grove", "city": "Garden Grove", "state": "CA", "county": "Orange",
         "latitude": 33.7739, "longitude": -117.9414, "population": 172800, "area_sq_mi": 17.9},
        {"name": "Tustin", "city": "Tustin", "state": "CA", "county": "Orange",
         "latitude": 33.7459, "longitude": -117.8266, "population": 79926, "area_sq_mi": 11.1},
        {"name": "Laguna Beach", "city": "Laguna Beach", "state": "CA", "county": "Orange",
         "latitude": 33.5427, "longitude": -117.7854, "population": 23032, "area_sq_mi": 8.9},
        {"name": "Mission Viejo", "city": "Mission Viejo", "state": "CA", "county": "Orange",
         "latitude": 33.6000, "longitude": -117.6720, "population": 93805, "area_sq_mi": 17.6},
        {"name": "Aliso Viejo", "city": "Aliso Viejo", "state": "CA", "county": "Orange",
         "latitude": 33.5750, "longitude": -117.7256, "population": 52076, "area_sq_mi": 7.5},
        {"name": "Laguna Niguel", "city": "Laguna Niguel", "state": "CA", "county": "Orange",
         "latitude": 33.5225, "longitude": -117.7076, "population": 66019, "area_sq_mi": 14.8},
        {"name": "Lake Forest", "city": "Lake Forest", "state": "CA", "county": "Orange",
         "latitude": 33.6469, "longitude": -117.6892, "population": 85058, "area_sq_mi": 16.0},
        {"name": "Yorba Linda", "city": "Yorba Linda", "state": "CA", "county": "Orange",
         "latitude": 33.8886, "longitude": -117.8131, "population": 68469, "area_sq_mi": 20.0},
        {"name": "Brea", "city": "Brea", "state": "CA", "county": "Orange",
         "latitude": 33.9167, "longitude": -117.9001, "population": 47425, "area_sq_mi": 12.1},
        {"name": "Placentia", "city": "Placentia", "state": "CA", "county": "Orange",
         "latitude": 33.8722, "longitude": -117.8703, "population": 51824, "area_sq_mi": 6.6},
        {"name": "La Habra", "city": "La Habra", "state": "CA", "county": "Orange",
         "latitude": 33.9319, "longitude": -117.9461, "population": 63197, "area_sq_mi": 7.4},
        {"name": "Buena Park", "city": "Buena Park", "state": "CA", "county": "Orange",
         "latitude": 33.8706, "longitude": -117.9981, "population": 84034, "area_sq_mi": 10.5},
    ]
    
    created = 0
    updated = 0
    
    for city_data in major_cities:
        try:
            # Check if area already exists
            existing_area = db.query(Area).filter(Area.name == city_data["name"]).first()
            
            if existing_area:
                # Update existing area
                existing_area.city = city_data["city"]
                existing_area.state = city_data["state"]
                existing_area.latitude = city_data["latitude"]
                existing_area.longitude = city_data["longitude"]
                updated += 1
            else:
                # Create new area
                new_area = Area(
                    name=city_data["name"],
                    city=city_data["city"],
                    state=city_data["state"],
                    latitude=city_data["latitude"],
                    longitude=city_data["longitude"]
                )
                db.add(new_area)
                created += 1
            
            # Calculate population density and create/update metrics
            population_density = int(city_data["population"] / city_data["area_sq_mi"])
            
            # Get or create area metric
            area = db.query(Area).filter(Area.name == city_data["name"]).first()
            metric = (
                db.query(AreaMetric)
                .filter(AreaMetric.area_id == area.id)
                .order_by(AreaMetric.id.desc())
                .first()
            )
            if not metric:
                metric = AreaMetric(area_id=area.id)
                db.add(metric)
            
            # Set realistic metrics
            metric.population_density = population_density
            metric.business_density = max(20, min(100, int(population_density / 100)))  # Scale with population
            metric.transport_score = 7.5  # Default transport score (will be updated later)
            
            print(f"Processed {city_data['name']}: {city_data['population']:,} people, {population_density:,} per sq mi")
            
        except Exception as e:
            print(f"Error processing {city_data['name']}: {str(e)}")
            continue
    
    db.commit()
    return APIResponse(
        success=True,
        data={"created": created, "updated": updated, "total": len(major_cities)},
        message=f"Discovered {created} new cities, updated {updated} existing cities. Total: {len(major_cities)} major SoCal cities."
    )

# --- ETL: Census population density (legacy - now handled by discover) ---
@app.post("/etl/census/population", response_model=APIResponse)
async def etl_census_population(db: Session = Depends(get_db)):
    """
    Legacy endpoint - population data now handled by /etl/cities/discover
    """
    return APIResponse(
        success=True, 
        data={"message": "Use /etl/cities/discover instead"}, 
        message="Population data is now handled by the city discovery endpoint"
    )

# --- ETL: Transportation scores ---
@app.post("/etl/transportation/scores", response_model=APIResponse)
async def etl_transportation_scores(db: Session = Depends(get_db)):
    """
    Update transportation scores for all areas using realistic transit data.
    """
    try:
        calculator = TransportationCalculator()
        updated_count = 0
        
        # Get all areas
        areas = db.query(Area).all()
        
        for area in areas:
            # Calculate transportation score
            transport_score = await calculator.get_transportation_score(
                area.name, 
                float(area.latitude), 
                float(area.longitude)
            )
            
            # Update or create AreaMetric
            metric = db.query(AreaMetric).filter(AreaMetric.area_id == area.id).first()
            if metric:
                metric.transport_score = transport_score
                updated_count += 1
            else:
                # Create new metric if it doesn't exist
                metric = AreaMetric(
                    area_id=area.id,
                    population_density=5000,  # Default value
                    business_density=50,      # Default value
                    transport_score=transport_score
                )
                db.add(metric)
                updated_count += 1
        
        db.commit()
        
        return APIResponse(
            success=True,
            data={"updated": updated_count, "total_areas": len(areas)},
            message=f"Updated transportation scores for {updated_count} areas"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update transportation scores: {str(e)}"
        )


def _score_from_metrics(metric: AreaMetric) -> float:
    # Normalize population density to 0..10 scale (assume 0..15000 people/sq mi)
    pop_norm = max(0.0, min(10.0, (float(metric.population_density) / 1500.0)))
    transport_norm = max(0.0, min(10.0, float(metric.transport_score)))
    # weighted scoring
    score = 0.6 * pop_norm + 0.4 * transport_norm
    return round(score, 1)

# Search endpoint (uses DB metrics with semantic search)
@app.post("/search", response_model=APIResponse)
async def search_locations(
    search_query: SearchQuery,
    db: Session = Depends(get_db)
):
    try:
        # Get all areas with their metrics (LEFT JOIN to include all areas)
        areas_with_metrics = (
            db.query(Area, AreaMetric)
            .outerjoin(AreaMetric, Area.id == AreaMetric.area_id)
            .all()
        )
        
        recs: List[LocationRecommendation] = []
        query_lower = search_query.query.lower()
        
        for area, metric in areas_with_metrics:
            # If no metric exists, create default values
            if not metric:
                metric = AreaMetric(
                    area_id=area.id,
                    population_density=5000,  # Default
                    business_density=50,      # Default
                    transport_score=7.0       # Default
                )
            
            # Compute base score using metrics
            base_score = _score_from_metrics(metric)
            
            # Apply semantic search filtering and boosting
            search_score = _calculate_search_score(
                query_lower, 
                area.name, 
                area.city, 
                search_query.business_type,
                base_score,
                metric
            )
            
            # Only include results that match the search criteria
            if search_score > 0:
                recs.append(
                    LocationRecommendation(
                        area=area.name,
                        score=float(search_score),
                        reasons=_generate_search_reasons(query_lower, area.name, metric),
                        coordinates=[float(area.longitude), float(area.latitude)],
                        business_density=int(metric.business_density),
                        population_density=int(metric.population_density),
                        transport_score=float(metric.transport_score),
                    )
                )
        
        # Sort by search score (highest first)
        recs.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results to top 20 for performance
        recs = recs[:20]
        
        return APIResponse(
            success=True,
            data={"recommendations": [r.model_dump() for r in recs]},
            message=f"Found {len(recs)} locations matching '{search_query.query}'"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

# AI-powered search endpoint
@app.post("/search/ai", response_model=APIResponse)
async def ai_search_locations(
    search_query: SearchQuery,
    db: Session = Depends(get_db)
):
    """
    AI-powered search using OpenAI for enhanced semantic understanding and recommendations.
    """
    try:
        # Analyze search intent using AI
        search_context = await openai_service.analyze_search_intent(
            search_query.query, 
            search_query.business_type
        )
        
        # Get all areas with their metrics
        areas_with_metrics = (
            db.query(Area, AreaMetric)
            .outerjoin(AreaMetric, Area.id == AreaMetric.area_id)
            .all()
        )
        
        # Prepare area data for AI analysis
        areas_data = []
        for area, metric in areas_with_metrics:
            if not metric:
                metric = AreaMetric(
                    area_id=area.id,
                    population_density=5000,
                    business_density=50,
                    transport_score=7.5
                )
            
            base_score = _score_from_metrics(metric)
            
            # Apply basic semantic search filtering
            query_lower = search_query.query.lower()
            search_score = _calculate_search_score(
                query_lower, 
                area.name, 
                area.city, 
                search_query.business_type,
                base_score,
                metric
            )
            
            if search_score > 0:
                areas_data.append({
                    "area": area.name,
                    "score": float(search_score),
                    "population_density": int(metric.population_density),
                    "business_density": int(metric.business_density),
                    "transport_score": float(metric.transport_score),
                    "coordinates": [float(area.longitude), float(area.latitude)]
                })
        
        # Sort by score and take top 10 for AI analysis
        areas_data.sort(key=lambda x: x["score"], reverse=True)
        top_areas = areas_data[:10]
        
        # Generate AI recommendations
        ai_recommendations = await openai_service.generate_ai_recommendations(
            top_areas, 
            search_context
        )
        
        # Create enhanced recommendations
        recs: List[LocationRecommendation] = []
        for ai_rec in ai_recommendations:
            # Find the corresponding area data
            area_data = next((a for a in areas_data if a["area"] == ai_rec.area_name), None)
            if area_data:
                # Enhance reasons using AI
                enhanced_reasons = await openai_service.enhance_search_reasons(
                    ai_rec.area_name,
                    {
                        "population_density": area_data["population_density"],
                        "business_density": area_data["business_density"],
                        "transport_score": area_data["transport_score"]
                    },
                    search_context
                )
                
                recs.append(
                    LocationRecommendation(
                        area=ai_rec.area_name,
                        score=float(ai_rec.confidence_score),
                        reasons=enhanced_reasons,
                        coordinates=area_data["coordinates"],
                        business_density=area_data["business_density"],
                        population_density=area_data["population_density"],
                        transport_score=area_data["transport_score"],
                    )
                )
        
        # Sort by AI confidence score
        recs.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results
        recs = recs[:15]
        
        # Add AI insights to response
        ai_insights = {
            "user_intent": search_context.user_intent,
            "location_preferences": search_context.location_preferences,
            "business_requirements": search_context.business_requirements,
            "ai_available": openai_service.is_available()
        }
        
        return APIResponse(
            success=True,
            data={
                "recommendations": [r.model_dump() for r in recs],
                "ai_insights": ai_insights
            },
            message=f"AI-powered search found {len(recs)} locations matching '{search_query.query}'"
        )
        
    except Exception as e:
        logger.error(f"AI search failed: {e}")
        # Fallback to regular search
        return await search_locations(search_query, db)

@app.post("/search/advanced", response_model=APIResponse)
async def advanced_search_locations(
    search_query: SearchQuery,
    filters: AdvancedFilters,
    db: Session = Depends(get_db)
):
    """
    Advanced search with filtering capabilities:
    - County-based filtering
    - Population density range
    - Business density range  
    - Transport score range
    - Map bounds filtering
    """
    try:
        # Get all areas with their metrics
        areas_with_metrics = (
            db.query(Area, AreaMetric)
            .outerjoin(AreaMetric, Area.id == AreaMetric.area_id)
            .all()
        )
        
        recs: List[LocationRecommendation] = []
        query_lower = search_query.query.lower()
        
        for area, metric in areas_with_metrics:
            # If no metric exists, create default values
            if not metric:
                metric = AreaMetric(
                    area_id=area.id,
                    population_density=5000,
                    business_density=50,
                    transport_score=7.0
                )
            
            # Apply filters
            if not _passes_filters(area, metric, filters):
                continue
            
            # Compute base score using metrics
            base_score = _score_from_metrics(metric)
            
            # Apply semantic search filtering and boosting
            search_score = _calculate_search_score(
                query_lower, 
                area.name, 
                area.city, 
                search_query.business_type,
                base_score,
                metric
            )
            
            # Only include results that match the search criteria
            if search_score > 0:
                recs.append(
                    LocationRecommendation(
                        area=area.name,
                        score=float(search_score),
                        reasons=_generate_search_reasons(query_lower, area.name, metric),
                        coordinates=[float(area.longitude), float(area.latitude)],
                        business_density=int(metric.business_density),
                        population_density=int(metric.population_density),
                        transport_score=float(metric.transport_score),
                    )
                )
        
        # Sort by search score (highest first)
        recs.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results to top 20 for performance
        recs = recs[:20]
        
        return APIResponse(
            success=True,
            data={"recommendations": [r.model_dump() for r in recs]},
            message=f"Found {len(recs)} locations matching '{search_query.query}' with applied filters"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Advanced search failed: {str(e)}"
        )

def _passes_filters(area: Area, metric: AreaMetric, filters: AdvancedFilters) -> bool:
    """
    Check if an area passes all applied filters.
    """
    # County filter
    if filters.counties:
        area_county = COUNTY_MAPPING.get(area.name)
        if not area_county or area_county not in filters.counties:
            return False
    
    # Population density range
    if filters.population_density_min is not None:
        if metric.population_density < filters.population_density_min:
            return False
    
    if filters.population_density_max is not None:
        if metric.population_density > filters.population_density_max:
            return False
    
    # Business density range
    if filters.business_density_min is not None:
        if metric.business_density < filters.business_density_min:
            return False
    
    if filters.business_density_max is not None:
        if metric.business_density > filters.business_density_max:
            return False
    
    # Transport score range
    if filters.transport_score_min is not None:
        if metric.transport_score < filters.transport_score_min:
            return False
    
    if filters.transport_score_max is not None:
        if metric.transport_score > filters.transport_score_max:
            return False
    
    # Map bounds filter
    if filters.map_bounds:
        bounds = filters.map_bounds
        if (area.latitude < bounds.get("south", -90) or 
            area.latitude > bounds.get("north", 90) or
            area.longitude < bounds.get("west", -180) or 
            area.longitude > bounds.get("east", 180)):
            return False
    
    return True

@app.get("/counties", response_model=APIResponse)
async def get_counties():
    """
    Get list of available counties for filtering.
    """
    counties = list(set(COUNTY_MAPPING.values()))
    return APIResponse(
        success=True,
        data={"counties": counties},
        message=f"Found {len(counties)} counties"
    )

def _calculate_search_score(query: str, area_name: str, city_name: str, business_type: str, base_score: float, metric: AreaMetric) -> float:
    """
    Calculate search relevance score based on query terms and business type.
    Returns 0 if no match, otherwise returns boosted base score.
    """
    score = 0.0
    
    # Direct name matches (highest priority)
    if query in area_name.lower() or query in city_name.lower():
        score = base_score * 1.5  # 50% boost for name matches
    
    # Business type specific matching
    elif business_type and business_type.lower() in ["restaurant", "food", "dining", "pizza", "cafe"]:
        # High population density areas are good for restaurants
        if metric.population_density > 8000:
            score = base_score * 1.3
        elif metric.population_density > 5000:
            score = base_score * 1.1
        else:
            score = base_score * 0.8
    
    # Geographic/descriptive terms
    elif any(term in query for term in ["beach", "coastal", "waterfront"]):
        if any(beach_term in area_name.lower() for beach_term in ["beach", "coast", "marina"]):
            score = base_score * 1.4
        else:
            score = base_score * 0.3  # Low score for non-beach areas
    
    elif any(term in query for term in ["downtown", "urban", "city", "center"]):
        if any(urban_term in area_name.lower() for urban_term in ["downtown", "center", "city"]):
            score = base_score * 1.3
        elif metric.population_density > 10000:  # High density = urban
            score = base_score * 1.2
        else:
            score = base_score * 0.7
    
    elif any(term in query for term in ["hills", "hillside", "mountain"]):
        if any(hill_term in area_name.lower() for hill_term in ["hills", "heights", "ridge"]):
            score = base_score * 1.3
        else:
            score = base_score * 0.5
    
    elif any(term in query for term in ["high", "dense", "busy", "crowded"]):
        if metric.population_density > 10000:
            score = base_score * 1.4
        elif metric.population_density > 7000:
            score = base_score * 1.2
        else:
            score = base_score * 0.6
    
    # Transportation-related terms
    elif any(term in query for term in ["transit", "transport", "metro", "bus", "rail", "subway", "accessible", "connectivity"]):
        if metric.transport_score > 8.0:
            score = base_score * 1.5  # Excellent transit access
        elif metric.transport_score > 6.0:
            score = base_score * 1.3  # Good transit access
        elif metric.transport_score > 4.0:
            score = base_score * 1.1  # Moderate transit access
        else:
            score = base_score * 0.5  # Poor transit access
    
    elif any(term in query for term in ["best", "top", "excellent", "great"]):
        # Return top performers
        if base_score > 7.0:
            score = base_score * 1.2
        elif base_score > 5.0:
            score = base_score * 1.0
        else:
            score = base_score * 0.8
    
    # Generic business terms
    elif any(term in query for term in ["business", "commercial", "retail", "office", "store", "shop"]):
        if metric.business_density > 80:
            score = base_score * 1.3
        elif metric.business_density > 60:
            score = base_score * 1.1
        else:
            score = base_score * 0.9
    
    # If no specific match, return base score for general queries
    elif query in ["all", "show", "list", "find", "search", ""]:
        score = base_score
    
    # Default: no match
    else:
        score = 0.0
    
    # Normalize score to 0-10 range
    if score > 0:
        score = min(10.0, max(0.0, score))
    
    return round(score, 1)

def _generate_search_reasons(query: str, area_name: str, metric: AreaMetric) -> List[str]:
    """Generate contextual reasons based on search query and area characteristics."""
    reasons = []
    
    if query in area_name.lower():
        reasons.append(f"Direct match for '{query}'")
    
    if metric.population_density > 10000:
        reasons.append("High population density - great for foot traffic")
    elif metric.population_density > 7000:
        reasons.append("Good population density for business")
    
    if metric.business_density > 80:
        reasons.append("High business density - established commercial area")
    elif metric.business_density > 60:
        reasons.append("Moderate business density - growing commercial area")
    
    if metric.transport_score > 8.0:
        reasons.append("Excellent public transportation access")
    elif metric.transport_score > 6.0:
        reasons.append("Good public transportation connectivity")
    
    # Add business-specific reasons
    if any(term in query.lower() for term in ["restaurant", "food", "dining", "pizza"]):
        if metric.population_density > 8000:
            reasons.append("High foot traffic ideal for restaurants")
        if metric.business_density > 70:
            reasons.append("Established dining scene with competition")
    
    if not reasons:
        reasons.append("Good business potential based on local metrics")
    
    return reasons

# Get location details
@app.get("/location/{area_name}", response_model=APIResponse)
async def get_location_details(
    area_name: str,
    db: Session = Depends(get_db)
):
    try:
        area = db.query(Area).filter(Area.name == area_name).first()
        if not area:
            raise HTTPException(status_code=404, detail="Area not found")
        metric = (
            db.query(AreaMetric)
            .filter(AreaMetric.area_id == area.id)
            .order_by(AreaMetric.id.desc())
            .first()
        )
        mock_details = {
            "area": area.name,
            "score": float(metric.score) if metric else 0.0,
            "parameters": {
                "population_density": int(metric.population_density) if metric else 0,
                "business_density": int(metric.business_density) if metric else 0,
                "transport_score": float(metric.transport_score) if metric else 0.0,
            },
            "recommendations": [
                "Replace with real insights from metrics",
                "Public transport and population density are key signals",
            ]
        }
        return APIResponse(success=True, data=mock_details, message=f"Location details for {area_name}")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get location details: {str(e)}"
        )

# Get available parameters
@app.get("/parameters", response_model=APIResponse)
async def get_available_parameters():
    """
    Get list of available search parameters
    """
    parameters = {
        "population_density": "Number of people per square mile",
        "business_density": "Number of existing businesses in area",
        "transport_score": "Public transportation accessibility (1-10)",
        "property_values": "Average property values in area",
        "tourist_attractions": "Number of tourist attractions nearby",
        "restaurant_density": "Number of restaurants in area",
        "traffic_congestion": "Traffic congestion level (1-10)"
    }
    
    return APIResponse(
        success=True,
        data={"parameters": parameters},
        message="Available parameters retrieved successfully"
    )

# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

@app.post("/auth/register", response_model=LoginResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = auth_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username is taken
    if user_data.username:
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create user
    user = auth_service.create_user(
        db=db,
        email=user_data.email,
        password=user_data.password,
        full_name=user_data.full_name,
        username=user_data.username
    )
    
    # Create session
    session_data = auth_service.create_user_session(db, user.id)
    
    return LoginResponse(
        access_token=session_data["access_token"],
        refresh_token=session_data["refresh_token"],
        token_type=session_data["token_type"],
        expires_in=30 * 60,  # 30 minutes
        user=UserResponse.from_orm(user)
    )

@app.post("/auth/login", response_model=LoginResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user with email and password."""
    user = auth_service.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create session
    session_data = auth_service.create_user_session(db, user.id)
    
    return LoginResponse(
        access_token=session_data["access_token"],
        refresh_token=session_data["refresh_token"],
        token_type=session_data["token_type"],
        expires_in=30 * 60,  # 30 minutes
        user=UserResponse.from_orm(user)
    )

@app.post("/auth/refresh", response_model=dict)
async def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    session_data = auth_service.refresh_access_token(db, token_data.refresh_token)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    return session_data

@app.post("/auth/logout")
async def logout_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout current user."""
    auth_service.logout_user(db, current_user.id)
    return {"message": "Successfully logged out"}

@app.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Send password reset email."""
    reset_token = auth_service.create_password_reset_token(db, request.email)
    if not reset_token:
        # Don't reveal if email exists or not
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Send email
    email_sent = auth_service.send_password_reset_email(request.email, reset_token)
    if not email_sent:
        logger.warning(f"Failed to send password reset email to {request.email}")
    
    return {"message": "If the email exists, a password reset link has been sent"}

@app.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Reset password using reset token."""
    success = auth_service.reset_password(db, reset_data.token, reset_data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password successfully reset"}

# Google OAuth2 endpoints
@app.get("/auth/google", response_model=GoogleAuthResponse)
async def google_auth():
    """Get Google OAuth2 authorization URL."""
    try:
        auth_url = google_oauth_service.get_authorization_url()
        return GoogleAuthResponse(authorization_url=auth_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@app.post("/auth/google/callback", response_model=GoogleCallbackResponse)
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth2 callback."""
    result = google_oauth_service.handle_google_callback(db, code)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google authentication failed"
        )
    
    return GoogleCallbackResponse(
        access_token=result["access_token"],
        refresh_token=result["refresh_token"],
        token_type=result["token_type"],
        expires_in=30 * 60,  # 30 minutes
        user=UserResponse.from_orm(result["user"])
    )

# User profile endpoints
@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile."""
    return UserResponse.from_orm(current_user)

@app.put("/auth/me", response_model=UserResponse)
async def update_user_profile(
    user_update: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    for field, value in user_update.items():
        if hasattr(current_user, field) and value is not None:
            setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)

# Search history endpoints
@app.post("/search/history", response_model=SearchHistoryResponse)
async def save_search_history(
    search_data: SearchHistoryCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save user search history."""
    search_history = SearchHistory(
        user_id=current_user.id,
        query=search_data.query,
        business_type=search_data.business_type,
        filters_used=search_data.filters_used
    )
    
    db.add(search_history)
    db.commit()
    db.refresh(search_history)
    
    return SearchHistoryResponse.from_orm(search_history)

@app.get("/search/history", response_model=List[SearchHistoryResponse])
async def get_search_history(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get user search history."""
    history = db.query(SearchHistory).filter(
        SearchHistory.user_id == current_user.id
    ).order_by(SearchHistory.search_timestamp.desc()).limit(limit).all()
    
    return [SearchHistoryResponse.from_orm(item) for item in history]

if __name__ == "__main__":
    # Seed the database
    seed()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
