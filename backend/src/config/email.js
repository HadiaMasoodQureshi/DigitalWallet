const nodemailer = require('nodemailer')

const sendEmail = async ({ to, subject, text, html }) => {
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  console.log(`[Email] Attempting to send to: ${to}`)
  console.log(`[Email] SMTP_USER: ${smtpUser}`)
  console.log(`[Email] SMTP_PASS length: ${smtpPass ? smtpPass.length : 'MISSING'}`)
  
  // Create transporter dynamically to ensure latest .env values are used
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  try {
    const info = await transporter.sendMail({
      from: `"PayWallet" <${smtpUser}>`,
      to,
      subject,
      text,
      html,
    })
    console.log(`[Email] SUCCESS: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`[Email] FAILED CODE: ${error.code}`)
    console.error(`[Email] FAILED: ${error.message}`)
    console.error(`[Email] FULL ERROR: ${JSON.stringify(error)}`)
    return false
  }
}

module.exports = { sendEmail }
