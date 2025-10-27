import React, { useEffect, useState } from 'react';
import MapByFinalDate from './MapByFinalDate'; // adjust if your path differs

const FallSemesterMapCarousel = ({ universities }) => {
  return (
    <div style={{ overflowX: 'auto', display: 'flex', gap: '2rem', padding: '2rem 0' }}>
      <div style={{ minWidth: '400px', flexShrink: 0 }}>
        <MapByFinalDate
          universities={universities}
          dateKey="First Day of Classes Fall 2025"
          label="Start of Fall 2025"
          viewMode="spring"
        />
      </div>
      <div style={{ minWidth: '400px', flexShrink: 0 }}>
        <MapByFinalDate
          universities={universities}
          dateKey="Last Day of Finals Week in Fall 2025"
          label="Finals End - Fall 2025"
          viewMode="spring"
        />
      </div>
    </div>
  );
};

export default FallSemesterMapCarousel;
