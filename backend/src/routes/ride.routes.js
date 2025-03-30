const express = require('express');
const {
  createRide,
  getAllRides,
  getRideById,
  updateRide,
  deleteRide,
  getRideBookings,
  updateRideStatus
} = require('../controllers/ride.controller');

const router = express.Router();

// Public routes
router.get('/', getAllRides);
router.get('/:id', getRideById);
router.get('/:id/bookings', getRideBookings);

// Ride manager routes
router.post('/', createRide);
router.patch('/:id', updateRide);
router.delete('/:id', deleteRide);
router.patch('/:id/status', updateRideStatus);

module.exports = router; 