const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Booking = require('../models/booking.model');
const Ride = require('../models/ride.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('Ride Manager Endpoints', () => {
  let rideManagerToken;
  let testRide;
  let testBooking;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    
    // Create test ride manager
    const rideManager = await User.create({
      name: 'Test Ride Manager',
      email: 'ride.manager@test.com',
      password: 'password123',
      role: 'ride-manager'
    });

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user'
    });

    // Create test ride
    testRide = await Ride.create({
      name: 'Test Ride',
      description: 'Test ride description',
      price: 100,
      duration: 30,
      maxCapacity: 10
    });

    // Create test booking
    testBooking = await Booking.create({
      ride: testRide._id,
      customer: testUser._id,
      date: new Date(),
      time: '10:00',
      quantity: 1,
      totalAmount: 100,
      ticketId: 'TEST-TICKET-001',
      status: 'confirmed',
      qrCode: 'test-qr-code'
    });

    // Generate token for ride manager
    rideManagerToken = jwt.sign(
      { id: rideManager._id, role: rideManager.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('GET /api/bookings/all-bookings', () => {
    it('should get all bookings', async () => {
      const response = await request(app)
        .get('/api/bookings/all-bookings')
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
      expect(response.body.data.bookings.length).toBeGreaterThan(0);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/bookings/all-bookings');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/bookings/validate-ticket', () => {
    it('should validate a valid ticket', async () => {
      const response = await request(app)
        .post('/api/bookings/validate-ticket')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ ticketId: testBooking.ticketId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking._id).toBe(testBooking._id.toString());
    });

    it('should reject an invalid ticket', async () => {
      const response = await request(app)
        .post('/api/bookings/validate-ticket')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ ticketId: 'INVALID-TICKET' });

      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/bookings/start-ride', () => {
    it('should start a confirmed ride', async () => {
      const response = await request(app)
        .post('/api/bookings/start-ride')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: testBooking._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking.status).toBe('in-progress');
      expect(response.body.booking.startTime).toBeDefined();
    });

    it('should not start an already started ride', async () => {
      const response = await request(app)
        .post('/api/bookings/start-ride')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: testBooking._id });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/bookings/stop-ride', () => {
    it('should stop an active ride', async () => {
      const response = await request(app)
        .post('/api/bookings/stop-ride')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: testBooking._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking.status).toBe('completed');
      expect(response.body.booking.endTime).toBeDefined();
    });

    it('should not stop a non-active ride', async () => {
      const response = await request(app)
        .post('/api/bookings/stop-ride')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: testBooking._id });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/bookings/cancel-ticket', () => {
    it('should cancel a valid ticket', async () => {
      // Create a new booking for cancellation test
      const newBooking = await Booking.create({
        ride: testRide._id,
        customer: testUser._id,
        date: new Date(),
        time: '11:00',
        quantity: 1,
        totalAmount: 100,
        ticketId: 'TEST-TICKET-002',
        status: 'confirmed',
        qrCode: 'test-qr-code-2'
      });

      const response = await request(app)
        .post('/api/bookings/cancel-ticket')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: newBooking._id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.booking.status).toBe('cancelled');
    });

    it('should not cancel an already completed ride', async () => {
      const response = await request(app)
        .post('/api/bookings/cancel-ticket')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send({ bookingId: testBooking._id });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
}); 