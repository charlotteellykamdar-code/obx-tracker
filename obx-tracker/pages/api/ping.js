import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const secret = req.headers['x-alert-secret']
  if (secret !== process.env.ALERT_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  await supabase.from('status').upsert({
    id: 1,
    last_checked: new Date().toISOString(),
  })

  return res.status(200).json({ ok: true })
}
