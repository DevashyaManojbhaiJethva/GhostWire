const { getMQTTClient } = require('../config/mqtt');
const Event = require('../models/Event');
const { validateEvent } = require('../services/validator');
const { dispatchEmergency } = require('../workers/dispatchWorker');

const EVENT_TOPIC = '/ghostwire/events/+';

function parseNodeIdFromTopic(topic) {
  const parts = topic.split('/');
  return parts[parts.length - 1];
}

function startSubscriber() {
  try {
    const client = getMQTTClient();

    client.subscribe(EVENT_TOPIC, { qos: 1 }, (error) => {
      if (error) {
        console.log(`❌ MQTT subscription failed: ${error.message}`);
        return;
      }

      console.log(`✅ MQTT subscribed to ${EVENT_TOPIC}`);
    });

    client.on('message', async (topic, messageBuffer) => {
      try {
        console.log(`📨 MQTT message received on ${topic}`);

        const topicNodeId = parseNodeIdFromTopic(topic);
        const payload = JSON.parse(messageBuffer.toString());
        const validation = await validateEvent(payload, topicNodeId);

        if (!validation.valid) {
          console.log(`⚠️ Invalid event rejected: ${validation.reason}`);
          return;
        }

        const nodeId = payload.node_id || topicNodeId;
        const event = await Event.create({
          node_id: nodeId,
          timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
          sensors: payload.sensors,
          location: {
            type: 'Point',
            coordinates: [Number(payload.lng), Number(payload.lat)]
          },
          confirmed: true,
          dispatched: false,
          weather: payload.weather || null,
          blockchain_tx: payload.blockchain_tx || null
        });

        console.log(`✅ Event saved for node ${nodeId}`);
        await dispatchEmergency(event);
      } catch (error) {
        console.log(`❌ MQTT message handling failed: ${error.message}`);
      }
    });
  } catch (error) {
    console.log(`❌ MQTT subscriber failed to start: ${error.message}`);
    throw error;
  }
}

module.exports = { startSubscriber };
