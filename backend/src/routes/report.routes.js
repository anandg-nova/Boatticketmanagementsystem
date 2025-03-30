const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { getBookingStats, getRevenueStats } = require('../controllers/report.controller');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Admin only routes
router.use(restrictTo('admin'));

router.get('/bookings', getBookingStats);
router.get('/revenue', getRevenueStats);

module.exports = router; 