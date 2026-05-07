require('reflect-metadata')
const express = require('express')
const cors = require('cors')
require('dotenv').config()
const AppDataSource = require('./config/db')
const authRoutes = require('./routes/auth')
const walletRoutes = require('./routes/wallet')
const transactionRoutes = require('./routes/transactions')
const adminRoutes = require('./routes/admin')
const profileRoutes = require('./routes/profile')
const usersRoutes = require('./routes/users')
const braintreeRoutes = require('./routes/braintree')

const app = express()

app.use(cors())
app.use(express.json())

// Global JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON body. Please check your syntax (commas, quotes, etc).' });
  }
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Digital Wallet API is running!' })
})

app.use('/api/auth', authRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/braintree', braintreeRoutes)

const PORT = process.env.PORT || 5000

const seedAdmin = async () => {
  try {
    const userRepo = AppDataSource.getRepository('User')
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    const bcrypt = require('bcryptjs')
    
    const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } })
    const hashedPassword = await bcrypt.hash(adminPassword, 10)

    if (!existingAdmin) {
      const admin = userRepo.create({
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        balance: 1000000
      })
      await userRepo.save(admin)
      console.log(`✅ Admin user seeded successfully (${adminEmail} / ${adminPassword})`)
    } else {
      // Update password anyway to ensure it matches user's request
      existingAdmin.password = hashedPassword
      existingAdmin.role = 'admin' // Ensure role is also correct
      await userRepo.save(existingAdmin)
      console.log(`✅ Admin password reset to "${adminPassword}" for existing user.`)
    }
  } catch (err) {
    console.error('❌ Error seeding admin user:', err.message)
  }
}

AppDataSource.initialize()
  .then(async () => {
    console.log('Database connected!')
    await seedAdmin()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Database connection failed!', err.message)
  })