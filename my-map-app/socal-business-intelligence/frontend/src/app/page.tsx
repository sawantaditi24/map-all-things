'use client';

import { useState, useEffect } from 'react';
import EnhancedMapComponent from '@/components/EnhancedMapComponent';
import AdvancedFiltersContent, { FilterState } from '@/components/AdvancedFiltersContent';
import BlurOverlay from '@/components/BlurOverlay';
import LoginModal from '@/components/auth/LoginModal';
import RegisterModal from '@/components/auth/RegisterModal';
import UserProfile from '@/components/auth/UserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, MapPin, Star, Users, Building, Car, LogIn, UserPlus } from 'lucide-react';

interface LocationData {
  area: string;
  score: number;
  reasons: string[];
  coordinates: [number, number];
  business_density: number;
  population_density: number;
  transport_score: number;
}

export default function Home() {
  const { user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [businessType, setBusinessType] = useState('restaurant');
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterState | null>(null);
  const [useAISearch, setUseAISearch] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapMetric, setHeatMapMetric] = useState<'business_density' | 'population_density' | 'transport_score'>('business_density');
  const [mounted, setMounted] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let endpoint = '/search';
      let body: any;

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
            counties: activeFilters.counties.length > 0 ? activeFilters.counties : null,
            population_density_min: activeFilters.populationDensityMin,
            population_density_max: activeFilters.populationDensityMax,
            business_density_min: activeFilters.businessDensityMin,
            business_density_max: activeFilters.businessDensityMax,
            transport_score_min: activeFilters.transportScoreMin,
            transport_score_max: activeFilters.transportScoreMax,
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
          'Content-Type': 'application/json', 
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(body)
      });
      const data = await resp.json();
      const recs = (data?.data?.recommendations || []) as LocationData[];
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
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters: FilterState) => {
    setActiveFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setShowFilters(false);
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

  const handleLocationClick = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 via-pink-900 to-black shadow-lg border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
                       <div className="p-2 bg-pink-500 rounded-lg">
                         <MapPin className="h-8 w-8 text-white" />
                       </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  SoCal Business Intelligence
                </h1>
                <div className="text-sm text-pink-200 font-medium">
                  Find the perfect location for your business
                </div>
              </div>
            </div>
            
            {/* Authentication Section - Hidden for initial phase */}
            {/* 
            <div className="flex items-center space-x-4">
              {user ? (
                <UserProfile />
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-white bg-pink-600 hover:bg-pink-700 rounded-md transition duration-200"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-pink-600 bg-white hover:bg-gray-50 rounded-md transition duration-200"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              )}
            </div>
            */}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Panel */}
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

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`w-full flex items-center justify-center space-x-2 py-2 transition-colors duration-200 rounded-lg ${
                    activeFilters 
                      ? 'bg-pink-100 text-pink-700 border border-pink-300' 
                      : 'text-gray-600 hover:text-pink-600'
                  }`}
                >
                           <Filter className="h-4 w-4" />
                  <span>
                    {activeFilters ? 'Filters Active' : 'Advanced Filters'}
                    {activeFilters && (
                      <span className="ml-2 bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                        {Object.values(activeFilters).filter(v => v !== null && (Array.isArray(v) ? v.length > 0 : true)).length}
                      </span>
                    )}
                  </span>
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

              {/* Results List */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <div className="w-1 h-4 bg-gradient-to-b from-pink-400 to-pink-500 rounded-full mr-2"></div>
                  Recommended Locations
                </h3>
                <div className="space-y-3">
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

          {/* Map */}
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
                    <span className="text-sm font-medium text-gray-700">Heat Map</span>
                  </label>
                </div>
                
                {showHeatMap && (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Metric:</label>
                    <select
                      value={heatMapMetric}
                      onChange={(e) => setHeatMapMetric(e.target.value as any)}
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
              
              <div className="h-96 lg:h-[600px] rounded-lg overflow-hidden">
                <EnhancedMapComponent
                  locations={locations}
                  onLocationClick={handleLocationClick}
                  activeFilters={activeFilters}
                  showHeatMap={showHeatMap}
                  heatMapMetric={heatMapMetric}
                />
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

      {/* Advanced Filters with Blur Overlay */}
      <BlurOverlay
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Advanced Search Filters"
      >
        <AdvancedFiltersContent
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
        />
      </BlurOverlay>

      {/* Authentication Modals - Hidden for initial phase */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />
      
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />
    </div>
  );
}