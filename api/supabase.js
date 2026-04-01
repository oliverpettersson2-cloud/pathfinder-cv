import https from 'https';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const { action, email, token, accessToken, userId, cvData } = req.body || {};

  function makeRequest(url, options, body) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000
      };
      const req = https.request(reqOptions, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, data: JSON.parse(data) });
          } catch(e) {
            resolve({ status: response.statusCode, data: { raw: data } });
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
      req.end();
    });
  }

  const baseHeaders = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  };

  try {

    // ── Skicka OTP-kod via mail ──────────────────────────
    if (action === 'send_otp') {
      const origin = req.headers.origin || 'https://pathfinder-cv.vercel.app';
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/otp`,
        { method: 'POST', headers: baseHeaders },
        { email, options: { shouldCreateUser: true } }
      );
      console.log('OTP send result:', result.status, JSON.stringify(result.data));
      if (result.status >= 400) {
        return res.status(result.status).json({
          error: result.data.error_description || result.data.msg || result.data.message || JSON.stringify(result.data)
        });
      }
      return res.status(200).json({ success: true });
    }

    // ── Verifiera OTP-kod ────────────────────────────────
    if (action === 'verify_otp') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/verify`,
        { method: 'POST', headers: baseHeaders },
        { email, token, type: 'email' }
      );
      console.log('OTP verify result:', result.status, JSON.stringify(result.data));
      if (result.status >= 400) {
        return res.status(result.status).json({
          error: result.data.error_description || result.data.msg || result.data.message || 'Felaktig eller utgången kod'
        });
      }
      // Returnera access_token och user
      return res.status(200).json({
        access_token: result.data.access_token,
        user: result.data.user
      });
    }

    // ── Hämta användare ──────────────────────────────────
    if (action === 'get_user') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/user`,
        { method: 'GET', headers: { ...baseHeaders, 'Authorization': `Bearer ${accessToken}` } }
      );
      return res.status(200).json(result.data);
    }

    // ── Spara CV ─────────────────────────────────────────
    if (action === 'save_cv') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/cv_data`,
        {
          method: 'POST',
          headers: {
            ...baseHeaders,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'resolution=merge-duplicates'
          }
        },
        { user_id: userId, cv_json: cvData, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Ladda CV ─────────────────────────────────────────
    if (action === 'load_cv') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/cv_data?user_id=eq.${userId}&select=cv_json&limit=1`,
        {
          method: 'GET',
          headers: { ...baseHeaders, 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = Array.isArray(result.data) ? result.data : [];
      return res.status(200).json({ cv: data[0]?.cv_json || null });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
