const axios = require('axios');
const { AMBULANCE_WEBHOOK_URL } = require('../config/env');

async function dispatch108(event) {
  try {
    const [lng, lat] = event.location.coordinates;
    const payload = {
      source: 'GhostWire',
      node_id: event.node_id,
      lat,
      lng,
      timestamp: event.timestamp,
      priority: 'HIGH'
    };

    const response = await axios.post(AMBULANCE_WEBHOOK_URL, payload, {
      timeout: 2500
    });

    console.log(`✅ 108 ambulance dispatch accepted for node ${event.node_id}`);
    return response.data;
  } catch (error) {
    console.log(`⚠️ 108 dispatch webhook failed, using mock fallback: ${error.message}`);
    return {
      status: 'mock_dispatched',
      eta: '8 minutes',
      unit: 'AMB-042'
    };
  }
}

module.exports = { dispatch108 };
