// src/components/HeroSection.jsx
import React from 'react';

const HeroSection = () => {
  return (
    <section className="bg-gradient-to-r from-blue-100 to-green-100 py-10 px-6 text-center rounded-3xl shadow-lg">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-semibold italic text-teal-700 leading-snug tracking-wide mb-4 drop-shadow-sm">
          The Ultimate Map Hub for U.S. Colleges & Campus Life
        </h1>
        <p className="text-sm md:text-lg text-gray-600 font-medium leading-relaxed">
          Discover everything you need to know—academic calendars, living costs, transit access, LA 2028 Olympic venues and more — visualized on beautiful, interactive maps. Make smarter, faster decisions for your college journey.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
