import { createTileLayerComponent } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet-boundary-canvas';

const createBoundaryLayer = (props, context) => {
  const layer = L.TileLayer.boundaryCanvas(props.url, {
    ...props,
    boundary: props.boundary,
  });
  return { instance: layer, context };
};

const updateBoundaryLayer = (instance, props, prevProps) => {
  if (props.url !== prevProps.url) {
    instance.setUrl(props.url);
  }
};

const BoundaryTileLayer = createTileLayerComponent(createBoundaryLayer, updateBoundaryLayer);

export default BoundaryTileLayer;
