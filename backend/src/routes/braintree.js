const express = require('express')
const router = express.Router()
const gateway = require('../config/braintree')
const AppDataSource = require('../config/db')
const authMiddleware = require('../middleware/auth')
const { sendEmail } = require('../config/email')

// GET /api/braintree/token  – generate a client token for the Drop-in UI
router.get('/token', authMiddleware, async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({})
    res.json({ clientToken: response.clientToken })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/braintree/pay  – charge card, then credit wallet
router.post('/pay', authMiddleware, async (req, res) => {
  const { nonce, amount } = req.body

  if (!nonce || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Invalid payment details' })
  }

  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()

  try {
    // 1. Charge via Braintree
    const result = await gateway.transaction.sale({
      amount: parseFloat(amount).toFixed(2),
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
    })

    if (!result.success) {
      console.error('[Braintree Topup Error]', result.message)
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      return res.status(400).json({ success: false, message: result.message })
    }

    // 2. Credit user wallet
    const userRepo = queryRunner.manager.getRepository('User')
    const txRepo   = queryRunner.manager.getRepository('Transaction')

    const user = await userRepo.findOne({ where: { id: req.user.id } })
    user.balance = parseFloat(user.balance) + parseFloat(amount)
    await userRepo.save(user)

    // 3. Record transaction
    const tx = txRepo.create({
      senderId:      null,
      receiverId:    req.user.id,
      amount:        parseFloat(amount),
      type:          'topup',
      status:        'success',
      paymentMethod: 'Braintree',
      paymentRef:    result.transaction.id,
      description:   `Card Top-up via Braintree`,
    })
    await txRepo.save(tx)

    await queryRunner.commitTransaction()

    res.json({
      success:       true,
      message:       'Top-up successful! Your balance has been updated.',
      balance:       parseFloat(user.balance),
      transaction:   tx,
      braintreeId:   result.transaction.id,
    })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

// POST /api/braintree/pay-user – charge card and pay another user directly
router.post('/pay-user', authMiddleware, async (req, res) => {
  const { nonce, amount, receiverEmail, description } = req.body

  if (!nonce || !amount || parseFloat(amount) <= 0 || !receiverEmail) {
    return res.status(400).json({ message: 'Invalid transfer details' })
  }

  const queryRunner = AppDataSource.createQueryRunner()
  await queryRunner.connect()
  await queryRunner.startTransaction()

  try {
    const userRepo = queryRunner.manager.getRepository('User')
    const txRepo   = queryRunner.manager.getRepository('Transaction')

    const sender = await userRepo.findOne({ where: { id: req.user.id } })
    const emailToSearch = receiverEmail.trim()
    const receiver = await userRepo.createQueryBuilder('user')
      .where('user.email ILIKE :email', { email: emailToSearch })
      .getOne()

    console.log(`[Braintree P2P] Sender: ${sender.email}, Searching for Receiver: ${emailToSearch}`)

    if (!receiver) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      return res.status(404).json({ message: 'Receiver not found' })
    }

    if (sender.email === receiverEmail) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      return res.status(400).json({ message: 'Cannot send to yourself' })
    }

    // 1. Charge via Braintree
    const result = await gateway.transaction.sale({
      amount: parseFloat(amount).toFixed(2),
      paymentMethodNonce: nonce,
      options: { submitForSettlement: true },
    })

    if (!result.success) {
      console.error('[Braintree P2P Error]', result.message)
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      return res.status(400).json({ success: false, message: result.message })
    }

    // 2. Credit receiver wallet
    receiver.balance = parseFloat(receiver.balance) + parseFloat(amount)
    await userRepo.save(receiver)

    // 3. Record transaction
    const tx = txRepo.create({
      senderId:      sender.id,
      receiverId:    receiver.id,
      amount:        parseFloat(amount),
      type:          'transfer',
      status:        'success',
      paymentMethod: 'Braintree Card',
      paymentRef:    result.transaction.id,
      description:   description || `Transfer via Card`,
    })
    await txRepo.save(tx)

    await queryRunner.commitTransaction()

    // 📩 Send Email Notification to Recipient (Awaited)
    try {
      await sendEmail({
        to: receiver.email,
        subject: '💳 You received a card payment!',
        text: `Hi ${receiver.name}, ${sender.name} just sent you PKR ${amount} directly from their card. Your wallet balance has been updated.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">PKR ${amount} Received (via Card)!</h2>
            <p>Hi <b>${receiver.name}</b>,</p>
            <p><b>${sender.name}</b> has just paid you via Card on PayWallet.</p>
            <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><b>Amount:</b> PKR ${parseFloat(amount).toLocaleString()}</p>
              <p style="margin: 5px 0 0 0;"><b>Type:</b> Card Payment</p>
            </div>
            <p>The funds are already in your wallet balance.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">Automated message from PayWallet.</p>
          </div>
        `
      })
    } catch (e) {
      console.error('App Braintree Email Error:', e.message)
    }

    res.json({
      success:       true,
      message:       `Success! PKR ${amount} sent to ${receiver.name} via card.`,
      transaction:   tx,
    })
  } catch (err) {
    await queryRunner.rollbackTransaction()
    res.status(500).json({ message: err.message })
  } finally {
    await queryRunner.release()
  }
})

// POST /api/braintree/webhook  – receive Braintree settlement events
router.post('/webhook', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const notification = await gateway.webhookNotification.parse(
      req.body.bt_signature,
      req.body.bt_payload
    )
    console.log('[Braintree Webhook]', notification.kind)
    res.sendStatus(200)
  } catch (err) {
    console.error('[Braintree Webhook Error]', err.message)
    res.sendStatus(400)
  }
})

module.exports = router
