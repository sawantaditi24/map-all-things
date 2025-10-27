import React from 'react';
import LoanCalculator from '../components/LoanCalculator';

const Tools = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-blue-700 mb-8">
          🧮 Financial Tools for Smarter College Planning
        </h1>

        <div className="bg-white p-6 md:p-10 rounded-xl shadow-lg">
          <LoanCalculator />
        </div>
      </div>
    </div>
  );
};

export default Tools;
