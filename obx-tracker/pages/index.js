import Head from 'next/head'
import { useState } from 'react'

export async function getServerSideProps() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/status?id=eq.1&select=*`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    )
    const data = await res.json()
    const row = data[0] || {}
    return {
      props: {
        ticketsLive: row.tickets_live ?? false,
        ticketUrl: row.ticket_url ?? null,
        lastChecked: row.last_checked ?? null,
        source: row.source ?? null,
      }
    }
  } catch (e) {
    return { props: { ticketsLive: false, ticketUrl: null, lastChecked: null, source: null } }
  }
}

export default function Home({ ticketsLive, ticketUrl, lastChecked, source }) {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e) {
    e.preventDefault()
    if (!email && !phone) {
      setError('Enter at least an email or phone number.')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    })
    const data = await res.json()
    if (res.ok) {
      setSubmitted(true)
    } else {
      setError(data.error || 'Something went wrong.')
    }
    setLoading(false)
  }

  const formattedTime = lastChecked
    ? new Date(lastChecked).toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      })
    : null

  return (
    <>
      <Head>
        <title>OBX S5 Tickets — Are They Live?</title>
        <meta name="description" content="Get alerted the second Outer Banks Season 5 premiere tickets drop on GoFobo or Tudum." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="page">
        <div className="bg-layer" />

        <main>
          <section className="hero">
            <div className={`status-badge ${ticketsLive ? 'live' : 'waiting'}`}>
              {ticketsLive ? '🎟️ TICKETS ARE LIVE' : '👀 NOT YET'}
            </div>

            <h1 className="headline">
              {ticketsLive
                ? 'OBX Season 5 Tickets Are Up'
                : 'Watching for OBX S5 Tickets'}
            </h1>

            <p className="subhead">
              {ticketsLive
                ? `Found on ${source}. Grab them before they're gone.`
                : 'Checking GoFobo and Tudum every 5 minutes. Sign up to get a text + email the second they drop.'}
            </p>

            {ticketsLive && ticketUrl && (
              <a href={ticketUrl} className="cta-button" target="_blank" rel="noopener noreferrer">
                Get Tickets →
              </a>
            )}

            {formattedTime && (
              <p className="last-checked">Last checked: {formattedTime}</p>
            )}
          </section>

          {!ticketsLive && (
            <section className="signup-section">
              {submitted ? (
                <div className="success-box">
                  <span className="success-icon">✓</span>
                  <p>You're on the list. We'll text and email you the moment tickets appear.</p>
                </div>
              ) : (
                <>
                  <h2 className="signup-heading">Alert me when tickets drop</h2>
                  <p className="signup-sub">No spam. One message, when it matters.</p>
                  <form onSubmit={handleSignup} className="signup-form">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input"
                    />
                    <input
                      type="tel"
                      placeholder="Phone number (for texts)"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="input"
                    />
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="submit-btn" disabled={loading}>
                      {loading ? 'Saving...' : 'Notify me'}
                    </button>
                  </form>
                </>
              )}
            </section>
          )}

          <section className="watching-section">
            <p className="watching-label">Watching</p>
            <div className="watching-pills">
              <span className="pill">GoFobo</span>
              <span className="pill">Netflix Tudum</span>
            </div>
          </section>
        </main>

        <footer>
          <p>Fan-made tracker. Not affiliated with Netflix or Outer Banks.</p>
        </footer>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0a0e14;
          color: #f0ece3;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }
      `}</style>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        .bg-layer {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212, 160, 60, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(32, 90, 120, 0.15) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        main {
          flex: 1;
          position: relative;
          z-index: 1;
          max-width: 560px;
          margin: 0 auto;
          padding: 64px 24px 40px;
          width: 100%;
        }

        .hero { text-align: center; }

        .status-badge {
          display: inline-block;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 28px;
        }
        .status-badge.waiting {
          background: rgba(240, 236, 227, 0.08);
          border: 1px solid rgba(240, 236, 227, 0.15);
          color: rgba(240, 236, 227, 0.6);
        }
        .status-badge.live {
          background: rgba(212, 160, 60, 0.18);
          border: 1px solid rgba(212, 160, 60, 0.5);
          color: #e8b84b;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 160, 60, 0); }
          50% { box-shadow: 0 0 0 8px rgba(212, 160, 60, 0.1); }
        }

        .headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(52px, 12vw, 88px);
          line-height: 0.95;
          letter-spacing: 0.01em;
          color: #f0ece3;
          margin-bottom: 20px;
        }

        .subhead {
          font-size: 16px;
          line-height: 1.6;
          color: rgba(240, 236, 227, 0.6);
          max-width: 400px;
          margin: 0 auto 32px;
        }

        .cta-button {
          display: inline-block;
          background: #d4a03c;
          color: #0a0e14;
          font-weight: 600;
          font-size: 15px;
          padding: 14px 32px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.15s;
          margin-bottom: 20px;
        }
        .cta-button:hover { background: #e8b84b; }

        .last-checked {
          font-size: 12px;
          color: rgba(240, 236, 227, 0.3);
          margin-top: 16px;
        }

        .signup-section {
          margin-top: 56px;
          background: rgba(240, 236, 227, 0.04);
          border: 1px solid rgba(240, 236, 227, 0.08);
          border-radius: 12px;
          padding: 32px;
        }

        .signup-heading {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.03em;
          color: #f0ece3;
          margin-bottom: 6px;
        }

        .signup-sub {
          font-size: 13px;
          color: rgba(240, 236, 227, 0.45);
          margin-bottom: 24px;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input {
          background: rgba(240, 236, 227, 0.06);
          border: 1px solid rgba(240, 236, 227, 0.12);
          border-radius: 6px;
          padding: 12px 16px;
          font-size: 15px;
          color: #f0ece3;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: border-color 0.15s;
        }
        .input::placeholder { color: rgba(240, 236, 227, 0.3); }
        .input:focus { border-color: rgba(212, 160, 60, 0.5); }

        .error {
          font-size: 13px;
          color: #e05a5a;
        }

        .submit-btn {
          background: #d4a03c;
          color: #0a0e14;
          font-weight: 600;
          font-size: 15px;
          padding: 13px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.15s;
        }
        .submit-btn:hover:not(:disabled) { background: #e8b84b; }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .success-box {
          display: flex;
          align-items: center;
          gap: 16px;
          color: rgba(240, 236, 227, 0.75);
          font-size: 15px;
          line-height: 1.5;
        }
        .success-icon {
          width: 36px;
          height: 36px;
          min-width: 36px;
          background: rgba(80, 200, 120, 0.15);
          border: 1px solid rgba(80, 200, 120, 0.3);
          color: #50c878;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .watching-section {
          margin-top: 40px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .watching-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(240, 236, 227, 0.3);
        }
        .watching-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .pill {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 100px;
          background: rgba(240, 236, 227, 0.06);
          border: 1px solid rgba(240, 236, 227, 0.1);
          color: rgba(240, 236, 227, 0.5);
        }

        footer {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 24px;
          font-size: 12px;
          color: rgba(240, 236, 227, 0.2);
        }
      `}</style>
    </>
  )
}
