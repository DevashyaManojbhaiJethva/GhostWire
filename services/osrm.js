const axios = require('axios');
const { OSRM_URL } = require('../config/env');

async function getRoute(depotCoords, crashCoords) {
  try {
    const [depotLng, depotLat] = depotCoords.map(Number);
    const [crashLng, crashLat] = crashCoords.map(Number);
    const url = `${OSRM_URL}/route/v1/driving/${depotLng},${depotLat};${crashLng},${crashLat}?overview=full&geometries=geojson&steps=true`;

    console.log('[OSRM] Requesting route...');
    const response = await axios.get(url, { timeout: 10000 });
    const route = response.data.routes && response.data.routes[0];

    if (!route) throw new Error('OSRM returned no route');

    console.log(`[OSRM] Route computed: ${Math.ceil(route.duration / 60)} min ETA`);
    return {
      distance_m: route.distance,
      duration_s: route.duration,
      eta_minutes: Math.ceil(route.duration / 60),
      geometry: route.geometry
    };

  } catch (error) {
    console.log('[OSRM] Route failed:', error.message);
    return { eta_minutes: 10, fallback: true };
  }
}

module.exports = { getRoute };