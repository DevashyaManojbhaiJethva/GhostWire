const mqtt = require('mqtt');
const {
  MQTT_BROKER_URL,
  MQTT_PORT,
  MQTT_USERNAME,
  MQTT_PASSWORD
} = require('./env');

let mqttClient = null;

function connectMQTT() {
  try {
    if (mqttClient) {
      return mqttClient;
    }

    mqttClient = mqtt.connect(MQTT_BROKER_URL, {
      port: MQTT_PORT,
      username: MQTT_USERNAME,
      password: MQTT_PASSWORD,
      reconnectPeriod: 5000,
      connectTimeout: 30000
    });

    mqttClient.on('connect', () => {
      console.log('✅ MQTT connected to Mosquitto broker');
    });

    mqttClient.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting to broker');
    });

    mqttClient.on('error', (error) => {
      console.log(`❌ MQTT error: ${error.message}`);
    });

    mqttClient.on('close', () => {
      console.log('⚠️ MQTT connection closed');
    });

    return mqttClient;
  } catch (error) {
    console.log(`❌ MQTT connection setup failed: ${error.message}`);
    throw error;
  }
}

function getMQTTClient() {
  if (!mqttClient) {
    throw new Error('MQTT client has not been initialized');
  }

  return mqttClient;
}

module.exports = { connectMQTT, getMQTTClient };
