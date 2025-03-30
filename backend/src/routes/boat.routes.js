const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createBoat,
  getAllBoats,
  getBoat,
  updateBoat,
  deleteBoat,
  updateBoatLocation,
  updateBoatStatus,
  getBoatsByPier
} = require('../controllers/boat.controller');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Public routes
router.get('/', getAllBoats);
router.get('/:id', getBoat);
router.get('/pier/:pierId', getBoatsByPier);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', restrictTo('admin'), createBoat);
router.patch('/:id', restrictTo('admin'), updateBoat);
router.delete('/:id', restrictTo('admin'), deleteBoat);
router.patch('/:id/location', updateBoatLocation);
router.patch('/:id/status', updateBoatStatus);

module.exports = router; 