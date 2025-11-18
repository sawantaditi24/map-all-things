import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import AdvancedFiltersContent from '../bi/AdvancedFiltersContent';
import SportsVenuesMap from '../components/SportsVenuesMap';

const BusinessIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null); // For real-time updates
  const useAISearch = true; // AI search always enabled
  const [aiInsights, setAiInsights] = useState(null);
  const [error, setError] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // Debug: Log API URL (remove in production)
  useEffect(() => {
    console.log('🔍 API URL being used:', apiUrl);
    console.log('🔍 Environment variable REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    
    // Warn if using localhost in production
    if (apiUrl.includes('localhost') && window.location.hostname !== 'localhost') {
      console.error('⚠️ WARNING: Using localhost API URL on deployed site!');
      console.error('⚠️ Set REACT_APP_API_URL in Netlify environment variables to your Render backend URL');
      setError('⚠️ API URL not configured correctly. Using localhost. Please set REACT_APP_API_URL in Netlify environment variables.');
    }
  }, [apiUrl]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      let endpoint = '/search';
      let body;

      // Use AI search only if:
      // 1. AI search is enabled
      // 2. No advanced filters are active
      // 3. User has provided an actual search query (not just default)
      const hasUserQuery = searchQuery && searchQuery.trim() && searchQuery !== 'show best areas';
      
      if (useAISearch && !activeFilters && hasUserQuery) {
        endpoint = '/search/ai';
        body = {
          query: searchQuery,
          business_type: businessType
        };
      } else if (activeFilters) {
        // Use advanced search if filters are active
        endpoint = '/search/advanced';
        const radiusMinValue = activeFilters.radiusMilesMin !== undefined && activeFilters.radiusMilesMin !== null ? activeFilters.radiusMilesMin : null;
        const radiusMaxValue = activeFilters.radiusMilesMax !== undefined && activeFilters.radiusMilesMax !== null ? activeFilters.radiusMilesMax : null;
        console.log('🔍 Applying filters with radius_miles_min:', radiusMinValue, 'radius_miles_max:', radiusMaxValue);
        const apartmentCountMin = activeFilters.apartmentCountMin === 0 ? null : activeFilters.apartmentCountMin;
        const apartmentCountMax = activeFilters.apartmentCountMax === 500000 ? null : activeFilters.apartmentCountMax;
        console.log('🏠 Apartment filter - min:', apartmentCountMin, 'max:', apartmentCountMax, 'raw:', activeFilters.apartmentCountMax);
        body = {
          search_query: { 
            query: searchQuery || 'show best areas', 
            business_type: businessType 
          },
          filters: {
            population_density_min: activeFilters.populationDensityMin === 0 ? null : activeFilters.populationDensityMin,
            population_density_max: activeFilters.populationDensityMax === 20000 ? null : activeFilters.populationDensityMax,
            business_density_min: activeFilters.businessDensityMin === 0 ? null : activeFilters.businessDensityMin,
            business_density_max: activeFilters.businessDensityMax === 150 ? null : activeFilters.businessDensityMax,
            transport_score_min: activeFilters.transportScoreMin === 0 ? null : activeFilters.transportScoreMin,
            transport_score_max: activeFilters.transportScoreMax === 10 ? null : activeFilters.transportScoreMax,
            apartment_count_min: apartmentCountMin,
            apartment_count_max: apartmentCountMax,
            radius_miles_min: radiusMinValue,
            radius_miles_max: radiusMaxValue,
          }
        };
      } else {
        // Regular search format
        body = {
          query: searchQuery || 'show best areas',
          business_type: businessType,
          filters: {}
        };
      }

      const resp = await fetch(`${apiUrl.replace(/\/$/, '')}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`Search request failed with status ${resp.status}:`, errorText);
        setError(`API Error (${resp.status}): ${errorText || 'Unknown error'}`);
        setLocations([]);
        setLoading(false);
        return;
      }

      const data = await resp.json();
      console.log('Search response:', data);
      
      if (!data.success) {
        console.error('Search response indicates failure:', data);
        setError(data.message || 'Search failed - no recommendations found');
        setLocations([]);
        setLoading(false);
        return;
      }

      const recs = (data?.data?.recommendations || []);
      console.log('Found recommendations:', recs.length);
      setLocations(recs);
      if (recs.length > 0) setSelectedLocation(recs[0]);
      
      // Capture AI insights if available
      if (data?.data?.ai_insights) {
        console.log('🤖 AI Insights received:', data.data.ai_insights);
        console.log('🤖 AI Available:', data.data.ai_insights.ai_available);
        setAiInsights(data.data.ai_insights);
        
        // Log warning if AI is not available
        if (!data.data.ai_insights.ai_available) {
          console.warn('⚠️ AI Fallback Mode: OpenAI API key not configured on backend');
        } else {
          console.log('✅ AI Analysis Active: OpenAI is working correctly');
        }
      } else {
        setAiInsights(null);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
      setError(`Network Error: ${e.message || 'Failed to connect to backend. Check console for details.'}`);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    console.log('📋 Filters applied:', filters);
    console.log('🏠 Apartment count in filters:', filters.apartmentCountMax);
    setActiveFilters(filters);
    setCurrentFilters(filters); // Also update current filters
  };

  const handleFilterChange = (filters) => {
    // Update current filters in real-time for dynamic marker size
    setCurrentFilters(filters);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setCurrentFilters(null); // Also clear current filters for real-time updates
  };

  useEffect(() => {
    // initial load
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Refetch when filters change
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilters]);

  const handleSearch = async () => {
    await fetchRecommendations();
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
      <div className="w-full max-w-none mx-auto px-0 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Panel - Search & Filters */}
          <div className="lg:col-span-1">
            {/* Search Locations Section - Hidden from UI but code preserved for future use */}
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-3 hidden">
              <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-2"></div>
                Search Locations
              </h2>
              
              {/* Search Input */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    What are you looking for?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. areas for cake shops"
                      className="w-full pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail</option>
                    <option value="service">Service</option>
                    <option value="education">Education</option>
                  </select>
                </div>

                {/* AI Search Info - Always Enabled */}
                <div className="flex items-center p-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900">AI-Powered Search</div>
                      <div className="text-xs text-gray-600">Enhanced recommendations enabled</div>
                    </div>
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-2 px-3 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs font-medium shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5" />
                      <span>Search Locations</span>
                    </>
                  )}
                </button>

              </div>

              {/* AI Insights */}
              {aiInsights && (
                <div className="mt-3 p-2.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <h3 className="text-xs font-semibold text-gray-900">AI Insights</h3>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="font-medium text-gray-700">Intent:</span>
                      <span className="ml-1.5 text-gray-600">{aiInsights.user_intent}</span>
                    </div>
                    {aiInsights.location_preferences?.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Preferences:</span>
                        <span className="ml-1.5 text-gray-600">{aiInsights.location_preferences.join(', ')}</span>
                      </div>
                    )}
                    {aiInsights.business_requirements?.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Requirements:</span>
                        <span className="ml-1.5 text-gray-600">{aiInsights.business_requirements.join(', ')}</span>
                      </div>
                    )}
                    <div className="text-xs text-purple-600 font-medium">
                      {aiInsights.ai_available ? '✓ AI Analysis Active' : '⚠ AI Fallback Mode'}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Advanced Filters - Visible Section */}
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-3 mt-4">
              <h3 className="text-xs font-medium text-gray-700 mb-2 flex items-center">
                <div className="w-1 h-3 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full mr-2"></div>
                Advanced Filters
              </h3>
              <div className="max-h-[400px] overflow-y-auto">
                <AdvancedFiltersContent
                  onApplyFilters={handleApplyFilters}
                  onClearFilters={handleClearFilters}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Center-Right Panel - Unified Map (expanded) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
              {/* Map Title */}
              <h2 className="text-sm font-semibold text-gray-900 mb-1.5 flex items-center">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-2"></div>
                Interactive Map
              </h2>
              
              {/* Unified Map with Olympic Venues + Business Intelligence */}
              <div className="h-[600px] lg:h-[900px] xl:h-[1000px] rounded-lg overflow-hidden">
                <SportsVenuesMap 
                  businessLocations={locations}
                  onBusinessLocationClick={handleLocationClick}
                  showBusinessHeatMap={false}
                  businessHeatMapMetric={null}
                  activeFilters={currentFilters || activeFilters} // Use currentFilters for real-time updates
                />
              </div>
              
              {/* Recommended Locations Panel - Directly Below Map */}
              <div className="mt-6">
                <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-2"></div>
                    Recommended Locations
                  </h3>
                  
                  {/* Error Display */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium">⚠️ Error</p>
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                      <p className="text-xs text-red-500 mt-2">
                        Check browser console (F12) for details. Verify REACT_APP_API_URL in Netlify environment variables.
                      </p>
                    </div>
                  )}
                  
                  {/* Loading State */}
                  {loading && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <p className="text-sm text-blue-800">Loading recommendations...</p>
                    </div>
                  )}
                  
                  {/* Empty State */}
                  {!loading && !error && locations.length === 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-sm text-yellow-800">No recommendations found</p>
                      <p className="text-xs text-yellow-600 mt-1">Try adjusting your search or filters</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
                    {locations.map((location, index) => (
                      <div
                        key={index}
                        onClick={() => handleLocationClick(location)}
                        className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-all duration-200 transform hover:scale-105 ${
                          selectedLocation?.area === location.area 
                            ? 'border-pink-300 bg-gradient-to-r from-pink-50 to-pink-100 shadow-lg' 
                            : 'border-gray-200 hover:border-pink-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{location.area}</h4>
                            <p className="text-sm text-gray-600">
                              {location.business_density} businesses • {location.population_density} people/sq mi
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreBgColor(location.score)} ${getScoreColor(location.score)}`}>
                            {location.score}/10
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default BusinessIntegration;
