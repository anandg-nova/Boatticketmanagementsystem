const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createBooking,
  getBooking,
  getUserBookings,
  cancelBooking,
  getAllBookings,
  validateQRCode,
  updateDuration,
  getTodayBookings,
  validateTicket,
  startRide,
  stopRide,
  cancelTicket
} = require('../controllers/booking.controller');

const router = express.Router();

// Public routes (no authentication required)
router.post('/validate', validateQRCode);
router.post('/update-duration', updateDuration);
router.get('/today', getTodayBookings);
router.get('/all-bookings', getAllBookings); // Made public for ride manager

// Protect all routes after this middleware
router.use(protect);

// Routes for all authenticated users
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

// Admin only routes
router.get('/', restrictTo('admin'), getAllBookings);

// Validate ticket
router.post('/validate-ticket', validateTicket);

// Start ride
router.post('/start-ride', protect, restrictTo('ride_manager'), startRide);

// Stop ride
router.post('/stop-ride', protect, restrictTo('ride_manager'), stopRide);

// Cancel ticket
router.post('/cancel-ticket', cancelTicket);

module.exports = router; 