const Booking = require('../models/booking.model');
const { logger } = require('../utils/logger');

exports.getBookingStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats }
    });
  } catch (error) {
    logger.error('Error getting booking stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting booking statistics'
    });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const stats = await Booking.aggregate([
      {
        $match: { status: 'confirmed' }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { stats: stats[0] || { totalRevenue: 0, averageBookingValue: 0, totalBookings: 0 } }
    });
  } catch (error) {
    logger.error('Error getting revenue stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error getting revenue statistics'
    });
  }
}; 