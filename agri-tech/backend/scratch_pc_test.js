const axios = require('axios');

async function test() {
  const element84Id = "S2C_43RBK_20250511_0_L2A";
  const timestamp = "2025-05-11T05:52:03.387000Z";
  const pcUrl = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
  
  // Try to find the same item on PC using the timestamp and a small window
  const searchParams = {
    collections: ["sentinel-2-l2a"],
    datetime: "2025-05-11T05:50:00Z/2025-05-11T05:55:00Z",
    bbox: [72.6, 26.7, 72.8, 26.9],
    limit: 1
  };

  try {
    console.log("Searching PC for ID mapping...");
    const res = await axios.post(pcUrl, searchParams, { timeout: 10000 });
    if (res.data.features && res.data.features.length > 0) {
      console.log("Found PC Item ID:", res.data.features[0].id);
    } else {
      console.log("No matching item on PC");
    }
  } catch (err) {
    console.log("PC Search failed:", err.message);
  }
}

test();
