import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendMail(to, subject, html) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured; skipping send')
      return false
    }
    const from = process.env.EMAIL_FROM || '4BASE <noreply@4base.pro>'
    const { data, error } = await resend.emails.send({ from, to, subject, html })
    if (error) {
      console.log('resend error', error)
      return false
    }
    return !!data?.id
  } catch (e) {
    console.log('sendMail error', e?.message)
    return false
  }
}
