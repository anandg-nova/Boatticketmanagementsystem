const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createTimeslot,
  getAllTimeslots,
  getTimeslot,
  updateTimeslot,
  deleteTimeslot,
  getTimeslotsByBoat,
  getTimeslotsByPier,
  getAvailableTimeslots
} = require('../controllers/timeslot.controller');

const router = express.Router();

// Public routes
router.get('/available', getAvailableTimeslots);
router.get('/boat/:boatId', getTimeslotsByBoat);
router.get('/pier/:pierId', getTimeslotsByPier);
router.get('/:id', getTimeslot);

// Protect all routes after this middleware
router.use(protect);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', createTimeslot);
router.patch('/:id', updateTimeslot);
router.delete('/:id', deleteTimeslot);

// Admin only routes
router.get('/', restrictTo('admin'), getAllTimeslots);

module.exports = router; 