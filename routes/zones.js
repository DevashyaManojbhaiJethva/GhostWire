const express = require('express');
const { getZoneGeoJSON } = require('../workers/knnWorker');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const geojson = await getZoneGeoJSON();
    res.json(geojson);
  } catch (error) {
    console.log(`❌ GET /api/zones failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch zones' });
  }
});

module.exports = router;
