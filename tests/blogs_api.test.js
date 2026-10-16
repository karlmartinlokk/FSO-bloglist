const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
    {
        _id: "5a422a851b54a676234d17f7",
        title: "React patterns",
        author: "Michael Chan",
        url: "https://reactpatterns.com/",
        likes: 7,
        __v: 0
    },
    {
        _id: "5a422aa71b54a676234d17f8",
        title: "Go To Statement Considered Harmful",
        author: "Edsger W. Dijkstra",
        url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
        likes: 5,
        __v: 0
    },
    {
        _id: "5a422b3a1b54a676234d17f9",
        title: "Canonical string reduction",
        author: "Edsger W. Dijkstra",
        url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
        likes: 12,
        __v: 0
    },
    {
        _id: "5a422b891b54a676234d17fa",
        title: "First class tests",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
        likes: 10,
        __v: 0
    },
    {
        _id: "5a422ba71b54a676234d17fb",
        title: "TDD harms architecture",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
        likes: 0,
        __v: 0
    },
    {
        _id: "5a422bc61b54a676234d17fc",
        title: "Type wars",
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2,
        __v: 0
    }  
]

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(initialBlogs)
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
    }

    const postResponse = await api
        .post('/api/blogs')
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
        title: "This post is missing the likes property!",
        author: "Edsger W. Dijkstra",
        url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
        __v: 0
    }

    const savedBlog = await api
        .post(`/api/blogs`)
        .send(missingLikeBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get(`/api/blogs/${savedBlog.body.id}`)
    assert.strictEqual(response.body.likes, 0)


})

test('title missing', async () => {
    const missingTitleBlog = {
        author: "Robert C. Martin",
        url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
        likes: 2,
        __v: 0
    }

    await api
        .post(`/api/blogs`)
        .send(missingTitleBlog)
        .expect(400)

    const blogsAfter400 = await Blog.find({})
    assert.strictEqual(blogsAfter400.length, initialBlogs.length)

})

test('url missing', async () => {
    const missingUrlBlog = {
        title: "Type wars",
        author: "Robert C. Martin",
        likes: 2,
    }

    await api
        .post(`/api/blogs`)
        .send(missingUrlBlog)
        .expect(400)

    const blogsAfter400 = await Blog.find({})
    assert.strictEqual(blogsAfter400.length, initialBlogs.length)

})

after(async () => {
    await mongoose.connection.close()
})