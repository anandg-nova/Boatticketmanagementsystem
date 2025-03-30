const express = require('express');
const authRoutes = require('./auth.routes');
const boatRoutes = require('./boat.routes');
const pierRoutes = require('./pier.routes');
const timeslotRoutes = require('./timeslot.routes');
const bookingRoutes = require('./booking.routes');
const rideRoutes = require('./ride.routes');
const ticketRoutes = require('./ticket.routes');
const qrcodeRoutes = require('./qrcode.routes');
const paymentRoutes = require('./payment.routes');

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/boats', boatRoutes);
router.use('/piers', pierRoutes);
router.use('/timeslots', timeslotRoutes);
router.use('/bookings', bookingRoutes);
router.use('/rides', rideRoutes);
router.use('/tickets', ticketRoutes);
router.use('/qrcodes', qrcodeRoutes);
router.use('/payment', paymentRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy'
  });
});

module.exports = router; 