const request = require('supertest');
const app = require('../server');

describe('User Authentication', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    // Log response body if the test fails
    if (res.statusCode !== 201) {
      console.log(res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login a user', async () => {
    let res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    // If login fails, log the response body
    if (res.statusCode === 400) {
      console.log(res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
