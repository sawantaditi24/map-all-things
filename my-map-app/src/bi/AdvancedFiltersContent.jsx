import React, { useState } from 'react';
import ReactSlider from 'react-slider';

const AdvancedFiltersContent = ({ onApplyFilters, onClearFilters, onFilterChange }) => {
  const [filters, setFilters] = useState({
    populationDensityMin: 0,
    populationDensityMax: 20000,
    businessDensityMin: 0,
    businessDensityMax: 150,
    transportScoreMin: 0,
    transportScoreMax: 10,
    apartmentCountMin: 0,
    apartmentCountMax: 500000,
    radiusMilesMin: 0, // Minimum radius in miles
    radiusMilesMax: 100, // Maximum radius in miles
  });

  const handleClear = () => {
    setFilters({
      populationDensityMin: 0,
      populationDensityMax: 20000,
      businessDensityMin: 0,
      businessDensityMax: 150,
      transportScoreMin: 0,
      transportScoreMax: 10,
      apartmentCountMin: 0,
      apartmentCountMax: 500000,
      radiusMilesMin: 0,
      radiusMilesMax: 100,
    });
    onClearFilters();
  };

  return (
    <div className="space-y-2">
      {/* Radius from Olympic Venues Filter */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-2.5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Distance from Olympic Venues</h3>
          <div className="mb-1.5">
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
                // Apply filters dynamically
                if (onApplyFilters) {
                  onApplyFilters(newFilters);
                }
                return newFilters;
              });
            }}
            ariaLabel="Maximum radius"
          />
        </div>
      </div>

      {/* Population Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-2.5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Population Density</h3>
          <div className="mb-1.5">
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
                // Apply filters dynamically
                if (onApplyFilters) {
                  onApplyFilters(newFilters);
                }
                return newFilters;
              });
            }}
            ariaLabel="Maximum population density"
          />
        </div>
      </div>

      {/* Business Density Filter */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-2.5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Business Density</h3>
          <div className="mb-1.5">
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
                // Apply filters dynamically
                if (onApplyFilters) {
                  onApplyFilters(newFilters);
                }
                return newFilters;
              });
            }}
            ariaLabel="Maximum business density"
          />
        </div>
      </div>

      {/* Transport Score Filter */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-2.5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Transportation</h3>
          <div className="mb-1.5">
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
                // Apply filters dynamically
                if (onApplyFilters) {
                  onApplyFilters(newFilters);
                }
                return newFilters;
              });
            }}
            ariaLabel="Maximum transport score"
          />
        </div>
      </div>

      {/* Apartment Count Filter */}
      <div className="border border-gray-200 rounded-lg">
        <div className="p-2.5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Number of Apartments</h3>
          <div className="mb-1.5">
            <label className="text-xs font-medium text-gray-700">Max: 0 - {filters.apartmentCountMax.toLocaleString()} units</label>
          </div>
          <ReactSlider
            className="horizontal-slider single-value-slider"
            thumbClassName="slider-thumb"
            trackClassName="slider-track"
            min={0}
            max={500000}
            step={1000}
            value={filters.apartmentCountMax}
            onChange={(value) => {
              setFilters(prev => {
                const newFilters = {
                  ...prev,
                  apartmentCountMin: 0,
                  apartmentCountMax: value
                };
                if (onFilterChange) {
                  onFilterChange(newFilters);
                }
                // Apply filters dynamically
                if (onApplyFilters) {
                  onApplyFilters(newFilters);
                }
                return newFilters;
              });
            }}
            ariaLabel="Maximum apartment count"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-start pt-3 border-t border-gray-200 mt-3">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-pink-500 transition-colors duration-200"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default AdvancedFiltersContent;


