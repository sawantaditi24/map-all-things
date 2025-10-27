import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">

      <div className="space-x-2 text-gray-700 font-medium flex flex-wrap items-center">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg transition ${
              isActive
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
            }`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/tools"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg transition ${
              isActive
                ? 'bg-green-600 text-white font-semibold shadow'
                : 'bg-white border border-green-400 text-green-600 hover:bg-green-50'
            }`
          }
        >
          Student Loan Calculator
        </NavLink>

        <NavLink
             to="/news"
            className={({ isActive }) =>
  `px-4 py-2 rounded-lg transition ${
    isActive
      ? 'bg-blue-600 text-white font-semibold shadow'
      : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
             }`
          }
            >
          Campus News
        </NavLink>




        <NavLink
          to="/contact"
          className={({ isActive }) =>
            `px-4 py-2 rounded-lg transition ${
              isActive
                ? 'bg-blue-600 text-white font-semibold shadow'
                : 'bg-white border border-blue-300 text-blue-600 hover:bg-blue-50'
            }`
          }
        >
          Contact
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
