export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const body = req.body || {};
  const { action, email, accessToken, userId, cvData } = body;

  try {

    // Skicka magic link
    if (action === 'magic_link') {
      const origin = req.headers.origin || 'https://pathfinder-cv.vercel.app';
      const r = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          options: { emailRedirectTo: origin }
        })
      });
      const text = await r.text();
      let data = {};
      try { data = JSON.parse(text); } catch(e) {}
      if (!r.ok) return res.status(r.status).json({ error: data.error_description || data.msg || text });
      return res.status(200).json({ success: true });
    }

    // Hämta användare från access token
    if (action === 'get_user') {
      const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await r.json();
      return res.status(200).json(data);
    }

    // Spara CV
    if (action === 'save_cv') {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/cv_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          user_id: userId,
          cv_json: cvData,
          updated_at: new Date().toISOString()
        })
      });
      return res.status(200).json({ success: true });
    }

    // Ladda CV
    if (action === 'load_cv') {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/cv_data?user_id=eq.${userId}&select=cv_json&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      const data = await r.json();
      return res.status(200).json({ cv: data[0]?.cv_json || null });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
