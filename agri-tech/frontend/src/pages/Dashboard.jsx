import React, { useState, useEffect } from 'react';
import { fieldsAPI } from '../services/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';

function Dashboard() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await fieldsAPI.getAll();
      setFields(res.data);
    } catch (err) {
      console.error('Failed to fetch fields', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px' }}>Loading Dashboard Data...</div>;
  }

  if (error) {
    return <div style={{ padding: '24px', color: 'red' }}>{error}</div>;
  }

  // Analytics Computation
  const totalFields = fields.length;
  
  const totalArea = fields.reduce((sum, f) => sum + (f.area || 0), 0).toFixed(2);
  
  const analyzedFields = fields.filter(f => f.ndvi != null);
  const avgHealth = analyzedFields.length > 0 
    ? (analyzedFields.reduce((sum, f) => sum + (f.healthScore || 0), 0) / analyzedFields.length).toFixed(1)
    : 0;

  const atRiskFields = fields.filter(f => f.ndvi != null && f.ndvi < 0.4).length;

  // Crop Breakdown Computation
  const cropDistribution = fields.reduce((acc, f) => {
    acc[f.cropType] = (acc[f.cropType] || 0) + (f.area || 0);
    return acc;
  }, {});


  const pieData = Object.entries(cropDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Health Distribution Computation
  const healthDistribution = [
    { name: 'Excellent', count: fields.filter(f => f.ndvi >= 0.8).length, color: '#15803d' },
    { name: 'Good', count: fields.filter(f => f.ndvi >= 0.6 && f.ndvi < 0.8).length, color: '#22c55e' },
    { name: 'Moderate', count: fields.filter(f => f.ndvi >= 0.4 && f.ndvi < 0.6).length, color: '#eab308' },
    { name: 'Poor', count: fields.filter(f => f.ndvi < 0.4 && f.ndvi != null).length, color: '#f59e0b' },
  ];

  const getNDVIColor = (ndvi) => {
    if (!ndvi) return '#999';
    if (ndvi < 0.2) return '#ef4444'; // Red
    if (ndvi < 0.4) return '#f59e0b'; // Orange
    if (ndvi < 0.6) return '#eab308'; // Yellow
    if (ndvi < 0.8) return '#22c55e'; // Light Green
    return '#15803d'; // Dark Green
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
    <div style={{ padding: '10px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Farm Overview</h2>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Total Area Managed</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalArea} <span style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>ha</span>
          </div>
        </div>
        
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Fields Tracked</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalFields}
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: avgHealth > 70 ? '4px solid #10b981' : '4px solid #f59e0b' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>Avg Health Score</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {avgHealth}%
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: atRiskFields > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', fontWeight: 600 }}>At-Risk Fields</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: atRiskFields > 0 ? '#ef4444' : 'var(--text-primary)', marginTop: '8px' }}>
            {atRiskFields} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>requiring attention</span>
          </div>
        </div>
      </div>



      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Field Performance List */}
        <div className="card" style={{ padding: '24px' }}>
          <h5 style={{ fontWeight: 600, marginBottom: '20px' }}>Field Health Performance</h5>
          {fields.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No fields added yet. Go to the Map to draw your fields.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fields.map(f => (
                <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{f.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.cropType} • {f.area?.toFixed(2)} ha</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: getNDVIColor(f.ndvi) }}>
                        {f.healthScore ? `${f.healthScore}%` : 'N/A'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {getNDVIStatus(f.ndvi)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crop Distribution Pie Chart */}
        <div className="card" style={{ padding: '24px', height: 'fit-content' }}>
          <h5 style={{ fontWeight: 600, marginBottom: '20px' }}>Crop Distribution (ha)</h5>
          {pieData.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No crops defined.</p>
          ) : (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Health Distribution Row */}
      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <h5 style={{ fontWeight: 600, marginBottom: '20px' }}>Farm Health Overview</h5>
        <div style={{ height: '250px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={healthDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <RechartsTooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {healthDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;