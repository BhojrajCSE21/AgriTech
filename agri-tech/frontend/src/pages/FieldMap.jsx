import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  FeatureGroup,
  useMap,
  ZoomControl,
  SVGOverlay,
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

const INDIA_CENTER = [22.9734, 78.6569];
const INDIA_BOUNDS = [
  [6.5, 67],
  [37.5, 98],
];

function MapBoundsUpdater({ fields, selectedField }) {
  const map = useMap();

  useEffect(() => {
    if (selectedField?.geoJson?.coordinates?.[0]) {
      const coords = selectedField.geoJson.coordinates[0].map((coord) => [
        coord[1],
        coord[0],
      ]);
      map.fitBounds(coords, { padding: [70, 70], maxZoom: 16 });
      return;
    }
    if (fields.length === 0) {
      map.fitBounds(INDIA_BOUNDS, { padding: [20, 20] });
    }
  }, [fields.length, selectedField, map]);

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
  const [tileOverlayFailed, setTileOverlayFailed] = useState(false);

  const normalizeTileUrl = (url) =>
    url
      .trim()
      .replace("{y}@1x", "{y}.png")
      .replace(/\/(\d+)@1x(?=\?)/, "/$1.png")
      .replace(/([?&])rescale=0(?:%2C|,)3000&?/i, "$1")
      .replace("?&", "?")
      .replace(/[?&]$/, "");

  const getValidTileUrls = (urls) =>
    (urls || [])
      .filter((url) => typeof url === "string" && url.trim())
      .map(normalizeTileUrl);

  const visualTileUrls = getValidTileUrls(selectedField?.tileUrls);
  const ndviTileUrls = getValidTileUrls(selectedField?.ndviTileUrls);
  const overlayTileUrls = mapMode === "ndvi" ? ndviTileUrls : visualTileUrls;
  const selectedFieldBounds = getPolygonBounds(selectedField?.geoJson);
  const satelliteTileBounds = getBboxBounds(selectedField?.satelliteBbox);
  const selectedFieldSvgPoints = getPolygonSvgPoints(selectedField?.geoJson);
  const thumbnailFallbackImage =
    mapMode === "visual"
      ? selectedField?.satelliteImage
      : selectedField?.ndviThumbnail;
  const showThumbnailFallback =
    Boolean(thumbnailFallbackImage) &&
    selectedFieldBounds &&
    selectedFieldSvgPoints &&
    (overlayTileUrls.length === 0 || tileOverlayFailed);

  useEffect(() => {
    setTileOverlayFailed(false);
  }, [selectedField?._id, mapMode, overlayTileUrls.join("|")]);

  useEffect(() => {
    if (selectedField && mapMode === "ndvi" && ndviTileUrls.length === 0) {
      setMapMode("visual");
    }
  }, [selectedField, mapMode, ndviTileUrls.length]);

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
      if (layer?.setStyle) {
        layer.setStyle({
          fillOpacity: 0,
          fillColor: "transparent",
          color: "#10b981",
          weight: 3,
        });
      }
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

  function getPolygonBounds(geoJson) {
    if (!geoJson?.coordinates?.[0]?.length) return null;
    const coords = geoJson.coordinates[0];
    const lngs = coords.map((coord) => coord[0]);
    const lats = coords.map((coord) => coord[1]);
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
  }

  function getBboxBounds(bbox) {
    if (!Array.isArray(bbox) || bbox.length < 4) return null;
    const [west, south, east, north] = bbox;
    return [
      [south, west],
      [north, east],
    ];
  }

  function getPolygonSvgPoints(geoJson) {
    if (!geoJson?.coordinates?.[0]?.length) return "";
    const coords = geoJson.coordinates[0];
    const lngs = coords.map((coord) => coord[0]);
    const lats = coords.map((coord) => coord[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const width = maxLng - minLng || 1;
    const height = maxLat - minLat || 1;

    return coords
      .map(([lng, lat]) => {
        const x = (lng - minLng) / width;
        const y = (maxLat - lat) / height;
        return `${x.toFixed(4)},${y.toFixed(4)}`;
      })
      .join(" ");
  }

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
        <h2 className="page-title">
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
          className="map-shell"
          style={{
            flex: 1,
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            height: "725px", // Increased height
            boxShadow: "0 24px 64px rgba(15,23,42,0.16)",
          }}
        >
          {/* Modern Layer Switcher (Bottom Center) */}
          <div
            className="glass-panel layer-switcher"
            style={{
              position: "absolute",
              bottom: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(255, 255, 255, 0.72)",
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
                className="layer-button"
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
            className="glass-panel field-list-card"
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              zIndex: 1000,
              background: "rgba(255,255,255,0.76)",
              borderRadius: "18px",
              padding: "10px",
              boxShadow: "0 18px 48px rgba(15,23,42,0.15)",
              maxHeight: "150px",
              overflowY: "auto",
            }}
          >
            <div className="field-list-header">
              <div>
                <div className="field-list-title">Saved Fields</div>
                <div className="field-list-subtitle">{savedFields.length} active plots</div>
              </div>
              <span className="field-count-pill">{savedFields.length}</span>
            </div>
            {savedFields.map((field) => (
              <div
                key={field._id}
                className="field-list-item"
                onClick={() => setSelectedField(field)}
                style={{
                  padding: "8px 10px",
                  margin: "4px 0",
                  borderRadius: "12px",
                  cursor: "pointer",
                  background:
                    selectedField?._id === field._id
                      ? "rgba(209,250,229,0.9)"
                      : "transparent",
                  fontSize: "12px",
                }}
              >
                <span className="field-pin">•</span>
                <span style={{ minWidth: 0 }}>
                  <span className="field-name-text">{field.name}</span>
                  <span className="field-crop-text">{field.cropType}</span>
                </span>
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: "11px", color: "#666" }}>Loading...</div>
            )}
          </div>

          <div className="glass-panel draw-helper">
            <div className="draw-helper-icon">✚</div>
            <div>
              <div className="draw-helper-title">Draw a Field</div>
              <div className="draw-helper-text">Enter a name, then use the toolbar to sketch a boundary.</div>
            </div>
          </div>

          <MapContainer
            center={INDIA_CENTER}
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

            <MapBoundsUpdater fields={savedFields} selectedField={selectedField} />

            {/* Canvas Cropped Satellite Overlay */}
            {overlayTileUrls.length > 0 &&
              selectedField.geoJson &&
              overlayTileUrls.map((url, index) => (
                <BoundaryTileLayer
                  key={`sat-overlay-${selectedField._id}-${index}-${mapMode}`}
                  url={url}
                  boundary={selectedField.geoJson}
                  bounds={satelliteTileBounds || undefined}
                  crossOrigin={true}
                  zIndex={350}
                  opacity={1}
                  eventHandlers={{
                    tileerror: () => setTileOverlayFailed(true),
                    tileload: () => setTileOverlayFailed(false),
                  }}
                />
              ))}

            {showThumbnailFallback && (
              <SVGOverlay
                key={`sat-image-${selectedField._id}-${mapMode}`}
                bounds={selectedFieldBounds}
                opacity={mapMode === "ndvi" ? 0.75 : 0.95}
                zIndex={330}
              >
                <defs>
                  <clipPath
                    id={`field-clip-${selectedField._id}`}
                    clipPathUnits="objectBoundingBox"
                  >
                    <polygon points={selectedFieldSvgPoints} />
                  </clipPath>
                </defs>
                <image
                  href={thumbnailFallbackImage}
                  width="100%"
                  height="100%"
                  preserveAspectRatio="none"
                  clipPath={`url(#field-clip-${selectedField._id})`}
                />
              </SVGOverlay>
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
                    pane: "overlayPane",
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
