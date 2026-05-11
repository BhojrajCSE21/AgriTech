import React from 'react';

function FieldInfoPanel({ field, onClose, onAnalyze, analyzing }) {
  if (!field) return null;

  const getNDVIColor = (ndvi) => {
    if (!ndvi) return '#999';
    if (ndvi < 0.2) return '#FF0000';
    if (ndvi < 0.4) return '#FFA500';
    if (ndvi < 0.6) return '#FFFF00';
    if (ndvi < 0.8) return '#90EE90';
    return '#228B22';
  };

  const getNDVIStatus = (ndvi) => {
    if (!ndvi) return 'Not analyzed';
    if (ndvi < 0.2) return 'Bare/Dead';
    if (ndvi < 0.4) return 'Poor';
    if (ndvi < 0.6) return 'Moderate';
    if (ndvi < 0.8) return 'Good';
    return 'Excellent';
  };

  return (
    <div className="field-info-panel" style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h5 style={{ margin: 0 }}>Field Details</h5>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '12px' }}>Field Name</label>
          <div style={{ fontSize: '16px' }}>{field.name || 'Unnamed Field'}</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '12px' }}>Crop Type</label>
          <div style={{ fontSize: '16px' }}>{field.cropType || 'Winter Wheat'}</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '12px' }}>Area</label>
          <div style={{ fontSize: '16px' }}>{field.area || '0'} hectares</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '12px' }}>NDVI Score</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: getNDVIColor(field.ndvi)
            }}>
              {field.ndvi ? field.ndvi.toFixed(2) : '—'}
            </span>
            <span style={{
              padding: '2px 8px',
              backgroundColor: getNDVIColor(field.ndvi),
              color: 'white',
              borderRadius: '3px',
              fontSize: '12px'
            }}>
              {getNDVIStatus(field.ndvi)}
            </span>
          </div>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '10px',
          borderRadius: '5px'
        }}>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '12px' }}>Coordinates</label>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {field.geoJson?.geometry?.coordinates?.[0]?.[0] ?
              `${field.geoJson.geometry.coordinates[0][0][1].toFixed(4)}, ${field.geoJson.geometry.coordinates[0][0][0].toFixed(4)}` :
              'Drawing...'}
          </div>
        </div>

        <button
          onClick={onAnalyze}
          className="btn btn-success w-100"
          disabled={!field.geoJson || analyzing}
          style={{ marginTop: '10px' }}
        >
          {analyzing ? 'Analyzing with Sentinel-2...' : 'Analyze with Sentinel-2'}
        </button>
      </div>
    </div>
  );
}

export default FieldInfoPanel;