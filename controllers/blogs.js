const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    response.json(blog)
  } else {
    response.status(404).end()
  }
})

blogsRouter.post('/', async (request, response) => {
  const { title, url } = request.body
  if (!title || !url) {
    return response.status(400).end()
  }

  const blog = new Blog(request.body)
  const savedBlogResponse = await blog.save()
  response.status(201).json(savedBlogResponse)
})

blogsRouter.delete('/:id', async (request, response) => {
  const blog = await Blog.findByIdAndDelete(request.params.id)
  if (blog) {
    return response.status(204).end()
  } else {
    response.status(404).end()
  }
})

blogsRouter.put('/:id', async (request, response) => {
  const { title, author, url, likes } = request.body
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    blog.title = title
    blog.author = author
    blog.url = url
    blog.likes = likes

    const savedBlog = await blog.save()
    return response.json(savedBlog)
  } else {
    response.status(404).end()
  }
})

module.exports = blogsRouter