const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema(
  {
    grid_id: {
      type: String,
      required: true,
      unique: true
    },
    center: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    risk_score: {
      type: Number,
      default: 0
    },
    risk_level: {
      type: String,
      enum: ['green', 'yellow', 'orange', 'red'],
      default: 'green'
    },
    crash_count_30d: {
      type: Number,
      default: 0
    },
    last_updated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', zoneSchema);
