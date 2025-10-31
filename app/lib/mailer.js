import nodemailer from 'nodemailer'

export async function sendMail(to, subject, html) {
  try {
    const url = process.env.EMAIL_SERVER
    const from = process.env.EMAIL_FROM || 'no-reply@4profit.dev'
    if (!url) {
      console.log('EMAIL_SERVER not configured; skipping send')
      return false
    }
    const transporter = nodemailer.createTransport(url)
    await transporter.sendMail({ from, to, subject, html })
    return true
  } catch (e) {
    console.log('sendMail error', e?.message)
    return false
  }
}
