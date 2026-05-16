require('dotenv').config();

const env = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || '',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || 'mqtt://localhost',
  MQTT_PORT: Number(process.env.MQTT_PORT || 1883),
  MQTT_USERNAME: process.env.MQTT_USERNAME || 'ghostwire',
  MQTT_PASSWORD: process.env.MQTT_PASSWORD || 'ghostwire123',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
  OFFICER_PHONE_NUMBER: process.env.OFFICER_PHONE_NUMBER || '',
  OSRM_URL: process.env.OSRM_URL || 'http://localhost:5000',
  AMBULANCE_WEBHOOK_URL:
    process.env.AMBULANCE_WEBHOOK_URL || 'https://mock-108-api.ghostwire.dev/dispatch',
  HMAC_SECRET: process.env.HMAC_SECRET || 'ghostwire_secret_key_2026',
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || ''
};

module.exports = env;
