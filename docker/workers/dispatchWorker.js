const { dispatch108 } = require('../services/ambulance');
const { sendOfficerSMS, callDepot } = require('../services/twilio');
const { findNearestDepot } = require('../services/depotService');
const { getRoute } = require('../services/osrm');
const Event = require('../models/Event');

let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const dispatchEmergency = async (eventData) => {
  const { node_id, location } = eventData;
  const [lng, lat] = location.coordinates;

  console.log(`🚨 Emergency dispatch started for node ${node_id}`);

  try {
    const [ambulanceResult, smsResult, depot] = await Promise.all([
      dispatch108(eventData),
      sendOfficerSMS(eventData),
      findNearestDepot(lng, lat),
    ]);

    let routeResult = null;

    if (depot) {
      const [route] = await Promise.all([
        getRoute(depot.location.coordinates, [lng, lat]),
        callDepot(depot.contact.phone, node_id),
      ]);
      routeResult = route;
    }

    await Event.findOneAndUpdate(
      { node_id, dispatched: false },
      { dispatched: true, confirmed: true },
      { new: true }
    );

    const summary = {
      node_id,
      timestamp: new Date().toISOString(),
      ambulance: ambulanceResult,
      sms_sent: !!smsResult,
      depot: depot ? depot.name : 'none',
      eta_minutes: routeResult ? routeResult.eta_minutes : null,
      route: routeResult,
    };

    if (io) {
      io.emit('incident', summary);
      console.log(`📡 Incident emitted for node ${node_id}`);
    }

    console.log(`✅ Emergency dispatch completed for node ${node_id}`);
    return summary;

  } catch (err) {
    console.error(`❌ Dispatch failed for node ${node_id}:`, err.message);
    throw err;
  }
};

module.exports = { dispatchEmergency, setSocketIO };