const express = require('express')
const router = express.Router()
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY) // Removed

// GET /api/wallet/balance - get current user balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    res.json({ balance: parseFloat(req.user.balance) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/wallet/withdraw - request a withdrawal
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentRef } = req.body
    const userRepo = AppDataSource.getRepository('User')
    const txRepo = AppDataSource.getRepository('Transaction')

    const user = await userRepo.findOneBy({ id: req.user.id })
    const withdrawAmount = parseFloat(amount)

    if (user.balance < withdrawAmount) {
      return res.status(400).json({ message: 'Insufficient balance' })
    }

    // Deduct balance immediately
    user.balance = parseFloat(user.balance) - withdrawAmount
    await userRepo.save(user)

    // Create pending transaction
    const tx = txRepo.create({
      senderId: user.id,
      amount: withdrawAmount,
      type: 'withdraw',
      status: 'pending',
      paymentMethod: paymentMethod || 'Braintree',
      paymentRef: paymentRef || '',
      description: 'Withdrawal Request'
    })
    await txRepo.save(tx)

    res.json({ message: 'Withdrawal request submitted', balance: user.balance, transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/wallet/request-topup - manual top-up request
router.post('/request-topup', authMiddleware, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentRef } = req.body
    const txRepo = AppDataSource.getRepository('Transaction')

    const tx = txRepo.create({
      receiverId: req.user.id,
      amount: parseFloat(amount),
      type: 'topup',
      status: 'pending',
      paymentMethod: paymentMethod || 'Braintree',
      paymentRef: paymentRef || '',
      description: 'Manual Top-up Request'
    })
    await txRepo.save(tx)

    res.json({ message: 'Top-up request submitted for approval', transaction: tx })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
