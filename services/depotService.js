const Depot = require('../models/Depot');

async function findNearestDepot(lng, lat) {
  try {
    const depot = await Depot.findOne({
      active: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: 10000
        }
      }
    });

    return depot;
  } catch (error) {
    console.log(`❌ Nearest depot lookup failed: ${error.message}`);
    throw error;
  }
}

async function getAllDepots() {
  try {
    return await Depot.find({ active: true }).sort({ type: 1, name: 1 });
  } catch (error) {
    console.log(`❌ Depot listing failed: ${error.message}`);
    throw error;
  }
}

module.exports = { findNearestDepot, getAllDepots };
