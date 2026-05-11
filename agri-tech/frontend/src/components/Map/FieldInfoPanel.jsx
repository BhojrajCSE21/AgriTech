import React from 'react';

function FieldInfoPanel({ field, onClose, onAnalyze, onDelete, analyzing }) {
  if (!field) {
    return (
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📍</div>
        <p style={{ color: '#666', margin: 0 }}>
          Select a field from the map or draw a new one to see details
        </p>
      </div>
    );
  }

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
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 15px rgba(0,0,0,0.1)'
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Field Name</label>
          <div style={{ fontSize: '16px', fontWeight: '500' }}>{field.name}</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Crop Type</label>
          <div style={{ fontSize: '16px' }}>{field.cropType}</div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Area</label>
          <div style={{ fontSize: '16px' }}>{field.area} hectares</div>
        </div>

        <div style={{
          background: `linear-gradient(135deg, ${getNDVIColor(field.ndvi)}20, ${getNDVIColor(field.ndvi)}40)`,
          padding: '15px',
          borderRadius: '8px',
          border: `2px solid ${getNDVIColor(field.ndvi)}`
        }}>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>NDVI Score</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
            <span style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: getNDVIColor(field.ndvi)
            }}>
              {field.ndvi ? field.ndvi.toFixed(2) : '—'}
            </span>
            <span style={{
              padding: '4px 10px',
              backgroundColor: getNDVIColor(field.ndvi),
              color: 'white',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {getNDVIStatus(field.ndvi)}
            </span>
          </div>
          {field.lastAnalyzed && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>
              Analyzed: {new Date(field.lastAnalyzed).toLocaleDateString()}
            </div>
          )}
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Health Score</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1,
              height: '8px',
              background: '#e0e0e0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${field.healthScore || 0}%`,
                height: '100%',
                background: getNDVIColor(field.ndvi),
                transition: 'width 0.3s'
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{field.healthScore || 0}%</span>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Growth Stage</label>
          <div style={{ fontSize: '14px' }}>{field.growthStage || 'Planted'}</div>
        </div>

        {field.ndviHistory && field.ndviHistory.length > 0 && (
          <div>
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>NDVI History</label>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {field.ndviHistory.length} analysis{field.ndviHistory.length > 1 ? 'es' : ''} recorded
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
          <button
            onClick={onAnalyze}
            className="btn btn-success"
            disabled={!field._id || analyzing}
          >
            {analyzing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Analyzing...
              </>
            ) : (
              '🛰️ Analyze with Sentinel-2'
            )}
          </button>

          {field._id && (
            <button
              onClick={() => onDelete(field._id)}
              className="btn btn-outline-danger btn-sm"
            >
              🗑️ Delete Field
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FieldInfoPanel;