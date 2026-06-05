process.env.JWT_SECRET = 'testsecret'

const request = require('supertest')
const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const createApp = require('../app')
const User = require('../models/User')

const app = createApp()
let mongoServer
let userToken

beforeAll(async () => {
  await mongoose.disconnect()
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  const user = await new User({ email: 'test@test.com', password: 'hashedpassword' }).save()
  userToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

const samplePayload = (overrides = {}) => ({
  name: 'Test Room',
  room: { width: 5, length: 5, shape: 'Rectangle', wallColor: '#fff', floorColor: '#ccc' },
  furniture: [{ id: '1', type: 'Chair', x: 100, y: 100 }],
  ...overrides,
})

describe('Designs API', () => {
  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app).get('/api/designs')
    expect(res.statusCode).toBe(401)
  })

  it('creates a design via POST /api/designs', async () => {
    const res = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${userToken}`)
      .send(samplePayload())

    expect(res.statusCode).toBe(201)
    expect(res.body.name).toBe('Test Room')
    expect(res.body._id).toBeDefined()
  })

  it('rejects an invalid design payload with 400', async () => {
    const res = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${userToken}`)
      .send(samplePayload({ room: { width: 0, length: 5 } })) // width below min
    expect(res.statusCode).toBe(400)
  })

  it('rejects an over-sized thumbnail with 400', async () => {
    const res = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${userToken}`)
      .send(samplePayload({ thumbnail: 'x'.repeat(2_000_001) }))
    expect(res.statusCode).toBe(400)
  })

  it('lists designs for the user via GET /api/designs', async () => {
    const res = await request(app).get('/api/designs').set('Authorization', `Bearer ${userToken}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
  })

  it('deletes a design via DELETE /api/designs/:id', async () => {
    const createRes = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${userToken}`)
      .send(samplePayload({ name: 'To Delete', furniture: [] }))

    const deleteRes = await request(app)
      .delete(`/api/designs/${createRes.body._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(deleteRes.statusCode).toBe(200)
    expect(deleteRes.body.message).toBe('Design deleted successfully')
  })

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/nope')
    expect(res.statusCode).toBe(404)
    expect(res.body.error).toBe('Not found')
  })
})
