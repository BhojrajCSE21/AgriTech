const axios = require("axios");

const STAC_API_URL = "https://planetarycomputer.microsoft.com/api/stac/v1";

/**
 * Searches for the latest Sentinel-2 L2A scene that covers the field geometry
 * @param {Object} geometry - The GeoJSON geometry of the field
 * @returns {Object|null} - Metadata of the latest satellite scene
 */
exports.getLatestSentinelData = async (geometry) => {
  try {
    // Search the Microsoft Planetary Computer STAC API
    const response = await axios.post(`${STAC_API_URL}/search`, {
      collections: ["sentinel-2-l2a"],
      intersects: geometry,
      limit: 3,
      sortby: [{ field: "properties.datetime", direction: "desc" }],
      query: {
        "eo:cloud_cover": { lt: 15 }, // Filter scenes with less than 15% cloud cover
      },
    });

    if (response.data.features && response.data.features.length > 0) {
      const latestScene = response.data.features[0];
      
      const tileUrls = response.data.features.map(scene => 
        `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${scene.id}&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png`
      );

      // Fetch authentic NDVI tile templates from the tilejson endpoint
      const ndviTileUrls = [];
      for (const scene of response.data.features) {
        try {
          const tileJsonUrl = `https://planetarycomputer.microsoft.com/api/data/v1/item/tilejson.json?collection=sentinel-2-l2a&item=${scene.id}&assets=B04&assets=B08&expression=(b2-b1)/(b2%2Bb1)&rescale=0,1&colormap_name=viridis`;
          
          const tileRes = await axios.get(tileJsonUrl);
          
          if (tileRes.data.tiles && tileRes.data.tiles.length > 0) {
            ndviTileUrls.push(tileRes.data.tiles[0]);
          }
        } catch (err) {
          console.error(`Failed to fetch NDVI tilejson for scene ${scene.id}:`, err.message);
        }
      }

      return {
        date: latestScene.properties.datetime,
        cloudCover: latestScene.properties["eo:cloud_cover"],
        thumbnail: latestScene.assets.rendered_preview?.href || latestScene.assets.thumbnail?.href,
        ndviThumbnail: latestScene.assets.rendered_preview?.href, // Simple and reliable
        id: latestScene.id,
        tileUrls: tileUrls,
        ndviTileUrls: ndviTileUrls
      };
    }

    return null;
  } catch (error) {
    console.error("Satellite Search Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
    return null;
  }
};
