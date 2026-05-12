import React from 'react';

function NDVILegend() {
  const legendItems = [
    { range: '< 0.2', meaning: 'Bare/Dead', color: '#FF0000' },
    { range: '0.2 - 0.4', meaning: 'Poor', color: '#FFA500' },
    { range: '0.4 - 0.6', meaning: 'Moderate', color: '#FFFF00' },
    { range: '0.6 - 0.8', meaning: 'Good', color: '#90EE90' },
    { range: '> 0.8', meaning: 'Excellent', color: '#228B22' }
  ];

  return (
    <div className="card" style={{
      padding: '10px',
      marginTop: '10px'
    }}>
      <h6 style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>NDVI Legend</h6>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {legendItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '45%' }}>
            <div style={{
              width: '14px',
              height: '14px',
              backgroundColor: item.color,
              borderRadius: '3px',
              border: '1px solid #ddd'
            }} />
            <div style={{ fontSize: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.range}</span>
              <span style={{ color: '#666', marginLeft: '3px' }}>{item.meaning}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NDVILegend;