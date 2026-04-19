// ============================================================================
// CVmatchen: log_event action handler
//
// Klistra in denna bloggen i /api/supabase.js där de andra
// action-handlers ligger (action === 'log_event')
//
// Förutsätter att ni redan har:
//   - createClient från '@supabase/supabase-js'
//   - SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY som env
//   - en hjälpfunktion som validerar accessToken till user_id
// ============================================================================

// Lista över giltiga event-typer. Allt annat avvisas för att förhindra spam.
const ALLOWED_EVENTS = new Set([
  // Auth
  'login',
  'logout',

  // CV-bygge
  'cv_created',
  'cv_saved',
  'cv_exported',
  'profile_generated',

  // Matchning
  'cv_matched',           // när matchaCV körs
  'cv_saved_from_match',  // när användare sparar matchat CV

  // AI-funktioner
  'ai_skill_match',       // aiMatchSkills
  'ai_cv_analysis',       // när CV-analys körs
  'syv_chat',             // SYV-fråga

  // Utbildning
  'edu_saved',            // sparad utbildning från hub
  'edu_removed',

  // Sök
  'job_search',

  // Handläggare
  'task_assigned',
  'task_completed',
]);

// Hur stor metadata får vara. Förhindrar abuse.
const MAX_METADATA_BYTES = 4096;

/**
 * Anropas som: { action: 'log_event', accessToken, userId, event_type, metadata }
 *
 * Returnerar: { ok: true } eller { error: '...' }
 */
async function handleLogEvent(req, res, supabase) {
  const { accessToken, userId, event_type, metadata } = req.body || {};

  // 1) Validera parametrar
  if (!accessToken || !userId || !event_type) {
    return res.status(400).json({ error: 'accessToken, userId och event_type krävs' });
  }

  if (!ALLOWED_EVENTS.has(event_type)) {
    return res.status(400).json({ error: 'Okänd event_type: ' + event_type });
  }

  // 2) Verifiera att access_token tillhör userId — skyddar mot spoofing
  const { data: userData, error: userErr } = await supabase.auth.getUser(accessToken);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: 'Ogiltig access_token' });
  }
  if (userData.user.id !== userId) {
    return res.status(403).json({ error: 'user_id matchar inte access_token' });
  }

  // 3) Validera metadata-storlek
  let safeMetadata = {};
  if (metadata && typeof metadata === 'object') {
    const json = JSON.stringify(metadata);
    if (json.length > MAX_METADATA_BYTES) {
      return res.status(400).json({ error: 'metadata för stor (max ' + MAX_METADATA_BYTES + ' bytes)' });
    }
    safeMetadata = metadata;
  }

  // 4) Skriv till activity_log (använder service-role, inte RLS)
  const userEmail = userData.user.email || null;
  const { error: insertErr } = await supabase.from('activity_log').insert({
    user_id: userId,
    user_email: userEmail,
    event_type,
    metadata: safeMetadata,
  });

  if (insertErr) {
    // Logga fel server-side men ge minimal info till klienten
    console.error('[log_event] insert failed:', insertErr);
    return res.status(500).json({ error: 'Loggning misslyckades' });
  }

  return res.status(200).json({ ok: true });
}

// ============================================================================
// Integration: om /api/supabase använder switch/case på action:
// ============================================================================
/*
switch (action) {
  case 'log_event':
    return handleLogEvent(req, res, supabase);

  // ... andra actions
}
*/

// Exportera för test / integration
module.exports = { handleLogEvent, ALLOWED_EVENTS };
