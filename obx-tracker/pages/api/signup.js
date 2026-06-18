import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role for writes
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, phone } = req.body

  if (!email && !phone) {
    return res.status(400).json({ error: 'Provide at least an email or phone number.' })
  }

  // Basic email validation
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  // Basic phone validation (strip non-digits, check length)
  const cleanPhone = phone ? phone.replace(/\D/g, '') : null
  if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 11)) {
    return res.status(400).json({ error: 'Invalid phone number.' })
  }

  const { error } = await supabase.from('subscribers').upsert(
    {
      email: email || null,
      phone: cleanPhone ? `+1${cleanPhone.slice(-10)}` : null,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  )

  if (error) {
    console.error('Supabase error:', error)
    return res.status(500).json({ error: 'Could not save your info. Try again.' })
  }

  return res.status(200).json({ ok: true })
}
