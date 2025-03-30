const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ride name is required'],
    trim: true,
    minlength: [3, 'Ride name must be at least 3 characters long'],
    maxlength: [100, 'Ride name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Ride description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  schedule: {
    startTime: {
      type: String,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: String,
      required: [true, 'End time is required']
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: [true, 'At least one day must be specified']
    }]
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for faster queries
rideSchema.index({ name: 1 });
rideSchema.index({ status: 1 });
rideSchema.index({ 'schedule.days': 1 });

// Virtual for checking if ride is available
rideSchema.virtual('isAvailable').get(function() {
  return this.status === 'active';
});

// Method to check if ride is available on a specific day
rideSchema.methods.isAvailableOnDay = function(day) {
  return this.schedule.days.includes(day.toLowerCase());
};

// Method to check if ride is available at a specific time
rideSchema.methods.isAvailableAtTime = function(time) {
  return time >= this.schedule.startTime && time <= this.schedule.endTime;
};

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride; 