const express = require('express');
const http = require('http');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { PORT } = require('./config/env');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { connectMQTT } = require('./config/mqtt');
const { startSubscriber } = require('./mqtt/subscriber');
const { initSocketIO } = require('./socket/socketServer');
const { setSocketIO } = require('./workers/dispatchWorker');
const { startKNNScheduler } = require('./workers/knnWorker');

const zonesRoutes = require('./routes/zones');
const depotsRoutes = require('./routes/depots');
const routeRoutes = require('./routes/route');
const cvRoutes = require('./routes/cv');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      service: 'GhostWire Backend',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/zones', zonesRoutes);
app.use('/api/depots', depotsRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/cv/scene', cvRoutes);

async function boot() {
  try {
    console.log('🔄 Booting GhostWire Backend');

    await connectDB();
    await connectRedis();
    connectMQTT();

    const io = initSocketIO(server);
    setSocketIO(io);

    setTimeout(() => {
      try {
        startSubscriber();
      } catch (error) {
        console.log(`❌ Delayed MQTT subscriber start failed: ${error.message}`);
      }
    }, 2000);

    startKNNScheduler(io);

    server.listen(PORT, () => {
      console.log(`✅ GhostWire Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.log(`❌ GhostWire Backend boot failed: ${error.message}`);
    process.exit(1);
  }
}

boot();
