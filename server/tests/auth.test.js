process.env.JWT_SECRET = 'testsecret'
process.env.JWT_REFRESH_SECRET = 'testrefreshsecret'

const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const createApp = require('../app')

const app = createApp()
let mongoServer

beforeAll(async () => {
  await mongoose.disconnect()
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

const creds = { email: 'alice@example.com', password: 'supersecret' }

describe('Auth API — register', () => {
  it('registers a new user and returns a token + refresh cookie', async () => {
    const res = await request(app).post('/api/auth/register').send(creds)
    expect(res.statusCode).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.email).toBe(creds.email)
    const cookies = res.headers['set-cookie'].join(';')
    expect(cookies).toMatch(/refreshToken=/)
    expect(cookies).toMatch(/HttpOnly/i)
  })

  it('rejects a duplicate email with 400', async () => {
    const res = await request(app).post('/api/auth/register').send(creds)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/already taken/i)
  })

  it('rejects a too-short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: '123' })
    expect(res.statusCode).toBe(400)
  })

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'supersecret' })
    expect(res.statusCode).toBe(400)
  })
})

describe('Auth API — login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(creds)
    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('rejects a wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: creds.email, password: 'wrongpassword' })
    expect(res.statusCode).toBe(401)
  })

  it('rejects an unknown user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'supersecret' })
    expect(res.statusCode).toBe(401)
  })
})

describe('Auth API — refresh & logout', () => {
  it('rotates the access token using the refresh cookie', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send(creds)
    const res = await agent.post('/api/auth/refresh')
    expect(res.statusCode).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('rejects refresh when no cookie is present with 401', async () => {
    const res = await request(app).post('/api/auth/refresh')
    expect(res.statusCode).toBe(401)
  })

  it('rejects an invalid refresh token with 403', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=garbage.token.value')
    expect(res.statusCode).toBe(403)
  })

  it('clears the refresh cookie on logout', async () => {
    const res = await request(app).post('/api/auth/logout')
    expect(res.statusCode).toBe(200)
    expect(res.headers['set-cookie'].join(';')).toMatch(/refreshToken=;/)
  })
})
