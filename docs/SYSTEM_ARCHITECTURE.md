# AgriTech - Precision Agriculture Platform

## System Architecture Document

---

## 1. Project Overview

**Project Name:** AgriTech - Precision Agriculture Platform

**Purpose:** A web-based agricultural monitoring system that uses satellite imagery, weather data, and AI to help farmers monitor crop health, predict yields, and optimize farming decisions.

**Target Users:**
- Small to medium-scale farmers
- Agricultural consultants
- AgriTech companies

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React.js 18 | UI Components |
| **Styling** | Bootstrap 5 | Responsive Design |
| **Maps** | Leaflet + OpenStreetMap | GPS Field Visualization |
| **Backend** | Node.js + Express | API Server |
| **Database** | MongoDB | Data Storage |
| **Real-time** | Socket.io | Live Sensor Updates |
| **Weather** | Open-Meteo API | Weather Data (Free) |
| **Satellite** | Microsoft Planetary Computer | Sentinel-2 Imagery (Free) |
| **AI** | TensorFlow.js / Python | Crop Health Analysis |
| **Auth** | JWT | User Authentication |
| **Deployment** | Vercel + Render | Hosting |

---

## 3. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USERS                                           │
│                         (Farmers/Agronomists)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React.js)                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐│
│  │ Dashboard │  │  Sensor  │  │  Weather  │  │Field Map  │  │ Settings ││
│  │   Panel   │  │  Panel   │  │ Forecast  │  │  (Leaflet)│  │          ││
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js + Express)                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        API Routes                                        ││
│  │  /api/fields    /api/sensors   /api/weather   /api/ai   /api/auth       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        ▼                           ▼                           ▼            │
│  ┌─────────┐                ┌───────────┐               ┌─────────────┐  │
│  │ Socket.io│               │ REST APIs │               │  AI Engine   │  │
│  │(WebSocket)│              │           │               │ (TensorFlow) │  │
│  └────┬────┘                └─────┬─────┘               └──────┬──────┘  │
└───────┼───────────────────────────┼─────────────────────────────┼──────────┘
        │                           │                             │
        │    ┌──────────────────────┴──────────────────────┐       │
        │    │                  DATABASE                   │       │
        │    │                (MongoDB)                   │       │
        │    │  ┌──────────┐ ┌──────────┐ ┌────────────┐ │       │
        │    │  │  Fields  │ │ Sensors  │ │ Readings   │ │       │
        │    │  └──────────┘ └──────────┘ └────────────┘ │       │
        │    │  ┌──────────┐ ┌──────────┐                │       │
        │    │  │WeatherLog│ │  Users   │                │       │
        │    │  └──────────┘ └──────────┘                │       │
        │    └────────────────────────────────────────────┘       │
        │                                                             │
        └──────────────┬────────────────────────────────────────────┘
                      │ External Data
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌────────────────────────┐    ┌─────────────────┐
│   EXTERNAL APIs  │    │    SATELLITE IMAGERY    │    │      AI/ML      │
│                  │    │                        │    │                 │
│  ┌────────────┐  │    │  ┌──────────────────┐  │    │ ┌─────────────┐ │
│  │  Open-Meteo │  │    │  │ Microsoft        │  │    │ │ TensorFlow  │ │
│  │  (Weather)  │  │    │  │ Planetary        │  │    │ │ Crop Disease│ │
│  │  FREE       │  │    │  │ Computer         │  │    │ │ Detection   │ │
│  └────────────┘  │    │  │ (Sentinel-2)     │  │    │ └─────────────┘ │
│                  │    │  │ FREE             │  │    │                 │
│  ┌────────────┐  │    │  └──────────────────┘  │    │ ┌─────────────┐ │
│  │ WeatherAPI │  │    │                        │    │ │ Yield       │ │
│  │ .com       │  │    │  ┌──────────────────┐  │    │ │ Prediction  │ │
│  │ (Backup)   │  │    │  │ Google Earth Eng. │  │    │ │ Model       │ │
│  └────────────┘  │    │  │ (Optional)        │  │    │ └─────────────┘ │
└──────────────────┘    │  └──────────────────┘  │    └─────────────────┘
                       └────────────────────────┘
```

---

## 4. Detailed Architecture Layers

### Layer 1: Client (Frontend)

```
Browser (Chrome/Firefox/Safari)
         │
         ▼
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │   React     │     │   React     │     │   React     │
   │  Dashboard  │     │  Field Map  │     │   Settings  │
   │  Component  │     │  Component  │     │   Component │
   └─────────────┘     └─────────────┘     └─────────────┘
         │                   │                   │
         └───────────────────┴───────────────────┘
                      │
               ┌──────▼──────┐
               │  Axios/Fetch │
               │  WebSocket   │
               └─────────────┘
```

### Layer 2: Server (Backend)

```
┌────────────────────────────────────────────────────────────┐
│              Node.js + Express Server                      │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │              API ROUTES                             │   │
│  │                                                    │   │
│  │  GET    /api/fields         → Get all fields      │   │
│  │  POST   /api/fields         → Create field        │   │
│  │  GET    /api/sensors        → Get sensor data     │   │
│  │  GET    /api/weather        → Get weather         │   │
│  │  POST   /api/upload         → Upload image (AI)   │   │
│  │  GET    /api/ai/crop-health → AI analysis result  │   │
│  │  POST   /api/auth/register  → User registration   │   │
│  │  POST   /api/auth/login     → User login          │   │
│  │                                                    │   │
│  └────────────────────────────────────────────────────┘   │
│                            │                               │
│  ┌───────────┬─────────────┴─────────────┬───────────┐    │
│  ▼           ▼                           ▼           ▼     │
│ ┌────────┐ ┌────────┐            ┌────────┐ ┌────────┐   │
│ │Field   │ │Sensor  │            │Weather │ │  AI    │   │
│ │Service │ │Service │            │Service │ │Service │   │
│ └────────┘ └────────┘            └────────┘ └────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    DATABASE     │ │  EXTERNAL APIs  │ │   AI MODELS     │
│    (MongoDB)    │ │                 │ │                 │
│                 │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ ┌─────────────┐ │ │ │  Open-Meteo │ │ │ │ TensorFlow  │ │
│ │   Fields    │ │ │ │  (Weather)  │ │ │ │  (Crop ID)  │ │
│ │  Collection │ │ │ └─────────────┘ │ │ └─────────────┘ │
│ └─────────────┘ │ │                 │ │                 │
│                 │ │ ┌─────────────┐ │ │ ┌─────────────┐ │
│ ┌─────────────┐ │ │ │ Planetary   │ │ │ │  scikit     │ │
│ │  Sensors    │ │ │ │ Computer    │ │ │ │  (Yield)    │ │
│ │  Collection │ │ │ │ (Sentinel-2)│ │ │ └─────────────┘ │
│ └─────────────┘ │ │ └─────────────┘ │ │                 │
│                 │ │                 │ │                 │
│ ┌─────────────┐ │ └─────────────────┘ └─────────────────┘
│ │ Readings   │ │ │
│ │  Collection │ │ │
│ └─────────────┘ │ │
│                 │ │
│ ┌─────────────┐ │
│ │   Users     │ │
│ │  Collection │ │
│ └─────────────┘ │
└─────────────────┘
```

---

## 5. Data Flow Diagrams

### 5.1 AI Crop Health Analysis Flow

```
🌾 Crop Image Upload
        │
        ▼
┌───────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend    │ ───► │  Backend     │ ───► │   AI Engine  │
│   (React)     │      │  (Node.js)   │      │ (TensorFlow) │
└───────────────┘      └──────────────┘      └──────┬───────┘
                                                    │
                                          ┌─────────▼─────────┐
                                          │  Returns analysis │
                                          │  (Disease/Health) │
                                          └─────────┬─────────┘
                                                    │
                                      ┌─────────────┴─────────────┐
                                      │                             │
                                      ▼                             ▼
                              ┌──────────────┐            ┌──────────────┐
                              │  MongoDB     │            │  Frontend     │
                              │  (Storage)   │            │  (Display)    │
                              └──────────────┘            └──────────────┘
```

### 5.2 Weather Data Flow

```
🌤️ Weather Data Flow
        │
        ▼
┌───────────────┐      ┌──────────────┐      ┌──────────────┐
│  Open-Meteo   │ ───► │  Backend     │ ───► │  Frontend    │
│  API          │      │  (Node.js)   │      │  (Dashboard) │
└───────────────┘      └──────┬───────┘      └──────────────┘
                             │
                             ▼
                     ┌──────────────┐
                     │   MongoDB    │
                     │  (Historical)│
                     └──────────────┘
```

### 5.3 Satellite Imagery Flow

```
🛰️ Satellite Imagery Flow
        │
        ▼
┌───────────────────┐      ┌──────────────┐      ┌──────────────┐
│ Microsoft         │ ───► │  Backend     │ ───► │  Frontend    │
│ Planetary         │      │  (Node.js)   │      │  (Field Map) │
│ Computer          │      └──────────────┘      └──────────────┘
│ (Sentinel-2)      │
└───────────────────┘
```

---

## 6. Database Schema (MongoDB)

### 6.1 Fields Collection

```javascript
{
  _id: ObjectId,
  name: String,           // "Field 1", "Field 2"
  cropType: String,        // "Winter Wheat", "Corn"
  area: Number,            // 3.5 (hectares)
  gpsCoords: {
    lat: Number,
    lng: Number
  },
  boundaries: [
    { lat: Number, lng: Number }
  ],
  healthScore: Number,     // 88.9 (percentage)
  growthStage: String,    // "Shooting phase"
  createdAt: Date,
  updatedAt: Date
}
```

### 6.2 Sensors Collection

```javascript
{
  _id: ObjectId,
  fieldId: ObjectId,
  type: String,           // "humidity", "temperature", "soilMoisture"
  location: {
    lat: Number,
    lng: Number
  },
  installDate: Date,
  status: String,         // "active", "inactive"
  lastReading: Date
}
```

### 6.3 Readings Collection

```javascript
{
  _id: ObjectId,
  sensorId: ObjectId,
  humidity: Number,       // 65.5 (percentage)
  temperature: Number,    // 22.5 (celsius)
  soilMoisture: Number,   // 45.2 (percentage)
  timestamp: Date
}
```

### 6.4 Users Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,       // hashed
  role: String,           // "admin", "farmer"
  createdAt: Date
}
```

---

## 7. API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | User login |
| GET | /api/auth/profile | Get user profile |

### Fields

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/fields | Get all fields |
| POST | /api/fields | Create new field |
| GET | /api/fields/:id | Get field by ID |
| PUT | /api/fields/:id | Update field |
| DELETE | /api/fields/:id | Delete field |

### Sensors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/sensors | Get all sensors |
| POST | /api/sensors | Add new sensor |
| GET | /api/sensors/:id | Get sensor data |
| GET | /api/sensors/field/:fieldId | Get sensors by field |

### Weather

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/weather/current | Get current weather |
| GET | /api/weather/forecast | Get 5-day forecast |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/crop-health | Analyze crop health from image |
| GET | /api/ai/yield-prediction/:fieldId | Predict yield for field |

---

## 8. External APIs

### 8.1 Weather API - Open-Meteo (FREE)

```
URL: https://api.open-meteo.com/v1/forecast
Parameters: latitude, longitude, hourly=temperature_2m,humidity_2m
Cost: FREE, No API key required
Limit: Unlimited requests
```

### 8.2 Satellite Imagery - Microsoft Planetary Computer (FREE)

```
Source: Sentinel-2 (ESA)
Resolution: 10 meters
Revisit: 5 days
Cost: FREE
Access: Via STAC API
```

### 8.3 Google Earth Engine (Limited Free)

```
Cost: Free for non-commercial/research
Commercial: Paid
Note: Consider Planetary Computer as alternative
```

---

## 9. AI Features

### 9.1 Crop Disease Detection

- **Input:** Leaf/plant image
- **Process:** TensorFlow.js MobileNet model
- **Output:** Disease type and confidence score

### 9.2 Yield Prediction

- **Input:** Historical sensor data, weather, satellite imagery
- **Process:** scikit-learn regression model
- **Output:** Predicted harvest amount

### 9.3 Soil Health Analysis

- **Input:** Sensor readings (moisture, pH, nutrients)
- **Process:** Rule-based analysis + ML
- **Output:** Health score and recommendations

---

## 10. Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     DEPLOYMENT                           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   GitHub Repository                                      │
│        │                                                 │
│   ┌────┴────┐                                            │
│   ▼         ▼                                            │
│ ┌──────┐  ┌──────┐                                      │
│ │Vercel│  │Render│  ← Frontend (React) + Backend (Node) │
│ └──────┘  └──────┘                                      │
│                                                          │
│        OR                                                │
│                                                          │
│   ┌────────┐  ┌────────┐  ┌────────┐                    │
│   │Netlify │  │Heroku  │  │ Railway│  ← Alternative     │
│   └────────┘  └────────┘  └────────┘                    │
│                                                          │
│   ┌────────────────────────────────┐                     │
│   │     MongoDB Atlas (Cloud)     │  ← Database         │
│   └────────────────────────────────┘                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Project Folder Structure

```
agri-tech/
├── frontend/                    # React.js Application
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CropHealth.jsx
│   │   │   │   └── StatsCard.jsx
│   │   │   ├── Sensors/
│   │   │   │   ├── SensorPanel.jsx
│   │   │   │   └── SensorCard.jsx
│   │   │   ├── Weather/
│   │   │   │   ├── WeatherForecast.jsx
│   │   │   │   └── WeatherCard.jsx
│   │   │   ├── Map/
│   │   │   │   ├── FieldMap.jsx
│   │   │   │   └── FieldInfo.jsx
│   │   │   ├── AI/
│   │   │   │   ├── CropAnalyzer.jsx
│   │   │   │   └── UploadForm.jsx
│   │   │   ├── Settings/
│   │   │   │   └── SettingsPanel.jsx
│   │   │   └── Layout/
│   │   │       ├── Sidebar.jsx
│   │   │       ├── Header.jsx
│   │   │       └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   └── weatherService.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── styles/
│   │   │   └── App.css
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── README.md
│
├── backend/                     # Node.js Application
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fieldController.js
│   │   ├── sensorController.js
│   │   ├── weatherController.js
│   │   └── aiController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Field.js
│   │   ├── Sensor.js
│   │   └── Reading.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── fields.js
│   │   ├── sensors.js
│   │   ├── weather.js
│   │   └── ai.js
│   ├── services/
│   │   ├── weatherService.js
│   │   ├── satelliteService.js
│   │   └── aiService.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   └── mockData.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── docs/
│   └── SYSTEM_ARCHITECTURE.md
│
├── README.md
└── .gitignore
```

---

## 12. Security Considerations

1. **Authentication:** JWT tokens with expiration
2. **Password:** bcrypt hashing
3. **API:** Rate limiting, CORS configuration
4. **Environment:** .env files for secrets
5. **Input Validation:** Sanitize all user inputs

---

## 13. Scalability Considerations

1. **Database:** MongoDB Atlas for cloud hosting
2. **Caching:** Redis for frequent queries
3. **CDN:** Serve static assets via CDN
4. **Load Balancing:** Multiple server instances

---

## 14. Resume Value

This project demonstrates:

| Skill | How Demonstrated |
|-------|-----------------|
| Full-Stack Development | React.js frontend + Node.js backend |
| Database Management | MongoDB schemas and queries |
| API Integration | Weather, Satellite, AI APIs |
| Real-time Features | Socket.io for live updates |
| AI/ML | TensorFlow.js, scikit-learn |
| GIS/Mapping | Leaflet with GPS coordinates |
| Cloud Deployment | Vercel, Render, MongoDB Atlas |
| Version Control | Git/GitHub |

---

## 15. Timeline Estimate

| Phase | Task | Duration |
|-------|------|----------|
| 1 | Project Setup | 1 day |
| 2 | Backend API | 3-4 days |
| 3 | Database Models | 1-2 days |
| 4 | Frontend UI | 5-7 days |
| 5 | Weather Integration | 1-2 days |
| 6 | Map Integration | 2-3 days |
| 7 | AI Features | 3-5 days |
| 8 | Testing & Deployment | 2-3 days |
| **Total** | **MVP** | **2-3 weeks** |

---

## 16. Cost Analysis

| Service | Cost |
|---------|------|
| Open-Meteo API | FREE |
| Microsoft Planetary Computer | FREE |
| MongoDB Atlas (Shared) | FREE |
| Vercel (Frontend) | FREE |
| Render (Backend) | FREE (with limits) |
| Domain | ~$10/year |
| **Total MVP** | **~$10/year** |

---

**Document Version:** 1.0
**Last Updated:** May 2026
**Author:** AgriTech Development Team