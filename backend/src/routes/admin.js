const express = require('express')
const router = express.Router()
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')

// Middleware to check admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// GET /api/admin/users - all users with search, filter, sort, pagination
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sortBy = 'id', order = 'ASC' } = req.query
    const userRepo = AppDataSource.getRepository('User')
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const qb = userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.name', 'u.email', 'u.role', 'u.balance', 'u.isActive'])

    if (search) {
      qb.where('u.name ILIKE :s OR u.email ILIKE :s', { s: `%${search}%` })
    }

    const allowedSort = ['id', 'name', 'email', 'balance']
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'id'
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'

    qb.orderBy(`u.${sortField}`, sortOrder)
      .skip(skip)
      .take(parseInt(limit))

    const [users, total] = await qb.getManyAndCount()

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/transactions - all transactions with search, filter, sort, pagination
router.get('/transactions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, search, sortBy = 'createdAt', order = 'DESC' } = req.query
    const txRepo = AppDataSource.getRepository('Transaction')
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const qb = txRepo.createQueryBuilder('tx')
      .leftJoinAndSelect('User', 'sender', 'tx.senderId = sender.id')
      .leftJoinAndSelect('User', 'receiver', 'tx.receiverId = receiver.id')

    if (type) qb.where('tx.type = :type', { type })
    if (status) qb.andWhere('tx.status = :status', { status })
    
    if (search) {
      qb.andWhere('(tx.description ILIKE :s OR tx.paymentRef ILIKE :s OR sender.email ILIKE :s OR receiver.email ILIKE :s)', { s: `%${search}%` })
    }

    const allowedSort = ['createdAt', 'amount', 'id']
    const sortField = allowedSort.includes(sortBy) ? sortBy : 'createdAt'
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    qb.orderBy(`tx.${sortField}`, sortOrder)
      .skip(skip)
      .take(parseInt(limit))

    const [transactions, total] = await qb.getManyAndCount()

    res.json({ transactions, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/stats - platform stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository('User')
    const txRepo = AppDataSource.getRepository('Transaction')

    const totalUsers = await userRepo.count()
    const totalTransactions = await txRepo.count()

    const totalVolume = await txRepo
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'total')
      .where('tx.status = :status', { status: 'success' })
      .getRawOne()

    const failedCount = await txRepo.count({ where: { status: 'failed' } })

    res.json({
      totalUsers,
      totalTransactions,
      totalVolume: parseFloat(totalVolume?.total || 0),
      failedTransactions: failedCount
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/admin/users/:id/toggle-status - block or unblock user
router.patch('/users/:id/toggle-status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userRepo = AppDataSource.getRepository('User')
    const user = await userRepo.findOneBy({ id: req.params.id })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot block other admins' })

    user.isActive = !user.isActive
    await userRepo.save(user)

    res.json({ message: `User ${user.isActive ? 'activated' : 'suspended'} successfully`, isActive: user.isActive })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/users/:id/adjust-balance - manually change user balance
router.post('/users/:id/adjust-balance', authMiddleware, adminOnly, async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const { amount, type, reason } = req.body // type: 'add' or 'subtract'
    const userRepo = queryRunner.manager.getRepository('User')
    const txRepo = queryRunner.manager.getRepository('Transaction')

    const user = await userRepo.findOneBy({ id: req.params.id })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const amt = parseFloat(amount)
    if (type === 'add') {
      user.balance = parseFloat(user.balance) + amt
    } else {
      user.balance = parseFloat(user.balance) - amt
    }
    await userRepo.save(user)

    // Log this adjustment as a system transaction
    const tx = txRepo.create({
      type: 'adjustment',
      amount: amt,
      status: 'success',
      description: `Admin Adjustment: ${reason || 'Manual Correction'}`,
      receiverId: type === 'add' ? user.id : null,
      senderId: type === 'subtract' ? user.id : null
    })
    await txRepo.save(tx)

    await queryRunner.commitTransaction()
    res.json({ message: 'Balance adjusted successfully', newBalance: user.balance })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

// POST /api/admin/transactions/:id/refund - refund a successful transaction
router.post('/transactions/:id/refund', authMiddleware, adminOnly, async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const txRepo = queryRunner.manager.getRepository('Transaction')
    const userRepo = queryRunner.manager.getRepository('User')

    const tx = await txRepo.findOneBy({ id: req.params.id, status: 'success' })
    if (!tx) return res.status(404).json({ message: 'Successful transaction not found' })
    if (tx.type === 'refund') return res.status(400).json({ message: 'Already a refund' })

    // Refund logic depends on type
    if (tx.type === 'transfer' || tx.type === 'request') {
      const sender = await userRepo.findOneBy({ id: tx.senderId })
      const receiver = await userRepo.findOneBy({ id: tx.receiverId })
      
      if (receiver && receiver.balance < tx.amount) {
        return res.status(400).json({ message: 'Receiver has insufficient balance to refund' })
      }
      
      if (sender) sender.balance = parseFloat(sender.balance) + parseFloat(tx.amount)
      if (receiver) receiver.balance = parseFloat(receiver.balance) - parseFloat(tx.amount)
      
      if (sender) await userRepo.save(sender)
      if (receiver) await userRepo.save(receiver)
    } 
    else if (tx.type === 'topup' || tx.type === 'referral') {
      const user = await userRepo.findOneBy({ id: tx.receiverId })
      if (!user) return res.status(404).json({ message: 'User not found' })
      if (user.balance < tx.amount) return res.status(400).json({ message: 'User has insufficient balance to reverse credit' })
      
      user.balance = parseFloat(user.balance) - parseFloat(tx.amount)
      await userRepo.save(user)
    }

    tx.status = 'failed'
    tx.description = tx.description + ' (Refunded by Admin)'
    await txRepo.save(tx)

    // Log the refund as its own entity or just update this one? 
    // Updating the original to 'failed' + info is usually cleaner for simple wallets.

    await queryRunner.commitTransaction()
    res.json({ message: 'Transaction refunded successfully' })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

// GET /api/admin/pending-topups - fetch all pending topup requests
router.get('/pending-topups', authMiddleware, adminOnly, async (req, res) => {
  try {
    const txRepo = AppDataSource.getRepository('Transaction')
    const pending = await txRepo.createQueryBuilder('tx')
      .leftJoinAndSelect('users', 'u', 'tx.receiverId = u.id')
      .select([
        'tx.id as "tx_id"', 
        'tx.amount as "tx_amount"', 
        'tx.paymentMethod as "tx_paymentMethod"', 
        'tx.paymentRef as "tx_paymentRef"', 
        'tx.createdAt as "tx_createdAt"',
        'u.name as "u_name"',
        'u.email as "u_email"'
      ])
      .where('tx.type = :type AND tx.status = :status', { type: 'topup', status: 'pending' })
      .orderBy('tx.createdAt', 'DESC')
      .getRawMany()

    res.json(pending)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/approve-topup/:id
router.post('/approve-topup/:id', authMiddleware, adminOnly, async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const txRepo = queryRunner.manager.getRepository('Transaction')
    const userRepo = queryRunner.manager.getRepository('User')

    const tx = await txRepo.findOneBy({ id: req.params.id, status: 'pending' })
    if (!tx) return res.status(404).json({ message: 'Pending top-up not found' })

    const user = await userRepo.findOneBy({ id: tx.receiverId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Credit balance
    user.balance = parseFloat(user.balance) + parseFloat(tx.amount)
    await userRepo.save(user)

    // Mark success
    tx.status = 'success'
    await txRepo.save(tx)

    await queryRunner.commitTransaction()
    res.json({ message: 'Top-up approved successfully' })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

// POST /api/admin/reject-topup/:id
router.post('/reject-topup/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const txRepo = AppDataSource.getRepository('Transaction')
    const tx = await txRepo.findOneBy({ id: req.params.id, status: 'pending' })
    if (!tx) return res.status(404).json({ message: 'Pending top-up not found' })

    tx.status = 'failed'
    tx.description = tx.description + ' (Rejected by Admin)'
    await txRepo.save(tx)

    res.json({ message: 'Top-up rejected' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/admin/pending-withdrawals - fetch all pending withdrawal requests
router.get('/pending-withdrawals', authMiddleware, adminOnly, async (req, res) => {
  try {
    const txRepo = AppDataSource.getRepository('Transaction')
    const pending = await txRepo.createQueryBuilder('tx')
      .leftJoinAndSelect('users', 'u', 'tx.senderId = u.id')
      .select([
        'tx.id as "tx_id"', 
        'tx.amount as "tx_amount"', 
        'tx.paymentMethod as "tx_paymentMethod"', 
        'tx.paymentRef as "tx_paymentRef"', 
        'tx.createdAt as "tx_createdAt"',
        'u.name as "u_name"',
        'u.email as "u_email"'
      ])
      .where('tx.type = :type AND tx.status = :status', { type: 'withdraw', status: 'pending' })
      .orderBy('tx.createdAt', 'DESC')
      .getRawMany()

    res.json(pending)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/complete-withdrawal/:id
router.post('/complete-withdrawal/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const txRepo = AppDataSource.getRepository('Transaction')
    const tx = await txRepo.findOneBy({ id: req.params.id, status: 'pending' })
    if (!tx) return res.status(404).json({ message: 'Pending withdrawal not found' })

    tx.status = 'success'
    await txRepo.save(tx)

    res.json({ message: 'Withdrawal marked as completed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/admin/cancel-withdrawal/:id
router.post('/cancel-withdrawal/:id', authMiddleware, adminOnly, async (req, res) => {
  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()
  try {
    const txRepo = queryRunner.manager.getRepository('Transaction')
    const userRepo = queryRunner.manager.getRepository('User')

    const tx = await txRepo.findOneBy({ id: req.params.id, status: 'pending' })
    if (!tx) return res.status(404).json({ message: 'Pending withdrawal not found' })

    const user = await userRepo.findOneBy({ id: tx.senderId })
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Refund balance
    user.balance = parseFloat(user.balance) + parseFloat(tx.amount)
    await userRepo.save(user)

    tx.status = 'failed'
    tx.description = tx.description + ' (Cancelled by Admin)'
    await txRepo.save(tx)

    await queryRunner.commitTransaction()
    res.json({ message: 'Withdrawal cancelled and balance refunded' })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

module.exports = router

