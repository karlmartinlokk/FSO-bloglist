const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
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

blogsRouter.post('/', userExtractor, async (request, response) => {
  const { title, author, url, likes } = request.body
  const user = request.user

  if (!title || !url) {
    return response.status(400).end()
  }

  const blog = new Blog({
    title,
    author,
    url,
    likes,
    user: user._id,
  })

  const savedBlogResponse = await blog.save()
  user.blogs = user.blogs.concat(savedBlogResponse._id)
  await user.save()

  response.status(201).json(savedBlogResponse)
})

blogsRouter.delete('/:id', userExtractor, async (request, response) => {
  const user = request.user
  const blog = await Blog.findById(request.params.id)
  if (blog) {
    if (blog.user.toString() === user.id.toString()) {
      await Blog.findByIdAndDelete(request.params.id)
      user.blogs = user.blogs.filter(b => b.toString() !== request.params.id)
      await user.save()

      return response.status(204).end()
    } else {
      return response.status(403).json({ error: 'invalid user, cannot delete other users posts' })
    }
  } else {
    return response.status(404).end()
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