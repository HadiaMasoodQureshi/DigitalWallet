const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to}`)

  try {
    const SibApiV3Sdk = require('@getbrevo/brevo')
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
    apiInstance.setApiKey(
      SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    )

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()
    sendSmtpEmail.to = [{ email: to }]
    sendSmtpEmail.sender = { name: 'PayWallet', email: 'wardaf586@gmail.com' }
    sendSmtpEmail.subject = subject
    sendSmtpEmail.textContent = text
    sendSmtpEmail.htmlContent = html

    const result = await apiInstance.sendTransacEmail(sendSmtpEmail)
    console.log(`[Email] BREVO SUCCESS: ${result.body.messageId}`)
    return true
  } catch (err) {
    console.error(`[Email] BREVO FAILED: ${err.message}`)
    return false
  }
}

module.exports = { sendEmail }
