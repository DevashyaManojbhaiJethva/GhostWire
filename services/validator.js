const crypto = require('crypto');
const { HMAC_SECRET } = require('../config/env');
const { client } = require('../config/redis');

function createPayloadForSigning(payload) {
  const { hmac, ...payloadWithoutHmac } = payload;
  return payloadWithoutHmac;
}

function verifyHMAC(payload) {
  const receivedHmac = payload.hmac;

  if (!receivedHmac || typeof receivedHmac !== 'string') {
    return false;
  }

  const signedPayload = createPayloadForSigning(payload);
  const expectedHmac = crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(JSON.stringify(signedPayload))
    .digest('hex');

  const receivedBuffer = Buffer.from(receivedHmac, 'hex');
  const expectedBuffer = Buffer.from(expectedHmac, 'hex');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

async function validateEvent(payload, topicNodeId) {
  try {
    const sensors = payload && payload.sensors;

    if (!sensors || sensors.mic !== true || sensors.vibration !== true || sensors.ir !== true) {
      return { valid: false, reason: '3-sensor agreement failed' };
    }

    if (topicNodeId && payload.node_id && topicNodeId !== payload.node_id) {
      return { valid: false, reason: 'topic node_id does not match payload node_id' };
    }

    if (!verifyHMAC(payload)) {
      return { valid: false, reason: 'HMAC verification failed' };
    }

    const nodeId = payload.node_id || topicNodeId;

    if (!nodeId) {
      return { valid: false, reason: 'node_id is required' };
    }

    const dedupKey = `dedup:${nodeId}`;
    const existing = await client.get(dedupKey);

    if (existing) {
      return { valid: false, reason: 'duplicate event within 30 seconds' };
    }

    await client.set(dedupKey, '1', { EX: 30 });

    return { valid: true };
  } catch (error) {
    console.log(`❌ Event validation failed: ${error.message}`);
    return { valid: false, reason: `validation error: ${error.message}` };
  }
}

module.exports = { validateEvent };
