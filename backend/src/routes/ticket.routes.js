const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createTicket,
  getAllTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  validateTicket,
  getTicketsByBooking,
  getTicketsByStatus,
  getTicketQRCode
} = require('../controllers/ticket.controller');

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (authenticated users)
router.get('/booking/:bookingId', getTicketsByBooking);
router.get('/status/:status', getTicketsByStatus);
router.get('/:id', getTicket);
router.get('/:id/qr-code', getTicketQRCode);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', createTicket);
router.patch('/:id', updateTicket);
router.delete('/:id', deleteTicket);
router.post('/validate', validateTicket);

// Admin only routes
router.get('/', restrictTo('admin'), getAllTickets);

module.exports = router; 