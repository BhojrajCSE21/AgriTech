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
    <div className="ndvi-legend" style={{
      background: 'white',
      padding: '15px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginTop: '10px'
    }}>
      <h6 style={{ marginBottom: '10px', fontWeight: 'bold' }}>NDVI Legend</h6>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {legendItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '20px',
              height: '20px',
              backgroundColor: item.color,
              borderRadius: '3px',
              border: '1px solid #ddd'
            }} />
            <div style={{ fontSize: '12px' }}>
              <span style={{ fontWeight: 'bold' }}>{item.range}</span>
              <span style={{ color: '#666', marginLeft: '5px' }}>{item.meaning}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NDVILegend;