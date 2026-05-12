const axios = require('axios');

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
      limit: 1,
      sortby: [
        { field: "properties.datetime", direction: "desc" }
      ],
      query: {
        "eo:cloud_cover": { lt: 15 } // Filter scenes with less than 15% cloud cover
      }
    });

    if (response.data.features && response.data.features.length > 0) {
      const latestScene = response.data.features[0];
      
      return {
        date: latestScene.properties.datetime,
        cloudCover: latestScene.properties["eo:cloud_cover"],
        thumbnail: latestScene.assets.rendered_preview?.href || latestScene.assets.thumbnail?.href,
        id: latestScene.id,
        tileUrl: `https://planetarycomputer.microsoft.com/api/data/v1/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?collection=sentinel-2-l2a&item=${latestScene.id}&assets=visual&asset_bidx=visual%7C1%2C2%2C3&nodata=0&format=png`
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
