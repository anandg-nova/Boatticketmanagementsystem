const { AppError } = require('../middleware/errorHandler');
const Ticket = require('../models/ticket.model');
const Booking = require('../models/booking.model');
const Ride = require('../models/ride.model');
const QRCode = require('../models/qrcode.model');
const { logger } = require('../utils/logger');

exports.createTicket = async (req, res, next) => {
  try {
    const { bookingId, passengerName, passengerAge, passengerGender } = req.body;

    // Check if booking exists and is confirmed
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }
    if (booking.status !== 'confirmed') {
      return next(new AppError('Booking is not confirmed', 400));
    }

    // Check if ticket already exists for this booking
    const existingTicket = await Ticket.findOne({ booking: bookingId });
    if (existingTicket) {
      return next(new AppError('Ticket already exists for this booking', 400));
    }

    const ticket = await Ticket.create({
      booking: bookingId,
      passengerName,
      passengerAge,
      passengerGender,
      status: 'valid'
    });

    // Generate QR code for the ticket
    const qrCode = await QRCode.create({
      ticket: ticket._id,
      data: JSON.stringify({
        ticketId: ticket._id,
        bookingId: booking._id,
        passengerName,
        rideId: booking.timeslot.ride
      })
    });

    ticket.qrCode = qrCode._id;
    await ticket.save();

    res.status(201).json({
      status: 'success',
      data: { ticket }
    });
  } catch (error) {
    logger.error('Ticket creation error:', error);
    next(error);
  }
};

exports.getAllTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find()
      .populate('booking', 'timeslot')
      .populate('qrCode')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: { tickets }
    });
  } catch (error) {
    logger.error('Get all tickets error:', error);
    next(error);
  }
};

exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('booking', 'timeslot')
      .populate('qrCode');

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { ticket }
    });
  } catch (error) {
    logger.error('Get ticket error:', error);
    next(error);
  }
};

exports.updateTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    // Prevent updating certain fields if ticket is used or expired
    if (ticket.status === 'used' || ticket.status === 'expired') {
      if (req.body.passengerName || req.body.passengerAge || req.body.passengerGender) {
        return next(new AppError('Cannot update passenger details for used or expired ticket', 400));
      }
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: { ticket: updatedTicket }
    });
  } catch (error) {
    logger.error('Update ticket error:', error);
    next(error);
  }
};

exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    // Only allow deletion of unused tickets
    if (ticket.status !== 'valid') {
      return next(new AppError('Cannot delete used or expired ticket', 400));
    }

    // Remove QR code
    await QRCode.findByIdAndDelete(ticket.qrCode);

    await ticket.remove();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete ticket error:', error);
    next(error);
  }
};

exports.validateTicket = async (req, res, next) => {
  try {
    const { qrCodeId } = req.body;
    const ticket = await Ticket.findOne({ qrCode: qrCodeId })
      .populate('booking', 'timeslot');

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    // Check if ticket is valid
    if (ticket.status !== 'valid') {
      return next(new AppError('Ticket is not valid', 400));
    }

    // Check if ticket is for current ride
    const ride = await Ride.findById(ticket.booking.timeslot.ride);
    if (!ride || ride.status !== 'in_progress') {
      return next(new AppError('Ticket is not valid for current ride', 400));
    }

    // Mark ticket as used
    ticket.status = 'used';
    ticket.usedAt = new Date();
    await ticket.save();

    res.status(200).json({
      status: 'success',
      data: { ticket }
    });
  } catch (error) {
    logger.error('Validate ticket error:', error);
    next(error);
  }
};

exports.getTicketsByBooking = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ booking: req.params.bookingId })
      .populate('qrCode');

    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: { tickets }
    });
  } catch (error) {
    logger.error('Get tickets by booking error:', error);
    next(error);
  }
};

exports.getTicketsByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const tickets = await Ticket.find({ status })
      .populate('booking', 'timeslot')
      .populate('qrCode')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: tickets.length,
      data: { tickets }
    });
  } catch (error) {
    logger.error('Get tickets by status error:', error);
    next(error);
  }
};

exports.getTicketQRCode = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('qrCode');

    if (!ticket) {
      return next(new AppError('Ticket not found', 404));
    }

    if (!ticket.qrCode) {
      return next(new AppError('QR code not found for ticket', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { qrCode: ticket.qrCode }
    });
  } catch (error) {
    logger.error('Get ticket QR code error:', error);
    next(error);
  }
}; 