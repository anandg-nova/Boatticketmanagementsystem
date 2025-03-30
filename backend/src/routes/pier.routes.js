const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createPier,
  getAllPiers,
  getPier,
  updatePier,
  deletePier,
  updateOperatingHours,
  getPierCapacity,
  getNearbyPiers
} = require('../controllers/pier.controller');

const router = express.Router();

// Public routes
router.get('/', getAllPiers);
router.get('/nearby', getNearbyPiers);
router.get('/:id', getPier);
router.get('/:id/capacity', getPierCapacity);

// Protect all routes after this middleware
router.use(protect);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', createPier);
router.patch('/:id', updatePier);
router.delete('/:id', deletePier);
router.patch('/:id/operating-hours', updateOperatingHours);

module.exports = router; 