/**
 * CVmatchen — Session refresh endpoint
 *
 * Förlänger en befintlig session utan att användaren behöver
 * göra om hela Microsoft-login-flödet. Används av frontend
 * ~30 min innan token går ut.
 *
 * Flow:
 *   POST /api/v1/auth/refresh med { token: "<nuvarande token>" }
 *   → Verifiera HMAC-signaturen
 *   → Kolla att token inte är EXTREMT gammal (>24h = kräv full re-login)
 *   → Verifiera att användaren fortfarande finns i admins-tabellen
 *     (gör att vi kan återkalla behörighet genom att ta bort rad i Supabase)
 *   → Skapa ny token med ny 8h TTL
 *   → Returnera: { token: "<ny>", expiresAt: <timestamp> }
 *
 * Säkerhet:
 * - Tar bara refresh om originaltoken är < 24h gammal
 * - Kontrollerar admins-tabellen vid varje refresh — om adminen tagits bort
 *   kommer refresh att misslyckas och användaren loggas ut
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!clientSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('[refresh] Saknar env vars');
    return res.status(500).json({ error: 'config_missing' });
  }

  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'missing_token' });
  }

  // Verifiera token: format + HMAC-signatur
  const parts = token.split('.');
  if (parts.length !== 2) {
    return res.status(401).json({ error: 'invalid_token_format' });
  }
  const [payloadB64, signature] = parts;

  // Räkna om HMAC och jämför
  const expectedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(payloadB64)
    .digest('base64url');

  if (!safeEquals(expectedSignature, signature)) {
    console.warn('[refresh] Signatur matchar inte');
    return res.status(401).json({ error: 'invalid_signature' });
  }

  // Parsa payload
  let payload;
  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
    payload = JSON.parse(json);
  } catch (e) {
    return res.status(401).json({ error: 'invalid_payload' });
  }

  // Begränsning: refresh är bara OK om originaltoken är < 24h gammal
  // Efter det måste användaren göra full re-login
  const tokenAge = Date.now() - (payload.issuedAt || 0);
  const MAX_REFRESH_AGE = 24 * 60 * 60 * 1000; // 24h
  if (tokenAge > MAX_REFRESH_AGE) {
    return res.status(401).json({ error: 'refresh_expired', requireLogin: true });
  }

  // Verifiera att admin fortfarande finns i admins-tabellen
  // Om någon tagit bort raden → refresh misslyckas → användaren loggas ut
  try {
    const email = (payload.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(401).json({ error: 'no_email_in_token' });
    }

    const adminCheck = await fetch(
      `${supabaseUrl}/rest/v1/admins?email=eq.${encodeURIComponent(email)}&select=id,name,email,role`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    );

    if (!adminCheck.ok) {
      console.error('[refresh] Admin-check misslyckades:', await adminCheck.text());
      return res.status(500).json({ error: 'admin_check_failed' });
    }

    const admins = await adminCheck.json();
    if (!Array.isArray(admins) || admins.length === 0) {
      // Admin har tagits bort — tvinga re-login
      return res.status(401).json({ error: 'admin_revoked', requireLogin: true });
    }

    const admin = admins[0];

    // Skapa ny token med förnyad TTL
    const newPayload = {
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      loginMethod: payload.loginMethod || 'microsoft',
      issuedAt: payload.issuedAt || Date.now(), // behåll original-issuedAt så 24h-gränsen räknas från initial login
      refreshedAt: Date.now(),
      expiresAt: Date.now() + 8 * 60 * 60 * 1000 // 8 timmar från nu
    };

    const newToken = signSessionToken(newPayload, clientSecret);

    return res.status(200).json({
      token: newToken,
      expiresAt: newPayload.expiresAt,
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    });

  } catch (err) {
    console.error('[refresh] Oväntat fel:', err);
    return res.status(500).json({ error: 'unexpected' });
  }
}

// ═══════════════════════════════════════════════════════════════
// HJÄLPFUNKTIONER
// ═══════════════════════════════════════════════════════════════

/**
 * Timing-safe jämförelse av två strängar för att undvika timing-attacker.
 */
function safeEquals(a, b) {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Signera session-payload med HMAC-SHA256.
 * Samma format som callback.js — base64url(payload).base64url(signature).
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
