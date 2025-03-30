const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, generateTestToken } = require('../helpers');

describe('User Controller', () => {
  let admin;
  let rideManager;
  let customer;
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
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /users', () => {
    it('should get all users (admin)', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toHaveLength(3);
    });

    it('should not get all users (ride manager)', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not get all users (customer)', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id (admin)', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user._id).toBe(customer._id.toString());
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should get own user profile (ride manager)', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${rideManager._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user._id).toBe(rideManager._id.toString());
    });

    it('should get own user profile (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user._id).toBe(customer._id.toString());
    });

    it('should not get other user profile (customer)', async () => {
      const response = await request(app)
        .get(`/api/v1/users/${rideManager._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not get user with invalid id', async () => {
      const response = await request(app)
        .get('/api/v1/users/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user (admin)', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.email).toBe(updateData.email);
      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should update own profile (ride manager)', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${rideManager._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should update own profile (customer)', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should not update other user profile (customer)', async () => {
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${rideManager._id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user (admin)', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      // Verify user is deleted
      const getResponse = await request(app)
        .get(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should not delete user (ride manager)', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${customer._id}`)
        .set('Authorization', `Bearer ${rideManagerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not delete user (customer)', async () => {
      const response = await request(app)
        .delete(`/api/v1/users/${rideManager._id}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /users/:id/role', () => {
    it('should update user role (admin)', async () => {
      const roleData = {
        role: 'ride_manager'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${customer._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(roleData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe(roleData.role);
    });

    it('should not update user role (ride manager)', async () => {
      const roleData = {
        role: 'admin'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${customer._id}/role`)
        .set('Authorization', `Bearer ${rideManagerToken}`)
        .send(roleData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });

    it('should not update user role (customer)', async () => {
      const roleData = {
        role: 'ride_manager'
      };

      const response = await request(app)
        .patch(`/api/v1/users/${rideManager._id}/role`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(roleData);

      expect(response.status).toBe(403);
      expect(response.body.status).toBe('error');
    });
  });
}); 