const { Restaurant, Category, Comment, User } = require('../../models')

const restaurantServices = require('../../services/restaurant-services')
const { getUser } = require('../../helpers/auth-helpers')
const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category,
        { model: Comment, include: User },
        { model: User, as: 'FavoritedUsers' },
        { model: User, as: 'LikedUsers' }
      ]
    }).then(restaurant => {
      const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
      const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
      if (!restaurant) throw new Error('Restaurant does not exit!')
      restaurant.increment('viewCounts', { by: 1 })
      res.render('restaurant', {
        restaurant: restaurant.toJSON(),
        isFavorited,
        isLiked
      })
    })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Restaurant.findByPk(req.params.id, {
      include: [
        Category
      ]
    }).then(restaurant => {
      res.render('dashboard', {
        restaurant: restaurant.toJSON()
      })
    })
      .catch(err => next(err))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => {
        res.render('feeds', {
          restaurants,
          comments
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant.findAll({
      include: [{ model: User, as: 'FavoritedUsers' }]
    })
      .then(restaurants => {
        const limit = 10
        const result = restaurants.map(restaurant => ({
          ...restaurant.toJSON(),
          description: restaurant.description.substring(0, 500),
          favoritedCount: restaurant.FavoritedUsers.length,
          isFavorited: getUser(req) && getUser(req).FavoritedRestaurants.some(fr => fr.id === restaurant.id)
        }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, limit)
        res.render('top-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}

module.exports = restaurantController
