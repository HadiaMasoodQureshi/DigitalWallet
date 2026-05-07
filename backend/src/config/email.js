const nodemailer = require('nodemailer')

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to}...`)
  
  // Create transporter dynamically to ensure latest .env values are used
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"PayWallet" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    })
    console.log(`[Email] SUCCESS: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`[Email] FAILED: ${error.message}`)
    return false
  }
}

module.exports = { sendEmail }
