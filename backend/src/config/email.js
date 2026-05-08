const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to}`)

  try {
    const apiKey = process.env.ELASTIC_EMAIL_API_KEY
    if (!apiKey) {
      console.error('[Email] ELASTIC_EMAIL_API_KEY is missing')
      return false
    }

    const response = await fetch('https://api.elasticemail.com/v2/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        apikey: apiKey,
        subject: subject,
        from: 'wardaf586@gmail.com',
        fromName: 'PayWallet',
        to: to,
        bodyHtml: html || text,
        bodyText: text,
        isTransactional: true,
      }),
    })

    const result = await response.json()

    if (result.success) {
      console.log(`[Email] ELASTIC EMAIL SUCCESS: ${result.data.messageid}`)
      return true
    } else {
      console.error(`[Email] ELASTIC EMAIL FAILED: ${result.error}`)
      return false
    }
  } catch (err) {
    console.error(`[Email] ELASTIC EMAIL ERROR: ${err.message}`)
    return false
  }
}

module.exports = { sendEmail }
