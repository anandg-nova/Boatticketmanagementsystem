const stripe = require('../config/stripe.config');
const QRCode = require('qrcode');
const Ticket = require('../models/ticket.model');

const createPaymentIntent = async (req, res) => {
  try {
    console.log('Received payment intent request:', req.body);
    
    const { amount, currency = 'usd' } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      console.error('Invalid amount:', amount);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid amount',
        details: 'Amount must be a positive number'
      });
    }

    // Validate currency
    if (currency.toLowerCase() !== 'usd') {
      console.error('Invalid currency:', currency);
      return res.status(400).json({ 
        success: false,
        error: 'Invalid currency',
        details: 'Only USD is supported'
      });
    }

    console.log('Creating payment intent with:', { amount, currency });

    // Create payment intent with additional validation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        integration_check: 'accept_a_payment',
        amount: amount.toString(),
        currency: 'usd'
      },
    });

    console.log('Payment intent created successfully:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    // Return success response with payment details
    return res.status(200).json({ 
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: 'usd'
      }
    });
  } catch (error) {
    console.error('Payment intent creation error:', {
      type: error.type,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid payment request',
        details: error.message
      });
    }
    
    // Handle Stripe API errors
    if (error.type === 'StripeAPIError') {
      return res.status(503).json({ 
        success: false,
        error: 'Payment service unavailable',
        details: error.message
      });
    }
    
    // Handle authentication errors
    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({ 
        success: false,
        error: 'Payment service authentication failed',
        details: error.message
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      success: false,
      error: 'Failed to create payment intent',
      details: error.message || 'Unknown error occurred'
    });
  }
};

const generateTicketQR = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    if (!ticketId) {
      return res.status(400).json({ 
        success: false,
        error: 'Ticket ID is required',
        details: 'Please provide a valid ticket ID'
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: 'Ticket not found',
        details: 'The requested ticket does not exist'
      });
    }

    // Create ticket data to encode in QR
    const ticketData = {
      id: ticket._id,
      rideName: ticket.rideName,
      date: ticket.date,
      time: ticket.time,
      quantity: ticket.quantity,
      price: ticket.price,
      status: ticket.status
    };

    // Generate QR code
    const qrCode = await QRCode.toDataURL(JSON.stringify(ticketData));

    return res.status(200).json({ 
      success: true,
      data: { qrCode }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate QR code',
      details: error.message || 'Unknown error occurred'
    });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, customerDetails, ticketDetails } = req.body;
    
    console.log('Received payment confirmation request:', {
      paymentIntentId,
      customerDetails,
      ticketDetails
    });

    if (!paymentIntentId) {
      console.log('Missing payment intent ID');
      return res.status(400).json({ 
        success: false,
        error: 'Payment intent ID is required',
        details: 'Please provide a valid payment intent ID'
      });
    }

    console.log('Retrieving payment intent from Stripe:', paymentIntentId);

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment intent retrieved:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount
    });

    if (!paymentIntent) {
      console.log('Payment intent not found');
      return res.status(404).json({ 
        success: false,
        error: 'Payment intent not found',
        details: 'The requested payment intent does not exist'
      });
    }

    if (paymentIntent.status === 'succeeded') {
      console.log('Payment succeeded, creating ticket with details:', ticketDetails);
      
      // Create new ticket
      const ticket = await Ticket.create({
        rideName: ticketDetails.rideName,
        date: new Date(ticketDetails.date),
        time: ticketDetails.time,
        quantity: ticketDetails.quantity,
        price: ticketDetails.price,
        status: 'confirmed',
        paymentIntentId: paymentIntent.id,
        customerEmail: customerDetails.email,
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone
      });

      console.log('Ticket created successfully:', {
        ticketId: ticket._id,
        status: ticket.status,
        customerEmail: ticket.customerEmail
      });

      return res.status(200).json({ 
        success: true,
        data: { ticket }
      });
    } else {
      console.log('Payment not successful. Status:', paymentIntent.status);
      return res.status(400).json({ 
        success: false,
        error: 'Payment not successful',
        details: `Payment status: ${paymentIntent.status}`
      });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid payment request',
        details: error.message
      });
    }
    
    // Handle Stripe API errors
    if (error.type === 'StripeAPIError') {
      return res.status(503).json({ 
        success: false,
        error: 'Payment service unavailable',
        details: error.message
      });
    }
    
    // Generic error response
    return res.status(500).json({ 
      success: false,
      error: 'Failed to confirm payment',
      details: error.message || 'Unknown error occurred'
    });
  }
};

module.exports = {
  createPaymentIntent,
  generateTicketQR,
  confirmPayment
}; 