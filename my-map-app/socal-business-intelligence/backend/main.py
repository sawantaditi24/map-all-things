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
from census_service import census_service

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
# Specific origins for development and production
cors_origins = [
        "http://localhost:3000", 
        "http://localhost:3002",
    "http://localhost:3005",
    "https://socal-business-intelligence.netlify.app",
    "https://mapallthings.com",
]

# Add custom origins from environment variable if set
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS:
    cors_origins.extend([origin.strip() for origin in ALLOWED_ORIGINS.split(",")])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    # Regex to allow all Netlify, Render, Vercel, and Railway subdomains
    allow_origin_regex=r"https://.*\.(netlify|render|vercel|railway)\.(app|com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Load Olympic venues data
def load_olympic_venues():
    """Load Olympic venues from JSON file."""
    try:
        json_path = os.path.join(os.path.dirname(__file__), 'olympic_sports_venues.json')
        with open(json_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Failed to load Olympic venues: {e}")
        return []

# Haversine distance calculation (returns km, can convert to miles)
def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula. Returns distance in km."""
    import math
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def miles_to_km(miles):
    """Convert miles to kilometers."""
    return miles * 1.60934

def km_to_miles(km):
    """Convert kilometers to miles."""
    return km * 0.621371

def find_nearest_city_metrics(venue_lat: float, venue_lon: float, db: Session):
    """
    Find the nearest city (Area) to an Olympic venue and return its metrics.
    Returns (Area, AreaMetric) tuple, or (None, None) if no city found.
    """
    # Get all areas with their metrics
    areas_with_metrics = (
        db.query(Area, AreaMetric)
        .outerjoin(AreaMetric, Area.id == AreaMetric.area_id)
        .all()
    )
    
    if not areas_with_metrics:
        return None, None
    
    nearest_area = None
    nearest_metric = None
    min_distance = None
    
    for area, metric in areas_with_metrics:
        try:
            area_lat = float(area.latitude)
            area_lon = float(area.longitude)
            distance = calculate_distance_km(venue_lat, venue_lon, area_lat, area_lon)
            
            if min_distance is None or distance < min_distance:
                min_distance = distance
                nearest_area = area
                nearest_metric = metric
        except (ValueError, TypeError):
            continue
    
    # If no metric exists, create default values
    if nearest_area and not nearest_metric:
        nearest_metric = AreaMetric(
            area_id=nearest_area.id,
            population_density=5000,
            business_density=50,
            transport_score=7.0
        )
    
    return nearest_area, nearest_metric

def is_within_radius_range(lat, lon, radius_min_miles, radius_max_miles, venues):
    """Check if a location is within the radius range [radius_min, radius_max] of the NEAREST Olympic venue.
    Accepts radius in miles and converts to km for distance calculation."""
    if not venues:
        return True  # No filter if no venues
    
    # If no radius specified, don't filter
    if radius_min_miles is None and radius_max_miles is None:
        return True
    
    # Convert miles to km for distance comparison
    radius_min_km = miles_to_km(radius_min_miles) if radius_min_miles is not None else None
    radius_max_km = miles_to_km(radius_max_miles) if radius_max_miles is not None else None
    
    # Find the NEAREST Olympic venue (not just any venue)
    nearest_distance_km = None
    for venue in venues:
        if not venue.get('Latitude') or not venue.get('Longitude'):
            continue
        distance_km = calculate_distance_km(lat, lon, venue['Latitude'], venue['Longitude'])
        if nearest_distance_km is None or distance_km < nearest_distance_km:
            nearest_distance_km = distance_km
    
    # If no valid venue found, don't filter
    if nearest_distance_km is None:
        return True
    
    # Check if nearest distance is within range (in km)
    # Note: radius_min_km can be 0.0, which is valid
    if radius_min_km is not None and radius_max_km is not None:
        # Both min and max specified: check if distance is in range
        result = radius_min_km <= nearest_distance_km <= radius_max_km
        logger.debug(f"Radius filter check: distance={nearest_distance_km:.2f}km ({nearest_distance_km*0.621371:.2f}mi), range=[{radius_min_km:.2f}km, {radius_max_km:.2f}km] ([{radius_min_km*0.621371:.2f}mi, {radius_max_km*0.621371:.2f}mi]), result={result}")
        return result
    elif radius_max_km is not None:
        # Only max specified: check if distance <= max
        result = nearest_distance_km <= radius_max_km
        logger.debug(f"Radius filter check (max only): distance={nearest_distance_km:.2f}km ({nearest_distance_km*0.621371:.2f}mi), max={radius_max_km:.2f}km ({radius_max_km*0.621371:.2f}mi), result={result}")
        return result
    elif radius_min_km is not None:
        # Only min specified: check if distance >= min
        result = nearest_distance_km >= radius_min_km
        logger.debug(f"Radius filter check (min only): distance={nearest_distance_km:.2f}km ({nearest_distance_km*0.621371:.2f}mi), min={radius_min_km:.2f}km ({radius_min_km*0.621371:.2f}mi), result={result}")
        return result
    
    return False

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
    apartment_count_min: Optional[int] = None
    apartment_count_max: Optional[int] = None
    radius_miles_min: Optional[float] = None  # Minimum radius from Olympic venues (in miles)
    radius_miles_max: Optional[float] = None  # Maximum radius from Olympic venues (in miles)
    map_bounds: Optional[dict] = None  # {north, south, east, west}

class LocationRecommendation(BaseModel):
    area: str  # Will contain venue location name (e.g., "Kia Forum/YouTube Theater")
    sport: Optional[str] = None  # Olympic sport name (e.g., "Basketball")
    venue_location: Optional[str] = None  # Full location string (e.g., "Arena, Inglewood, CA (Kia Forum/YouTube Theater)")
    score: float
    reasons: List[str]
    coordinates: List[float]
    business_density: int
    population_density: int
    transport_score: float
    apartment_count: Optional[int] = None

class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None

# Remove the old get_current_user function - using the one from auth_middleware

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Southern California Business Intelligence API", "status": "running", "version": "1.0.1"}

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

# Test OpenAI endpoint
@app.get("/test/openai")
async def test_openai():
    """Test endpoint to verify OpenAI is working."""
    try:
        is_available = openai_service.is_available()
        api_key_present = os.getenv("OPENAI_API_KEY") is not None
        api_key_length = len(os.getenv("OPENAI_API_KEY", ""))
        api_key_starts_with_sk = os.getenv("OPENAI_API_KEY", "").startswith("sk-")
        
        result = {
            "openai_available": is_available,
            "api_key_present": api_key_present,
            "api_key_length": api_key_length,
            "api_key_starts_with_sk": api_key_starts_with_sk,
            "client_is_none": openai_service.client is None
        }
        
        # Try a simple OpenAI call if available
        if is_available:
            try:
                test_response = openai_service.client.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "user", "content": "Say 'OpenAI is working' if you can read this."}
                    ],
                    max_tokens=20
                )
                result["test_call_successful"] = True
                result["test_response"] = test_response.choices[0].message.content
            except Exception as e:
                result["test_call_successful"] = False
                result["test_call_error"] = str(e)
                result["test_call_error_type"] = type(e).__name__
                if hasattr(e, 'response'):
                    result["test_call_error_response"] = str(e.response)
                logger.error(f"OpenAI test call failed: {e}", exc_info=True)
        
        return {
            "success": True,
            "data": result,
            "message": "OpenAI test completed"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "OpenAI test failed"
        }

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
        {"name": "Downtown LA", "city": "Los Angeles", "county": "Los Angeles County", 
         "latitude": 34.0522, "longitude": -118.2437, "population": 3898747, "area_sq_mi": 502.7},
        {"name": "Santa Monica", "city": "Santa Monica", "county": "Los Angeles County",
         "latitude": 34.0195, "longitude": -118.4912, "population": 93076, "area_sq_mi": 8.4},
        {"name": "Beverly Hills", "city": "Beverly Hills", "county": "Los Angeles County",
         "latitude": 34.0736, "longitude": -118.4004, "population": 33792, "area_sq_mi": 5.7},
        {"name": "Pasadena", "city": "Pasadena", "county": "Los Angeles County",
         "latitude": 34.1478, "longitude": -118.1445, "population": 138699, "area_sq_mi": 22.9},
        {"name": "Glendale", "city": "Glendale", "county": "Los Angeles County",
         "latitude": 34.1425, "longitude": -118.2551, "population": 196543, "area_sq_mi": 30.4},
        {"name": "Burbank", "city": "Burbank", "county": "Los Angeles County",
         "latitude": 34.1808, "longitude": -118.3090, "population": 107337, "area_sq_mi": 17.3},
        {"name": "Long Beach", "city": "Long Beach", "county": "Los Angeles County",
         "latitude": 33.7701, "longitude": -118.1937, "population": 466742, "area_sq_mi": 50.3},
        {"name": "Torrance", "city": "Torrance", "county": "Los Angeles County",
         "latitude": 33.8358, "longitude": -118.3406, "population": 141181, "area_sq_mi": 20.5},
        {"name": "Manhattan Beach", "city": "Manhattan Beach", "county": "Los Angeles County",
         "latitude": 33.8847, "longitude": -118.4109, "population": 35006, "area_sq_mi": 3.9},
        {"name": "Redondo Beach", "city": "Redondo Beach", "county": "Los Angeles County",
         "latitude": 33.8492, "longitude": -118.3884, "population": 71417, "area_sq_mi": 6.2},
        {"name": "West Hollywood", "city": "West Hollywood", "county": "Los Angeles County",
         "latitude": 34.0900, "longitude": -118.3617, "population": 35098, "area_sq_mi": 1.9},
        {"name": "Culver City", "city": "Culver City", "county": "Los Angeles County",
         "latitude": 34.0211, "longitude": -118.3965, "population": 40190, "area_sq_mi": 5.1},
        {"name": "Inglewood", "city": "Inglewood", "county": "Los Angeles County",
         "latitude": 33.9617, "longitude": -118.3531, "population": 107762, "area_sq_mi": 9.1},
        {"name": "Compton", "city": "Compton", "county": "Los Angeles County",
         "latitude": 33.8958, "longitude": -118.2201, "population": 95897, "area_sq_mi": 10.0},
        {"name": "Carson", "city": "Carson", "county": "Los Angeles County",
         "latitude": 33.8314, "longitude": -118.2822, "population": 95174, "area_sq_mi": 19.0},
        
        # Orange County
        {"name": "Anaheim", "city": "Anaheim", "county": "Orange County",
         "latitude": 33.8366, "longitude": -117.9143, "population": 346824, "area_sq_mi": 50.8},
        {"name": "Santa Ana", "city": "Santa Ana", "county": "Orange County",
         "latitude": 33.7455, "longitude": -117.8677, "population": 334217, "area_sq_mi": 27.3},
        {"name": "Irvine", "city": "Irvine", "county": "Orange County",
         "latitude": 33.6846, "longitude": -117.8265, "population": 307670, "area_sq_mi": 66.1},
        {"name": "Huntington Beach", "city": "Huntington Beach", "county": "Orange County",
         "latitude": 33.6595, "longitude": -117.9988, "population": 198711, "area_sq_mi": 26.7},
        {"name": "Newport Beach", "city": "Newport Beach", "county": "Orange County",
         "latitude": 33.6189, "longitude": -117.9298, "population": 85887, "area_sq_mi": 23.1},
        {"name": "Costa Mesa", "city": "Costa Mesa", "county": "Orange County",
         "latitude": 33.6411, "longitude": -117.9187, "population": 111918, "area_sq_mi": 15.7},
        {"name": "Fullerton", "city": "Fullerton", "county": "Orange County",
         "latitude": 33.8703, "longitude": -117.9253, "population": 135161, "area_sq_mi": 22.4},
        {"name": "Orange", "city": "Orange", "county": "Orange County",
         "latitude": 33.7879, "longitude": -117.8531, "population": 139911, "area_sq_mi": 25.7},
        {"name": "Garden Grove", "city": "Garden Grove", "county": "Orange County",
         "latitude": 33.7739, "longitude": -117.9414, "population": 172800, "area_sq_mi": 17.9},
        {"name": "Tustin", "city": "Tustin", "county": "Orange County",
         "latitude": 33.7459, "longitude": -117.8266, "population": 79926, "area_sq_mi": 11.1},
        {"name": "Laguna Beach", "city": "Laguna Beach", "county": "Orange County",
         "latitude": 33.5427, "longitude": -117.7854, "population": 23032, "area_sq_mi": 8.9},
        {"name": "Mission Viejo", "city": "Mission Viejo", "county": "Orange County",
         "latitude": 33.6000, "longitude": -117.6720, "population": 93805, "area_sq_mi": 17.6},
        {"name": "Aliso Viejo", "city": "Aliso Viejo", "county": "Orange County",
         "latitude": 33.5750, "longitude": -117.7256, "population": 52076, "area_sq_mi": 7.5},
        {"name": "Laguna Niguel", "city": "Laguna Niguel", "county": "Orange County",
         "latitude": 33.5225, "longitude": -117.7076, "population": 66019, "area_sq_mi": 14.8},
        {"name": "Lake Forest", "city": "Lake Forest", "county": "Orange County",
         "latitude": 33.6469, "longitude": -117.6892, "population": 85058, "area_sq_mi": 16.0},
        {"name": "Yorba Linda", "city": "Yorba Linda", "county": "Orange County",
         "latitude": 33.8886, "longitude": -117.8131, "population": 68469, "area_sq_mi": 20.0},
        {"name": "Brea", "city": "Brea", "county": "Orange County",
         "latitude": 33.9167, "longitude": -117.9001, "population": 47425, "area_sq_mi": 12.1},
        {"name": "Placentia", "city": "Placentia", "county": "Orange County",
         "latitude": 33.8722, "longitude": -117.8703, "population": 51824, "area_sq_mi": 6.6},
        {"name": "La Habra", "city": "La Habra", "county": "Orange County",
         "latitude": 33.9319, "longitude": -117.9461, "population": 63197, "area_sq_mi": 7.4},
        {"name": "Buena Park", "city": "Buena Park", "county": "Orange County",
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
                existing_area.county = city_data["county"]
                existing_area.latitude = city_data["latitude"]
                existing_area.longitude = city_data["longitude"]
                updated += 1
            else:
                # Create new area
                new_area = Area(
                    name=city_data["name"],
                    city=city_data["city"],
                    county=city_data["county"],
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

# --- ETL: Apartment Count Data from Census ---
@app.post("/etl/census/apartments", response_model=APIResponse)
async def etl_census_apartments(db: Session = Depends(get_db)):
    """
    Update apartment count metrics for all areas using US Census Bureau data.
    """
    try:
        updated_count = 0
        
        # Get all areas
        areas = db.query(Area).all()
        
        for area in areas:
            # Fetch apartment count from Census service
            apartment_count = await census_service.get_apartment_count_by_city(area.name)
            
            if apartment_count is not None:
                # Update or create AreaMetric
                metric = db.query(AreaMetric).filter(AreaMetric.area_id == area.id).first()
                if metric:
                    metric.apartment_count = apartment_count
                    updated_count += 1
                    logger.info(f"Updated apartment count for {area.name}: {apartment_count:,} units")
                else:
                    # Create new metric if it doesn't exist
                    metric = AreaMetric(
                        area_id=area.id,
                        population_density=5000,  # Default value
                        business_density=50,      # Default value
                        transport_score=6.5,      # Default value
                        apartment_count=apartment_count
                    )
                    db.add(metric)
                    updated_count += 1
                    logger.info(f"Created apartment count metric for {area.name}: {apartment_count:,} units")
        
        db.commit()
        
        return APIResponse(
            success=True,
            data={"updated": updated_count, "total_areas": len(areas)},
            message=f"Updated apartment count metrics for {updated_count} areas"
        )
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update apartment count metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update apartment count metrics: {str(e)}"
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
        # Load Olympic venues
        venues = load_olympic_venues()
        if not venues:
            return APIResponse(
                success=False,
                data={"recommendations": []},
                message="No Olympic venues found"
            )
        
        recs: List[LocationRecommendation] = []
        query_lower = search_query.query.lower()
        
        for venue in venues:
            if not venue.get('Latitude') or not venue.get('Longitude'):
                continue
            
            venue_lat = venue['Latitude']
            venue_lon = venue['Longitude']
            sport = venue.get('Sport', '')
            location = venue.get('Location', '')
            
            # Find nearest city and get its metrics
            nearest_area, nearest_metric = find_nearest_city_metrics(venue_lat, venue_lon, db)
            
            if not nearest_area or not nearest_metric:
                # Use default metrics if no city found
                nearest_metric = AreaMetric(
                    area_id=0,
                    population_density=5000,
                    business_density=50,
                    transport_score=7.0
                )
            
            # Compute base score using metrics
            base_score = _score_from_metrics(nearest_metric)
            
            # Apply semantic search filtering and boosting
            # Search in sport name, location, and nearest city name
            search_score = _calculate_search_score(
                query_lower,
                location,  # Use venue location instead of area name
                nearest_area.name if nearest_area else location,  # Use nearest city as fallback
                search_query.business_type,
                base_score,
                nearest_metric
            )
            
            # Only include results that match the search criteria
            if search_score > 0:
                # Extract venue name from location (e.g., "Kia Forum/YouTube Theater" from "Arena, Inglewood, CA (Kia Forum/YouTube Theater)")
                venue_name = location
                if '(' in location and ')' in location:
                    # Extract text in parentheses
                    venue_name = location[location.find('(')+1:location.find(')')]
                elif ',' in location:
                    # Use first part before comma
                    venue_name = location.split(',')[0].strip()
                
                recs.append(
                    LocationRecommendation(
                        area=venue_name,
                        sport=sport,
                        venue_location=location,
                        score=float(search_score),
                        reasons=_generate_search_reasons(query_lower, location, nearest_metric),
                        coordinates=[venue_lon, venue_lat],
                        business_density=int(nearest_metric.business_density),
                        population_density=int(nearest_metric.population_density),
                        transport_score=float(nearest_metric.transport_score),
                        apartment_count=int(nearest_metric.apartment_count) if nearest_metric.apartment_count else None,
                    )
                )
        
        # Sort by search score (highest first)
        recs.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results to top 20 for performance
        recs = recs[:20]
        
        return APIResponse(
            success=True,
            data={"recommendations": [r.model_dump() for r in recs]},
            message=f"Found {len(recs)} Olympic venues matching '{search_query.query}'"
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
                    "apartment_count": int(metric.apartment_count) if metric.apartment_count else None,
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
        # Use the reasoning from AI recommendations directly (already includes detailed reasons)
        # This avoids making 10+ additional sequential OpenAI API calls
        recs: List[LocationRecommendation] = []
        for ai_rec in ai_recommendations:
            # Find the corresponding area data
            area_data = next((a for a in areas_data if a["area"] == ai_rec.area_name), None)
            if area_data:
                # Use AI-generated reasoning directly (already includes detailed analysis)
                # Convert key_factors and reasoning into reasons list
                reasons = []
                if ai_rec.reasoning:
                    reasons.append(ai_rec.reasoning)
                if ai_rec.key_factors:
                    reasons.extend([f"{factor}" for factor in ai_rec.key_factors[:3]])  # Limit to top 3 factors
                if ai_rec.business_insights:
                    reasons.append(ai_rec.business_insights)
                
                # Fallback to basic reasons if AI didn't provide enough
                if len(reasons) < 2:
                    # Create a temporary AreaMetric-like object for fallback reasons
                    temp_metric = AreaMetric(
                        area_id=0,  # Not used
                        population_density=area_data["population_density"],
                        business_density=area_data["business_density"],
                        transport_score=area_data["transport_score"]
                    )
                    reasons = _generate_search_reasons(
                        search_query.query.lower(),
                        ai_rec.area_name,
                        temp_metric
                    )
                
                recs.append(
                    LocationRecommendation(
                        area=ai_rec.area_name,
                        sport=None,  # AI search still uses cities, will be updated later
                        venue_location=None,
                        score=float(ai_rec.confidence_score),
                        reasons=reasons[:4],  # Limit to 4 reasons
                        coordinates=area_data["coordinates"],
                        business_density=area_data["business_density"],
                        population_density=area_data["population_density"],
                        transport_score=area_data["transport_score"],
                        apartment_count=area_data.get("apartment_count"),
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
    - Radius from Olympic venues
    - Map bounds filtering
    """
    try:
        # Load Olympic venues
        venues = load_olympic_venues()
        if not venues:
            return APIResponse(
                success=False,
                data={"recommendations": []},
                message="No Olympic venues found"
            )
        
        recs: List[LocationRecommendation] = []
        query_lower = search_query.query.lower()
        
        for venue in venues:
            if not venue.get('Latitude') or not venue.get('Longitude'):
                continue
            
            venue_lat = venue['Latitude']
            venue_lon = venue['Longitude']
            sport = venue.get('Sport', '')
            location = venue.get('Location', '')
            
            # Find nearest city and get its metrics
            nearest_area, nearest_metric = find_nearest_city_metrics(venue_lat, venue_lon, db)
            
            if not nearest_area or not nearest_metric:
                # Use default metrics if no city found
                nearest_metric = AreaMetric(
                    area_id=0,
                    population_density=5000,
                    business_density=50,
                    transport_score=7.0
                )
                nearest_area = None
            
            # Apply filters using nearest city's metrics
            # Note: We use nearest_area for county filter, but metric for other filters
            if nearest_area and not _passes_filters(nearest_area, nearest_metric, filters):
                continue
            
            # Compute base score using metrics
            base_score = _score_from_metrics(nearest_metric)
            
            # Apply semantic search filtering and boosting
            search_score = _calculate_search_score(
                query_lower,
                location,
                nearest_area.name if nearest_area else location,
                search_query.business_type,
                base_score,
                nearest_metric
            )
            
            # Only include results that match the search criteria
            if search_score > 0:
                # Extract venue name from location
                venue_name = location
                if '(' in location and ')' in location:
                    venue_name = location[location.find('(')+1:location.find(')')]
                elif ',' in location:
                    venue_name = location.split(',')[0].strip()
                
                recs.append(
                    LocationRecommendation(
                        area=venue_name,
                        sport=sport,
                        venue_location=location,
                        score=float(search_score),
                        reasons=_generate_search_reasons(query_lower, location, nearest_metric),
                        coordinates=[venue_lon, venue_lat],
                        business_density=int(nearest_metric.business_density),
                        population_density=int(nearest_metric.population_density),
                        transport_score=float(nearest_metric.transport_score),
                        apartment_count=int(nearest_metric.apartment_count) if nearest_metric.apartment_count else None,
                    )
                )
        
        # Sort by search score (highest first)
        recs.sort(key=lambda x: x.score, reverse=True)
        
        # Limit results to top 20 for performance
        recs = recs[:20]
        
        return APIResponse(
            success=True,
            data={"recommendations": [r.model_dump() for r in recs]},
            message=f"Found {len(recs)} Olympic venues matching '{search_query.query}' with applied filters"
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
    
    # Apartment count range
    # Only apply filter if apartment_count data exists (don't filter out None values)
    if filters.apartment_count_min is not None:
        if metric.apartment_count is not None and metric.apartment_count < filters.apartment_count_min:
            return False
    
    if filters.apartment_count_max is not None:
        if metric.apartment_count is not None and metric.apartment_count > filters.apartment_count_max:
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
