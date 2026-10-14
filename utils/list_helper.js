const lodash = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const blogLikes = blogs.map(blog => blog.likes)
  let sum = blogLikes.reduce((x,y) => {
    return x + y
  })
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
  for (var key in authorsFrequency) {
    if (authorsFrequency.hasOwnProperty(key)) {
      if (authorsFrequency[key] === Math.max(...Object.values(authorsFrequency))) {
        return key
      }
    }
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
}