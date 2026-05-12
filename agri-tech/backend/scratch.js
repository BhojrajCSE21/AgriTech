const axios = require('axios');
async function test() {
  const geom = {
    "type": "Polygon",
    "coordinates": [[[77.209, 28.6139], [77.209, 28.62], [77.22, 28.62], [77.22, 28.6139], [77.209, 28.6139]]]
  };
  try {
    const response = await axios.post("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
      collections: ["sentinel-2-l2a"],
      intersects: geom,
      limit: 1,
      sortby: [{ field: "properties.datetime", direction: "desc" }],
      query: { "eo:cloud_cover": { lt: 15 } }
    });
    if (response.data.features.length > 0) {
      console.log(response.data.features[0].assets);
    } else {
      console.log("No features");
    }
  } catch (e) { console.error(e.response ? e.response.data : e.message); }
}
test();
