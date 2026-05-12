import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import FieldInfoPanel from "../components/Map/FieldInfoPanel";
import NDVILegend from "../components/Map/NDVILegend";
import { fieldsAPI } from "../services/api";
import "../components/Map/MapComponent.css";
import * as turf from "@turf/turf";

const TILE_LAYERS = {
  satellite: {
    name: "Satellite",
    attribution: "&copy; Esri",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  },
  streets: {
    name: "Streets",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
  positron: {
    name: "Light",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  },
  dark: {
    name: "Dark",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  },
};

function MapBoundsUpdater({ fields }) {
  const map = useMap();

  useEffect(() => {
    if (fields.length > 0) {
      const allCoords = [];
      fields.forEach((field) => {
        if (field.geoJson?.coordinates?.[0]) {
          field.geoJson.coordinates[0].forEach((coord) => {
            allCoords.push([coord[1], coord[0]]);
          });
        }
      });
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [50, 50] });
      }
    }
  }, [fields, map]);

  return null;
}

function FieldMap() {
  const [fields, setFields] = useState([]);
  const [savedFields, setSavedFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [cropType, setCropType] = useState("Winter Wheat");
  const [analyzing, setAnalyzing] = useState(false);
  const [activeLayer, setActiveLayer] = useState("satellite");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const res = await fieldsAPI.getAll();
      setSavedFields(res.data);
    } catch (err) {
      console.error("Failed to load fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateArea = (geometry) => {
    const areaInSqMeters = turf.area(geometry);
    const areaInHectares = areaInSqMeters / 10000;
    return areaInHectares.toFixed(2);
  };

  const getCentroid = (geometry) => {
    const coords = geometry.coordinates[0];
    let latSum = 0,
      lngSum = 0;
    coords.forEach((coord) => {
      latSum += coord[1];
      lngSum += coord[0];
    });
    return {
      lat: latSum / coords.length,
      lng: lngSum / coords.length,
    };
  };

  const handleFieldCreate = async ({ geoJson, layer }) => {
    if (!fieldName.trim()) {
      alert("Please enter a field name");
      return;
    }

    const area = calculateArea(geoJson.geometry);
    const centroid = getCentroid(geoJson.geometry);

    try {
      setSaving(true);
      const res = await fieldsAPI.create({
        name: fieldName,
        cropType,
        area,
        geoJson: geoJson.geometry,
        centroid,
      });

      setSavedFields([res.data, ...savedFields]);
      setSelectedField(res.data);
      setFieldName("");
    } catch (err) {
      console.error("Failed to save field:", err);
      alert("Failed to save field. Please login first.");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldEdit = async (fieldId, geoJson) => {
    try {
      const res = await fieldsAPI.update(fieldId, {
        geoJson: geoJson.geometry,
      });
      setSavedFields(
        savedFields.map((f) => (f._id === fieldId ? res.data : f)),
      );
      setSelectedField(res.data);
    } catch (err) {
      console.error("Failed to update field:", err);
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!confirm("Are you sure you want to delete this field?")) return;

    try {
      await fieldsAPI.delete(fieldId);
      setSavedFields(savedFields.filter((f) => f._id !== fieldId));
      if (selectedField?._id === fieldId) {
        setSelectedField(null);
      }
    } catch (err) {
      console.error("Failed to delete field:", err);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedField?._id) return;

    setAnalyzing(true);
    try {
      const res = await fieldsAPI.analyze(selectedField._id);
      setSelectedField(res.data);
      setSavedFields(
        savedFields.map((f) => (f._id === selectedField._id ? res.data : f)),
      );
    } catch (err) {
      console.error("Failed to analyze field:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const polygonToLeaflet = (geoJson) => {
    if (!geoJson?.coordinates?.[0]) return [];
    return geoJson.coordinates[0].map((coord) => [coord[1], coord[0]]);
  };

  return (
    <div style={{ padding: "20px", height: "calc(100vh - 80px)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>My Fields</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Field name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="form-control"
            style={{ width: "200px" }}
          />
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="form-control"
            style={{ width: "150px" }}
          >
            <option value="Winter Wheat">Winter Wheat</option>
            <option value="Corn">Corn</option>
            <option value="Soybean">Soybean</option>
            <option value="Rice">Rice</option>
          </select>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: "20px", height: "calc(100% - 80px)" }}
      >
        {/* Map Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {/* Layer Switcher */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 1000,
              background: "white",
              borderRadius: "8px",
              padding: "5px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
            }}
          >
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 15px",
                  margin: "2px 0",
                  border: "none",
                  borderRadius: "5px",
                  background: activeLayer === key ? "#27ae60" : "transparent",
                  color: activeLayer === key ? "white" : "#333",
                  cursor: "pointer",
                  fontSize: "12px",
                  textAlign: "left",
                }}
              >
                {layer.name}
              </button>
            ))}
          </div>

          {/* Field List (top of map) */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "100px",
              zIndex: 1000,
              background: "white",
              borderRadius: "8px",
              padding: "10px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              maxHeight: "150px",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "5px",
              }}
            >
              Saved Fields ({savedFields.length})
            </div>
            {savedFields.map((field) => (
              <div
                key={field._id}
                onClick={() => setSelectedField(field)}
                style={{
                  padding: "5px 10px",
                  margin: "2px 0",
                  borderRadius: "5px",
                  cursor: "pointer",
                  background:
                    selectedField?._id === field._id
                      ? "#e8f5e9"
                      : "transparent",
                  fontSize: "12px",
                }}
              >
                📍 {field.name} ({field.cropType})
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: "11px", color: "#666" }}>Loading...</div>
            )}
          </div>

          <MapContainer
            center={[28.6139, 77.209]}
            zoom={10}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution={TILE_LAYERS[activeLayer].attribution}
              url={TILE_LAYERS[activeLayer].url}
            />

            <MapBoundsUpdater fields={savedFields} />

            {/* Saved Fields */}
            {savedFields.map((field) => (
              <Polygon
                key={field._id}
                positions={polygonToLeaflet(field.geoJson)}
                pathOptions={{
                  color: selectedField?._id === field._id ? "#ffeb3b" : "#ffffff",
                  fillColor: selectedField?._id === field._id ? "#ffeb3b" : "#ffffff",
                  fillOpacity: selectedField?._id === field._id ? 0.1 : 0.05,
                  weight: selectedField?._id === field._id ? 3 : 1,
                  dashArray: selectedField?._id === field._id ? "" : "5, 5"
                }}
                eventHandlers={{
                  click: () => setSelectedField(field),
                }}
              />
            ))}

            {/* Satellite Pass Overlay for Selected Field */}
            {selectedField?.tileUrl && (
              <TileLayer
                url={selectedField.tileUrl}
                zIndex={10}
                opacity={0.8}
              />
            )}

            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={(e) =>
                  handleFieldCreate({
                    geoJson: e.layer.toGeoJSON(),
                    layer: e.layer,
                  })
                }
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: {
                    allowIntersection: false,
                    shapeOptions: {
                      color: "#27ae60",
                      fillColor: "#27ae60",
                      fillOpacity: 0.3,
                    },
                  },
                }}
                edit={false}
              />
            </FeatureGroup>
          </MapContainer>

          {/* <div style={{
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
              Draw polygon to add new field • Click field to view details
            </span>
          </div> */}
        </div>

        {/* Side Panel */}
        <div
          style={{
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <FieldInfoPanel
            field={selectedField}
            onClose={() => setSelectedField(null)}
            onAnalyze={handleAnalyze}
            onDelete={handleDeleteField}
            analyzing={analyzing}
          />
          <NDVILegend />
        </div>
      </div>
    </div>
  );
}

export default FieldMap;
