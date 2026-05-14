const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const AppDataSource = require('../config/db')
const { sendEmail } = require('../config/email')

// Register
router.post('/register', async (req, res) => {
  try {
    const name = req.body.name || req.body.Name || ''
    const rawEmail = req.body.email || req.body.Email || ''
    const password = req.body.password || req.body.Password || ''
    const email = rawEmail.trim().toLowerCase()
    const userRepo = AppDataSource.getRepository('User')

    // Check if user already exists
    const existingUser = await userRepo.findOne({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Save user
    const user = userRepo.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      balance: 0
    })
    await userRepo.save(user)

    res.json({ message: 'User registered successfully' })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  console.log(`[Auth] Login attempt for: ${req.body.email || req.body.Email}`);
  try {
    const rawEmail = req.body.email || req.body.Email || ''
    const email = rawEmail.trim().toLowerCase()
    const rawPassword = req.body.password || req.body.Password || ''
    const password = rawPassword.trim() // Trim password to avoid accidental space issues

    const userRepo = AppDataSource.getRepository('User')

    // Find user
    // Find user using case-insensitive search
    const user = await userRepo.findOne({ 
      where: { 
        email: require('typeorm').ILike(email) 
      } 
    })
    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Check password
    console.log(`[Login] Checking password for: ${email}`)
    const isMatch = await bcrypt.compare(password, user.password)
    console.log(`[Login] Match result: ${isMatch}`)
    
    if (!isMatch) {
      console.log(`[Login] Password mismatch for: ${email}. Provided: "${password}", Stored Hash: ${user.password.substring(0, 10)}...`)
      return res.status(400).json({ message: 'Wrong password' })
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance
      }
    })

  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})


// Forgot Password - Send Reset Link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    const userRepo = AppDataSource.getRepository('User')

    const trimmedEmail = email.trim().toLowerCase()
    const user = await userRepo.findOne({ 
      where: { 
        email: require('typeorm').ILike(trimmedEmail) 
      } 
    })
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' })
    }

    // Generate a reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, type: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`
    res.json({ 
      message: 'Password reset link sent to your email',
      resetToken,
      resetUrl
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Reset Password - Verify Token and Update
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: 'Invalid token type' })
    }

    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOne({ where: { id: decoded.id } })
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log(`[Reset] Updating password for user ID: ${user.id}`)
    user.password = hashedPassword
    await userRepo.save(user)
    console.log(`[Reset] SUCCESS: Password updated in database`)

    res.json({ message: 'Password has been reset successfully. You can now login.' })
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link has expired' })
    }
    res.status(400).json({ message: 'Invalid or expired token' })
  }
})

module.exports = router