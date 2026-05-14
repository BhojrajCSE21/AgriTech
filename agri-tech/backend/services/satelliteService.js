const axios = require("axios");
const turf = require("@turf/turf");

// Element84 Earth Search — free, fast, reliable STAC API for Sentinel-2
const STAC_API_URL = "https://earth-search.aws.element84.com/v1";

// TiTiler — a public, high-performance tile server for Cloud Optimized GeoTIFFs (COGs)
// This replaces the unreliable Planetary Computer tile server.
const TITILER_URL =
  "https://titiler.xyz/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png";

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

      // visual COG (true color) - used for the visual overlay
      const visualCOG = assets.visual?.href || assets.TCI?.href || null;
      const tileUrl = visualCOG
        ? `${TITILER_URL}?url=${encodeURIComponent(visualCOG)}`
        : null;

      // try to locate a single multiband scene COG first, otherwise check for separate band assets
      const sceneCOG = assets.scene?.href || assets.cog?.href || null;
      const b04 =
        assets.B04?.href || assets.red?.href || assets["B04"]?.href || null;
      const b08 =
        assets.B08?.href || assets.nir?.href || assets["B08"]?.href || null;

      // NDVI: only build a TiTiler expression URL when we have a single multiband COG
      let ndviTileUrl = null;
      if (sceneCOG) {
        ndviTileUrl = `${TITILER_URL}?url=${encodeURIComponent(sceneCOG)}&expression=(b8-b4)/(b8+b4)&rescale=-0.2,0.8&colormap_name=viridis`;
      } else if (b04 && b08) {
        // public titiler.xyz typically rejects multi-url expressions (two url= params).
        // So do NOT attempt `?url=...&url=...&expression=...` against titiler.xyz — it will 422.
        // Fallback: set ndviTileUrl = null and log an explanatory warning.
        console.warn(
          "Found separate B04/B08 COGs but titiler.xyz does not accept multi-url expressions. Consider server-side NDVI COG generation or hosting your own titiler.",
        );
        ndviTileUrl = null;
      } else {
        ndviTileUrl = null;
      }

      console.log("tileUrl:", tileUrl);
      console.log("ndviTileUrl:", ndviTileUrl);
      return {
        date: latestScene.properties.datetime,
        cloudCover: latestScene.properties["eo:cloud_cover"],
        thumbnail: thumbnail,
        ndviThumbnail: thumbnail,
        id: latestScene.id,
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
