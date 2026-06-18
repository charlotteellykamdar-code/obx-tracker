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

  return res.status(200).json({ ok: true, subscribers: subscribers.length })
}
