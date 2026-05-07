const express = require('express')
const router = express.Router()
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')

// GET /api/profile/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOne({
      where: { id: req.user.id },
      select: ['id', 'name', 'email', 'role', 'balance']
    })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/profile/update
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOne({ where: { id: req.user.id } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (name) user.name = name
    await userRepo.save(user)
    res.json({ message: 'Profile updated', user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: parseFloat(user.balance) } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
