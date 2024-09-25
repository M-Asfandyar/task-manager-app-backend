const request = require('supertest');
const app = require('../server');
let token;

beforeAll(async () => {
  // Try to login first
  let res = await request(app).post('/api/auth/login').send({
    email: 'test@example.com',
    password: 'password123'
  });

  // Log error if login fails
  if (res.statusCode === 400) {
    console.log('Login failed:', res.body);
  }

  // If login fails, register a new user
  if (res.statusCode === 400) {
    res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    if (res.statusCode !== 201) {
      console.log('Registration failed:', res.body);
    }

    // Then login again after registration
    res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123'
    });
  }

  token = res.body.token;
});

describe('Task CRUD Operations', () => {
  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Task',
        description: 'This is a test task',
        priority: 'High',
        dueDate: '2024-09-30T10:00:00Z',
        category: 'Work'
      });

    // Log response body if the test fails
    if (res.statusCode !== 201) {
      console.log(res.body);
    }

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('title', 'Test Task');
  });

  it('should retrieve tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    // Log response body if the test fails
    if (res.statusCode !== 200) {
      console.log(res.body);
    }

    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
  });
});
