import React, { useState, useEffect, useRef } from 'react';
import { fieldsAPI, aiAPI, marketAPI } from '../services/api';

const DEFAULT_CROP_DATA = {
  'Winter Wheat': { yieldPerHa: 3.5, pricePerTon: 244 },
  'Corn': { yieldPerHa: 10.5, pricePerTon: 184 },
  'Soybeans': { yieldPerHa: 3.2, pricePerTon: 446 },
  'Rice': { yieldPerHa: 4.8, pricePerTon: 550 },
};
const MARKET_DATE = "May 13, 2026";

const getSeverityColor = (severity) => {
  if (!severity || severity === 'None') return '#15803d';
  if (severity === 'Low') return '#ca8a04';
  if (severity === 'Moderate') return '#ea580c';
  return '#dc2626';
};

function AICenter() {
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [weather, setWeather] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);

  // Scanner state
  const [aiPreview, setAiPreview] = useState(null);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fieldsRes, marketRes] = await Promise.all([
          fieldsAPI.getAll(),
          marketAPI.getPrices()
        ]);
        setFields(fieldsRes.data);
        setLivePrices(marketRes.data);
        if (fieldsRes.data.length > 0) setSelectedField(fieldsRes.data[0]);
      } catch (err) {
        console.error('Data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedField || !selectedField.location) return;
      try {
        const [lng, lat] = selectedField.location.coordinates;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m`);
        const data = await res.json();
        setWeather(data.current);
      } catch (err) {
        console.error('Weather fetch failed');
      }
    };
    fetchWeather();
  }, [selectedField]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedField) return;

    const preview = URL.createObjectURL(file);
    setAiPreview(preview);
    setAiScanning(true);
    setAiResult(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('cropType', selectedField.cropType);
    formData.append('symptoms', symptoms);

    try {
      const res = await aiAPI.analyzeCrop(formData);
      setAiResult(res.data);
      setScanHistory(prev => [{
        preview,
        result: res.data,
        field: selectedField.name,
        cropType: selectedField.cropType,
        date: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 4)]);
    } catch (err) {
      const errData = err.response?.data;
      if (err.response?.status === 503 && errData?.retryAfter) {
        setAiResult({
          disease: '⏳ Model Warming Up...',
          confidence: 0,
          severity: 'None',
          isError: true,
          treatments: ['The AI model is loading (free tier cold start). Please wait ~20 seconds and click "New Scan" to try again.']
        });
      } else if (err.response?.status === 503 && errData?.setupInstructions) {
        setAiResult({
          disease: '🔑 Hugging Face Token Required',
          confidence: 0,
          severity: 'None',
          isError: true,
          treatments: errData.setupInstructions
        });
      } else {
        setAiResult({
          disease: 'Analysis Failed',
          confidence: 0,
          severity: 'None',
          isError: true,
          treatments: ['Please try uploading the image again.']
        });
      }
    } finally {
      setAiScanning(false);
    }
  };

  const resetScan = () => {
    setAiPreview(null);
    setAiResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Yield Prediction for selected field
  const getYieldForecast = (field) => {
    if (!field || !field.ndvi) return null;
    
    // Get live price or fallback to default
    const marketInfo = livePrices[field.cropType] || { pricePerTon: (DEFAULT_CROP_DATA[field.cropType]?.pricePerTon || 200) };
    const cropData = { ...DEFAULT_CROP_DATA[field.cropType], pricePerTon: marketInfo.pricePerTon };
    
    // 1. NDVI Health Modifier (0.2 to 1.0)
    let healthModifier = Math.min(1.0, Math.max(0.2, field.ndvi / 0.75));
    
    // 2. Real-time Weather Stress Factor
    let weatherStress = 1.0;
    if (weather) {
      const temp = weather.temperature_2m;
      const humidity = weather.relative_humidity_2m;
      
      // Heat Stress: Reduce yield if temp > 30°C
      if (temp > 30) weatherStress -= (temp - 30) * 0.02;
      // Cold Stress: Reduce yield if temp < 5°C
      if (temp < 5) weatherStress -= (5 - temp) * 0.05;
      // Humidity Stress (Disease Risk): Reduce yield if humidity > 85%
      if (humidity > 85) weatherStress -= 0.05;
      
      weatherStress = Math.max(0.5, weatherStress); // Cap stress at 50% loss
    }

    const tons = field.area * cropData.yieldPerHa * healthModifier * weatherStress;
    const revenue = tons * cropData.pricePerTon;
    return { tons, revenue, cropData, weatherStress };
  };

  const allFieldsYield = fields.map(f => {
    const forecast = getYieldForecast(f);
    return { ...f, forecast };
  });

  const totalTons = allFieldsYield.reduce((s, f) => s + (f.forecast?.tons || 0), 0);
  const totalRevenue = allFieldsYield.reduce((s, f) => s + (f.forecast?.revenue || 0), 0);
  const selectedForecast = selectedField ? getYieldForecast(selectedField) : null;

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading AI Center...</div>;

  return (
    <div style={{ padding: '24px', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontWeight: 800, fontSize: '28px', color: '#0f172a', margin: 0 }}>
          🤖 AI Center
        </h2>
        <p style={{ color: '#64748b', marginTop: '6px', fontSize: '14px' }}>
          Powered by AI — Disease detection, yield predictions, and crop intelligence.
        </p>
      </div>

      {/* Field Selector */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontWeight: 600, fontSize: '13px', color: '#475569', display: 'block', marginBottom: '8px' }}>
          SELECT FIELD TO ANALYZE
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {fields.map(f => (
            <button
              key={f._id}
              onClick={() => { setSelectedField(f); resetScan(); }}
              style={{
                padding: '8px 16px',
                borderRadius: '24px',
                border: selectedField?._id === f._id ? '2px solid #10b981' : '2px solid #e2e8f0',
                background: selectedField?._id === f._id ? '#f0fdf4' : 'white',
                color: selectedField?._id === f._id ? '#065f46' : '#475569',
                fontWeight: selectedField?._id === f._id ? 700 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedField?._id === f._id ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none'
              }}
            >
              🌾 {f.name} <span style={{ opacity: 0.6 }}>({f.cropType})</span>
            </button>
          ))}
          {fields.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>No fields yet. Go to Field Map to add one.</p>
          )}
        </div>
      </div>

      {/* Global Market Ticker */}
      <div style={{ 
        background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)', 
        borderRadius: '12px', 
        padding: '12px 20px', 
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#10b981', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>LIVE MARKET</div>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>Global Commodity Prices <span style={{ opacity: 0.5, fontWeight: 400 }}>({MARKET_DATE})</span></div>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {Object.entries(livePrices).map(([name, data]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', opacity: 0.7 }}>{name}:</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>${data.pricePerTon}</span>
              <span style={{ fontSize: '11px', color: data.trend === 'up' ? '#4ade80' : '#f87171' }}>
                {data.trend === 'up' ? '▲' : '▼'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* AI Disease Scanner */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #f0f9ff 0%, #f0fdf4 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', color: '#0369a1' }}>🔬 Crop Disease Scanner</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Upload a leaf photo for AI diagnosis
                  {selectedField && <span style={{ color: '#0ea5e9' }}> — {selectedField.name} ({selectedField.cropType})</span>}
                </div>
              </div>
              {aiPreview && (
                <button onClick={resetScan} style={{ background: 'none', border: '1px solid #bae6fd', borderRadius: '8px', color: '#0ea5e9', fontSize: '12px', padding: '4px 10px', cursor: 'pointer' }}>
                  New Scan
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {!aiPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #bae6fd',
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: '#f8fafc',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <div style={{ fontWeight: 600, color: '#0369a1', fontSize: '15px' }}>Click to upload leaf photo</div>
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>JPG, PNG — any plant leaf or crop image</div>
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    FIELD OBSERVATIONS (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. yellow spots, dry leaves, insects seen..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>
            ) : (
              <div>
                {/* Preview + scan animation */}
                <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', height: '200px' }}>
                  <img src={aiPreview} alt="Uploaded crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {aiScanning && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,165,233,0.12)' }}>
                      <div style={{
                        position: 'absolute', left: 0, right: 0, height: '3px',
                        background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)',
                        animation: 'scan 1.8s ease-in-out infinite',
                        boxShadow: '0 0 12px #0ea5e9'
                      }} />
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'column', gap: '8px'
                      }}>
                        <div style={{ color: 'white', fontWeight: 700, fontSize: '14px', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                          🤖 Analyzing...
                        </div>
                        <div style={{ color: '#e0f2fe', fontSize: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                          Running disease detection model
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Result */}
                {aiResult && !aiScanning && (
                  <div>
                    <div style={{
                      padding: '16px',
                      borderRadius: '10px',
                      background: aiResult.severity === 'None' ? '#f0fdf4' : '#fff7ed',
                      border: `1px solid ${getSeverityColor(aiResult.severity)}30`,
                      marginBottom: '12px'
                    }}>
                      {aiResult.isVerified && (
                        <div style={{ 
                          background: '#ecfdf5', 
                          color: '#059669', 
                          padding: '6px 12px', 
                          borderRadius: '8px', 
                          fontSize: '11px', 
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '12px',
                          border: '1px solid #d1fae5'
                        }}>
                          🛡️ MULTI-MODEL VERIFIED
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 800, fontSize: '18px', color: getSeverityColor(aiResult.severity) }}>
                          {aiResult.disease}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                            {(aiResult.confidence * 100).toFixed(0)}% confidence
                          </span>
                          {aiResult.severity && aiResult.severity !== 'None' && (
                            <span style={{ background: `${getSeverityColor(aiResult.severity)}20`, color: getSeverityColor(aiResult.severity), fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                              {aiResult.severity} Risk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                        💊 Recommended Treatment
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {aiResult.treatments.map((t, i) => (
                          <li key={i} style={{ fontSize: '13px', color: '#334155' }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Yield Prediction for selected field */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'white' }}>📈 AI Yield Predictor</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {selectedField ? `Forecast for ${selectedField.name}` : 'Select a field to see forecast'}
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            {selectedForecast ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Big numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>Est. Harvest</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                      {selectedForecast.tons.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>tons</div>
                  </div>
                  <div style={{ background: 'linear-gradient(135deg, #f0f9ff, #dbeafe)', borderRadius: '12px', padding: '16px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase' }}>Est. Revenue</div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>
                      ${selectedForecast.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>USD</div>
                  </div>
                </div>

                {/* Breakdown */}
                <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Prediction Factors
                  </div>
                  {[
                    { label: 'Field Area', value: `${selectedField.area?.toFixed(2)} ha` },
                    { label: 'Crop Type', value: selectedField.cropType },
                    { label: 'Base Yield Rate', value: `${selectedForecast.cropData.yieldPerHa} t/ha` },
                    { label: 'NDVI Health Score', value: selectedField.ndvi ? selectedField.ndvi.toFixed(2) : 'Not analyzed' },
                    { 
                      label: 'Weather Stress Factor', 
                      value: <span style={{ color: selectedForecast.weatherStress < 1 ? '#ef4444' : '#10b981' }}>
                        {(selectedForecast.weatherStress * 100).toFixed(0)}% (Optimal: 100%)
                      </span> 
                    },
                    { label: 'Market Price', value: `$${selectedForecast.cropData.pricePerTon}/ton` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', marginBottom: '6px', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                      <span style={{ color: '#64748b' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {!selectedField.ndvi && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#92400e' }}>
                    ⚠️ Run "Analyze with Sentinel-2" on the Field Map to get an accurate NDVI-based prediction.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                <div style={{ fontSize: '14px' }}>Select a field to see the yield prediction</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Fields Summary + Scan History */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Scan History (Moved to Left under Scanner) */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>🗂️ Recent Scan History</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Last 5 diagnoses this session</div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {scanHistory.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔬</div>
                <div style={{ fontSize: '13px' }}>No scans yet. Upload a leaf image to get started.</div>
              </div>
            ) : scanHistory.map((scan, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #f8fafc' }}>
                <img src={scan.preview} alt="scan" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e2e8f0', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: getSeverityColor(scan.result.severity), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {scan.result.disease}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{scan.field} · {scan.cropType}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>{(scan.result.confidence * 100).toFixed(0)}%</div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1' }}>{scan.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Farm-Wide Yield Summary (Moved to Right under Yield Predictor) */}
        <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>🌾 Farm-Wide Yield Summary</div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total: <strong style={{ color: '#15803d' }}>{totalTons.toLocaleString(undefined, { maximumFractionDigits: 1 })} tons</strong></div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Revenue: <strong style={{ color: '#1e40af' }}>${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></div>
            </div>
          </div>
          <div style={{ padding: '8px 0' }}>
            {allFieldsYield.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No fields yet.</div>
            ) : allFieldsYield.map(f => (
              <div key={f._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #f8fafc' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{f.cropType} · {f.area?.toFixed(1)} ha</div>
                </div>
                {f.forecast ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#15803d' }}>{f.forecast.tons.toLocaleString(undefined, { maximumFractionDigits: 1 })} t</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>${f.forecast.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '10px' }}>Needs analysis</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICenter;
