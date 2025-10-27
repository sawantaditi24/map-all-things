// src/components/BlogPreview.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const posts = [
  {
    title: 'When Do Colleges Start Fall 2025?',
    snippet: 'A complete guide to start dates across major U.S. universities...',
    path: '/blog'
  },
  {
    title: 'Top 25 Most Expensive College Towns',
    snippet: 'We analyzed rent, groceries, and utilities to find the priciest cities...',
    path: '/blog'
  },
  {
    title: 'Finals Week Travel Tips for Students',
    snippet: 'Find the cheapest days to book flights around university calendars...',
    path: '/blog'
  }
];

const BlogPreview = () => (
  <section style={{ padding: '3rem 2rem', background: '#fff' }}>
    <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>From the Blog</h2>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        justifyContent: 'center'
      }}
    >
      {posts.map((post, idx) => (
        <Link
          key={idx}
          to={post.path}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div
            style={{
              width: '320px',
              border: '1px solid #eee',
              borderRadius: '10px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              backgroundColor: '#fafafa'
            }}
          >
            <h3>{post.title}</h3>
            <p>{post.snippet}</p>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default BlogPreview;
