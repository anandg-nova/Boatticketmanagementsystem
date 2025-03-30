const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, createTestTimeslot, createTestBooking, generateTestToken } = require('../helpers');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

describe('Payment Controller', () => {
  let admin;
  let rideManager;
  let customer;
  let pier;
  let boat;
  let timeslot;
  let booking;
  let adminToken;
  let rideManagerToken;
  let customerToken;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
    admin = await createTestUser({ role: 'admin' });
    rideManager = await createTestUser({ role: 'ride_manager' });
    customer = await createTestUser({ role: 'customer' });
    
    // Generate tokens
    adminToken = generateTestToken(admin._id);
    rideManagerToken = generateTestToken(rideManager._id);
    customerToken = generateTestToken(customer._id);
    
    // Create test data
    pier = await createTestPier();
    boat = await createTestBoat({ pier: pier._id });
    timeslot = await createTestTimeslot({ boat: boat._id });
    booking = await createTestBooking({ customer: customer._id, timeslot: timeslot._id });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /payments/create-payment-intent', () => {
    it('should create payment intent (customer)', async () => {
      const paymentData = {
        booking: booking._id,
        amount: 100,
        currency: 'usd'
      };

      const response = await request(app)
        .post('/api/v1/payments/create-payment-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.clientSecret).toBeDefined();
    });

    it('should not create payment intent (admin)', async () => {
      const paymentData = {
        booking: booking._id,
        amount: 100,
        currency: 'usd'
      };

      const response = await request(app)
        .post('/api/v1/payments/create-payment-intent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not create payment intent for invalid booking', async () => {
      const paymentData = {
        booking: 'invalid-id',
        amount: 100,
        currency: 'usd'
      };

      const response = await request(app)
        .post('/api/v1/payments/create-payment-intent')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(paymentData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /payments/webhook', () => {
    it('should handle successful payment webhook', async () => {
      const webhookData = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            amount: 100,
            currency: 'usd',
            metadata: {
              booking: booking._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('Stripe-Signature', 'test_signature')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should handle failed payment webhook', async () => {
      const webhookData = {
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test',
            amount: 100,
            currency: 'usd',
            metadata: {
              booking: booking._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('Stripe-Signature', 'test_signature')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should handle invalid webhook signature', async () => {
      const webhookData = {
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test',
            amount: 100,
            currency: 'usd',
            metadata: {
              booking: booking._id.toString()
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/v1/payments/webhook')
        .set('Stripe-Signature', 'invalid_signature')
        .send(webhookData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /payments/booking/:bookingId', () => {
    it('should get payment details for booking (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/booking/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.payment).toBeDefined();
      expect(response.body.data.payment.booking).toBe(booking._id.toString());
    });

    it('should get payment details for booking (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/booking/${booking._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get own payment details for booking (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/payments/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get payment details for invalid booking', async () => {
      const response = await request(app)
        .get('/api/v1/payments/booking/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /payments/refund', () => {
    it('should process refund (admin)', async () => {
      const refundData = {
        booking: booking._id,
        amount: 100,
        reason: 'customer_request'
      };

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.refund).toBeDefined();
      expect(response.body.data.refund.amount).toBe(refundData.amount);
    });

    it('should not process refund (ride manager)', async () => {
      const refundData = {
        booking: booking._id,
        amount: 100,
        reason: 'customer_request'
      };

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(refundData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not process refund (customer)', async () => {
      const refundData = {
        booking: booking._id,
        amount: 100,
        reason: 'customer_request'
      };

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(refundData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not process refund for invalid booking', async () => {
      const refundData = {
        booking: 'invalid-id',
        amount: 100,
        reason: 'customer_request'
      };

      const response = await request(app)
        .post('/api/v1/payments/refund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(refundData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
}); 