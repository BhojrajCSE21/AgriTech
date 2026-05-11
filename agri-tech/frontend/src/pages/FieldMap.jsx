import React, { useState } from 'react';
import MapWithDraw from '../components/Map/MapWithDraw';
import FieldInfoPanel from '../components/Map/FieldInfoPanel';
import NDVILegend from '../components/Map/NDVILegend';
import { FeatureGroup } from 'react-leaflet';

function FieldMap() {
  const [drawnItems, setDrawnItems] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldName, setFieldName] = useState('');
  const [cropType, setCropType] = useState('Winter Wheat');
  const [analyzing, setAnalyzing] = useState(false);

  const handleFieldCreate = ({ geoJson, area, layer }) => {
    setSelectedField({
      name: fieldName || `Field ${Date.now()}`,
      cropType,
      area,
      geoJson,
      layer,
      ndvi: null
    });
  };

  const handleFieldEdit = (geoJson, layer) => {
    setSelectedField(prev => ({
      ...prev,
      geoJson,
      layer
    }));
  };

  const handleAnalyze = async () => {
    if (!selectedField?.geoJson) return;

    setAnalyzing(true);

    // Simulate NDVI calculation (will connect to backend later)
    setTimeout(() => {
      const simulatedNDVI = 0.4 + Math.random() * 0.4;
      setSelectedField(prev => ({
        ...prev,
        ndvi: simulatedNDVI
      }));
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Field Map - Draw Your Farm</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Field name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="form-control"
            style={{ width: '200px' }}
          />
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="form-control"
            style={{ width: '150px' }}
          >
            <option value="Winter Wheat">Winter Wheat</option>
            <option value="Corn">Corn</option>
            <option value="Soybean">Soybean</option>
            <option value="Rice">Rice</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 200px)' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapWithDraw
            onFieldCreate={handleFieldCreate}
            onFieldEdit={handleFieldEdit}
            drawnItems={drawnItems}
          />

          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '10px 20px',
            borderRadius: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              Click polygon icon (top right) to draw • Use layer switcher (top left) to change map style
            </span>
          </div>
        </div>

        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <FieldInfoPanel
            field={selectedField}
            onClose={() => setSelectedField(null)}
            onAnalyze={handleAnalyze}
            analyzing={analyzing}
          />
          <NDVILegend />

          {selectedField?.ndvi && (
            <div style={{
              background: 'white',
              padding: '15px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h6 style={{ marginBottom: '10px' }}>Analysis Complete</h6>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                NDVI: <strong>{selectedField.ndvi.toFixed(2)}</strong>
              </p>
              <button
                onClick={handleAnalyze}
                className="btn btn-outline-success btn-sm w-100"
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FieldMap;