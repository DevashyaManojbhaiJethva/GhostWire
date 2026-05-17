const axios = require('axios');
const { OSRM_URL } = require('../config/env');

const getRoute = async (depotCoords, crashCoords) => {
  const [depotLng, depotLat] = depotCoords;
  const [crashLng, crashLat] = crashCoords;

  const url = `${OSRM_URL}/route/v1/driving/${depotLng},${depotLat};${crashLng},${crashLat}?overview=full&geometries=geojson&steps=true`;

  try {
    const response = await axios.get(url, { timeout: 5000 });
    const route = response.data.routes[0];

    const result = {
      distance_m: route.distance,
      duration_s: route.duration,
      eta_minutes: Math.ceil(route.duration / 60),
      geometry: route.geometry,
    };

    console.log(`✅ OSRM route computed: ${result.eta_minutes} min ETA`);
    return result;
  } catch (err) {
    console.warn('⚠️ OSRM route failed, using fallback ETA:', err.message);
    return {
      distance_m: null,
      duration_s: null,
      eta_minutes: 10,
      geometry: null,
      fallback: true,
    };
  }
};

module.exports = { getRoute };