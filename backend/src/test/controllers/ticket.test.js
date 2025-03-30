const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, createTestTimeslot, createTestBooking, createTestTicket, generateTestToken } = require('../helpers');

describe('Ticket Controller', () => {
  let admin;
  let rideManager;
  let customer;
  let pier;
  let boat;
  let timeslot;
  let booking;
  let ticket;
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
    ticket = await createTestTicket({ booking: booking._id });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /tickets', () => {
    it('should get all tickets (admin)', async () => {
      const response = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.tickets).toHaveLength(1);
    });

    it('should get all tickets (ride manager)', async () => {
      const response = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get all tickets (customer)', async () => {
      const response = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /tickets/:id', () => {
    it('should get ticket by id (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ticket._id).toBe(ticket._id.toString());
    });

    it('should get ticket by id (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get own ticket by id (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/${ticket._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get ticket with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/tickets/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /tickets/:id/validate', () => {
    it('should validate ticket (admin)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/validate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ticket.status).toBe('validated');
    });

    it('should validate ticket (ride manager)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/validate`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not validate ticket (customer)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/validate`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /tickets/:id/invalidate', () => {
    it('should invalidate ticket (admin)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/invalidate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ticket.status).toBe('invalidated');
    });

    it('should invalidate ticket (ride manager)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/invalidate`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not invalidate ticket (customer)', async () => {
      const response = await request(app)
        .patch(`/api/v1/tickets/${ticket._id}/invalidate`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /tickets/booking/:bookingId', () => {
    it('should get tickets by booking (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/booking/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.tickets).toHaveLength(1);
      expect(response.body.data.tickets[0].booking).toBe(booking._id.toString());
    });

    it('should get tickets by booking (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/booking/${booking._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get own tickets by booking (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/tickets/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
}); 