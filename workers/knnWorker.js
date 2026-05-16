const Event = require('../models/Event');
const Zone = require('../models/Zone');
const { client } = require('../config/redis');
const { runKNN, toGeoJSON } = require('../ml/knn');

let ioInstance = null;

async function runKNNWorker() {
  try {
    console.log('🔄 Running KNN crash-zone worker');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const events = await Event.find({
      confirmed: true,
      timestamp: { $gte: since }
    }).select('location timestamp');

    const crashPoints = events.map((event) => ({
      lat: event.location.coordinates[1],
      lng: event.location.coordinates[0],
      timestamp: event.timestamp
    }));

    const scoredCells = runKNN(crashPoints);
    const geojson = toGeoJSON(scoredCells);

    await client.set('knn:geojson', JSON.stringify(geojson), { EX: 960 });

    await Promise.all(
      scoredCells.map((cell) =>
        Zone.findOneAndUpdate(
          { grid_id: cell.grid_id },
          {
            ...cell,
            last_updated: new Date()
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      )
    );

    if (ioInstance) {
      ioInstance.emit('zone_update', geojson);
      console.log('📡 KNN zone_update emitted');
    }

    console.log(`✅ KNN worker completed with ${scoredCells.length} scored cells`);
    return geojson;
  } catch (error) {
    console.log(`❌ KNN worker failed: ${error.message}`);
    return { type: 'FeatureCollection', features: [] };
  }
}

function startKNNScheduler(io) {
  try {
    ioInstance = io;
    runKNNWorker();
    setInterval(runKNNWorker, 15 * 60 * 1000);
    console.log('✅ KNN scheduler started');
  } catch (error) {
    console.log(`❌ KNN scheduler failed to start: ${error.message}`);
  }
}

async function getZoneGeoJSON() {
  try {
    const cached = await client.get('knn:geojson');

    if (cached) {
      return JSON.parse(cached);
    }

    return await runKNNWorker();
  } catch (error) {
    console.log(`❌ KNN GeoJSON fetch failed: ${error.message}`);
    return { type: 'FeatureCollection', features: [] };
  }
}

module.exports = { startKNNScheduler, runKNNWorker, getZoneGeoJSON };
