import React from 'react';
import { Link } from 'react-router-dom';

const tools = [
  { name: 'Loan Repayment Calculator', path: '/tools', description: 'Estimate your loan payments and interest' },
  { name: 'University Cost Comparison', path: '/tools', description: 'Compare tuition, housing, and travel expenses' },
  { name: 'Calendar Fit Finder', path: '/calendar', description: 'Align academic schedules with personal plans' },
];

const SmartTools = () => {
  return (
    <section style={{ padding: '3rem 2rem', background: '#f8f9fa' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Smart Planning Tools</h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
        {tools.map((tool, idx) => (
          <Link key={idx} to={tool.path} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              border: '1px solid #ccc',
              borderRadius: '10px',
              width: '280px',
              padding: '1.5rem',
              backgroundColor: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <h3>{tool.name}</h3>
              <p>{tool.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SmartTools;
