'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded-md p-2"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden md:block font-medium">{user.full_name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            
            <div className="px-4 py-2">
              <div className="flex items-center text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full mr-2 ${user.is_verified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                {user.is_verified ? 'Verified' : 'Pending Verification'}
              </div>
            </div>

            <div className="border-t border-gray-100">
              <button
                onClick={() => {
                  // TODO: Implement profile settings
                  alert('Profile settings coming soon!');
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile Settings
              </button>
              
              <button
                onClick={() => {
                  // TODO: Implement search history
                  alert('Search history coming soon!');
                  setIsDropdownOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Search History
              </button>
              
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
