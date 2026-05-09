const sendEmail = async ({ to, subject, text, html }) => {
  console.log(`[Email] Attempting to send to: ${to} via Google Script`)

  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL
    if (!scriptUrl) {
      console.error('[Email] GOOGLE_SCRIPT_URL is missing')
      return false
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        subject: subject,
        text: text,
        html: html || text,
      }),
    })

    const result = await response.text()
    
    if (result === 'Success') {
      console.log(`[Email] GOOGLE SCRIPT SUCCESS: sent to ${to}`)
      return true
    } else {
      console.error(`[Email] GOOGLE SCRIPT FAILED: ${result}`)
      return false
    }
  } catch (err) {
    console.error(`[Email] GOOGLE SCRIPT ERROR: ${err.message}`)
    return false
  }
}

module.exports = { sendEmail }
