const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, createTestPier, generateTestToken } = require('../helpers');

describe('Pier Controller', () => {
  let admin;
  let rideManager;
  let customer;
  let pier;
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
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /piers', () => {
    it('should create a new pier (admin)', async () => {
      const pierData = {
        name: 'New Pier',
        location: {
          latitude: 12.3456,
          longitude: 78.9012
        },
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/piers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(pierData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.pier).toBeDefined();
      expect(response.body.data.pier.name).toBe(pierData.name);
      expect(response.body.data.pier.location.latitude).toBe(pierData.location.latitude);
    });

    it('should create a new pier (ride manager)', async () => {
      const pierData = {
        name: 'New Pier',
        location: {
          latitude: 12.3456,
          longitude: 78.9012
        },
        status: 'active'
      };

      const response = await request(app)
        .post('/api/v1/piers')
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(pierData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
    });

    it('should not create pier (customer)', async () => {
      const pierData = {
        name: 'New Pier',
        location: {
          latitude: 12.3456,
          longitude: 78.9012
        }
      };

      const response = await request(app)
        .post('/api/v1/piers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(pierData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /piers', () => {
    it('should get all piers (public)', async () => {
      const response = await request(app)
        .get('/api/v1/piers');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.piers).toHaveLength(1);
    });
  });

  describe('GET /piers/:id', () => {
    it('should get pier by id (public)', async () => {
      const response = await request(app)
        .get(`/api/v1/piers/${pier._id}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.pier._id).toBe(pier._id.toString());
    });

    it('should not get pier with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/piers/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /piers/:id', () => {
    it('should update pier (admin)', async () => {
      const updateData = {
        name: 'Updated Pier',
        location: {
          latitude: 23.4567,
          longitude: 89.0123
        }
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.pier.name).toBe(updateData.name);
      expect(response.body.data.pier.location.latitude).toBe(updateData.location.latitude);
    });

    it('should update pier (ride manager)', async () => {
      const updateData = {
        name: 'Updated Pier',
        location: {
          latitude: 23.4567,
          longitude: 89.0123
        }
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update pier (customer)', async () => {
      const updateData = {
        name: 'Updated Pier',
        location: {
          latitude: 23.4567,
          longitude: 89.0123
        }
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /piers/:id', () => {
    it('should delete pier (admin)', async () => {
      const response = await request(app)
        .delete(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify pier is deleted
      const getResponse = await request(app)
        .get(`/api/v1/piers/${pier._id}`);

      expect(getResponse.status).toBe(404);
    });

    it('should delete pier (ride manager)', async () => {
      const response = await request(app)
        .delete(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(204);
    });

    it('should not delete pier (customer)', async () => {
      const response = await request(app)
        .delete(`/api/v1/piers/${pier._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /piers/:id/status', () => {
    it('should update pier status (admin)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.pier.status).toBe(statusData.status);
    });

    it('should update pier status (ride manager)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}/status`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(statusData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update pier status (customer)', async () => {
      const statusData = {
        status: 'maintenance'
      };

      const response = await request(app)
        .patch(`/api/v1/piers/${pier._id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(statusData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });
}); 