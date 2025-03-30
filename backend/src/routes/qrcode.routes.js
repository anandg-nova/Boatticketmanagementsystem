const express = require('express');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createQRCode,
  getAllQRCodes,
  getQRCode,
  updateQRCode,
  deleteQRCode,
  getQRCodeImage,
  getQRCodesByTicket,
  regenerateQRCode
} = require('../controllers/qrcode.controller');

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (authenticated users)
router.get('/ticket/:ticketId', getQRCodesByTicket);
router.get('/:id', getQRCode);
router.get('/:id/image', getQRCodeImage);

// Admin and ride manager routes
router.use(restrictTo('admin', 'ride_manager'));

router.post('/', createQRCode);
router.patch('/:id', updateQRCode);
router.delete('/:id', deleteQRCode);
router.patch('/:id/regenerate', regenerateQRCode);

// Admin only routes
router.get('/', restrictTo('admin'), getAllQRCodes);

module.exports = router; 