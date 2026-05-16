const { Server } = require('socket.io');
const { getZoneGeoJSON } = require('../workers/knnWorker');

let ioInstance = null;

function initSocketIO(httpServer) {
  try {
    ioInstance = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    ioInstance.on('connection', (socket) => {
      console.log(`📡 Socket connected: ${socket.id}`);

      socket.on('request_zones', async () => {
        try {
          const geojson = await getZoneGeoJSON();
          socket.emit('zone_update', geojson);
        } catch (error) {
          console.log(`❌ Socket request_zones failed: ${error.message}`);
          socket.emit('zone_error', { error: 'Failed to fetch zones' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`📡 Socket disconnected: ${socket.id}`);
      });
    });

    console.log('✅ Socket.io initialized');
    return ioInstance;
  } catch (error) {
    console.log(`❌ Socket.io initialization failed: ${error.message}`);
    throw error;
  }
}

function getIO() {
  return ioInstance;
}

module.exports = { initSocketIO, getIO };
