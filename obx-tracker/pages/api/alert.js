export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = req.headers['x-alert-secret']
  if (secret !== process.env.ALERT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { title, url, source } = req.body
  if (!url) return res.status(400).json({ error: 'url is required' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // 1. Update status
  await fetch(`${supabaseUrl}/rest/v1/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      id: 1,
      tickets_live: true,
      ticket_url: url,
      source: source || 'Unknown',
      last_checked: new Date().toISOString(),
    }),
  })

  // 2. Fetch subscribers
  const subRes = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=email,phone`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
  })
  const subscribers = await subRes.json()
  const subArray = Array.isArray(subscribers) ? subscribers : []
  const emails = subArray.filter(s => s.email).map(s => s.email)
  const phones = subArray.filter(s => s.phone).map(s => s.phone)

  // 3. Send emails via Resend
  let emailSent = 0
  if (process.env.RESEND_API_KEY && emails.length > 0) {
    await Promise.allSettled(emails.map(email =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'OBX Alerts <alerts@obxs5premieretracker.com>',
          to: email,
          subject: '🎟️ OBX Season 5 Tickets Are Live!',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0a0e14;color:#f0ece3;border-radius:12px;">
              <p style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#d4a03c;margin-bottom:12px;">Outer Banks Alert</p>
              <h1 style="font-size:28px;margin-bottom:16px;line-height:1.2;">Season 5 Tickets Are Live</h1>
              <p style="color:rgba(240,236,227,0.7);margin-bottom:24px;">Found on <strong>${source}</strong>. Grab them before they're gone!</p>
              <a href="${url}" style="display:inline-block;background:#d4a03c;color:#0a0e14;font-weight:600;padding:14px 28px;border-radius:6px;text-decoration:none;">Get Tickets →</a>
              <p style="margin-top:32px;font-size:12px;color:rgba(240,236,227,0.25);">You signed up at obxs5premieretracker.com</p>
            </div>
          `,
        }),
      }).then(r => { if (r.ok) emailSent++ })
    ))
  }

  // 4. Send texts via Vonage
  let textsSent = 0
  if (process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET && phones.length > 0) {
    await Promise.allSettled(phones.map(phone =>
      fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.VONAGE_API_KEY,
          api_secret: process.env.VONAGE_API_SECRET,
          to: phone.replace('+', ''),
          from: 'OBXTracker',
          text: `🎟️ OBX S5 tickets are live on ${source}! Grab them: ${url}`,
        }),
      }).then(r => { if (r.ok) textsSent++ })
    ))
  }

  return res.status(200).json({ ok: true, emailSent, textsSent, total: subArray.length })
}
