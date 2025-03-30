const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, createTestTimeslot, generateTestToken } = require('../helpers');

describe('Booking Controller', () => {
  let customer;
  let admin;
  let boat;
  let pier;
  let timeslot;
  let customerToken;
  let adminToken;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create test users
    customer = await createTestUser({ role: 'customer' });
    admin = await createTestUser({ role: 'admin' });
    
    // Generate tokens
    customerToken = generateTestToken(customer._id);
    adminToken = generateTestToken(admin._id);
    
    // Create test data
    pier = await createTestPier();
    boat = await createTestBoat({ pier: pier._id });
    timeslot = await createTestTimeslot({ boat: boat._id });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /bookings', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        timeslot: timeslot._id,
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.booking).toBeDefined();
      expect(response.body.data.booking.customer).toBe(customer._id.toString());
      expect(response.body.data.booking.timeslot).toBe(timeslot._id.toString());
      expect(response.body.data.booking.numberOfTickets).toBe(2);
      expect(response.body.data.booking.status).toBe('pending');
    });

    it('should not create booking with invalid timeslot', async () => {
      const bookingData = {
        timeslot: 'invalid-id',
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      const response = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /bookings/my-bookings', () => {
    it('should get user bookings', async () => {
      // Create a booking first
      const bookingData = {
        timeslot: timeslot._id,
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      const response = await request(app)
        .get('/api/v1/bookings/my-bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].customer).toBe(customer._id.toString());
    });
  });

  describe('GET /bookings/:id', () => {
    it('should get booking by id', async () => {
      // Create a booking first
      const bookingData = {
        timeslot: timeslot._id,
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      const bookingId = createResponse.body.data.booking._id;

      const response = await request(app)
        .get(`/api/v1/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.booking._id).toBe(bookingId);
    });

    it('should not get booking with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/bookings/invalid-id')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /bookings/:id/cancel', () => {
    it('should cancel booking', async () => {
      // Create a booking first
      const bookingData = {
        timeslot: timeslot._id,
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      const createResponse = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      const bookingId = createResponse.body.data.booking._id;

      const response = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.booking.status).toBe('cancelled');
    });

    it('should not cancel booking with invalid id', async () => {
      const response = await request(app)
        .patch('/api/v1/bookings/invalid-id/cancel')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /bookings (Admin)', () => {
    it('should get all bookings (admin only)', async () => {
      // Create a booking first
      const bookingData = {
        timeslot: timeslot._id,
        numberOfTickets: 2,
        paymentMethod: 'card'
      };

      await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData);

      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.bookings).toHaveLength(1);
    });

    it('should not get all bookings (non-admin)', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });
}); 