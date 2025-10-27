'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AdvancedFiltersContentProps {
  onApplyFilters: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export interface FilterState {
  counties: string[];
  populationDensityMin: number | null;
  populationDensityMax: number | null;
  businessDensityMin: number | null;
  businessDensityMax: number | null;
  transportScoreMin: number | null;
  transportScoreMax: number | null;
}

export default function AdvancedFiltersContent({ onApplyFilters, onClearFilters }: AdvancedFiltersContentProps) {
  const [counties, setCounties] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    counties: [],
    populationDensityMin: null,
    populationDensityMax: null,
    businessDensityMin: null,
    businessDensityMax: null,
    transportScoreMin: null,
    transportScoreMax: null,
  });
  const [expandedSections, setExpandedSections] = useState({
    county: true,
    population: true,
    business: true,
    transport: true,
  });

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Fetch available counties
    const fetchCounties = async () => {
      try {
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/counties`);
        const data = await response.json();
        if (data.success) {
          setCounties(data.data.counties);
        }
      } catch (error) {
        console.error('Failed to fetch counties:', error);
      }
    };
    fetchCounties();
  }, [apiUrl]);

  const handleCountyChange = (county: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      counties: checked 
        ? [...prev.counties, county]
        : prev.counties.filter(c => c !== county)
    }));
  };

  const handleRangeChange = (field: keyof FilterState, value: number | null) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
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
      counties: [],
      populationDensityMin: null,
      populationDensityMax: null,
      businessDensityMin: null,
      businessDensityMax: null,
      transportScoreMin: null,
      transportScoreMax: null,
    });
    onClearFilters();
  };

  return (
    <div className="space-y-6">
      {/* County Filter */}
      <div className="border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('county')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold text-gray-900">County</h3>
                 {expandedSections.county ? (
                   <ChevronUp className="h-5 w-5 text-gray-500" />
                 ) : (
                   <ChevronDown className="h-5 w-5 text-gray-500" />
                 )}
        </button>
        {expandedSections.county && (
          <div className="px-4 pb-4 space-y-2">
            {counties.map((county) => (
              <label key={county} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={filters.counties.includes(county)}
                  onChange={(e) => handleCountyChange(county, e.target.checked)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{county}</span>
              </label>
            ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                <input
                  type="number"
                  value={filters.populationDensityMin || ''}
                  onChange={(e) => handleRangeChange('populationDensityMin', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 5000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                <input
                  type="number"
                  value={filters.populationDensityMax || ''}
                  onChange={(e) => handleRangeChange('populationDensityMax', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 15000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                <input
                  type="number"
                  value={filters.businessDensityMin || ''}
                  onChange={(e) => handleRangeChange('businessDensityMin', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                <input
                  type="number"
                  value={filters.businessDensityMax || ''}
                  onChange={(e) => handleRangeChange('businessDensityMax', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Scale: 0-100 (higher = more businesses per area)
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.transportScoreMin || ''}
                  onChange={(e) => handleRangeChange('transportScoreMin', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 5.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.transportScoreMax || ''}
                  onChange={(e) => handleRangeChange('transportScoreMax', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="e.g., 10.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
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
}
