const { createClient } = require('redis');
const { REDIS_HOST, REDIS_PORT } = require('./env');

const client = createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  }
});

client.on('connect', () => {
  console.log('✅ Redis socket connected');
});

client.on('ready', () => {
  console.log('✅ Redis client ready');
});

client.on('error', (error) => {
  console.log(`❌ Redis error: ${error.message}`);
});

async function connectRedis() {
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    return client;
  } catch (error) {
    console.log(`❌ Redis connection failed: ${error.message}`);
    throw error;
  }
}

module.exports = { client, connectRedis };
