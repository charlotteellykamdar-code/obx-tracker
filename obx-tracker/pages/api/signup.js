export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, phone } = req.body

  if (!email && !phone) {
    return res.status(400).json({ error: 'Provide at least an email or phone number.' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const response = await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      email: email || null,
      phone: phone ? `+1${phone.replace(/\D/g, '').slice(-10)}` : null,
    }),
  })

  if (!response.ok) {
    return res.status(500).json({ error: 'Could not save your info. Try again.' })
  }

  return res.status(200).json({ ok: true })
}
