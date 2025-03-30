const express = require('express');
const router = express.Router();
const { createPaymentIntent, generateTicketQR, confirmPayment } = require('../controllers/payment.controller');

// Create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

// Generate QR code for a ticket
router.get('/ticket/:ticketId/qr', generateTicketQR);

// Confirm payment and update ticket status
router.post('/confirm-payment', confirmPayment);

module.exports = router; 