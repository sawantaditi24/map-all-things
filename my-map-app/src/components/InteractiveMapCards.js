import React from 'react';
import { Link } from 'react-router-dom';

const maps = [
  { title: 'University Calendar Map', path: '/calendar', description: 'Start dates, finals, and breaks for 2025–2026' },
  { title: 'Student Housing Cost Map', path: '/student-housing', description: 'Monthly off-campus living costs by location' },
  { title: 'Finals Week Travel Planner', path: '/maps', description: 'Plan best dates to travel after finals' },
];

const InteractiveMapCards = () => {
  return (
    <section style={{ padding: '3rem 2rem', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Interactive Maps</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {maps.map((map, idx) => (
          <Link key={idx} to={map.path} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              border: '1px solid #ddd',
              borderRadius: '10px',
              width: '280px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}>
              <h3>{map.title}</h3>
              <p>{map.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default InteractiveMapCards;
