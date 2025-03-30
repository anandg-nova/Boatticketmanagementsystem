const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, createTestTimeslot, createTestBooking, createTestTicket, generateTestToken } = require('../helpers');
const fs = require('fs');
const path = require('path');

describe('QR Code Controller', () => {
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

  describe('GET /qrcodes/booking/:bookingId', () => {
    it('should get QR code for booking (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/booking/${booking._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.qrCode.booking).toBe(booking._id.toString());
    });

    it('should get QR code for booking (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/booking/${booking._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get own booking QR code (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/booking/${booking._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get QR code for invalid booking', async () => {
      const response = await request(app)
        .get('/api/v1/qrcodes/booking/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /qrcodes/ticket/:ticketId', () => {
    it('should get QR code for ticket (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/ticket/${ticket._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.qrCode).toBeDefined();
      expect(response.body.data.qrCode.ticket).toBe(ticket._id.toString());
    });

    it('should get QR code for ticket (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/ticket/${ticket._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get own ticket QR code (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/ticket/${ticket._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get QR code for invalid ticket', async () => {
      const response = await request(app)
        .get('/api/v1/qrcodes/ticket/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /qrcodes/:id/image', () => {
    it('should get QR code image (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/${ticket._id}/image`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should get QR code image (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/${ticket._id}/image`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should get own QR code image (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/qrcodes/${ticket._id}/image`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
    });

    it('should not get QR code image for invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/qrcodes/invalid-id/image')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /qrcodes/verify', () => {
    it('should verify QR code (admin)', async () => {
      const verifyData = {
        qrCode: ticket._id,
        status: 'validated'
      };

      const response = await request(app)
        .post('/api/v1/qrcodes/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ticket.status).toBe(verifyData.status);
    });

    it('should verify QR code (ride manager)', async () => {
      const verifyData = {
        qrCode: ticket._id,
        status: 'validated'
      };

      const response = await request(app)
        .post('/api/v1/qrcodes/verify')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(verifyData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not verify QR code (customer)', async () => {
      const verifyData = {
        qrCode: ticket._id,
        status: 'validated'
      };

      const response = await request(app)
        .post('/api/v1/qrcodes/verify')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(verifyData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not verify invalid QR code', async () => {
      const verifyData = {
        qrCode: 'invalid-id',
        status: 'validated'
      };

      const response = await request(app)
        .post('/api/v1/qrcodes/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(verifyData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
}); 