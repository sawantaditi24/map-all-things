// src/pages/CampusNews.js
import React from 'react';
import CampusNewsMap from '../components/CampusNewsMap';  // ← use your existing map component

const CampusNews = () => (
  <div className="max-w-6xl mx-auto px-6 py-12">
    <h1 className="text-3xl font-bold mb-4">📰 Campus News & Investigations</h1>
    <p className="text-gray-700 mb-6">
      The U.S. Department of Education's Office for Civil Rights (OCR)
      has sent letters to 60 universities under investigation for
      antisemitic discrimination and harassment. Below is an interactive map of those schools.
    </p>
    <CampusNewsMap />
  </div>
);

export default CampusNews;
