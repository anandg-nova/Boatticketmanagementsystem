const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  rideName: {
    type: String,
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
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for querying tickets by booking
ticketSchema.index({ booking: 1 });

// Method to validate ticket
ticketSchema.methods.validateTicket = async function(rideManagerId) {
  if (this.status !== 'valid') {
    return {
      isValid: false,
      reason: `Ticket is ${this.status}`
    };
  }

  if (this.isScanned) {
    return {
      isValid: false,
      reason: 'Ticket has already been scanned'
    };
  }

  // Add validation attempt
  this.validationAttempts.push({
    timestamp: new Date(),
    isValid: true,
    scannedBy: rideManagerId
  });

  this.isScanned = true;
  this.scannedAt = new Date();
  this.scannedBy = rideManagerId;
  this.status = 'used';

  await this.save();

  return {
    isValid: true,
    reason: 'Ticket validated successfully'
  };
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket; 