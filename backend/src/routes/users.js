const express = require('express')
const router = express.Router()
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')

// GET /api/users - List users for discovery (limited info)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository('User')
    const users = await userRepo.find({
      select: ['id', 'name', 'email', 'role'], // include role to filter
      take: 50
    })
    
    // Filter out the current user AND all admins
    const otherUsers = users.filter(u => u.id !== req.user.id && u.role !== 'admin')
    
    res.json(otherUsers)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
