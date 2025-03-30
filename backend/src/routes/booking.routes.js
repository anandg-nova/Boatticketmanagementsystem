const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings
} = require('../controllers/booking.controller');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Routes for all authenticated users
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

// Admin only routes
router.get('/', restrictTo('admin'), getAllBookings);

module.exports = router; 