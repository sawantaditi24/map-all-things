// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tools from './pages/Tools';
import CampusNewsMap from './components/CampusNewsMap'; // ← your existing working map component
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Homepage */}
        <Route path="/" element={<Home />} />

        {/* Tools page */}
        <Route path="/tools" element={<Tools />} />

        {/* Campus News map */}
        <Route path="/news" element={<CampusNewsMap />} />

        {/* About & Contact */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
