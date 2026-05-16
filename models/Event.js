const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    node_id: {
      type: String,
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sensors: {
      mic: {
        type: Boolean,
        default: false
      },
      vibration: {
        type: Boolean,
        default: false
      },
      ir: {
        type: Boolean,
        default: false
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    confirmed: {
      type: Boolean,
      default: false,
      index: true
    },
    dispatched: {
      type: Boolean,
      default: false
    },
    blockchain_tx: {
      type: String,
      default: null
    },
    weather: {
      type: Object,
      default: null
    }
  },
  { timestamps: true }
);

eventSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Event', eventSchema);
