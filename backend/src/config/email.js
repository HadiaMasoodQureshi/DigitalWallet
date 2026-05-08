const { Resend } = require('resend')

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to}`)

  // Use Resend if API key is available, otherwise fallback to nodemailer
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    try {
      const { data, error } = await resend.emails.send({
        from: 'PayWallet <onboarding@resend.dev>',
        to,
        subject,
        text,
        html,
      })
      if (error) {
        console.error(`[Email] RESEND FAILED: ${JSON.stringify(error)}`)
        return false
      }
      console.log(`[Email] RESEND SUCCESS: ${data.id}`)
      return true
    } catch (err) {
      console.error(`[Email] RESEND ERROR: ${err.message}`)
      return false
    }
  }

  // Fallback: nodemailer
  const nodemailer = require('nodemailer')
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }
  })

  try {
    const info = await transporter.sendMail({
      from: `"PayWallet" <${process.env.SMTP_USER}>`,
      to, subject, text, html,
    })
    console.log(`[Email] NODEMAILER SUCCESS: ${info.messageId}`)
    return true
  } catch (error) {
    console.error(`[Email] NODEMAILER FAILED: ${error.message}`)
    return false
  }
}

module.exports = { sendEmail }
