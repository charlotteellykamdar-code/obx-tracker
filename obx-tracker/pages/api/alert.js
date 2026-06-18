/**
 * POST /api/alert
 * Called by the Python tracker when tickets are found.
 * 1. Updates the status table in Supabase (flips the site to LIVE)
 * 2. Sends email alerts via Resend
 * 3. Sends text alerts via Twilio
 *
 * Secured with a shared secret (ALERT_SECRET env var).
 */

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Auth check
  const secret = req.headers['x-alert-secret']
  if (secret !== process.env.ALERT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { title, url, source } = req.body
  if (!url) return res.status(400).json({ error: 'url is required' })

  // 1. Update status in Supabase
  const { error: statusError } = await supabase.from('status').upsert({
    id: 1,
    tickets_live: true,
    ticket_url: url,
    source: source || 'Unknown',
    last_checked: new Date().toISOString(),
  })
  if (statusError) console.error('Status update error:', statusError)

  // 2. Fetch all subscribers
  const { data: subscribers, error: subError } = await supabase
    .from('subscribers')
    .select('email, phone')
  if (subError) {
    console.error('Subscriber fetch error:', subError)
    return res.status(500).json({ error: 'Could not fetch subscribers' })
  }

  const emails = subscribers.filter(s => s.email).map(s => s.email)
  const phones = subscribers.filter(s => s.phone).map(s => s.phone)

  const ticketTitle = title || 'Outer Banks Season 5 Tickets'
  const alertText = `🎟️ OBX S5 tickets are live on ${source || 'GoFobo/Tudum'}! Grab them now: ${url}`

  // 3. Send emails via Resend (batch)
  const emailResults = await Promise.allSettled(
    emails.map(email =>
      resend.emails.send({
        from: 'OBX Alerts <alerts@yourdomain.com>',  // ← update with your Resend domain
        to: email,
        subject: '🎟️ OBX Season 5 Tickets Are Live!',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0e14;color:#f0ece3;border-radius:12px;">
            <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#d4a03c;margin-bottom:12px;">Outer Banks Alert</p>
            <h1 style="font-size:28px;margin-bottom:16px;line-height:1.2;">Season 5 Tickets Are Live</h1>
            <p style="color:rgba(240,236,227,0.7);margin-bottom:24px;">Found on <strong>${source}</strong>: ${ticketTitle}</p>
            <a href="${url}" style="display:inline-block;background:#d4a03c;color:#0a0e14;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;">
              Get Tickets →
            </a>
            <p style="margin-top:32px;font-size:12px;color:rgba(240,236,227,0.25);">You're receiving this because you signed up at the OBX ticket tracker. No more emails after this.</p>
          </div>
        `,
      })
    )
  )

  // 4. Send texts via Twilio
  const textResults = await Promise.allSettled(
    phones.map(phone =>
      twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
        body: alertText,
      })
    )
  )

  const emailSent = emailResults.filter(r => r.status === 'fulfilled').length
  const textsSent = textResults.filter(r => r.status === 'fulfilled').length

  console.log(`Alert sent: ${emailSent}/${emails.length} emails, ${textsSent}/${phones.length} texts`)

  return res.status(200).json({
    ok: true,
    emailSent,
    textsSent,
  })
}
