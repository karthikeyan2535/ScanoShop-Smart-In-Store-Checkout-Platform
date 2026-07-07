const request = require('supertest');
const { app, server } = require('../server');
const prisma = require('../config/prisma');

afterAll(async () => {
  // Close the server and database connection
  await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
});

describe('Integration Tests', () => {
  describe('Payments API', () => {
    it('should return 401 for unauthenticated access to /payments/create-order', async () => {
      const response = await request(app).post('/payments/create-order');
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('Products API', () => {
    it('should fetch products list successfully', async () => {
      const response = await request(app).get('/products');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toBeDefined();
    });
  });

  describe('Auth API', () => {
    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: '', password: '' });
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
