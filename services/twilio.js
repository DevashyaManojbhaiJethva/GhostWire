const twilio = require('twilio');
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  OFFICER_PHONE_NUMBER
} = require('../config/env');

function getTwilioClient() {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials are not configured');
  }

  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

async function sendOfficerSMS(event) {
  try {
    if (!TWILIO_PHONE_NUMBER || !OFFICER_PHONE_NUMBER) {
      throw new Error('Twilio sender or officer phone number is missing');
    }

    const [lng, lat] = event.location.coordinates;
    const mapLink = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `GhostWire emergency alert. Crash detected at node ${event.node_id}. Location: ${mapLink}`;
    const result = await getTwilioClient().messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: OFFICER_PHONE_NUMBER
    });

    console.log(`✅ Officer SMS sent: ${result.sid}`);
    return {
      status: 'sent',
      sid: result.sid,
      to: OFFICER_PHONE_NUMBER
    };
  } catch (error) {
    console.log(`❌ Officer SMS failed: ${error.message}`);
    return {
      status: 'failed',
      reason: error.message
    };
  }
}

async function callDepot(depotPhone, node_id) {
  try {
    if (!depotPhone) {
      throw new Error('Depot phone number is missing');
    }

    if (!TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number is missing');
    }

    const message = `GhostWire emergency alert. Crash detected at node ${node_id}. Please dispatch resources immediately.`;
    const result = await getTwilioClient().calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      from: TWILIO_PHONE_NUMBER,
      to: depotPhone
    });

    console.log(`✅ Depot voice call placed: ${result.sid}`);
    return {
      status: 'called',
      sid: result.sid,
      to: depotPhone
    };
  } catch (error) {
    console.log(`❌ Depot voice call failed: ${error.message}`);
    return {
      status: 'failed',
      reason: error.message
    };
  }
}

module.exports = { sendOfficerSMS, callDepot };
