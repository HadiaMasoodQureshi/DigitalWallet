const express = require('express')
const router = express.Router()
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')
const { sendEmail } = require('../config/email')

// POST /api/transactions/send - send money to another user
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { receiverEmail, amount, description } = req.body

    if (!receiverEmail || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid request data' })
    }

    const userRepo = AppDataSource.getRepository('User')
    const txRepo = AppDataSource.getRepository('Transaction')

    const sender = await userRepo.findOne({ where: { id: req.user.id } })
    const emailToSearch = receiverEmail.trim().toLowerCase()
    const receiver = await userRepo.findOne({ where: { email: emailToSearch } })

    if (!receiver) return res.status(404).json({ message: 'Receiver not found' })
    if (sender.email === receiverEmail) return res.status(400).json({ message: 'Cannot send to yourself' })

    const sendAmount = parseFloat(amount)
    if (parseFloat(sender.balance) < sendAmount) {
      // Record failed transaction
      const tx = txRepo.create({
        senderId: sender.id,
        receiverId: receiver.id,
        amount: sendAmount,
        type: 'transfer',
        status: 'failed',
        description: description || 'P2P Transfer'
      })
      await txRepo.save(tx)
      return res.status(400).json({ message: 'Insufficient balance', transaction: tx })
    }

    // Deduct from sender
    sender.balance = parseFloat(sender.balance) - sendAmount
    await userRepo.save(sender)

    // Add to receiver
    receiver.balance = parseFloat(receiver.balance) + sendAmount
    await userRepo.save(receiver)

    // Record transaction
    const tx = txRepo.create({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: sendAmount,
      type: 'transfer',
      status: 'success',
      description: description || 'P2P Transfer'
    })
    await txRepo.save(tx)

    // ✅ Send response IMMEDIATELY — don't wait for email
    res.json({
      message: 'Transfer successful',
      balance: parseFloat(sender.balance),
      transaction: tx
    })

    // 📩 Send Email in background (non-blocking)
    sendEmail({
      to: receiver.email,
      subject: '💰 You received money!',
      text: `Hi ${receiver.name}, ${sender.name} just sent you PKR ${sendAmount}. Your new balance is being updated in your wallet.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #10b981;">PKR ${sendAmount} Received!</h2>
          <p>Hi <b>${receiver.name}</b>,</p>
          <p><b>${sender.name}</b> has just sent you funds via PayWallet.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><b>Amount:</b> PKR ${sendAmount.toLocaleString()}</p>
            <p style="margin: 5px 0 0 0;"><b>Reference:</b> ${description || 'P2P Transfer'}</p>
          </div>
          <p>Login to your dashboard to check your updated balance.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">This is an automated notification from PayWallet.</p>
        </div>
      `
    }).catch(e => console.error('App Email Error:', e.message))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/transactions/history - get user transactions with search, filter, sort, pagination
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const {
      page = 1,
      limit = 10,
      type,
      status,
      search,
      sortBy = 'createdAt',
      order = 'DESC'
    } = req.query

    const txRepo = AppDataSource.getRepository('Transaction')

    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Build query
    const qb = txRepo.createQueryBuilder('tx')
      .where('(tx.senderId = :uid OR tx.receiverId = :uid)', { uid: userId })

    if (type) qb.andWhere('tx.type = :type', { type })
    if (status) qb.andWhere('tx.status = :status', { status })
    if (search) qb.andWhere('tx.description ILIKE :search', { search: `%${search}%` })

    const allowedSort = ['createdAt', 'amount']
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    qb.orderBy(`tx.${sortField}`, sortOrder)
      .skip(skip)
      .take(parseInt(limit))

    const [transactions, total] = await qb.getManyAndCount()

    res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/transactions/summary - monthly summary for dashboard
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const txRepo = AppDataSource.getRepository('Transaction')

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const sent = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.senderId = :uid AND tx.type = :type AND tx.status = :status AND tx.createdAt >= :start', {
        uid: userId, type: 'transfer', status: 'success', start: startOfMonth
      })
      .getRawOne()

    const received = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.receiverId = :uid AND tx.type = :type AND tx.status = :status AND tx.createdAt >= :start', {
        uid: userId, type: 'transfer', status: 'success', start: startOfMonth
      })
      .getRawOne()

    const topups = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.receiverId = :uid AND tx.type = :type AND tx.createdAt >= :start', {
        uid: userId, type: 'topup', start: startOfMonth
      })
      .getRawOne()

    res.json({
      monthlySent: parseFloat(sent?.total || 0),
      monthlyReceived: parseFloat(received?.total || 0),
      monthlyTopup: parseFloat(topups?.total || 0)
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
