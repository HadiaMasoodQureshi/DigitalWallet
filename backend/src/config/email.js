const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend')

const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to}`)

  try {
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    })

    const sentFrom = new Sender('wardaf586@gmail.com', 'PayWallet')
    const recipients = [new Recipient(to)]

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setText(text)
      .setHtml(html || text)

    await mailerSend.email.send(emailParams)
    console.log(`[Email] MAILERSEND SUCCESS: sent to ${to}`)
    return true
  } catch (err) {
    console.error(`[Email] MAILERSEND FAILED: ${err.message || JSON.stringify(err)}`)
    return false
  }
}

module.exports = { sendEmail }
