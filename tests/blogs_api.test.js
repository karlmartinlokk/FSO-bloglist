const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    user: '6a422a851b54a676234d1801',
    __v: 0
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    user: '6a422a851b54a676234d1802',
    __v: 0
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    user: '6a422a851b54a676234d1802',
    __v: 0
  },
  {
    _id: '5a422b891b54a676234d17fa',
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.html',
    likes: 10,
    user: '6a422a851b54a676234d1803',
    __v: 0
  },
  {
    _id: '5a422ba71b54a676234d17fb',
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    user: '6a422a851b54a676234d1803',
    __v: 0
  },
  {
    _id: '5a422bc61b54a676234d17fc',
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    user: '6a422a851b54a676234d1803',
    __v: 0
  }
]

// password for all users: "sekret"
const users = [
  {
    _id: '6a422a851b54a676234d1801',
    username: 'mchan',
    name: 'Michael Chan',
    passwordHash: '$2b$10$XE8nSnz0SQP9n/CujsPePeIXiDDWBpUpSqe9Ge7qVMjTpm2io1dTG',
    blogs: ['5a422a851b54a676234d17f7'],
    __v: 0
  },
  {
    _id: '6a422a851b54a676234d1802',
    username: 'dijkstra',
    name: 'Edsger W. Dijkstra',
    passwordHash: '$2b$10$XE8nSnz0SQP9n/CujsPePeIXiDDWBpUpSqe9Ge7qVMjTpm2io1dTG',
    blogs: ['5a422aa71b54a676234d17f8', '5a422b3a1b54a676234d17f9'],
    __v: 0
  },
  {
    _id: '6a422a851b54a676234d1803',
    username: 'unclebob',
    name: 'Robert C. Martin',
    passwordHash: '$2b$10$XE8nSnz0SQP9n/CujsPePeIXiDDWBpUpSqe9Ge7qVMjTpm2io1dTG',
    blogs: ['5a422b891b54a676234d17fa', '5a422ba71b54a676234d17fb', '5a422bc61b54a676234d17fc'],
    __v: 0
  }
]

let tokens = {
  'mchan': '',
  'dijkstra': '',
  'unclebob': ''
}

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  await Blog.insertMany(initialBlogs)
  await User.insertMany(users)

  for (let user of users) {
    let username = user.username
    let login = {
      username: username,
      password: 'sekret'
    }
    let loginResponse = await api
      .post('/api/login')
      .send(login)
      .expect(200)

    if (username === 'mchan') {
      tokens.mchan = loginResponse.body.token
    } else if (username === 'dijkstra') {
      tokens.dijkstra = loginResponse.body.token
    } else if (username === 'unclebob') {
      tokens.unclebob = loginResponse.body.token
    }
  }
})


test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('ALL blogs are returned', async () => {
  const response = await api.get('/api/blogs')

  assert.strictEqual(response.body.length, initialBlogs.length)
})

test('id property is named "id"', async () => {
  const response = await api.get('/api/blogs')
  const blog = response.body[0]

  assert.ok('id' in blog)
  assert.strictEqual(blog._id, undefined)
})

test('blog post successful', async () => {
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    user: '6a422a851b54a676234d1802'
  }

  const postResponse = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${tokens.dijkstra}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const savedBlog = postResponse.body

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length + 1)

  const newBlogResponse = await api
    .get(`/api/blogs/${savedBlog.id}`)
    .expect(200)
  assert.deepStrictEqual(newBlogResponse.body, { ...newBlog, id: savedBlog.id }) /* spread makes a new object with same props as newBlog with id added */
})


test('missing like to 0', async () => {
  const missingLikeBlog =
    {
      title: 'This post is missing the likes property!',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      __v: 0
    }

  const savedBlog = await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${tokens.dijkstra}`)
    .send(missingLikeBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get(`/api/blogs/${savedBlog.body.id}`)
  assert.strictEqual(response.body.likes, 0)


})

test('title missing', async () => {
  const missingTitleBlog = {
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    __v: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${tokens.unclebob}`)
    .send(missingTitleBlog)
    .expect(400)

  const blogsAfter400 = await Blog.find({})
  assert.strictEqual(blogsAfter400.length, initialBlogs.length)

})

test('url missing', async () => {
  const missingUrlBlog = {
    title: 'Type wars',
    author: 'Robert C. Martin',
    likes: 2,
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${tokens.unclebob}`)
    .send(missingUrlBlog)
    .expect(400)

  const blogsAfter400 = await Blog.find({})
  assert.strictEqual(blogsAfter400.length, initialBlogs.length)

})


describe('delete blog', () => {
  test('success', async () => {
    const id = '5a422bc61b54a676234d17fc'
    await api
      .delete(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${tokens.unclebob}`)
      .expect(204)

    const blogsAfterDeleted = await api.get('/api/blogs')
    assert.strictEqual(blogsAfterDeleted.body.length, initialBlogs.length - 1)
  })

  test('failure', async () => {
    const id = '7a622b3a1b59a676234d17f9'
    await api
      .delete(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${tokens.mchan}`) //any valid token works to send delete request, since the goal is to get 404
      .expect(404)

    const blogsAfterDeleted = await api.get('/api/blogs')
    assert.strictEqual(blogsAfterDeleted.body.length, initialBlogs.length)
  })
})

describe('update blog', () => {
  const originalBlog = initialBlogs[3]

  test('title', async () => {
    const newBlog = { ...originalBlog, title: 'New Title' }

    await api
      .put(`/api/blogs/${newBlog._id}`)
      .send(newBlog)
      .expect(200)

    const blogAfterModify = await api.get(`/api/blogs/${newBlog._id}`)
    assert.strictEqual(blogAfterModify.body.title, newBlog.title)
  })

  test('author', async () => {
    const newBlog = { ...originalBlog, author: 'New Author' }

    await api
      .put(`/api/blogs/${newBlog._id}`)
      .send(newBlog)
      .expect(200)

    const blogAfterModify = await api.get(`/api/blogs/${newBlog._id}`)
    assert.strictEqual(blogAfterModify.body.author, newBlog.author)
  })

  test('url', async () => {
    const newBlog = { ...originalBlog, url: 'http://example.com/new-url' }

    await api
      .put(`/api/blogs/${newBlog._id}`)
      .send(newBlog)
      .expect(200)

    const blogAfterModify = await api.get(`/api/blogs/${newBlog._id}`)
    assert.strictEqual(blogAfterModify.body.url, newBlog.url)
  })

  test('likes', async () => {
    const newBlog = { ...originalBlog, likes: 42 }

    await api
      .put(`/api/blogs/${newBlog._id}`)
      .send(newBlog)
      .expect(200)

    const blogAfterModify = await api.get(`/api/blogs/${newBlog._id}`)
    assert.strictEqual(blogAfterModify.body.likes, newBlog.likes)
  })

  test('nothing changes', async () => {
    const { _id, __v, ...unchangedBlog } = originalBlog

    await api
      .put(`/api/blogs/${_id}`)
      .send(originalBlog)
      .expect(200)

    const blogAfterModify = await api.get(`/api/blogs/${_id}`)
    assert.deepStrictEqual(blogAfterModify.body, { ...unchangedBlog, id: _id })
  })

  test('failure', async () => {
    const id = '7a622b3a1b59a676234d17f9'
    const newBlog = { ...originalBlog, author: 'New Author' }

    await api
      .put(`/api/blogs/${id}`)
      .send(newBlog)
      .expect(404)

    const blogsAfterUpdate = await Blog.find({})
    assert.strictEqual(blogsAfterUpdate.length, initialBlogs.length)
  })
})

test('auth failure', async () => {
  const newBlog = {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    user: '6a422a851b54a676234d1802'
  }

  await api
    .post('/api/blogs')
    .set('Authorization', '')
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)


  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialBlogs.length)
})


after(async () => {
  await mongoose.connection.close()
})