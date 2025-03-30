const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  timeslot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot',
    required: [true, 'Ride must be associated with a timeslot']
  },
  boat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: [true, 'Ride must be associated with a boat']
  },
  rideManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Ride must have a ride manager']
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  departureTime: Date,
  returnTime: Date,
  duration: {
    type: Number, // in minutes
    default: 0
  },
  actualCapacity: {
    type: Number,
    default: 0
  },
  weatherConditions: {
    type: String,
    enum: ['good', 'moderate', 'poor'],
    default: 'good'
  },
  notes: String,
  incidents: [{
    timestamp: Date,
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for querying rides by date and status
rideSchema.index({ departureTime: 1, status: 1 });

// Virtual populate bookings
rideSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'ride',
  localField: '_id'
});

// Method to start ride
rideSchema.methods.startRide = async function() {
  if (this.status !== 'scheduled') {
    throw new Error('Ride can only be started when scheduled');
  }

  this.status = 'in_progress';
  this.departureTime = new Date();
  await this.save();
};

// Method to end ride
rideSchema.methods.endRide = async function() {
  if (this.status !== 'in_progress') {
    throw new Error('Ride can only be ended when in progress');
  }

  this.status = 'completed';
  this.returnTime = new Date();
  this.duration = Math.round((this.returnTime - this.departureTime) / (1000 * 60));
  await this.save();
};

// Method to add incident
rideSchema.methods.addIncident = async function(description, severity) {
  this.incidents.push({
    timestamp: new Date(),
    description,
    severity
  });
  await this.save();
};

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 