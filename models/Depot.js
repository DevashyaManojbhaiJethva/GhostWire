const mongoose = require('mongoose');

const depotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['ambulance', 'police', 'fire', 'medical'],
      required: true,
      index: true
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
    contact: {
      phone: {
        type: String,
        required: true
      },
      officer: {
        type: String,
        required: true
      }
    },
    resources: {
      aed: {
        type: Boolean,
        default: false
      },
      stretcher: {
        type: Boolean,
        default: false
      },
      firstAid: {
        type: Boolean,
        default: true
      }
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

depotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Depot', depotSchema);
