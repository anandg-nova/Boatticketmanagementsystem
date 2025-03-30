const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestBoat, createTestPier, generateTestToken } = require('../helpers');

describe('Boat Controller', () => {
  let admin;
  let rideManager;
  let customer;
  let pier;
  let boat;
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
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /boats', () => {
    it('should create a new boat (admin)', async () => {
      const boatData = {
        name: 'New Boat',
        capacity: 50,
        pier: pier._id,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/boats')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(boatData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boat).toBeDefined();
      expect(response.body.data.boat.name).toBe(boatData.name);
      expect(response.body.data.boat.capacity).toBe(boatData.capacity);
    });

    it('should create a new boat (ride manager)', async () => {
      const boatData = {
        name: 'New Boat',
        capacity: 50,
        pier: pier._id,
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/boats')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(boatData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should not create boat (customer)', async () => {
      const boatData = {
        name: 'New Boat',
        capacity: 50,
        pier: pier._id
      };

      const response = await request(app)
        .post('/api/v1/boats')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(boatData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /boats', () => {
    it('should get all boats (public)', async () => {
      const response = await request(app)
        .get('/api/v1/boats');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boats).toHaveLength(1);
    });
  });

  describe('GET /boats/:id', () => {
    it('should get boat by id (public)', async () => {
      const response = await request(app)
        .get(`/api/v1/boats/${boat._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boat._id).toBe(boat._id.toString());
    });

    it('should not get boat with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/boats/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /boats/:id', () => {
    it('should update boat (admin)', async () => {
      const updateData = {
        name: 'Updated Boat',
        capacity: 60
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boat.name).toBe(updateData.name);
      expect(response.body.data.boat.capacity).toBe(updateData.capacity);
    });

    it('should update boat (ride manager)', async () => {
      const updateData = {
        name: 'Updated Boat',
        capacity: 60
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update boat (customer)', async () => {
      const updateData = {
        name: 'Updated Boat',
        capacity: 60
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /boats/:id', () => {
    it('should delete boat (admin)', async () => {
      const response = await request(app)
        .delete(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify boat is deleted
      const getResponse = await request(app)
        .get(`/api/v1/boats/${boat._id}`);

      expect(getResponse.status).toBe(404);
    });

    it('should delete boat (ride manager)', async () => {
      const response = await request(app)
        .delete(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(204);
    });

    it('should not delete boat (customer)', async () => {
      const response = await request(app)
        .delete(`/api/v1/boats/${boat._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /boats/:id/location', () => {
    it('should update boat location (admin)', async () => {
      const locationData = {
        latitude: 12.3456,
        longitude: 78.9012
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/location`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boat.currentLocation.latitude).toBe(locationData.latitude);
      expect(response.body.data.boat.currentLocation.longitude).toBe(locationData.longitude);
    });

    it('should update boat location (ride manager)', async () => {
      const locationData = {
        latitude: 12.3456,
        longitude: 78.9012
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/location`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(locationData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update boat location (customer)', async () => {
      const locationData = {
        latitude: 12.3456,
        longitude: 78.9012
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/location`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(locationData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /boats/:id/status', () => {
    it('should update boat status (admin)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boat.status).toBe(statusData.status);
    });

    it('should update boat status (ride manager)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/status`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update boat status (customer)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/boats/${boat._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(statusData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /boats/pier/:pierId', () => {
    it('should get boats by pier (public)', async () => {
      const response = await request(app)
        .get(`/api/v1/boats/pier/${pier._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.boats).toHaveLength(1);
      expect(response.body.data.boats[0].pier).toBe(pier._id.toString());
    });
  });
}); 