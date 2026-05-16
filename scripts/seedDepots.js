const connectDB = require('../config/db');
const Depot = require('../models/Depot');

const depots = [
  {
    name: 'Central Police Station',
    type: 'police',
    location: {
      type: 'Point',
      coordinates: [72.5873, 23.0258]
    },
    contact: {
      phone: '+919313434482',
      officer: 'Inspector Rakesh Patel'
    },
    resources: {
      aed: false,
      stretcher: false,
      firstAid: true
    },
    active: true
  },
  {
    name: 'Civil Hospital Ambulance Depot',
    type: 'ambulance',
    location: {
      type: 'Point',
      coordinates: [72.6047, 23.0525]
    },
    contact: {
      phone: '+919313434482',
      officer: 'Dr. Meera Shah'
    },
    resources: {
      aed: true,
      stretcher: true,
      firstAid: true
    },
    active: true
  },
  {
    name: 'Naroda Fire Station',
    type: 'fire',
    location: {
      type: 'Point',
      coordinates: [72.6561, 23.0701]
    },
    contact: {
      phone: '+919313434482',
      officer: 'Station Officer Arvind Solanki'
    },
    resources: {
      aed: true,
      stretcher: true,
      firstAid: true
    },
    active: true
  }
];

async function seedDepots() {
  try {
    await connectDB();
    await Depot.deleteMany({});
    await Depot.insertMany(depots);
    console.log('✅ Seeded 3 Ahmedabad depots successfully');
    process.exit(0);
  } catch (error) {
    console.log(`❌ Depot seeding failed: ${error.message}`);
    process.exit(1);
  }
}

seedDepots();
