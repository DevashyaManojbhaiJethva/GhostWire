const express = require('express');
const { findNearestDepot, getAllDepots } = require('../services/depotService');

const router = express.Router();

router.get('/nearest', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng query parameters are required' });
    }

    const depot = await findNearestDepot(Number(lng), Number(lat));
    return res.json({ depot });
  } catch (error) {
    console.log(`❌ GET /api/depots/nearest failed: ${error.message}`);
    return res.status(500).json({ error: 'Failed to fetch nearest depot' });
  }
});

router.get('/', async (req, res) => {
  try {
    const depots = await getAllDepots();
    res.json({ depots });
  } catch (error) {
    console.log(`❌ GET /api/depots failed: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch depots' });
  }
});

module.exports = router;
