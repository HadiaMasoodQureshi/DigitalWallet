const jwt = require('jsonwebtoken')
const AppDataSource = require('../config/db')

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization || req.headers.Authorization
    const token = authHeader?.split(' ')[1]

    if (!token) {
      return res.status(401).json({ message: 'No token, access denied' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if user is active in DB
    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOne({ where: { id: decoded.id } })
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' })
    }
    
    if (user.isActive === false) {
      return res.status(403).json({ message: 'This account has been suspended' })
    }

    req.user = user // Pass full user object to next middleware
    next()

  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware