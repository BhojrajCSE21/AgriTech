const axios = require("axios");
const turf = require("@turf/turf");

// Element84 Earth Search — free, fast, reliable STAC API for Sentinel-2
const STAC_API_URL = "https://earth-search.aws.element84.com/v1";

// TiTiler — a public, high-performance tile server for Cloud Optimized GeoTIFFs (COGs)
// This replaces the unreliable Planetary Computer tile server.
const TITILER_COG_TILE_URL =
  "https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png";
const TITILER_STAC_TILE_URL =
  "https://titiler.xyz/stac/tiles/WebMercatorQuad/{z}/{x}/{y}.png";

/**
 * Helper: retry a function with exponential backoff.
 */
async function withRetry(fn, retries = 2, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const status = error.response?.status;
      const isTimeout =
        error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      const isRetryable =
        status === 504 || status === 429 || status === 502 || isTimeout;

      if (isRetryable && attempt < retries) {
        const wait = delayMs * attempt;
        console.log(
          `STAC API attempt ${attempt}/${retries} failed (${status || error.code}), retrying in ${wait}ms...`,
        );
        await new Promise((r) => setTimeout(r, wait));
      } else {
        throw error;
      }
    }
  }
}

/**
 * Searches for the latest Sentinel-2 L2A scene and generates TiTiler URLs for map tiles.
 */
exports.getLatestSentinelData = async (geometry) => {
  try {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 90);
    const dateRange = `${past.toISOString().split("T")[0]}T00:00:00Z/${now.toISOString().split("T")[0]}T23:59:59Z`;

    const center = turf.centroid(geometry);
    const [lng, lat] = center.geometry.coordinates;
    const smallBbox = [
      Number((lng - 0.1).toFixed(4)),
      Number((lat - 0.1).toFixed(4)),
      Number((lng + 0.1).toFixed(4)),
      Number((lat + 0.1).toFixed(4)),
    ];

    const searchParams = {
      collections: ["sentinel-2-l2a"],
      bbox: smallBbox,
      datetime: dateRange,
      limit: 1, // Only need the latest for tiles to keep it simple and fast
      sortby: [{ field: "properties.datetime", direction: "desc" }],
      query: {
        "eo:cloud_cover": { lt: 25 },
      },
    };

    const response = await withRetry(
      () =>
        axios.post(`${STAC_API_URL}/search`, searchParams, { timeout: 30000 }),
      2,
    );

    if (response.data.features && response.data.features.length > 0) {
      const latestScene = response.data.features[0];
      const assets = latestScene.assets;

      console.log(
        `✓ Found scene: ${latestScene.id} (${latestScene.properties.datetime})`,
      );

      // 1. Get working thumbnail (S3 direct)
      const thumbnail = assets.thumbnail?.href || assets.visual?.href;
      const stacItemUrl = `${STAC_API_URL}/collections/sentinel-2-l2a/items/${latestScene.id}`;
      const encodedStacItemUrl = encodeURIComponent(stacItemUrl);

      // Visual tiles for the map. Use the direct COG endpoint so Leaflet can
      // request real raster tiles without stretching the low-res thumbnail.
      const visualCOG = assets.visual?.href || assets.TCI?.href || null;
      const tileUrl = visualCOG
        ? `${TITILER_COG_TILE_URL}?url=${encodeURIComponent(visualCOG)}`
        : null;

      // Build real NDVI tiles from Sentinel red/NIR assets.
      const sceneCOG = assets.scene?.href || assets.cog?.href || null;
      const redAsset = assets.red ? "red" : assets.B04 ? "B04" : null;
      const nirAsset = assets.nir ? "nir" : assets.B08 ? "B08" : null;
      let ndviTileUrl = null;
      if (redAsset && nirAsset) {
        const ndviExpression = encodeURIComponent(
          `(${nirAsset}-${redAsset})/(${nirAsset}+${redAsset})`,
        );
        ndviTileUrl = `${TITILER_STAC_TILE_URL}?url=${encodedStacItemUrl}&assets=${redAsset}&assets=${nirAsset}&asset_as_band=true&expression=${ndviExpression}&rescale=-0.2,0.8&colormap_name=viridis`;
      } else if (sceneCOG) {
        const ndviExpression = encodeURIComponent("(b8-b4)/(b8+b4)");
        ndviTileUrl = `${TITILER_COG_TILE_URL}?url=${encodeURIComponent(sceneCOG)}&expression=${ndviExpression}&rescale=-0.2,0.8&colormap_name=viridis`;
      } else {
        ndviTileUrl = null;
      }

      console.log("tileUrl:", tileUrl);
      console.log("ndviTileUrl:", ndviTileUrl);
      return {
        date: latestScene.properties.datetime,
        cloudCover: latestScene.properties["eo:cloud_cover"],
        thumbnail: thumbnail,
        ndviThumbnail: null,
        id: latestScene.id,
        bbox: latestScene.bbox,
        tileUrls: [tileUrl].filter(Boolean), // Array format expected by frontend
        ndviTileUrls: [ndviTileUrl].filter(Boolean),
      };
    }

    return null;
  } catch (error) {
    console.error("Satellite Search Error:", error.message);
    return null;
  }
};
