const { AppError } = require('../middleware/errorHandler');
const Booking = require('../models/booking.model');
const Timeslot = require('../models/timeslot.model');
const Ticket = require('../models/ticket.model');
const QRCode = require('qrcode');
const { logger } = require('../utils/logger');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Ride = require('../models/ride.model');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

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

// Get all bookings (for ride manager)
exports.getAllBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find()
    .populate('ride', 'name')
    .sort({ date: -1, time: -1 });

  const formattedBookings = bookings.map(booking => ({
    _id: booking._id,
    rideName: booking.ride.name,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount,
    ticketId: booking.ticketId,
    startTime: booking.startTime,
    endTime: booking.endTime
  }));

  res.status(200).json({
    status: 'success',
    data: {
      bookings: formattedBookings
    }
  });
});

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

exports.validateQRCode = async (req, res) => {
  try {
    const { qrCode, rideId } = req.body;

    // Find the booking by QR code and ride ID
    const booking = await Booking.findOne({
      qrCode,
      ride: rideId,
      status: 'confirmed'
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired ticket'
      });
    }

    // Check if the booking is for today
    const today = new Date();
    const bookingDate = new Date(booking.date);
    if (bookingDate.toDateString() !== today.toDateString()) {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not valid for today'
      });
    }

    // Check if the booking has already been used
    if (booking.used) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been used'
      });
    }

    // Mark the ticket as used
    booking.used = true;
    await booking.save();

    res.json({
      success: true,
      bookingId: booking._id,
      message: 'Ticket validated successfully'
    });
  } catch (error) {
    console.error('QR code validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate ticket'
    });
  }
};

exports.updateDuration = async (req, res) => {
  try {
    const { bookingId, duration } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update the duration
    booking.duration = duration;

    // Calculate fare if time-based
    if (booking.ride.pricingType === 'time-based') {
      const ratePerHour = booking.ride.price;
      const hours = duration / 3600; // Convert seconds to hours
      booking.finalPrice = Math.ceil(hours * ratePerHour);
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Duration updated successfully',
      booking: {
        duration: booking.duration,
        finalPrice: booking.finalPrice
      }
    });
  } catch (error) {
    console.error('Duration update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update duration'
    });
  }
};

exports.getTodayBookings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('ride')
    .populate('customer', 'name email phone')
    .sort({ date: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching today\'s bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch today\'s bookings'
    });
  }
};

// Validate ticket
exports.validateTicket = catchAsync(async (req, res, next) => {
  const { ticketId } = req.body;
  
  const booking = await Booking.findOne({ ticketId });
  if (!booking) {
    throw new ApiError('Invalid ticket', 404);
  }

  if (booking.status !== 'confirmed') {
    throw new ApiError('Ticket is not confirmed', 400);
  }

  res.status(200).json({
    status: 'success',
    data: {
      booking: {
        _id: booking._id,
        rideName: booking.ride.name,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        quantity: booking.quantity
      }
    }
  });
});

// Start ride
exports.startRide = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError('Booking not found', 404);
  }

  if (booking.status !== 'confirmed') {
    throw new ApiError('Cannot start ride for non-confirmed booking', 400);
  }

  if (booking.startTime) {
    throw new ApiError('Ride has already started', 400);
  }

  booking.startTime = new Date();
  booking.status = 'in_progress';
  booking.elapsedTime = 0;
  await booking.save();

  // Set a timeout to automatically stop the ride after 2 minutes
  setTimeout(async () => {
    const updatedBooking = await Booking.findById(bookingId);
    if (updatedBooking && updatedBooking.status === 'in_progress') {
      updatedBooking.endTime = new Date();
      updatedBooking.status = 'completed';
      updatedBooking.elapsedTime = 120; // 2 minutes in seconds
      await updatedBooking.save();
    }
  }, 120000); // 2 minutes in milliseconds

  res.status(200).json({
    status: 'success',
    data: {
      booking: {
        _id: booking._id,
        startTime: booking.startTime,
        status: booking.status,
        elapsedTime: booking.elapsedTime
      }
    }
  });
});

// Stop ride
exports.stopRide = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError('Booking not found', 404);
  }

  if (booking.status !== 'in_progress') {
    throw new ApiError('Cannot stop ride that is not in progress', 400);
  }

  booking.endTime = new Date();
  booking.status = 'completed';
  booking.elapsedTime = Math.min(booking.elapsedTime || 0, 120); // Cap at 2 minutes
  await booking.save();

  res.status(200).json({
    status: 'success',
    data: {
      booking: {
        _id: booking._id,
        endTime: booking.endTime,
        status: booking.status,
        elapsedTime: booking.elapsedTime
      }
    }
  });
});

// Cancel ticket
exports.cancelTicket = catchAsync(async (req, res, next) => {
  const { bookingId } = req.body;
  
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError('Booking not found', 404);
  }

  if (booking.status === 'completed') {
    throw new ApiError('Cannot cancel completed booking', 400);
  }

  booking.status = 'cancelled';
  await booking.save();

  res.status(200).json({
    status: 'success',
    data: {
      booking: {
        _id: booking._id,
        status: booking.status
      }
    }
  });
}); 