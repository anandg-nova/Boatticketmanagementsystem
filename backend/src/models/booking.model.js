const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a customer']
  },
  timeslot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timeslot',
    required: [true, 'Booking must be for a timeslot']
  },
  numberOfTickets: {
    type: Number,
    required: [true, 'Please specify number of tickets'],
    min: [1, 'Number of tickets must be at least 1']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please specify total amount']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    required: [true, 'Payment ID is required']
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  },
  qrCode: {
    type: String,
    required: [true, 'QR code is required']
  },
  rideStartTime: Date,
  rideEndTime: Date,
  duration: {
    type: Number, // in minutes
    default: 0
  },
  cancellationReason: String,
  refundAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for querying bookings by customer and date
bookingSchema.index({ customer: 1, createdAt: -1 });

// Virtual populate tickets
bookingSchema.virtual('tickets', {
  ref: 'Ticket',
  foreignField: 'booking',
  localField: '_id'
});

// Method to calculate refund amount
bookingSchema.methods.calculateRefundAmount = function() {
  if (this.bookingStatus === 'cancelled') {
    // Refund policy: 100% refund if cancelled 24 hours before
    const bookingDate = new Date(this.createdAt);
    const timeslotDate = new Date(this.timeslot.date);
    const hoursBeforeRide = (timeslotDate - bookingDate) / (1000 * 60 * 60);
    
    if (hoursBeforeRide >= 24) {
      return this.totalAmount;
    } else if (hoursBeforeRide >= 12) {
      return this.totalAmount * 0.5; // 50% refund
    }
    return 0; // No refund
  }
  return 0;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking; 