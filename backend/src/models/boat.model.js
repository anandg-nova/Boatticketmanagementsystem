const mongoose = require('mongoose');

const boatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide boat name'],
    unique: true,
    trim: true
  },
  pier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pier',
    required: [true, 'Boat must belong to a pier']
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide boat capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      default: [0, 0]
    }
  },
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'out_of_service'],
    default: 'available'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
boatSchema.index({ currentLocation: '2dsphere' });

// Virtual populate rides
boatSchema.virtual('rides', {
  ref: 'Ride',
  foreignField: 'boat',
  localField: '_id'
});

// Virtual populate timeslots
boatSchema.virtual('timeslots', {
  ref: 'Timeslot',
  foreignField: 'boat',
  localField: '_id'
});

const Boat = mongoose.model('Boat', boatSchema);

module.exports = Boat; 