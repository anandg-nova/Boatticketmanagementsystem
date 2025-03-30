const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createRide,
  getAllRides,
  getRide,
  updateRide,
  deleteRide,
  startRide,
  completeRide,
  updateRideLocation,
  getRidesByBoat,
  getRidesByStatus
} = require('../controllers/ride.controller');

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (authenticated users)
router.get('/boat/:boatId', getRidesByBoat);
router.get('/status/:status', getRidesByStatus);
router.get('/:id', getRide);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', createRide);
router.patch('/:id', updateRide);
router.delete('/:id', deleteRide);
router.patch('/:id/start', startRide);
router.patch('/:id/complete', completeRide);
router.patch('/:id/location', updateRideLocation);

// Admin only routes
router.get('/', restrictTo('admin'), getAllRides);

module.exports = router; 