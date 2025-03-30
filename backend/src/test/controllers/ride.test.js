const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, createTestTimeslot, createTestBooking, createTestRide, generateTestToken } = require('../helpers');

describe('Ride Controller', () => {
  let admin;
  let rideManager;
  let customer;
  let pier;
  let boat;
  let timeslot;
  let booking;
  let ride;
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
    ride = await createTestRide({ boat: boat._id, timeslot: timeslot._id });
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /rides', () => {
    it('should create a new ride (admin)', async () => {
      const rideData = {
        boat: boat._id,
        timeslot: timeslot._id,
        status: 'scheduled',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        arrivalTime: new Date(Date.now() + 25 * 60 * 60 * 1000) // Tomorrow + 1 hour
      };

      const response = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(rideData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ride).toBeDefined();
      expect(response.body.data.ride.boat).toBe(boat._id.toString());
      expect(response.body.data.ride.timeslot).toBe(timeslot._id.toString());
    });

    it('should create a new ride (ride manager)', async () => {
      const rideData = {
        boat: boat._id,
        timeslot: timeslot._id,
        status: 'scheduled',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        arrivalTime: new Date(Date.now() + 25 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(rideData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should not create ride (customer)', async () => {
      const rideData = {
        boat: boat._id,
        timeslot: timeslot._id,
        status: 'scheduled',
        departureTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        arrivalTime: new Date(Date.now() + 25 * 60 * 60 * 1000)
      };

      const response = await request(app)
        .post('/api/v1/rides')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(rideData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /rides', () => {
    it('should get all rides (admin)', async () => {
      const response = await request(app)
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.rides).toHaveLength(1);
    });

    it('should get all rides (ride manager)', async () => {
      const response = await request(app)
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get all rides (customer)', async () => {
      const response = await request(app)
        .get('/api/v1/rides')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /rides/:id', () => {
    it('should get ride by id (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ride._id).toBe(ride._id.toString());
    });

    it('should get ride by id (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get ride by id (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not get ride with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/rides/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /rides/:id', () => {
    it('should update ride (admin)', async () => {
      const updateData = {
        status: 'in_progress',
        actualDepartureTime: new Date()
      };

      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ride.status).toBe(updateData.status);
      expect(response.body.data.ride.actualDepartureTime).toBeDefined();
    });

    it('should update ride (ride manager)', async () => {
      const updateData = {
        status: 'in_progress',
        actualDepartureTime: new Date()
      };

      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update ride (customer)', async () => {
      const updateData = {
        status: 'in_progress',
        actualDepartureTime: new Date()
      };

      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /rides/:id/complete', () => {
    it('should complete ride (admin)', async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}/complete`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.ride.status).toBe('completed');
      expect(response.body.data.ride.actualArrivalTime).toBeDefined();
    });

    it('should complete ride (ride manager)', async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}/complete`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not complete ride (customer)', async () => {
      const response = await request(app)
        .patch(`/api/v1/rides/${ride._id}/complete`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /rides/boat/:boatId', () => {
    it('should get rides by boat (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/boat/${boat._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.rides).toHaveLength(1);
      expect(response.body.data.rides[0].boat).toBe(boat._id.toString());
    });

    it('should get rides by boat (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/boat/${boat._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should get rides by boat (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/rides/boat/${boat._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
}); 