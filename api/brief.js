// Project submission sender (Vercel serverless function).
// Delivers the brief by email through Resend. Until RESEND_API_KEY is set in
// the Vercel project, it answers 503 "not-configured" and the page falls back
// to opening the visitor's email app, exactly as before.
//
// Environment variables (Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY  required  API key from resend.com
//   BRIEF_TO        optional  where briefs go       (default dawood@unmadefilmsai.com)
//   BRIEF_FROM      optional  verified sender       (default "Unmade Films AI <onboarding@resend.dev>")

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ ok: false, reason: 'method' }); }

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(503).json({ ok: false, reason: 'not-configured' });

  const b = typeof req.body === 'object' && req.body ? req.body : {};
  if (clean(b.website, 200)) return res.status(200).json({ ok: true });        // honeypot: quietly drop bots

  const brief = {
    no: clean(b.no, 12),
    title: clean(b.title, 140) || 'Untitled',
    name: clean(b.name, 120),
    email: clean(b.email, 200),
    company: clean(b.company, 160),
    timing: clean(b.timing, 60),
    what: clean(b.what, 5000)
  };
  if (!brief.name || !brief.what || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email)) {
    return res.status(400).json({ ok: false, reason: 'invalid' });
  }

  const text = `PROJECT SUBMISSION No. ${brief.no}\n\nWorking title: ${brief.title}\nName: ${brief.name}\nEmail: ${brief.email}\nCompany: ${brief.company}\nNeeded by: ${brief.timing}\n\nLogline:\n${brief.what}`;
  const html = `<div style="font-family:Courier,monospace;font-size:14px;line-height:1.6;color:#1c1915">
    <p style="letter-spacing:.14em;text-transform:uppercase;color:#9a7434">Project submission No. ${escapeHtml(brief.no)}</p>
    <p><b>Working title:</b> ${escapeHtml(brief.title)}<br><b>Name:</b> ${escapeHtml(brief.name)}<br><b>Email:</b> ${escapeHtml(brief.email)}<br><b>Company:</b> ${escapeHtml(brief.company)}<br><b>Needed by:</b> ${escapeHtml(brief.timing)}</p>
    <p><b>Logline:</b><br>${escapeHtml(brief.what).replace(/\n/g, '<br>')}</p></div>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.BRIEF_FROM || 'Unmade Films AI <onboarding@resend.dev>',
        to: [process.env.BRIEF_TO || 'dawood@unmadefilmsai.com'],
        reply_to: brief.email,
        subject: `Project submission: ${brief.title} (${brief.name})`,
        text, html
      })
    });
    if (!r.ok) return res.status(502).json({ ok: false, reason: 'send-failed' });
    return res.status(200).json({ ok: true });
  } catch (_) {
    return res.status(502).json({ ok: false, reason: 'send-failed' });
  }
};
