import { createTileLayerComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-boundary-canvas';

const createBoundaryLayer = (props, context) => {
  const layer = L.TileLayer.boundaryCanvas(props.url, {
    ...props,
    boundary: props.boundary,
  });
  if (props.eventHandlers) {
    layer.on(props.eventHandlers);
  }
  return { instance: layer, context };
};

const updateBoundaryLayer = (instance, props, prevProps) => {
  if (prevProps.eventHandlers) {
    instance.off(prevProps.eventHandlers);
  }
  if (props.eventHandlers) {
    instance.on(props.eventHandlers);
  }
  if (props.url !== prevProps.url) {
    instance.setUrl(props.url);
  }
  if (JSON.stringify(props.boundary) !== JSON.stringify(prevProps.boundary)) {
    // Leaflet BoundaryCanvas doesn't have a simple 'setBoundary', 
    // so we have to update the options directly. 
    // Most Leaflet plugins require re-adding or internal option update.
    instance.options.boundary = props.boundary;
    instance.redraw();
  }
};

const BoundaryTileLayer = createTileLayerComponent(createBoundaryLayer, updateBoundaryLayer);

export default BoundaryTileLayer;
