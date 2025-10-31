import React, { useState, useEffect } from 'react';
import { Search, Star, Users, Building, Car } from 'lucide-react';
import AdvancedFiltersContent from '../bi/AdvancedFiltersContent';
import SportsVenuesMap from '../components/SportsVenuesMap';

const BusinessIntegration = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [useAISearch, setUseAISearch] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapMetric, setHeatMapMetric] = useState('business_density');
  const [mounted, setMounted] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let endpoint = '/search';
      let body;

      // Use AI search if enabled and no advanced filters
      if (useAISearch && !activeFilters) {
        endpoint = '/search/ai';
        body = {
          query: searchQuery || 'show best areas',
          business_type: businessType
        };
      } else if (activeFilters) {
        // Use advanced search if filters are active
        endpoint = '/search/advanced';
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
        setLocations([]);
        return;
      }

      const data = await resp.json();
      console.log('Search response:', data);
      
      if (!data.success) {
        console.error('Search response indicates failure:', data);
        setLocations([]);
        return;
      }

      const recs = (data?.data?.recommendations || []);
      console.log('Found recommendations:', recs.length);
      setLocations(recs);
      if (recs.length > 0) setSelectedLocation(recs[0]);
      
      // Capture AI insights if available
      if (data?.data?.ai_insights) {
        setAiInsights(data.data.ai_insights);
      } else {
        setAiInsights(null);
      }
    } catch (e) {
      console.error('Failed to fetch recommendations', e);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3"></div>
                Search Locations
              </h2>
              
              {/* Search Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What are you looking for?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g., Find areas good for coffee shops"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="retail">Retail</option>
                    <option value="service">Service</option>
                  </select>
                </div>

                {/* AI Search Toggle */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">AI-Powered Search</div>
                      <div className="text-xs text-gray-600">Enhanced recommendations</div>
                    </div>
                  </div>
                  {mounted && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAISearch}
                        onChange={(e) => setUseAISearch(e.target.checked)}
                        className="sr-only peer"
                        disabled={!!activeFilters}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                    </label>
                  )}
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 px-4 rounded-xl hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      <span>Search Locations</span>
                    </>
                  )}
                </button>

              </div>

              {/* AI Insights */}
              {aiInsights && (
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">AI Insights</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Intent:</span>
                      <span className="ml-2 text-gray-600">{aiInsights.user_intent}</span>
                    </div>
                    {aiInsights.location_preferences?.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Preferences:</span>
                        <span className="ml-2 text-gray-600">{aiInsights.location_preferences.join(', ')}</span>
                      </div>
                    )}
                    {aiInsights.business_requirements?.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Requirements:</span>
                        <span className="ml-2 text-gray-600">{aiInsights.business_requirements.join(', ')}</span>
                      </div>
                    )}
                    <div className="text-xs text-purple-600 font-medium">
                      {aiInsights.ai_available ? '✓ AI Analysis Active' : '⚠ AI Fallback Mode'}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Filters - Always Visible */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full mr-2"></div>
                  Advanced Filters
                </h3>
                <div className="max-h-[400px] overflow-y-auto">
                  <AdvancedFiltersContent
                    onApplyFilters={handleApplyFilters}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Panel - Unified Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
              {/* Map Controls */}
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showHeatMap}
                      onChange={(e) => setShowHeatMap(e.target.checked)}
                      className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Business Heat Map</span>
                  </label>
                </div>
                
                {showHeatMap && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Metric:</label>
                    <select
                      value={heatMapMetric}
                      onChange={(e) => setHeatMapMetric(e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="business_density">Business Density</option>
                      <option value="population_density">Population Density</option>
                      <option value="transport_score">Transport Score</option>
                    </select>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span>High Score</span>
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Medium</span>
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Low</span>
                </div>
              </div>
              
              {/* Unified Map with Olympic Venues + Business Intelligence */}
              <div className="h-[500px] lg:h-[700px] xl:h-[800px] rounded-lg overflow-hidden">
                <SportsVenuesMap 
                  businessLocations={locations}
                  onBusinessLocationClick={handleLocationClick}
                  showBusinessHeatMap={showHeatMap}
                  businessHeatMapMetric={heatMapMetric}
                  activeFilters={activeFilters}
                />
              </div>
            </div>
          </div>

          {/* Right Panel - Recommendations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-pink-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3"></div>
                Recommended Locations
              </h3>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
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

        {/* Location Details Panel */}
        {selectedLocation && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-pink-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <div className="w-2 h-8 bg-gradient-to-b from-pink-500 to-pink-600 rounded-full mr-3"></div>
                {selectedLocation.area} - Business Analysis
              </h3>
              <div className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${getScoreBgColor(selectedLocation.score)} ${getScoreColor(selectedLocation.score)}`}>
                Score: {selectedLocation.score}/10
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <div className="w-1 h-5 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full mr-2"></div>
                  Key Metrics
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg">
                    <div className="p-2 bg-pink-500 rounded-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Population Density</p>
                      <p className="font-bold text-gray-900">{selectedLocation.population_density} people/sq mi</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                    <div className="p-2 bg-gray-600 rounded-lg">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Density</p>
                      <p className="font-bold text-gray-900">{selectedLocation.business_density} businesses</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-black to-gray-800 rounded-lg">
                    <div className="p-2 bg-black rounded-lg">
                      <Car className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-300">Transport Score</p>
                      <p className="font-bold text-white">{selectedLocation.transport_score}/10</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="md:col-span-2">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-1 h-5 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full mr-2"></div>
                  Why This Area?
                </h4>
                <div className="space-y-3">
                  {selectedLocation.reasons.map((reason, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg">
                      <div className="p-1 bg-pink-500 rounded-full mt-0.5 flex-shrink-0">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default BusinessIntegration;
