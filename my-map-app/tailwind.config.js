module.exports = {
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
      "./public/index.html",
    ],
  },
  safelist: [
    'bg-blue-600', 'border-blue-300', 'text-blue-600', 'hover:bg-blue-50',
    'bg-green-600', 'border-green-300', 'text-green-600', 'hover:bg-green-50',
    'bg-purple-600', 'border-purple-300', 'text-purple-600', 'hover:bg-purple-50',
    'bg-red-600', 'border-red-300', 'text-red-600', 'hover:bg-red-50',
    'bg-yellow-500', 'border-yellow-300', 'text-yellow-500', 'hover:bg-yellow-50',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
