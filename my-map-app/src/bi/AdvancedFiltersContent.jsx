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
    population: false,
    business: false,
    transport: false,
    radius: false,
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
    <div className="space-y-2">
      {/* Radius from Olympic Venues Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('radius')}
          className="w-full flex items-center justify-between p-2.5 text-left hover:bg-gray-50"
        >
          <h3 className="text-sm font-semibold text-gray-900">Distance from Olympic Venues</h3>
          {expandedSections.radius ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.radius && (
          <div className="px-2.5 pb-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max: 0 - {filters.radiusMilesMax.toFixed(1)} miles</label>
            </div>
            <ReactSlider
              className="horizontal-slider single-value-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              min={0}
              max={100}
              step={1}
              value={filters.radiusMilesMax}
              onChange={(value) => {
                setFilters(prev => {
                  const newFilters = {
                    ...prev,
                    radiusMilesMin: 0,
                    radiusMilesMax: value
                  };
                  if (onFilterChange) {
                    onFilterChange(newFilters);
                  }
                  return newFilters;
                });
              }}
              ariaLabel="Maximum radius"
            />
            <button
              onClick={handleApply}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Population Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('population')}
          className="w-full flex items-center justify-between p-2.5 text-left hover:bg-gray-50"
        >
          <h3 className="text-sm font-semibold text-gray-900">Population Density</h3>
          {expandedSections.population ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.population && (
          <div className="px-2.5 pb-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max: 0 - {filters.populationDensityMax.toLocaleString()} per sq mi</label>
            </div>
            <ReactSlider
              className="horizontal-slider single-value-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              min={0}
              max={20000}
              step={100}
              value={filters.populationDensityMax}
              onChange={(value) => {
                setFilters(prev => {
                  const newFilters = {
                    ...prev,
                    populationDensityMin: 0,
                    populationDensityMax: value
                  };
                  if (onFilterChange) {
                    onFilterChange(newFilters);
                  }
                  return newFilters;
                });
              }}
              ariaLabel="Maximum population density"
            />
            <button
              onClick={handleApply}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Business Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('business')}
          className="w-full flex items-center justify-between p-2.5 text-left hover:bg-gray-50"
        >
          <h3 className="text-sm font-semibold text-gray-900">Business Density</h3>
          {expandedSections.business ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.business && (
          <div className="px-2.5 pb-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max: 0 - {filters.businessDensityMax}</label>
            </div>
            <ReactSlider
              className="horizontal-slider single-value-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              min={0}
              max={150}
              step={1}
              value={filters.businessDensityMax}
              onChange={(value) => {
                setFilters(prev => {
                  const newFilters = {
                    ...prev,
                    businessDensityMin: 0,
                    businessDensityMax: value
                  };
                  if (onFilterChange) {
                    onFilterChange(newFilters);
                  }
                  return newFilters;
                });
              }}
              ariaLabel="Maximum business density"
            />
            <button
              onClick={handleApply}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Transport Score Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('transport')}
          className="w-full flex items-center justify-between p-2.5 text-left hover:bg-gray-50"
        >
          <h3 className="text-sm font-semibold text-gray-900">Transportation</h3>
          {expandedSections.transport ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {expandedSections.transport && (
          <div className="px-2.5 pb-2.5">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-gray-700">Max: 0 - {filters.transportScoreMax.toFixed(1)}</label>
            </div>
            <ReactSlider
              className="horizontal-slider single-value-slider"
              thumbClassName="slider-thumb"
              trackClassName="slider-track"
              min={0}
              max={10}
              step={0.1}
              value={filters.transportScoreMax}
              onChange={(value) => {
                setFilters(prev => {
                  const newFilters = {
                    ...prev,
                    transportScoreMin: 0,
                    transportScoreMax: value
                  };
                  if (onFilterChange) {
                    onFilterChange(newFilters);
                  }
                  return newFilters;
                });
              }}
              ariaLabel="Maximum transport score"
            />
            <button
              onClick={handleApply}
              className="w-full mt-2 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg hover:from-pink-600 hover:to-pink-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 shadow-sm"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 mt-3">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 transition-colors duration-200"
        >
          Clear All
        </button>
        <div className="flex space-x-2">
          <button
            onClick={handleApply}
            className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg hover:from-pink-700 hover:to-purple-700 focus:ring-2 focus:ring-pink-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFiltersContent;


