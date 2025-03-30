const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Regular Ride', 'VIP Ride']
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  maxCapacity: {
    type: Number,
    default: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Ride', rideSchema); 