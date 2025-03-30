const request = require('supertest');
const app = require('../../app');
const { connect, closeDatabase, clearDatabase } = require('../config');
const { createTestUser, generateTestToken } = require('../helpers');

describe('Auth Controller', () => {
  beforeAll(async () => {
    await connect();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await createTestUser(userData);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with correct credentials', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123'
      };

      await createTestUser(userData);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.token).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123'
      };

      await createTestUser(userData);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });

  describe('PATCH /auth/update-password', () => {
    it('should update user password', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      const response = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.token).toBeDefined();

      // Verify new password works
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'newpassword123'
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should not update password with incorrect current password', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user._id);

      const response = await request(app)
        .patch('/api/v1/auth/update-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
}); 