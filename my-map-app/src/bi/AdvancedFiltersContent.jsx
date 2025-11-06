import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ReactSlider from 'react-slider';

const AdvancedFiltersContent = ({ onApplyFilters, onClearFilters, onFilterChange }) => {
  const [filters, setFilters] = useState({
    populationDensityMin: 0,
    populationDensityMax: 20000,
    businessDensityMin: 0,
    businessDensityMax: 150,
    transportScoreMin: 0,
    transportScoreMax: 10,
    radiusMilesMin: 0, // Minimum radius in miles
    radiusMilesMax: 100, // Maximum radius in miles
  });
  const [expandedSections, setExpandedSections] = useState({
    population: true,
    business: true,
    transport: true,
    radius: true,
  });

  const handleDualRangeChange = (fieldPrefix, values) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [`${fieldPrefix}Min`]: values[0],
        [`${fieldPrefix}Max`]: values[1]
      };
      // Notify parent of filter changes in real-time
      if (onFilterChange) {
        onFilterChange(newFilters);
      }
      return newFilters;
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters({
      populationDensityMin: 0,
      populationDensityMax: 20000,
      businessDensityMin: 0,
      businessDensityMax: 150,
      transportScoreMin: 0,
      transportScoreMax: 10,
      radiusMilesMin: 0,
      radiusMilesMax: 100,
    });
    onClearFilters();
  };

  return (
    <div className="space-y-6">
      {/* Radius from Olympic Venues Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('radius')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">Distance from Olympic Venues (miles)</h3>
          {expandedSections.radius ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.radius && (
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Range</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.radiusMilesMin.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">-</span>
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.radiusMilesMax.toFixed(1)} miles
                  </span>
                </div>
              </div>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                min={0}
                max={100}
                step={1}
                value={[filters.radiusMilesMin, filters.radiusMilesMax]}
                onChange={(values) => handleDualRangeChange('radiusMiles', values)}
                ariaLabel={['Minimum radius', 'Maximum radius']}
                pearling
                minDistance={0.5}
              />
            </div>
            <div className="text-xs text-gray-500">
              Show locations within {filters.radiusMilesMin.toFixed(1)} - {filters.radiusMilesMax.toFixed(1)} miles of Olympic venues. Marker size scales with maximum radius. Darker pink + solid = higher score.
            </div>
          </div>
        )}
      </div>

      {/* Population Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('population')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">Population Density (per sq mi)</h3>
          {expandedSections.population ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.population && (
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Range</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.populationDensityMin.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">-</span>
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.populationDensityMax.toLocaleString()}
                  </span>
                </div>
              </div>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                min={0}
                max={20000}
                step={100}
                value={[filters.populationDensityMin, filters.populationDensityMax]}
                onChange={(values) => handleDualRangeChange('populationDensity', values)}
                ariaLabel={['Minimum population density', 'Maximum population density']}
                pearling
                minDistance={100}
              />
            </div>
            <div className="text-xs text-gray-500">
              Typical range: 2,000 - 20,000 people per square mile
            </div>
          </div>
        )}
      </div>

      {/* Business Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('business')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">Business Density</h3>
          {expandedSections.business ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.business && (
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Range</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.businessDensityMin}
                  </span>
                  <span className="text-sm text-gray-400">-</span>
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.businessDensityMax}
                  </span>
                </div>
              </div>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                min={0}
                max={150}
                step={1}
                value={[filters.businessDensityMin, filters.businessDensityMax]}
                onChange={(values) => handleDualRangeChange('businessDensity', values)}
                ariaLabel={['Minimum business density', 'Maximum business density']}
                pearling
                minDistance={1}
              />
            </div>
            <div className="text-xs text-gray-500">
              Scale: 0-150 (higher = more businesses per area)
            </div>
          </div>
        )}
      </div>

      {/* Transport Score Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('transport')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">Transportation Score</h3>
          {expandedSections.transport ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        {expandedSections.transport && (
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">Range</label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.transportScoreMin.toFixed(1)}
                  </span>
                  <span className="text-sm text-gray-400">-</span>
                  <span className="text-sm font-semibold text-pink-600">
                    {filters.transportScoreMax.toFixed(1)}
                  </span>
                </div>
              </div>
              <ReactSlider
                className="horizontal-slider"
                thumbClassName="slider-thumb"
                trackClassName="slider-track"
                min={0}
                max={10}
                step={0.1}
                value={[filters.transportScoreMin, filters.transportScoreMax]}
                onChange={(values) => handleDualRangeChange('transportScore', values)}
                ariaLabel={['Minimum transport score', 'Maximum transport score']}
                pearling
                minDistance={0.1}
              />
            </div>
            <div className="text-xs text-gray-500">
              Scale: 0-10 (higher = better public transportation)
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handleClear}
          className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 transition-colors duration-200"
        >
          Clear All
        </button>
        <div className="flex space-x-3">
          <button
            onClick={handleApply}
            className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:from-pink-700 hover:to-purple-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersContent;


