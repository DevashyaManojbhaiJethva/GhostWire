const express = require('express');
const { getRoute } = require('../services/osrm');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { depotLat, depotLng, crashLat, crashLng } = req.query;

    if (!depotLat || !depotLng || !crashLat || !crashLng) {
      return res.status(400).json({
        error: 'depotLat, depotLng, crashLat, and crashLng query parameters are required'
      });
    }

    const route = await getRoute(
      [Number(depotLng), Number(depotLat)],
      [Number(crashLng), Number(crashLat)]
    );

    return res.json(route);
  } catch (error) {
    console.log(`❌ GET /api/route failed: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch route' });
  }
});

module.exports = router;
