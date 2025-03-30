const mongoose = require('mongoose');

const timeslotSchema = new mongoose.Schema({
  pier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pier',
    required: [true, 'Timeslot must belong to a pier']
  },
  boat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boat',
    required: [true, 'Timeslot must be assigned to a boat']
  },
  date: {
    type: Date,
    required: [true, 'Please provide date for the timeslot']
  },
  startTime: {
    type: String,
    required: [true, 'Please provide start time']
  },
  endTime: {
    type: String,
    required: [true, 'Please provide end time']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Please specify maximum capacity'],
    min: [1, 'Maximum capacity must be at least 1']
  },
  bookedCapacity: {
    type: Number,
    default: 0,
    min: [0, 'Booked capacity cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Please specify price per ticket'],
    min: [0, 'Price cannot be negative']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for querying timeslots by date and pier
timeslotSchema.index({ date: 1, pier: 1 });

// Virtual populate bookings
timeslotSchema.virtual('bookings', {
  ref: 'Booking',
  foreignField: 'timeslot',
  localField: '_id'
});

// Virtual populate rides
timeslotSchema.virtual('rides', {
  ref: 'Ride',
  foreignField: 'timeslot',
  localField: '_id'
});

// Method to check if timeslot is fully booked
timeslotSchema.methods.isFullyBooked = function() {
  return this.bookedCapacity >= this.maxCapacity;
};

// Method to check if timeslot is available for booking
timeslotSchema.methods.isAvailableForBooking = function() {
  return this.isAvailable && !this.isFullyBooked() && this.status === 'scheduled';
};

const Timeslot = mongoose.model('Timeslot', timeslotSchema);

module.exports = Timeslot; 