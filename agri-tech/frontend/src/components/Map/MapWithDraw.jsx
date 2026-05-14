import React, { useState } from "react";
import { MapContainer, TileLayer, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "./MapComponent.css";
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

function MapWithDraw({ onFieldCreate, onFieldEdit, drawnItems }) {
  const [activeLayer, setActiveLayer] = useState("satellite");

  const handleCreated = (e) => {
    const { layer } = e;
    const geoJson = layer.toGeoJSON();
    const area = calculateArea(geoJson.geometry);
    onFieldCreate({
      geoJson,
      area,
      layer,
    });
  };

  const handleEdited = (e) => {
    const layers = e.layers;
    layers.eachLayer((layer) => {
      const geoJson = layer.toGeoJSON();
      onFieldEdit(geoJson, layer);
    });
  };

  const handleDeleted = (e) => {
    // Handle deletion if needed
  };

  // const calculateArea = (geometry) => {
  //   const coords = geometry.coordinates[0];
  //   let area = 0;
  //   for (let i = 0; i < coords.length - 1; i++) {
  //     area += coords[i][0] * coords[i + 1][1];
  //     area -= coords[i + 1][0] * coords[i][1];
  //   }
  //   area = Math.abs(area / 2) * 111139 * 111139 / 10000;
  //   return area.toFixed(2);
  // };

  // 2. Update the calculateArea function
  const calculateArea = (geometry) => {
    const areaInSqMeters = turf.area(geometry);
    const areaInHectares = areaInSqMeters / 10000;
    return areaInHectares.toFixed(2);
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
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

      <MapContainer
        center={[28.6139, 77.209]} // Delhi/India - change to your farm location
        zoom={10}
        style={{ height: "100%", width: "100%", borderRadius: "10px" }}
      >
        <TileLayer
          attribution={TILE_LAYERS[activeLayer].attribution}
          url={TILE_LAYERS[activeLayer].url}
        />

        <FeatureGroup>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polyline: false,
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: "#e1e100",
                  message: "<strong>Error:</strong> Shape edges cannot cross!",
                },
                shapeOptions: {
                  color: "#27ae60",
                  fillColor: "#27ae60",
                  fillOpacity: 0.3,
                },
              },
            }}
            edit={{
              featureGroup: drawnItems,
              remove: true,
            }}
          />
          {drawnItems}
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}

export default MapWithDraw;
export { TILE_LAYERS };
