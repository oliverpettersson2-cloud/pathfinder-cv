export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { action, email, token, cvData, accessToken } = req.body || {};

  const headers = {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': accessToken ? `Bearer ${accessToken}` : `Bearer ${supabaseKey}`
  };

  try {
    // Magic link - skicka inloggningslänk
    if (action === 'magic_link') {
      const redirectUrl = req.headers.origin || 'https://pathfinder-cv.vercel.app';
      const r = await fetch(`${supabaseUrl}/auth/v1/otp`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          options: { emailRedirectTo: redirectUrl }
        })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json({ success: true });
    }

    // Verifiera token från magic link
    if (action === 'verify') {
      const r = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type: 'magiclink', token })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json(data);
    }

    // Hämta session från refresh token
    if (action === 'refresh') {
      const { refreshToken } = req.body;
      const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json(data);
    }

    // Spara CV
    if (action === 'save_cv') {
      const { userId } = req.body;
      // Upsert — skapa eller uppdatera
      const r = await fetch(`${supabaseUrl}/rest/v1/cv_data?user_id=eq.${userId}`, {
        method: 'GET',
        headers: { ...headers, 'Prefer': 'return=minimal' }
      });
      const existing = await r.json();

      let saveResp;
      if (existing && existing.length > 0) {
        saveResp = await fetch(`${supabaseUrl}/rest/v1/cv_data?user_id=eq.${userId}`, {
          method: 'PATCH',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ cv_json: cvData, updated_at: new Date().toISOString() })
        });
      } else {
        saveResp = await fetch(`${supabaseUrl}/rest/v1/cv_data`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=minimal' },
          body: JSON.stringify({ user_id: userId, cv_json: cvData, updated_at: new Date().toISOString() })
        });
      }
      return res.status(200).json({ success: true });
    }

    // Ladda CV
    if (action === 'load_cv') {
      const { userId } = req.body;
      const r = await fetch(`${supabaseUrl}/rest/v1/cv_data?user_id=eq.${userId}&select=cv_json`, {
        method: 'GET',
        headers
      });
      const data = await r.json();
      return res.status(200).json({ cv: data[0]?.cv_json || null });
    }

    // Hämta inloggad användare från access token
    if (action === 'get_user') {
      const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'GET',
        headers: { ...headers, 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await r.json();
      return res.status(200).json(data);
    }

    return res.status(400).json({ error: 'Unknown action' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
