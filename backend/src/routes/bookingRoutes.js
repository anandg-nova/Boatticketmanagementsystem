const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.post('/', bookingController.createBooking);
router.get('/:bookingId', bookingController.getBooking);
router.patch('/:bookingId/confirm', bookingController.confirmBooking);
router.patch('/:bookingId/cancel', bookingController.cancelBooking);

module.exports = router; 