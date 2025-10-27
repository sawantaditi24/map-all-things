import React from 'react';
import { Link } from 'react-router-dom';

const footerStyle = {
  padding: '2rem',
  background: '#f1f1f1',
  textAlign: 'center',
  marginTop: '2rem',
};

const linkStyle = {
  margin: '0 1rem',
  color: '#333',
  textDecoration: 'none',
};

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div>
        <Link to="/about" style={linkStyle}>About</Link>
        <Link to="/contact" style={linkStyle}>Contact</Link>
        <Link to="/blog" style={linkStyle}>Blog</Link>
      </div>
      <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
        &copy; {new Date().getFullYear()} MapAllThings.com
      </p>
    </footer>
  );
};

export default Footer;
