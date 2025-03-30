const { AppError } = require('../middleware/errorHandler');
const Booking = require('../models/booking.model');
const Timeslot = require('../models/timeslot.model');
const Ticket = require('../models/ticket.model');
const QRCode = require('qrcode');
const { logger } = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to generate QR code
const generateQRCode = async (bookingId) => {
  try {
    const qrData = JSON.stringify({
      bookingId,
      timestamp: Date.now()
    });
    
    const qrCodePath = `${process.env.QR_CODE_DIR}/${bookingId}.png`;
    await QRCode.toFile(qrCodePath, qrData);
    return qrCodePath;
  } catch (error) {
    logger.error('QR code generation error:', error);
    throw new AppError('Error generating QR code', 500);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { timeslotId, numberOfTickets } = req.body;
    const customer = req.user;

    // Check if timeslot exists and is available
    const timeslot = await Timeslot.findById(timeslotId);
    if (!timeslot) {
      return next(new AppError('Timeslot not found', 404));
    }

    if (!timeslot.isAvailableForBooking()) {
      return next(new AppError('Timeslot is not available for booking', 400));
    }

    // Check if there's enough capacity
    if (timeslot.bookedCapacity + numberOfTickets > timeslot.maxCapacity) {
      return next(new AppError('Not enough tickets available', 400));
    }

    // Calculate total amount
    const totalAmount = timeslot.price * numberOfTickets;

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // Convert to cents
      currency: 'usd',
      metadata: {
        timeslotId,
        numberOfTickets
      }
    });

    // Create booking
    const booking = await Booking.create({
      customer: customer._id,
      timeslot: timeslotId,
      numberOfTickets,
      totalAmount,
      paymentId: paymentIntent.id,
      qrCode: await generateQRCode(paymentIntent.id)
    });

    // Update timeslot capacity
    timeslot.bookedCapacity += numberOfTickets;
    await timeslot.save();

    // Create tickets
    const tickets = await Promise.all(
      Array(numberOfTickets).fill().map(async () => {
        return await Ticket.create({
          booking: booking._id,
          qrCodeData: booking.qrCode
        });
      })
    );

    res.status(201).json({
      status: 'success',
      data: {
        booking,
        tickets,
        clientSecret: paymentIntent.client_secret
      }
    });
  } catch (error) {
    logger.error('Booking creation error:', error);
    next(error);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('timeslot')
      .populate('tickets');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user has permission to view this booking
    if (req.user.role !== 'admin' && booking.customer._id.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to view this booking', 403));
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    logger.error('Get booking error:', error);
    next(error);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate('timeslot')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    logger.error('Get user bookings error:', error);
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('timeslot')
      .populate('tickets');

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Check if user has permission to cancel this booking
    if (req.user.role !== 'admin' && booking.customer.toString() !== req.user._id.toString()) {
      return next(new AppError('You do not have permission to cancel this booking', 403));
    }

    // Check if booking can be cancelled
    const timeslotDate = new Date(booking.timeslot.date);
    const hoursBeforeRide = (timeslotDate - new Date()) / (1000 * 60 * 60);
    
    if (hoursBeforeRide < 12) {
      return next(new AppError('Booking can only be cancelled up to 12 hours before the ride', 400));
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefundAmount();
    
    // Process refund if payment was completed
    if (booking.paymentStatus === 'completed' && refundAmount > 0) {
      await stripe.refunds.create({
        payment_intent: booking.paymentId,
        amount: refundAmount * 100 // Convert to cents
      });
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    booking.refundAmount = refundAmount;
    booking.cancellationReason = req.body.reason;
    await booking.save();

    // Update tickets status
    await Ticket.updateMany(
      { booking: booking._id },
      { status: 'cancelled' }
    );

    // Update timeslot capacity
    booking.timeslot.bookedCapacity -= booking.numberOfTickets;
    await booking.timeslot.save();

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    logger.error('Cancel booking error:', error);
    next(error);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email')
      .populate('timeslot')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: { bookings }
    });
  } catch (error) {
    logger.error('Get all bookings error:', error);
    next(error);
  }
}; 