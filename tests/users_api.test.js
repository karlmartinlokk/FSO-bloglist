const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const supertest = require('supertest')
const app = require('../app')
const User = require('../models/user')

const api = supertest(app)

describe('initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('user with fresh username creation success', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await api.get('/api/users')
    assert.strictEqual(usersAtEnd.body.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.body.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

    test('username already taken, creation fails', async () => {
    const usersAtStart = await User.find({})

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await api.get('/api/users')
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.body.length, usersAtStart.length)
  })

  describe('invalid user creation fails', () => {
    test('missing username', async () => {
      const usersAtStart = await User.find({})
      const newUser = { name: 'No Username', password: 'salainen' }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(result.body.error, 'missing username')

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('missing password', async () => {
      const usersAtStart = await User.find({})
      const newUser = { username: 'nopassword', name: 'No Password' }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(result.body.error, 'missing password')

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('username too short', async () => {
      const usersAtStart = await User.find({})
      const newUser = { username: 'ab', name: 'Short Username', password: 'salainen' }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(result.body.error, 'username too short')

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('password too short', async () => {
      const usersAtStart = await User.find({})
      const newUser = { username: 'shortpass', name: 'Short Password', password: 'ab' }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(result.body.error, 'password too short')

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })
})

after(async () => {
    await mongoose.connection.close()
})