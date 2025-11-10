"""
OpenAI Integration for Enhanced Semantic Search
Provides AI-powered search capabilities and intelligent recommendations.
"""

import openai
import os
import json
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

@dataclass
class SearchContext:
    """Context for AI-powered search."""
    query: str
    business_type: str
    user_intent: str
    location_preferences: List[str]
    business_requirements: List[str]

@dataclass
class AIRecommendation:
    """AI-generated recommendation with reasoning."""
    area_name: str
    confidence_score: float
    reasoning: str
    key_factors: List[str]
    business_insights: str

class OpenAIService:
    """OpenAI service for semantic search and recommendations."""
    
    def __init__(self):
        self.client = None
        self.api_key = os.getenv("OPENAI_API_KEY")
        
        logger.info(f"OpenAI service initialization started. API key present: {self.api_key is not None}")
        
        if self.api_key:
            logger.info(f"OpenAI API key found (length: {len(self.api_key)}, starts with 'sk-': {self.api_key.startswith('sk-')})")
            # Check if API key looks valid (starts with sk-)
            if not self.api_key.startswith("sk-"):
                logger.warning(f"OpenAI API key found but doesn't look valid (should start with 'sk-'): {self.api_key[:10]}...")
            try:
                # Use global API key method to avoid proxy issues
                openai.api_key = self.api_key
                self.client = openai  # Use the module directly
                logger.info("OpenAI service initialized successfully")
                logger.info(f"OpenAI API key loaded (length: {len(self.api_key)})")
                logger.info(f"OpenAI client set: {self.client is not None}")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI service: {e}", exc_info=True)
                self.client = None
        else:
            logger.warning("OpenAI API key not found. Using fallback semantic search.")
    
    def is_available(self) -> bool:
        """Check if OpenAI service is available."""
        is_avail = self.client is not None
        logger.info(f"OpenAI is_available() check: {is_avail} (client is {'not ' if self.client is None else ''}None)")
        return is_avail
    
    async def analyze_search_intent(self, query: str, business_type: str) -> SearchContext:
        """Analyze user search intent using AI."""
        if not self.is_available():
            logger.info("OpenAI not available, using fallback intent analysis")
            return self._fallback_intent_analysis(query, business_type)
        
        try:
            logger.info(f"Using OpenAI to analyze intent for: '{query}'")
            prompt = f"""
            Analyze this business location search query and extract key information:
            
            Query: "{query}"
            Business Type: "{business_type}"
            
            Extract:
            1. User Intent (what they're looking for)
            2. Location Preferences (beach, urban, suburban, etc.)
            3. Business Requirements (foot traffic, accessibility, competition, etc.)
            
            Respond in JSON format:
            {{
                "user_intent": "string",
                "location_preferences": ["list", "of", "preferences"],
                "business_requirements": ["list", "of", "requirements"]
            }}
            """
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a business location intelligence expert. Analyze search queries to understand user intent and requirements."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return SearchContext(
                query=query,
                business_type=business_type,
                user_intent=result.get("user_intent", ""),
                location_preferences=result.get("location_preferences", []),
                business_requirements=result.get("business_requirements", [])
            )
            
        except Exception as e:
            logger.error(f"OpenAI intent analysis failed: {e}")
            return self._fallback_intent_analysis(query, business_type)
    
    def _fallback_intent_analysis(self, query: str, business_type: str) -> SearchContext:
        """Fallback intent analysis when OpenAI is not available."""
        query_lower = query.lower()
        
        # Basic intent detection
        if any(word in query_lower for word in ["beach", "coastal", "waterfront"]):
            location_prefs = ["beach", "coastal"]
        elif any(word in query_lower for word in ["downtown", "urban", "city", "center"]):
            location_prefs = ["urban", "downtown"]
        elif any(word in query_lower for word in ["suburban", "family", "quiet"]):
            location_prefs = ["suburban", "family-friendly"]
        else:
            location_prefs = []
        
        # Business requirements detection
        requirements = []
        if any(word in query_lower for word in ["foot traffic", "busy", "crowded"]):
            requirements.append("high foot traffic")
        if any(word in query_lower for word in ["accessible", "metro", "transit"]):
            requirements.append("good accessibility")
        if any(word in query_lower for word in ["competition", "established"]):
            requirements.append("established commercial area")
        
        return SearchContext(
            query=query,
            business_type=business_type,
            user_intent=f"Looking for {business_type} location",
            location_preferences=location_prefs,
            business_requirements=requirements
        )
    
    async def generate_ai_recommendations(
        self, 
        areas_data: List[Dict], 
        search_context: SearchContext
    ) -> List[AIRecommendation]:
        """Generate AI-powered recommendations for areas."""
        if not self.is_available():
            return self._fallback_recommendations(areas_data, search_context)
        
        try:
            # Prepare area data for AI analysis
            areas_summary = []
            for area in areas_data[:10]:  # Limit to top 10 for AI processing
                areas_summary.append({
                    "name": area.get("area", ""),
                    "population_density": area.get("population_density", 0),
                    "business_density": area.get("business_density", 0),
                    "transport_score": area.get("transport_score", 0),
                    "coordinates": area.get("coordinates", [])
                })
            
            prompt = f"""
            Analyze these Southern California business locations for a {search_context.business_type} business.
            
            User Intent: {search_context.user_intent}
            Location Preferences: {', '.join(search_context.location_preferences)}
            Business Requirements: {', '.join(search_context.business_requirements)}
            
            Available Areas:
            {json.dumps(areas_summary, indent=2)}
            
            For each area, provide:
            1. Confidence Score (0-10)
            2. Reasoning (why this location is good)
            3. Key Factors (what makes it suitable)
            4. Business Insights (specific advice for this business type)
            
            Respond in JSON format:
            {{
                "recommendations": [
                    {{
                        "area_name": "string",
                        "confidence_score": 0-10,
                        "reasoning": "string",
                        "key_factors": ["list", "of", "factors"],
                        "business_insights": "string"
                    }}
                ]
            }}
            """
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a business location consultant specializing in Southern California. Provide detailed, actionable recommendations for business locations."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.4
            )
            
            result = json.loads(response.choices[0].message.content)
            
            recommendations = []
            for rec in result.get("recommendations", []):
                recommendations.append(AIRecommendation(
                    area_name=rec.get("area_name", ""),
                    confidence_score=float(rec.get("confidence_score", 0)),
                    reasoning=rec.get("reasoning", ""),
                    key_factors=rec.get("key_factors", []),
                    business_insights=rec.get("business_insights", "")
                ))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"OpenAI recommendation generation failed: {e}")
            return self._fallback_recommendations(areas_data, search_context)
    
    def _fallback_recommendations(
        self, 
        areas_data: List[Dict], 
        search_context: SearchContext
    ) -> List[AIRecommendation]:
        """Fallback recommendations when OpenAI is not available."""
        recommendations = []
        
        for area in areas_data[:5]:  # Top 5 areas
            area_name = area.get("area", "")
            score = area.get("score", 0)
            
            # Basic reasoning based on metrics
            reasoning_parts = []
            if area.get("population_density", 0) > 10000:
                reasoning_parts.append("High population density for customer base")
            if area.get("transport_score", 0) > 6:
                reasoning_parts.append("Good public transportation access")
            if area.get("business_density", 0) > 80:
                reasoning_parts.append("Established commercial area")
            
            reasoning = "; ".join(reasoning_parts) if reasoning_parts else "Good business potential"
            
            recommendations.append(AIRecommendation(
                area_name=area_name,
                confidence_score=min(10.0, score),
                reasoning=reasoning,
                key_factors=["Population density", "Transportation", "Business environment"],
                business_insights=f"Suitable for {search_context.business_type} based on local metrics"
            ))
        
        return recommendations
    
    async def enhance_search_reasons(
        self, 
        area_name: str, 
        metrics: Dict, 
        search_context: SearchContext
    ) -> List[str]:
        """Enhance search reasons using AI insights."""
        if not self.is_available():
            return self._fallback_reasons(area_name, metrics, search_context)
        
        try:
            prompt = f"""
            Generate specific, actionable reasons why {area_name} is suitable for a {search_context.business_type} business.
            
            Area Metrics:
            - Population Density: {metrics.get('population_density', 0)}
            - Business Density: {metrics.get('business_density', 0)}
            - Transport Score: {metrics.get('transport_score', 0)}
            
            User Context:
            - Intent: {search_context.user_intent}
            - Preferences: {', '.join(search_context.location_preferences)}
            - Requirements: {', '.join(search_context.business_requirements)}
            
            Provide 3-4 specific, compelling reasons in a list format.
            Focus on business value and practical benefits.
            """
            
            response = self.client.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a business location expert. Provide specific, actionable reasons for business location suitability."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.5
            )
            
            reasons_text = response.choices[0].message.content
            # Split by lines and clean up
            reasons = [reason.strip("- ").strip() for reason in reasons_text.split('\n') if reason.strip()]
            return reasons[:4]  # Limit to 4 reasons
            
        except Exception as e:
            logger.error(f"OpenAI reason enhancement failed: {e}")
            return self._fallback_reasons(area_name, metrics, search_context)
    
    def _fallback_reasons(
        self, 
        area_name: str, 
        metrics: Dict, 
        search_context: SearchContext
    ) -> List[str]:
        """Fallback reasons when OpenAI is not available."""
        reasons = []
        
        pop_density = metrics.get('population_density', 0)
        business_density = metrics.get('business_density', 0)
        transport_score = metrics.get('transport_score', 0)
        
        if pop_density > 10000:
            reasons.append("High population density - great for foot traffic")
        elif pop_density > 7000:
            reasons.append("Good population density for business")
        
        if business_density > 80:
            reasons.append("High business density - established commercial area")
        elif business_density > 60:
            reasons.append("Moderate business density - growing commercial area")
        
        if transport_score > 8:
            reasons.append("Excellent public transportation access")
        elif transport_score > 6:
            reasons.append("Good public transportation connectivity")
        
        if not reasons:
            reasons.append("Good business potential based on local metrics")
        
        return reasons

# Global OpenAI service instance
openai_service = OpenAIService()
