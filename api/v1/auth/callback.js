/**
 * CVmatchen — Microsoft OAuth start endpoint
 *
 * Denna endpoint startar OAuth-flödet genom att bygga rätt URL till Microsoft
 * och redirecta användaren dit. När användaren loggat in skickar Microsoft
 * tillbaka till /api/v1/auth/microsoft/callback med en code.
 *
 * Vi använder "common"-tenant så användare från alla Microsoft-tenants
 * (olika kommuner etc.) kan logga in. Multitenant-setup.
 *
 * Query params:
 *   e = förvald email (login_hint — gör login snabbare om känd)
 *
 * Env vars (måste finnas i Vercel):
 *   MICROSOFT_CLIENT_ID
 *   MICROSOFT_TENANT_ID (vanligtvis "common")
 */

import crypto from 'crypto';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

  if (!clientId) {
    return res.status(500).json({ error: 'MICROSOFT_CLIENT_ID saknas i env vars' });
  }

  // Bygg absolut redirect-URI från request-värden (stöder preview deployments)
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${protocol}://${host}/api/v1/auth/microsoft/callback`;

  // State = skydd mot CSRF. Vi genererar en slumpmässig sträng, sätter i cookie
  // och verifierar att den kommer tillbaka oförändrad i callback.
  const state = crypto.randomBytes(16).toString('hex');

  // Sätt cookie för state-validering (HttpOnly så JS kan inte läsa den)
  // SameSite=Lax krävs för OAuth-flows där vi kommer tillbaka via redirect.
  res.setHeader('Set-Cookie',
    `ms_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  // Bygg Microsoft-login-URL
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    // openid + profile + email = få email och namn tillbaka via ID-token
    // offline_access = få refresh_token så sessionen kan förnyas
    // User.Read = Microsoft Graph för utökad profilinfo
    scope: 'openid profile email offline_access User.Read',
    state: state,
    prompt: 'select_account'  // Visa kontoväljaren även om redan inloggad
  });

  // Lägg till login_hint om email skickades med (gör login snabbare)
  const emailHint = req.query.e;
  if (emailHint && typeof emailHint === 'string' && emailHint.length < 200) {
    params.set('login_hint', emailHint);
  }

  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  // 302-redirect till Microsoft
  res.setHeader('Location', authUrl);
  res.status(302).end();
}
