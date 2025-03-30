const { AppError } = require('../middleware/errorHandler');
const QRCode = require('../models/qrcode.model');
const Ticket = require('../models/ticket.model');
const { logger } = require('../utils/logger');
const QRCodeGenerator = require('../utils/qrcode');

exports.createQRCode = async (req, res, next) => {
  try {
    const { data } = req.body;

    // Generate QR code image
    const qrCodeImage = await QRCodeGenerator.generate(data);

    const qrCode = await QRCode.create({
      data,
      image: qrCodeImage
    });

    res.status(201).json({
      status: 'success',
      data: { qrCode }
    });
  } catch (error) {
    logger.error('QR code creation error:', error);
    next(error);
  }
};

exports.getAllQRCodes = async (req, res, next) => {
  try {
    const qrCodes = await QRCode.find()
      .populate('ticket', 'passengerName status')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: qrCodes.length,
      data: { qrCodes }
    });
  } catch (error) {
    logger.error('Get all QR codes error:', error);
    next(error);
  }
};

exports.getQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id)
      .populate('ticket', 'passengerName status');

    if (!qrCode) {
      return next(new AppError('QR code not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { qrCode }
    });
  } catch (error) {
    logger.error('Get QR code error:', error);
    next(error);
  }
};

exports.updateQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      return next(new AppError('QR code not found', 404));
    }

    // If data is being updated, regenerate QR code image
    if (req.body.data) {
      const qrCodeImage = await QRCodeGenerator.generate(req.body.data);
      req.body.image = qrCodeImage;
    }

    const updatedQRCode = await QRCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: { qrCode: updatedQRCode }
    });
  } catch (error) {
    logger.error('Update QR code error:', error);
    next(error);
  }
};

exports.deleteQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      return next(new AppError('QR code not found', 404));
    }

    // Check if QR code is associated with a ticket
    if (qrCode.ticket) {
      return next(new AppError('Cannot delete QR code associated with a ticket', 400));
    }

    await qrCode.remove();

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete QR code error:', error);
    next(error);
  }
};

exports.getQRCodeImage = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      return next(new AppError('QR code not found', 404));
    }

    if (!qrCode.image) {
      return next(new AppError('QR code image not found', 404));
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(qrCode.image);
  } catch (error) {
    logger.error('Get QR code image error:', error);
    next(error);
  }
};

exports.getQRCodesByTicket = async (req, res, next) => {
  try {
    const qrCodes = await QRCode.find({ ticket: req.params.ticketId })
      .populate('ticket', 'passengerName status');

    res.status(200).json({
      status: 'success',
      results: qrCodes.length,
      data: { qrCodes }
    });
  } catch (error) {
    logger.error('Get QR codes by ticket error:', error);
    next(error);
  }
};

exports.regenerateQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      return next(new AppError('QR code not found', 404));
    }

    // Regenerate QR code image
    const qrCodeImage = await QRCodeGenerator.generate(qrCode.data);
    qrCode.image = qrCodeImage;
    await qrCode.save();

    res.status(200).json({
      status: 'success',
      data: { qrCode }
    });
  } catch (error) {
    logger.error('Regenerate QR code error:', error);
    next(error);
  }
}; 