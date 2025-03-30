const mongoose = require('mongoose');

const pierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide pier name'],
    unique: true,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      required: [true, 'Please provide pier address']
    }
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  operatingHours: {
    start: {
      type: String,
      required: true,
      default: '10:00'
    },
    end: {
      type: String,
      required: true,
      default: '16:00'
    }
  },
  maxBoats: {
    type: Number,
    required: [true, 'Please specify maximum number of boats'],
    min: [1, 'Maximum boats must be at least 1']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
pierSchema.index({ location: '2dsphere' });

// Virtual populate boats
pierSchema.virtual('boats', {
  ref: 'Boat',
  foreignField: 'pier',
  localField: '_id'
});

// Virtual populate timeslots
pierSchema.virtual('timeslots', {
  ref: 'Timeslot',
  foreignField: 'pier',
  localField: '_id'
});

const Pier = mongoose.model('Pier', pierSchema);

module.exports = Pier; 