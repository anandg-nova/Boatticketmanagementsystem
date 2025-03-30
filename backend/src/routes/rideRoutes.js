const express = require('express');
const rideController = require('../controllers/rideController');

const router = express.Router();

router.get('/', rideController.getAllRides);
router.post('/check-availability', rideController.checkAvailability);
router.post('/initialize', rideController.initializeRides);

module.exports = router; 