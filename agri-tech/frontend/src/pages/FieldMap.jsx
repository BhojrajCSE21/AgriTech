import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  FeatureGroup,
  useMap,
  ZoomControl,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import FieldInfoPanel from "../components/Map/FieldInfoPanel";
import NDVILegend from "../components/Map/NDVILegend";
import { fieldsAPI } from "../services/api";
import BoundaryTileLayer from "../components/Map/BoundaryTileLayer";
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
  mapboxStreets: {
    name: "Mapbox Streets",
    attribution:
      '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    url: `https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`,
  },
  mapboxSatellite: {
    name: "Mapbox Satellite",
    attribution:
      '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a>',
    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`,
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
  const [mapMode, setMapMode] = useState("visual"); // visual or ndvi
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
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)" }}
        >
          My Fields
        </h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Field name"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="input-modern"
            style={{ width: "200px" }}
          />
          <select
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            className="input-modern"
            style={{ width: "150px" }}
          >
            <option value="Winter Wheat">Winter Wheat</option>
            <option value="Corn">Corn</option>
            <option value="Soybean">Soybean</option>
            <option value="Rice">Rice</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", flex: 1, minHeight: 0 }}>
        {/* Map Area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "16px",
            overflow: "hidden",
            height: "725px", // Increased height
            boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          }}
        >
          {/* Modern Layer Switcher (Bottom Center) */}
          <div
            style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: "16px",
              padding: "6px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              display: "flex",
              gap: "4px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
            }}
          >
            {Object.entries(TILE_LAYERS).map(([key, layer]) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "12px",
                  background: activeLayer === key ? "#10b981" : "transparent",
                  color: activeLayer === key ? "white" : "#475569",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {key === "satellite"
                  ? "🛰️"
                  : key === "streets"
                    ? "🗺️"
                    : key === "positron"
                      ? "⚪"
                      : "⚫"}{" "}
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
            center={[20.5937, 78.9629]}
            zoom={5}
            minZoom={3}
            maxBounds={[
              [-90, -180],
              [90, 180],
            ]}
            worldCopyJump={true}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
            
          >
            <ZoomControl position="bottomright" />
            <TileLayer
              attribution={TILE_LAYERS[activeLayer].attribution}
              url={TILE_LAYERS[activeLayer].url}
              noWrap={true}
              zIndex={1}
            />

            <MapBoundsUpdater fields={savedFields} />

            {/* Canvas Cropped Satellite Overlay */}
            {selectedField?.tileUrls &&
              selectedField.geoJson &&
              (mapMode === "visual"
                ? selectedField.tileUrls
                : selectedField.ndviTileUrls || selectedField.tileUrls
              ).map((url, index) => (
                <BoundaryTileLayer
                  key={`sat-overlay-${selectedField._id}-${index}-${mapMode}`}
                  url={url}
                  boundary={selectedField.geoJson}
                  zIndex={100}
                  opacity={1}
                />
              ))}

            <FeatureGroup>
              <EditControl
                position="topright"
                onCreated={(e) =>
                  handleFieldCreate({
                    geoJson: e.layer.toGeoJSON(),
                    layer: e.layer,
                  })
                }
                onEdited={(e) => {
                  const layers = e.layers;
                  layers.eachLayer((layer) => {
                    const fieldId = layer.options.fieldId;
                    if (fieldId) handleFieldEdit(fieldId, layer.toGeoJSON());
                  });
                }}
                onDeleted={(e) => {
                  const layers = e.layers;
                  layers.eachLayer((layer) => {
                    const fieldId = layer.options.fieldId;
                    if (fieldId) handleDeleteField(fieldId);
                  });
                }}
                draw={{
                  rectangle: {
                    shapeOptions: {
                      color: "#10b981",
                      fillColor: "#10b981",
                      fillOpacity: 0.2,
                    },
                  },
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: {
                    allowIntersection: false,
                    shapeOptions: {
                      color: "#10b981",
                      fillColor: "#10b981",
                      fillOpacity: 0.2,
                    },
                  },
                }}
                edit={{
                  edit: true,
                  remove: true,
                }}
              />
              {/* Render Saved Fields inside FeatureGroup to make them editable */}
              {savedFields.map((field) => (
                <Polygon
                  key={field._id}
                  fieldId={field._id} // Pass custom option for edit handler
                  positions={polygonToLeaflet(field.geoJson)}
                  pathOptions={{
                    color:
                      selectedField?._id === field._id ? "#10b981" : "#ffffff",
                    fillColor: "transparent",
                    fillOpacity: 0,
                    weight: selectedField?._id === field._id ? 3 : 1,
                    dashArray: selectedField?._id === field._id ? "" : "5, 5",
                  }}
                  eventHandlers={{
                    click: () => setSelectedField(field),
                  }}
                />
              ))}
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
            width: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            height: "100%",
            paddingRight: "5px",
          }}
        >
          <FieldInfoPanel
            field={selectedField}
            onClose={() => setSelectedField(null)}
            onAnalyze={handleAnalyze}
            onDelete={handleDeleteField}
            analyzing={analyzing}
            mapMode={mapMode}
            setMapMode={setMapMode}
          />
        </div>
      </div>
    </div>
  );
}

export default FieldMap;
