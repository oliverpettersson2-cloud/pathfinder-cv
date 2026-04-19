/**
 * CVmatchen — Microsoft OAuth callback endpoint
 *
 * Microsoft skickar hit användaren efter lyckad inloggning med en "code".
 * Vi byter code mot access-token, hämtar email/namn från Microsoft Graph,
 * verifierar att användaren är behörig handläggare (finns i admins-tabellen),
 * och skickar tillbaka till appen.
 *
 * För nu (läge C): bara emails som redan finns i admins-tabellen godkänns.
 * Senare kan vi öppna upp till specifika domäner eller whitelist-via-UI.
 *
 * Flow:
 *   ?code=XYZ&state=ABC  (från Microsoft)
 *   → Verifiera state vs cookie (CSRF-skydd)
 *   → Byt code → access_token (POST till Microsoft)
 *   → Hämta email/namn via Microsoft Graph
 *   → Kolla admins-tabellen i Supabase
 *   → Om match: skicka tillbaka till cvmatchen.com?ms_token=<session-id>
 *   → Om ej match: skicka tillbaka med ?ms_error=unauthorized
 *
 * Env vars:
 *   MICROSOFT_CLIENT_ID
 *   MICROSOFT_CLIENT_SECRET
 *   MICROSOFT_TENANT_ID (vanligtvis "common")
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  // Verifiera att alla env vars finns
  if (!clientId || !clientSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('[MS-callback] Saknar env vars');
    return redirectWithError(req, res, 'config_missing');
  }

  const { code, state, error, error_description } = req.query;

  // Microsoft kan returnera fel (t.ex. användaren avbröt)
  if (error) {
    console.error('[MS-callback] Microsoft returnerade fel:', error, error_description);
    return redirectWithError(req, res, error === 'access_denied' ? 'cancelled' : 'ms_error');
  }

  if (!code) {
    return redirectWithError(req, res, 'missing_code');
  }

  // CSRF-skydd: verifiera state-cookie
  const cookies = parseCookies(req.headers.cookie || '');
  const expectedState = cookies.ms_oauth_state;
  if (!expectedState || expectedState !== state) {
    console.error('[MS-callback] State mismatch — möjlig CSRF-attack');
    return redirectWithError(req, res, 'invalid_state');
  }

  try {
    // Steg 1: Byt code → access_token
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = `${protocol}://${host}/api/v1/auth/microsoft/callback`;

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid profile email offline_access User.Read'
        })
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('[MS-callback] Token exchange failed:', tokenData);
      return redirectWithError(req, res, 'token_exchange_failed');
    }

    // Steg 2: Hämta användarinfo via Microsoft Graph
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const graphData = await graphResponse.json();
    if (!graphResponse.ok) {
      console.error('[MS-callback] Graph API failed:', graphData);
      return redirectWithError(req, res, 'graph_failed');
    }

    // Email kan ligga i olika fält beroende på kontotyp
    const email = (graphData.mail || graphData.userPrincipalName || '').toLowerCase().trim();
    const name = graphData.displayName || '';
    if (!email) {
      console.error('[MS-callback] Hittade ingen email för användaren', graphData);
      return redirectWithError(req, res, 'no_email');
    }

    // Steg 3: Kolla admins-tabellen — är email behörig handläggare?
    const adminCheckResp = await fetch(
      `${supabaseUrl}/rest/v1/admins?email=eq.${encodeURIComponent(email)}&select=id,name,email,role`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    if (!adminCheckResp.ok) {
      console.error('[MS-callback] Admin-check mot Supabase failed:', await adminCheckResp.text());
      return redirectWithError(req, res, 'admin_check_failed');
    }

    const admins = await adminCheckResp.json();
    if (!Array.isArray(admins) || admins.length === 0) {
      // Användaren loggade in på Microsoft men finns inte i vår admins-tabell
      console.warn('[MS-callback] Unauthorized email:', email);
      return redirectWithError(req, res, 'unauthorized', email);
    }

    const admin = admins[0];

    // Steg 4: Skapa en session-token som frontend kan använda
    // För enkelhet skapar vi en signerad JSON-payload (kort TTL).
    // Senare kan vi byta till riktiga Supabase-JWT via admin.createUser/inviteUser.
    const sessionPayload = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      loginMethod: 'microsoft',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000  // 8 timmar
    };
    const sessionToken = signSessionToken(sessionPayload, clientSecret);

    // Steg 5: Logga inloggningen i admin_activity_log (om tabellen finns)
    try {
      await fetch(`${supabaseUrl}/rest/v1/admin_activity_log`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          admin_id: admin.id,
          action: 'login',
          details: { method: 'microsoft', email: admin.email }
        })
      });
    } catch (logErr) {
      // Logga men fortsätt — loggningen får inte blockera login
      console.warn('[MS-callback] Activity logging failed:', logErr.message);
    }

    // Steg 6: Rensa state-cookie och redirecta tillbaka till appen
    res.setHeader('Set-Cookie',
      'ms_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');

    const returnUrl = `${protocol}://${host}/?ms_token=${encodeURIComponent(sessionToken)}`;
    res.setHeader('Location', returnUrl);
    res.status(302).end();

  } catch (err) {
    console.error('[MS-callback] Oväntat fel:', err);
    return redirectWithError(req, res, 'unexpected');
  }
}

// ══════════════════════════════════════════════════════════════
// HJÄLPFUNKTIONER
// ══════════════════════════════════════════════════════════════

function parseCookies(cookieHeader) {
  const result = {};
  cookieHeader.split(';').forEach(part => {
    const [k, ...v] = part.trim().split('=');
    if (k) result[k] = decodeURIComponent(v.join('='));
  });
  return result;
}

function redirectWithError(req, res, errorCode, extraInfo) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const params = new URLSearchParams({ ms_error: errorCode });
  if (extraInfo) params.set('ms_info', extraInfo);
  const returnUrl = `${protocol}://${host}/?${params.toString()}`;
  res.setHeader('Set-Cookie',
    'ms_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.setHeader('Location', returnUrl);
  res.status(302).end();
}

/**
 * Signera session-payload med HMAC-SHA256.
 * Returnerar base64url(payload).base64url(signature).
 * Frontend dekoderar payload, backend verifierar signatur vid framtida anrop.
 */
function signSessionToken(payload, secret) {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadB64)
    .digest('base64url');
  return `${payloadB64}.${signature}`;
}
