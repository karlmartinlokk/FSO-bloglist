const lodash = require('lodash')

const dummy = () => {
  return 1
}

const totalLikes = (blogs) => {
  const blogLikes = blogs.map(blog => blog.likes)
  let sum = blogLikes.reduce((x,y) => {
    return x + y
  }, 0)
  return sum
}

const favoriteBlog = (blogs) => {
  const highestLikes = Math.max(...blogs.map(blog => blog.likes))
  const fav = blogs.find(blog => blog.likes === highestLikes)
  return fav
}

const mostBlogs = (blogs) => {
  const authors = blogs.map(blog => blog.author)
  const authorsFrequency = lodash.countBy(authors)
  for (let key in authorsFrequency) {
    if (Object.hasOwn(authorsFrequency, key)) {
      if (authorsFrequency[key] === Math.max(...Object.values(authorsFrequency))) {
        return {
          author: key,
          blogs: authorsFrequency[key]
        }
      }
    }
  }
}

const mostLikes = (blogs) => {
  let likeCounts = {}
  blogs.forEach(blog => {
    if (Object.hasOwn(likeCounts, blog.author)) {
      likeCounts[blog.author] = likeCounts[blog.author] + blog.likes
    } else {
      likeCounts[blog.author] = blog.likes
    }
  })
  for (const [key, value] of Object.entries(likeCounts)) {
    if (value === Math.max(...Object.values(likeCounts))) {
      return {
        author: key,
        likes: value
      }
    }
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}