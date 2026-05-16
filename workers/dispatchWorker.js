const Event = require('../models/Event');
const { dispatch108 } = require('../services/ambulance');
const { sendOfficerSMS, callDepot } = require('../services/twilio');
const { findNearestDepot } = require('../services/depotService');
const { getRoute } = require('../services/osrm');

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

async function dispatchEmergency(event) {
  try {
    console.log(`🚨 Emergency dispatch started for node ${event.node_id}`);

    const [lng, lat] = event.location.coordinates;
    const [ambulanceResult, smsResult, nearestDepot] = await Promise.all([
      dispatch108(event),
      sendOfficerSMS(event),
      findNearestDepot(lng, lat)
    ]);

    let routeResult = null;
    let callResult = null;

    if (nearestDepot) {
      [routeResult, callResult] = await Promise.all([
        getRoute(nearestDepot.location.coordinates, event.location.coordinates),
        callDepot(nearestDepot.contact.phone, event.node_id)
      ]);
    } else {
      console.log(`⚠️ No active depot found within 10km for node ${event.node_id}`);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      { dispatched: true, confirmed: true },
      { new: true }
    );

    const dispatchSummary = {
      event: updatedEvent || event,
      ambulance: ambulanceResult,
      officer_sms: smsResult,
      depot: nearestDepot,
      route: routeResult,
      depot_call: callResult,
      dispatched_at: new Date().toISOString()
    };

    if (ioInstance) {
      ioInstance.emit('incident', dispatchSummary);
      console.log(`📡 Incident emitted for node ${event.node_id}`);
    }

    console.log(`✅ Emergency dispatch completed for node ${event.node_id}`);
    return dispatchSummary;
  } catch (error) {
    console.log(`❌ Emergency dispatch failed for node ${event.node_id}: ${error.message}`);
    throw error;
  }
}

module.exports = { dispatchEmergency, setSocketIO };
