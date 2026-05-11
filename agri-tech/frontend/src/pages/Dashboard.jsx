import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    fields: 3,
    healthyCrops: 88.9,
    activeSensors: 12,
    temperature: 24.5
  });

  return (
    <div className="dashboard">
      <h2 style={{ marginBottom: '20px' }}>Dashboard</h2>

      <div className="row">
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Total Fields</h6>
            <h3>{stats.fields}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Crop Health</h6>
            <h3>{stats.healthyCrops}%</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Active Sensors</h6>
            <h3>{stats.activeSensors}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3">
            <h6>Temperature</h6>
            <h3>{stats.temperature}°C</h3>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Field Performance</h5>
            <p>Field 1: 88.9% health - Shooting phase</p>
            <p>Field 2: 92.3% health - Tillering phase</p>
            <p>Field 3: 78.5% health - Flowering phase</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Recent Alerts</h5>
            <p>Low moisture detected in Field 3</p>
            <p>Temperature spike in Field 1</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;