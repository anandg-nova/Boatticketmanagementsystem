const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  ride: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'in-progress', 'completed'],
    default: 'pending'
  },
  ticketId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String
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

// Index for faster queries
bookingSchema.index({ date: 1, time: 1 });
bookingSchema.index({ status: 1 });

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
    const timeslotDate = new Date(this.date);
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