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

  const { action, email, token, accessToken, userId, cvData, table, data } = req.body || {};

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

  function authHeaders(token) {
    return { ...baseHeaders, 'Authorization': `Bearer ${token}` };
  }

  try {

    // ── Skicka OTP-kod via mail ──────────────────────────
    if (action === 'send_otp') {
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
      return res.status(200).json({
        access_token: result.data.access_token,
        user: result.data.user
      });
    }

    // ── Hämta användare ──────────────────────────────────
    if (action === 'get_user') {
      const result = await makeRequest(
        `${SUPABASE_URL}/auth/v1/user`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      return res.status(200).json(result.data);
    }

    // ── Spara CV (huvud-CV) ───────────────────────────────
    if (action === 'save_cv') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/cvs`,
        {
          method: 'POST',
          headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' }
        },
        { user_id: userId, data: cvData, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Ladda CV (huvud-CV) ───────────────────────────────
    if (action === 'load_cv') {
      const result = await makeRequest(
        `${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${userId}&select=data&limit=1`,
        { method: 'GET', headers: authHeaders(accessToken) }
      );
      const rows = Array.isArray(result.data) ? result.data : [];
      return res.status(200).json({ cv: rows[0]?.data || null });
    }

    // ── Spara valfri tabell (array som JSONB per användare) ──
    // Tabeller: saved_cvs, matched_cvs, saved_edu, job_diary
    // Kolumner: user_id, data (JSONB), saved_at / updated_at
    if (action === 'save_table') {
      const ALLOWED = ['saved_cvs', 'matched_cvs', 'saved_edu', 'job_diary'];
      if (!ALLOWED.includes(table)) {
        return res.status(400).json({ error: 'Invalid table: ' + table });
      }
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${userId}`,
        {
          method: 'DELETE',
          headers: authHeaders(accessToken)
        }
      );
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/${table}`,
        {
          method: 'POST',
          headers: { ...authHeaders(accessToken), 'Prefer': 'return=minimal' }
        },
        { user_id: userId, data: data, saved_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Spara övningsprogress ────────────────────────────
    if (action === 'save_progress') {
      await makeRequest(
        `${SUPABASE_URL}/rest/v1/ovning_progress`,
        {
          method: 'POST',
          headers: { ...authHeaders(accessToken), 'Prefer': 'resolution=merge-duplicates' }
        },
        { user_id: userId, progress: data, updated_at: new Date().toISOString() }
      );
      return res.status(200).json({ success: true });
    }

    // ── Ladda all data (anropas vid inloggning) ──────────
    if (action === 'load_all') {
      const [cvRes, savedRes, matchedRes, progressRes, eduRes, diaryRes] = await Promise.all([
        makeRequest(
          `${SUPABASE_URL}/rest/v1/cvs?user_id=eq.${userId}&select=data&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        ),
        makeRequest(
          `${SUPABASE_URL}/rest/v1/saved_cvs?user_id=eq.${userId}&select=data&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        ),
        makeRequest(
          `${SUPABASE_URL}/rest/v1/matched_cvs?user_id=eq.${userId}&select=data&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        ),
        makeRequest(
          `${SUPABASE_URL}/rest/v1/ovning_progress?user_id=eq.${userId}&select=progress&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        ),
        makeRequest(
          `${SUPABASE_URL}/rest/v1/saved_edu?user_id=eq.${userId}&select=data&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        ),
        makeRequest(
          `${SUPABASE_URL}/rest/v1/job_diary?user_id=eq.${userId}&select=data&limit=1`,
          { method: 'GET', headers: authHeaders(accessToken) }
        )
      ]);

      const pick = (res, key) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        return rows[0]?.[key] || null;
      };

      return res.status(200).json({
        cv:         pick(cvRes,       'data'),
        savedCvs:   pick(savedRes,    'data'),
        matchedCvs: pick(matchedRes,  'data'),
        progress:   pick(progressRes, 'progress'),
        savedEdu:   pick(eduRes,      'data'),
        jobDiary:   pick(diaryRes,    'data')
      });
    }

    return res.status(400).json({ error: 'Unknown action: ' + action });

  } catch (err) {
    console.error('Supabase API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
