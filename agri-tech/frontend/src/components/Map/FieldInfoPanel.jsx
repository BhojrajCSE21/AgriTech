import React, { useState, useEffect } from 'react';
import { weatherAPI, fieldsAPI } from '../../services/api';
import NDVILegend from './NDVILegend';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

function FieldInfoPanel({ field, onClose, onAnalyze, onDelete, analyzing, mapMode, setMapMode }) {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [soilMoisture, setSoilMoisture] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [logType, setLogType] = useState('Planted');
  const [logNotes, setLogNotes] = useState('');
  const [logLoading, setLogLoading] = useState(false);
  const [displayLogs, setDisplayLogs] = useState(field?.logs || []);
  const hasVisualTileUrls = (field?.tileUrls || []).some(
    (url) => typeof url === 'string' && url.trim()
  );
  const hasNdviTileUrls = (field?.ndviTileUrls || []).some(
    (url) => typeof url === 'string' && url.trim()
  );


  useEffect(() => {
    setDisplayLogs(field?.logs || []);
  }, [field?.logs]);

  useEffect(() => {
    if (field && field.centroid) {
      const fetchWeather = async () => {
        setWeatherLoading(true);
        try {
          const res = await weatherAPI.getCurrent(field.centroid.lat, field.centroid.lng);
          setWeather(res.data.current);
          if (res.data.hourly && res.data.hourly.soil_moisture_0_to_7cm) {
            setSoilMoisture(res.data.hourly.soil_moisture_0_to_7cm[0]);
          }

          const forecastRes = await weatherAPI.getForecast(field.centroid.lat, field.centroid.lng);
          setForecast(forecastRes.data.daily);
        } catch (err) {
          console.error("Failed to fetch weather data");
        } finally {
          setWeatherLoading(false);
        }
      };
      fetchWeather();
    } else {
      setWeather(null);
    }
  }, [field?.centroid]);

  if (!field) {
    return (
      <div className="card field-empty-card">
        <div className="field-empty-icon">📍</div>
        <p style={{ color: '#475569', margin: 0 }}>
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

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!logNotes.trim()) return;

    setLogLoading(true);
    try {
      const res = await fieldsAPI.addLog(field._id, { type: logType, notes: logNotes });
      setDisplayLogs(res.data.logs);
      setLogNotes('');
    } catch (err) {
      console.error("Failed to add log");
    } finally {
      setLogLoading(false);
    }
  };



  return (
    <div className="card field-details-card" style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sticky Header */}
      <div className="field-details-header">
        <div>
          <div className="field-details-kicker">Precision Plot</div>
          <h5 style={{ margin: 0 }}>Field Details</h5>
        </div>
        <button
          onClick={onClose}
          className="field-close-button"
          style={{
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ×
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={{ padding: '0 12px 12px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="field-meta-grid">
          <div className="field-meta-cell">
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Field Name</label>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{field.name}</div>
          </div>
          <div className="field-meta-cell">
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Crop Type</label>
            <div style={{ fontSize: '14px' }}>{field.cropType}</div>
          </div>
          <div className="field-meta-cell">
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Area</label>
            <div style={{ fontSize: '14px' }}>{field.area} ha</div>
          </div>
          <div className="field-meta-cell">
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Growth</label>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>{field.growthStage || 'Planted'}</div>
          </div>
        </div>

        <div className="metric-panel" style={{
          background: field.ndvi ? `linear-gradient(135deg, ${getNDVIColor(field.ndvi)}15, ${getNDVIColor(field.ndvi)}30)` : '#f3f4f6',
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          border: field.ndvi ? `1px solid ${getNDVIColor(field.ndvi)}50` : '1px solid var(--border-color)',
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
          {field.satelliteImage && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Satellite View</label>
                {hasVisualTileUrls && (
                  <div className="segmented-control" style={{ display: 'flex', background: '#e2e8f0', borderRadius: '4px', padding: '2px' }}>
                    <button
                      onClick={() => setMapMode('visual')}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        border: 'none',
                        background: mapMode === 'visual' ? 'white' : 'transparent',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        boxShadow: mapMode === 'visual' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      👁️ True Color
                    </button>
                    {hasNdviTileUrls && (
                      <button
                        onClick={() => setMapMode('ndvi')}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          border: 'none',
                          background: mapMode === 'ndvi' ? 'white' : 'transparent',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          boxShadow: mapMode === 'ndvi' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        🌡️ Heatmap
                      </button>
                    )}
                  </div>
                )}
              </div>
              <img 
                className="satellite-preview"
                src={mapMode === 'ndvi' && field.ndviThumbnail ? field.ndviThumbnail : field.satelliteImage} 
                alt="Satellite thumbnail" 
                style={{ width: '100%', borderRadius: '5px', marginTop: '5px', border: '1px solid #ddd' }} 
              />
            </div>
          )}

          {field.ndviHistory && field.ndviHistory.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Growth Trend (6 Months)</label>
              <div style={{ height: '150px', width: '100%', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={field.ndviHistory}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey="date" 
                      hide={true}
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      hide={true}
                    />
                    <Tooltip 
                      labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      formatter={(value) => [value.toFixed(2), 'NDVI']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorScore)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>


        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Health Score</label>
            <span style={{ fontSize: '12px', fontWeight: '500' }}>{field.healthScore || 0}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              flex: 1,
              height: '6px',
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
          </div>
        </div>
        {/* Weather Card */}
        <div style={{
          background: '#f8fafc',
          padding: '10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e2e8f0',
          marginTop: '5px'
        }}>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '10px', textTransform: 'uppercase' }}>Live Weather (Open-Meteo)</label>
          {weatherLoading ? (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Loading weather...</div>
          ) : weather ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌡️</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{weather.temperature_2m}°C</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Temp</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>💧</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{weather.relative_humidity_2m}%</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Humidity</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🌊</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{soilMoisture ? (soilMoisture * 100).toFixed(1) : '--'}%</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Soil Moisture</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>
                  {weather.weather_code <= 3 ? '☀️' : weather.weather_code < 60 ? '☁️' : '🌧️'}
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {weather.weather_code <= 3 ? 'Clear' : weather.weather_code < 60 ? 'Cloudy' : 'Rain'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Condition</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>No weather data available</div>
          )}

          {forecast && (
            <div style={{ marginTop: '15px' }}>
              <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>5-Day Forecast</label>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '8px', 
                overflowX: 'auto', 
                paddingBottom: '5px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
              }}>
                {forecast.time.slice(1, 6).map((time, i) => (
                  <div key={time} style={{ 
                    minWidth: '60px', 
                    background: '#f1f5f9', 
                    padding: '8px 5px', 
                    borderRadius: '6px', 
                    textAlign: 'center',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {new Date(time).toLocaleDateString(undefined, { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '16px', marginBottom: '4px' }}>
                      {forecast.weather_code[i+1] <= 3 ? '☀️' : forecast.weather_code[i+1] < 60 ? '☁️' : '🌧️'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                      {Math.round(forecast.temperature_2m_max[i+1])}°
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>
                      {Math.round(forecast.temperature_2m_min[i+1])}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



        <div style={{ marginTop: '10px' }}>
          <label style={{ fontWeight: 'bold', color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>Activity Logbook</label>
          <form onSubmit={handleAddLog} style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                <option value="Planted">🌱 Planted</option>
                <option value="Fertilized">🧪 Fertilized</option>
                <option value="Irrigated">💧 Irrigated</option>
                <option value="Pesticide">🐛 Pesticide</option>
                <option value="Harvested">🚜 Harvested</option>
              </select>
              <button 
                type="submit" 
                disabled={logLoading || !logNotes.trim()}
                style={{
                  padding: '6px 12px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  opacity: (logLoading || !logNotes.trim()) ? 0.7 : 1
                }}
              >
                Add
              </button>
            </div>
            <textarea
              placeholder="Add notes..."
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                minHeight: '40px',
                resize: 'none',
                outline: 'none'
              }}
            />
          </form>

          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayLogs.length > 0 ? (
              displayLogs.slice(0, 3).map((log, index) => (
                <div key={index} style={{ 
                  background: 'white', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid #f1f5f9',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 'bold' }}>{log.type}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ color: '#475569', fontSize: '11px' }}>{log.notes}</div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                No activities logged yet
              </div>
            )}
          </div>
        </div>

        {/* Removed extra NDVI History text to save space */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '5px' }}>
          <button
            onClick={onAnalyze}
            className="btn-modern"
            disabled={!field._id || analyzing}
            style={{ width: '100%', padding: '8px', fontSize: '13px', opacity: (!field._id || analyzing) ? 0.7 : 1 }}
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
              className="btn-danger-modern"
              style={{ width: '100%', padding: '6px', fontSize: '12px' }}
            >
              Delete Field
            </button>
          )}
        </div>

        {/* Legend inside the panel */}
        <div style={{ marginTop: '5px' }}>
          <NDVILegend />
        </div>

      </div>
    </div>
  );
}

export default FieldInfoPanel;
