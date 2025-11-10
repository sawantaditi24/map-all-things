// src/pages/Home.js
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import MapByFinalDate from '../components/MapByFinalDate';
import SpringBreakRangeMap from '../components/SpringBreakRangeMap';
import StudentHousingCostMap from '../components/StudentHousingCostMap';
import SalesTaxMap from '../components/SalesTaxMap';
import TransitStopsMap from '../components/TransitStopsMap';
import TransitSavingsInfo from '../components/TransitSavingsInfo';
import AIUniversitiesMap from '../components/AIUniversitiesMap';
import BusinessIntegration from './BusinessIntegration';

const Tooltip = ({ text }) => (
  <span className="relative group inline-block ml-2">
    <span className="text-gray-500 cursor-pointer">❔</span>
    <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64
                     bg-white text-gray-700 text-sm border border-gray-200 rounded-lg p-2
                     shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
      {text}
    </span>
  </span>
);

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [universities, setUniversities] = useState([]);
  const [aiUniversities, setAIUniversities] = useState([]);
  
  // Get active tab from URL, default to 'semester' if not present
  const activeTab = searchParams.get('tab') || 'semester';
  
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    fetch('/University_Long_Lat2_rev3.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setUniversities)
      .catch(() => setUniversities([]));

    fetch('/AI_University_Rankings.json')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(setAIUniversities)
      .catch(() => setAIUniversities([]));
  }, []);

  const tabConfigs = [
    {
      key: 'semester',
      label: '🎓 Semester Maps',
      activeClass: 'bg-blue-600 text-white',
      inactiveClass: 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50',
    },
    {
      key: 'living',
      label: '🏠 Living Costs',
      activeClass: 'bg-green-600 text-white',
      inactiveClass: 'bg-white border border-green-300 text-green-600 hover:bg-green-50',
    },
    {
      key: 'ai',
      label: '🤖 AI Universities',
      activeClass: 'bg-indigo-600 text-white',
      inactiveClass: 'bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-50',
    },
    {
      key: 'transit',
      label: '🚆 Transit Stops',
      activeClass: 'bg-purple-600 text-white',
      inactiveClass: 'bg-white border border-purple-300 text-purple-600 hover:bg-purple-50',
    },
    {
      key: 'business',
      label: '🏅 LA 2028 Olympics',
      activeClass: 'bg-red-600 text-white',
      inactiveClass: 'bg-white border border-red-300 text-red-600 hover:bg-red-50',
    },

  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 text-gray-800">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabConfigs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`min-w-[140px] px-4 py-2 rounded-full text-sm md:text-base font-semibold transition whitespace-nowrap ${
                activeTab === tab.key ? tab.activeClass : tab.inactiveClass
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Semester Schedule */}
        {activeTab === 'semester' && (
          <div className="flex flex-col gap-8">
            <MapByFinalDate
              universities={universities}
              dateKey="First Day of Classes Fall 2025"
              label="Start of Fall 2025 Semester"
            />
            <MapByFinalDate
              universities={universities}
              dateKey="Last Day of Finals Week in Fall 2025"
              label="End of Fall 2025 Semester"
            />
            <MapByFinalDate
              universities={universities}
              dateKey="First Day of Classes Spring 2026"
              label="Start of Spring 2026 Semester"
            />
            <MapByFinalDate
              universities={universities}
              dateKey="Last Day of Finals Week in Spring 2026"
              label="End of Spring 2026 Semester"
            />
            <SpringBreakRangeMap universities={universities} />
          </div>
        )}

        {/* Living Costs */}
        {activeTab === 'living' && (
          <div className="flex flex-col gap-8">
            <StudentHousingCostMap universities={universities} />
            <SalesTaxMap />
          </div>
        )}

        {/* AI Universities */}
        {activeTab === 'ai' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              🤖 U.S. Universities Offering Graduate Degrees in Artificial Intelligence (AI) 
              <Tooltip text="Top 25 universities in the U.S. ranked by U.S. News for Artificial Intelligence programs." />
            </h3>
            <AIUniversitiesMap data={aiUniversities} />
          </div>
        )}

        {/* Transit Stops */}
        {activeTab === 'transit' && (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              🚆 Transit Friendly Colleges and Universities
              <Tooltip text="Number of transit stops within 1 mile of campus." />
            </h3>
            <TransitStopsMap />
            <div className="mt-6"><TransitSavingsInfo /></div>
          </div>
        )}

        {/* LA 2028 Olympics - Business Intelligence Integration */}
        {activeTab === 'business' && (
          <BusinessIntegration />
        )}
      </div>
    </div>
  );
}
