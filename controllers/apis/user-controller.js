const jwt = require('jsonwebtoken')
const userServices = require('../../services/user-services')
const userController = {
  signIn: (req, res, next) => {
    try {
      const userData = req.user.toJSON() // 新增這一行
      const token = jwt.sign(userData, process.env.JWT_SECRET, { expiresIn: '30d' }) // 將 req.user 改成 userData
      res.json({
        status: 'success',
        data: {
          token,
          user: userData // 將 req.user 改成 userData
        }
      })
    } catch (err) {
      next(err)
    }
  },
  signUp: (req, res, next) => {
    userServices.signUp(req, (err, data) => err ? next(err) : res.json({ status: 'success', data }))
  }
}
module.exports = userController
