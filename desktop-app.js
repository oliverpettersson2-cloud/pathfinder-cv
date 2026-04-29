/* ============================================================
   CVmatchen Desktop — App-logik
   Delar localStorage med mobilversionen så data synkas.
   ============================================================ */

(function() {
  'use strict';

  // ============================================================
  // KONSTANTER
  // ============================================================
  const STORAGE_KEY      = 'cvData';
  const AUTH_STORAGE_KEY = 'pathfinder_auth';
  const API_KEY_STORAGE  = 'cvmatchen_api_key';
  const TRAINING_PROGRESS_KEY = 'cvmatchen_ovning_progress';
  const SAVED_CVS_KEY    = 'pathfinder_saved_cvs';
  const MATCHED_CVS_KEY  = 'pathfinder_matched_cvs';
  const MATCHED_TTL_MS   = 14 * 24 * 3600 * 1000; // 14 dagar — samma som mobilen
  const MAX_SAVED_CVS    = 3;

  // Engångsmigrering: Om användaren har auth sparad i gamla 'cvmatchen_auth'-nyckeln
  // (från tidigare desktop-version), flytta över till 'pathfinder_auth' så den
  // delas med mobilen. Körs en gång vid appstart.
  try {
    const oldAuth = localStorage.getItem('cvmatchen_auth');
    const newAuth = localStorage.getItem('pathfinder_auth');
    if (oldAuth && !newAuth) {
      localStorage.setItem('pathfinder_auth', oldAuth);
      localStorage.removeItem('cvmatchen_auth');
      console.info('[CVmatchen] Auth migrerat från cvmatchen_auth → pathfinder_auth');
    } else if (oldAuth && newAuth) {
      // Båda finns — behåll nyare, radera gamla
      localStorage.removeItem('cvmatchen_auth');
    }
  } catch(e) { /* tyst */ }

  const ALL_LANGUAGES = [
    'Svenska', 'Engelska', 'Danska', 'Tyska', 'Franska', 'Spanska',
    'Arabiska', 'Persiska (Farsi)', 'Somalisk', 'Kurdisk', 'Turkisk',
    'Polsk', 'Tigrinj', 'Bosnisk', 'Kroatisk', 'Italiensk',
    'Vietnamesisk', 'Portugisisk', 'Mandarin (Kinesisk)', 'Urdu', 'Tamilsk', 'Lao'
  ];

  const ALL_LICENSES = [
    'B - Personbil',
    'BE - Personbil med släp',
    'C1 - Lätt lastbil',
    'C - Lastbil',
    'CE - Lastbil med tung släp',
    'D1 - Liten buss',
    'D - Buss',
    'Truckkort A - Låglyftande',
    'Truckkort B - Höglyftande',
    'Skylift/Saxplattform',
    'Traversutbildning',
  ];

  const TEMPLATES = [
    { id: 'classic',     name: 'Klassisk',          icon: '📋', color: '#e85d26' },
    { id: 'modern',      name: 'Modern',            icon: '✨', color: '#3eb489' },
    { id: 'template-3',  name: 'Modern Blå/Grön',   icon: '🎨', color: '#4285F4' },
    { id: 'template-4',  name: 'Modern Lila/Cyan',  icon: '💫', color: '#7c3aed' },
    { id: 'template-5',  name: 'Minimalistisk',     icon: '⚪', color: '#888888' },
    { id: 'template-6',  name: 'Traditionell 1',    icon: '📄', color: '#1a1a2e' },
    { id: 'template-7',  name: 'Traditionell 2',    icon: '📑', color: '#d4af37' },
    { id: 'template-8',  name: 'Modern Kort',       icon: '🎯', color: '#ec4899' },
    { id: 'template-9',  name: 'Två-kolumn',        icon: '🌟', color: '#10b981' },
    { id: 'template-10', name: 'Färgskatt',         icon: '🎨', color: '#f59e0b' },
    { id: 'template-11', name: 'Traditionell 3',    icon: '📜', color: '#8b1a1a' },
    { id: 'template-12', name: 'Traditionell 4',    icon: '📃', color: '#0f766e' },
  ];

  // ============================================================
  // TRAINING MODULES — laddas från training-modules.js (delas med mobilen)
  // ============================================================
  // Datan exponeras globalt via window.TRAINING_DATA. Om den saknas
  // (filen inte laddad eller blockerad) faller vi tillbaka till tomma
  // arrays så att appen inte kraschar — träningssektionen blir bara tom.
  var TRAINING_DATA = window.TRAINING_DATA || {};
  var INTRO    = TRAINING_DATA.INTRO    || [];
  var ARBETE   = TRAINING_DATA.ARBETE   || [];
  var HALSA    = TRAINING_DATA.HALSA    || [];
  var EKONOMI  = TRAINING_DATA.EKONOMI  || [];
  var DIGITAL  = TRAINING_DATA.DIGITAL  || [];
  var STUDIER  = TRAINING_DATA.STUDIER  || [];

  // Varna i konsolen om datan saknas — hjälper vid felsökning
  if (!window.TRAINING_DATA) {
    console.warn('[desktop-app] window.TRAINING_DATA saknas — laddade du training-modules.js före desktop-app.js?');
  }

  // Kategori-definitioner (samma som mobilen)
  const TRAINING_CATS = [
    { id: 'intro',    label: 'Intro',     icon: '🚀', color: '#3eb489', mods: INTRO },
    { id: 'arbete',   label: 'Arbete',    icon: '💼', color: '#f87171', mods: ARBETE },
    { id: 'studier',  label: 'Studier',   icon: '📖', color: '#60a5fa', mods: STUDIER },
    { id: 'halsa',    label: 'Hälsa',     icon: '🫀', color: '#fb923c', mods: HALSA },
    { id: 'ekonomi',  label: 'Ekonomi',   icon: '💰', color: '#a78bfa', mods: EKONOMI },
    { id: 'digital',  label: 'Digitalt',  icon: '🌐', color: '#34d399', mods: DIGITAL },
  ];

  // ════════════════════════════════════════════════════════════════
  // AKTIVA MODULER — lägg till/ta bort modul-ID:n här för att styra
  // vilka som visas aktiva vs "Under arbete". ÄNDRA BARA HÄR!
  // ════════════════════════════════════════════════════════════════
  const ACTIVE_MODS = ['m1','m2','m3','a_cv','a_match','a0','s0','s1','s2','s3'];

  // Bakåtkompatibilitet: TRAINING_MODULES = alla moduler i en array
  const TRAINING_MODULES = [].concat(INTRO, ARBETE, STUDIER, HALSA, EKONOMI, DIGITAL);

  // ============================================================
  // STATE
  // ============================================================
  let cvData = createEmptyCV();
  let currentView = 'hej';
  let currentStep = 'profil';
  let trainingProgress = loadTrainingProgress();
  let _saveDebounce = null;

  function createEmptyCV() {
    return {
      name: '', title: '', email: '', phone: '', summary: '',
      jobs: [], education: [],
      languages: [], certifications: [], licenses: [],
      references: [], refOnRequest: false,
      skills: [],
      photoData: null, showPhoto: false,
      template: 'classic'
    };
  }

  // ============================================================
  // NYTT CV — matchande mobilens beteende
  // ============================================================
  // Skapar ett nytt CV men BEHÅLLER jobb, utbildning, språk, körkort,
  // certifikat och referenser. Rensar bara de fält som typiskt skiljer
  // mellan olika ansökningar (namn/kontakt/profiltext/foto/kompetenser).
  //
  // Kompetenser rensas medvetet — de bör matcha den nya yrkestiteln,
  // och AI:n kan föreslå nya direkt baserat på behållna jobb.
  // ============================================================
  window.nyttCV = function() {
    // Bygg en bekräftelsemodal inline (samma stil som desktops andra overlays)
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(10,12,28,0.85);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    const card = document.createElement('div');
    card.style.cssText = 'max-width:440px;width:100%;background:#1a1f3a;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px;color:#fff;font-family:inherit;';

    const jobCount = (cvData.jobs || []).length;
    const eduCount = (cvData.education || []).length;
    const keepSummary = [
      jobCount ? jobCount + ' jobb' : '',
      eduCount ? eduCount + ' utbildning' + (eduCount > 1 ? 'ar' : '') : '',
      (cvData.languages || []).length ? 'språk' : '',
      (cvData.licenses || []).length ? 'körkort' : '',
      (cvData.certifications || []).length ? 'certifikat' : '',
      (cvData.references || []).length ? 'referenser' : ''
    ].filter(Boolean).join(', ');

    card.innerHTML =
      '<div style="font-size:32px;margin-bottom:12px;">📝</div>' +
      '<div style="font-size:20px;font-weight:800;margin-bottom:10px;">Skapa nytt CV?</div>' +
      '<div style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.75);margin-bottom:18px;">' +
        'Du börjar om med tomma fält för namn, kontakt, profiltext, foto och kompetenser. ' +
        (keepSummary ? '<br><br><strong style="color:#3eb489;">Behålls:</strong> ' + keepSummary + '.' : '') +
      '</div>' +
      '<div style="display:flex;gap:10px;">' +
        '<button id="nyttCvCancelBtn" style="flex:1;padding:14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);border-radius:12px;color:rgba(255,255,255,0.7);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">Avbryt</button>' +
        '<button id="nyttCvConfirmBtn" style="flex:1;padding:14px;background:linear-gradient(135deg,#3eb489,#10b981);border:none;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;font-family:inherit;">Ja, skapa nytt</button>' +
      '</div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    document.getElementById('nyttCvCancelBtn').onclick = function() { overlay.remove(); };
    document.getElementById('nyttCvConfirmBtn').onclick = function() {
      overlay.remove();
      nyttCVConfirm();
    };
  };

  window.nyttCVConfirm = function() {
    if (typeof logEvent === 'function') logEvent('cv_created');

    // Behåll: jobb, utbildning, språk, körkort, certifikat, referenser
    // Rensa: namn, titel, email, telefon, profiltext, foto, kompetenser, mall
    cvData = {
      name: '',
      title: '',
      email: '',
      phone: '',
      summary: '',
      jobs: cvData.jobs || [],
      education: cvData.education || [],
      languages: cvData.languages || [],
      certifications: cvData.certifications || [],
      licenses: cvData.licenses || [],
      references: cvData.references || [],
      refOnRequest: cvData.refOnRequest || false,
      skills: [],          // Kompetenser rensas — stämmer sällan med ny titel
      photoData: null,
      showPhoto: false,
      template: 'classic'
    };

    // Spara + ladda in i formuläret + rendera om allt
    if (typeof saveCVLocal === 'function') saveCVLocal();
    if (typeof loadCVIntoForm === 'function') loadCVIntoForm();
    if (typeof renderJobs === 'function') renderJobs();
    if (typeof renderEducation === 'function') renderEducation();
    if (typeof renderSkillsChips === 'function') renderSkillsChips();
    if (typeof renderLanguages === 'function') renderLanguages();
    if (typeof renderLicenses === 'function') renderLicenses();
    if (typeof renderTemplates === 'function') renderTemplates();
    if (typeof renderPreview === 'function') renderPreview();
    if (typeof cvSwitchStep === 'function') cvSwitchStep('profil');

    toast('🎯 Nytt CV startat — jobb och utbildning är kvar');
  };

  // ============================================================
  // STORAGE
  // ============================================================
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch(e) { return false; }
  }
  function safeRemove(key) {
    try { localStorage.removeItem(key); return true; } catch(e) { return false; }
  }

  // ── USER-SCOPED STORAGE — ISOLERA DATA PER ANVÄNDARE ─────────
  // KRITISK SÄKERHETSFIX: tidigare delade alla användare på samma
  // webbläsare samma localStorage-nycklar (t.ex. 'cvData'), vilket
  // gjorde att nästa person som loggade in såg föregående persons CV.
  // Lösning: alla användardata-nycklar suffixas med user-id.
  // Exempel: 'cvData' → 'cvData::user_abc123'
  // Auth-nyckeln (pathfinder_auth) är fortfarande global eftersom
  // den används för att identifiera vem som är inloggad.
  const USER_KEYS = [
    'cvData', 'pathfinder_saved_cvs', 'pathfinder_matched_cvs',
    'cvmatchen_ovning_progress', 'pf_saved_edu', 'pathfinder_job_diary'
  ];
  function userKey(baseKey) {
    const uid = window.authUserId;
    if (!uid) return baseKey + '::anon';
    return baseKey + '::' + uid;
  }
  // Override safeGet/safeSet för user-scoped nycklar
  const _origSafeGet = safeGet;
  const _origSafeSet = safeSet;
  const _origSafeRemove = safeRemove;
  safeGet = function(key) {
    if (USER_KEYS.indexOf(key) !== -1) {
      // Migrationsläge: om ingen användarscoped finns men gammal global gör det
      // → läs den globala MEN ENDAST om användaren just loggat in (engångsmigration)
      const scoped = _origSafeGet(userKey(key));
      if (scoped !== null) return scoped;
      // Om inget scoped finns → returnera null (INTE den globala — då skulle vi
      // läcka data mellan användare). Backend-load kommer skriva user-scoped.
      return null;
    }
    return _origSafeGet(key);
  };
  safeSet = function(key, val) {
    if (USER_KEYS.indexOf(key) !== -1) {
      return _origSafeSet(userKey(key), val);
    }
    return _origSafeSet(key, val);
  };
  safeRemove = function(key) {
    if (USER_KEYS.indexOf(key) !== -1) {
      return _origSafeRemove(userKey(key));
    }
    return _origSafeRemove(key);
  };
  // Rensa ALL user-scoped data (vid logout, kontoradering eller user-byte)
  function clearAllUserData() {
    try {
      // Rensa både user-scoped och eventuellt kvarvarande globala (gamla) nycklar
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(k => {
        // Ta bort alla user-scoped nycklar (innehåller '::')
        if (k.indexOf('::') !== -1) {
          const base = k.split('::')[0];
          if (USER_KEYS.indexOf(base) !== -1) localStorage.removeItem(k);
        }
        // Ta bort gamla globala nycklar som kan ligga kvar från före säkerhetsfixen
        if (USER_KEYS.indexOf(k) !== -1) localStorage.removeItem(k);
      });
    } catch(e) { console.warn('clearAllUserData fail:', e); }
  }
  window.clearAllUserData = clearAllUserData;

  function loadCV() {
    const raw = safeGet(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      cvData = Object.assign(createEmptyCV(), parsed);
      // Säkerställ arrays
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      // Normalisera språk: äldre data kan vara strings, vi vill ha {name,level}
      cvData.languages = cvData.languages.map(l => {
        if (typeof l === 'string') return { name: l, level: 'Flytande' };
        if (l && typeof l === 'object' && l.name) return { name: l.name, level: l.level || 'Flytande' };
        return null;
      }).filter(Boolean);
      // Auto-sortera jobb och utbildning kronologiskt (nyaste/pågående överst)
      if (typeof sortJobsByDate === 'function') sortJobsByDate();
      if (typeof sortEducationByDate === 'function') sortEducationByDate();
    } catch(e) {
      console.error('Kunde inte ladda CV', e);
    }
  }

  function saveCVLocal() {
    safeSet(STORAGE_KEY, JSON.stringify(cvData));
  }

  function loadTrainingProgress() {
    const raw = safeGet(TRAINING_PROGRESS_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw); } catch(e) { return {}; }
  }

  function saveTrainingProgress() {
    safeSet(TRAINING_PROGRESS_KEY, JSON.stringify(trainingProgress));
  }

  // ============================================================
  // AUTH (OTP-flöde — speglar mobilen)
  // ============================================================
  let authCurrentEmail = '';

  function getAuth() {
    const raw = safeGet(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }

  // ───── TOKEN-REFRESH (håller sessionen vid liv månadsvis) ─────
  // Returnerar uppdaterat accessToken (från refresh om nödvändigt), eller null vid fel.
  let _refreshInFlight = null; // dedupe: samtidiga anrop delar samma refresh
  async function ensureFreshToken() {
    const auth = getAuth();
    if (!auth || !auth.accessToken) return null;

    // Ingen expiry-info → anta att token fortfarande är giltig (backward-compat)
    if (!auth.expiresAt) return auth.accessToken;

    // Giltig med marginal (> 5 min kvar)? Återanvänd
    const now = Date.now();
    const FIVE_MIN = 5 * 60 * 1000;
    if (auth.expiresAt - now > FIVE_MIN) return auth.accessToken;

    // Nära utgång eller utgången → försök refresh
    if (!auth.refreshToken) {
      // Ingen refresh_token = sessionen är pre-nivå3, behöver re-login
      await handleAuthExpired();
      return null;
    }
    // Dedupe: om refresh redan pågår, vänta på den
    if (_refreshInFlight) return _refreshInFlight;

    _refreshInFlight = (async () => {
      try {
        const r = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'refresh_token', refreshToken: auth.refreshToken })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok || !data.access_token) throw new Error(data.error || 'refresh failed');
        // Uppdatera lagring
        const expiresIn = data.expires_in || 3600;
        const updated = Object.assign({}, auth, {
          accessToken: data.access_token,
          refreshToken: data.refresh_token || auth.refreshToken,
          expiresAt: Date.now() + (expiresIn * 1000)
        });
        safeSet(AUTH_STORAGE_KEY, JSON.stringify(updated));
        window.authAccessToken = data.access_token;
        return data.access_token;
      } catch(e) {
        console.warn('Token refresh failed:', e);
        await handleAuthExpired();
        return null;
      } finally {
        _refreshInFlight = null;
      }
    })();
    return _refreshInFlight;
  }
  window.ensureFreshToken = ensureFreshToken;

  // ───── SESSIONEN HAR GÅTT UT — re-login flow ─────
  async function handleAuthExpired() {
    // Rensa auth men behåll CV-data (användaren vill ju bara logga in igen)
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(e) {}
    window.authUserId = null;
    window.authAccessToken = null;
    toast('Sessionen har gått ut — logga in igen', 'error');
    setTimeout(() => showAuthOverlay(), 100);
  }
  window.handleAuthExpired = handleAuthExpired;

  // ───── MAGIC LINK-REDIRECT HANDLER ─────
  // När användare klickar magic link hamnar de på /?#access_token=...&refresh_token=...
  // Parsa, logga in, städa URL.
  async function handleMagicLinkRedirect() {
    if (!window.location.hash) return false;
    const hash = window.location.hash.substring(1); // ta bort '#'
    if (!hash.includes('access_token=')) return false;
    const params = new URLSearchParams(hash);
    const accessToken  = params.get('access_token');
    const refreshToken = params.get('refresh_token') || '';
    const expiresIn    = parseInt(params.get('expires_in') || '3600', 10);
    const error        = params.get('error_description');

    if (error) {
      toast('Inloggning misslyckades: ' + error, 'error');
      // Städa URL så inget känsligt ligger kvar
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return false;
    }
    if (!accessToken) return false;

    // Hämta user-info från Supabase så vi vet vilken email/userId det är
    showAiLoader('Loggar in...', 'Verifierar magic link');
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_user', accessToken })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.user || !data.user.email) throw new Error(data.error || 'ogiltig länk');
      const email = data.user.email;
      const userId = data.user.id;
      // Rensa URL-hashen innan vi loggar in (säkerhet + rent utseende)
      history.replaceState(null, '', window.location.pathname + window.location.search);
      hideAiLoader();
      await authSetLoggedIn(email, false, userId, accessToken, refreshToken, expiresIn);
      return true;
    } catch(e) {
      hideAiLoader();
      console.error('Magic link fail:', e);
      toast('Kunde inte logga in via magic link — pröva OTP istället', 'error');
      history.replaceState(null, '', window.location.pathname + window.location.search);
      return false;
    }
  }
  window.handleMagicLinkRedirect = handleMagicLinkRedirect;

  function showAuthOverlay() {
    const o = document.getElementById('loginOverlay');
    if (o) o.classList.remove('hidden');
    // Återställ till steg 1
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    const s1 = document.getElementById('authStep1');
    if (s1) s1.classList.add('active');
  }
  function hideAuthOverlay() {
    const o = document.getElementById('loginOverlay');
    if (o) o.classList.add('hidden');
  }

  function checkAuth() {
    const auth = getAuth();
    if (!auth || !auth.email) {
      showAuthOverlay();
      return false;
    }
    hideAuthOverlay();
    const sbName = document.getElementById('sbUserName');
    if (sbName) sbName.textContent = auth.email;
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = auth.email;
    window.authUserId = auth.userId || null;
    window.authAccessToken = auth.accessToken || null;
    authCurrentEmail = auth.email;

    // Synka från molnet i bakgrunden — sbCall auto-refreshar token om nära expiry
    if (auth.userId && auth.accessToken) {
      loadAllFromSupabase(auth.userId, auth.accessToken).catch(() => {});
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }
    return true;
  }

  // ── STEG 1 → STEG 2: skicka OTP-kod ───────────────────────
  window.authSendOtp = async function() {
    const input = document.getElementById('authEmail');
    const email = (input && input.value || '').trim().toLowerCase();
    const errEl = document.getElementById('authStep1Error');
    if (errEl) errEl.classList.remove('visible');

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      if (errEl) {
        errEl.textContent = 'Ange en giltig e-postadress.';
        errEl.classList.add('visible');
      }
      return;
    }

    const btn = document.getElementById('authSendBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span>Skickar...';
    }

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_otp', email })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Något gick fel');

      authCurrentEmail = email;
      const disp = document.getElementById('authEmailDisplay');
      if (disp) disp.textContent = email;

      // Gå till steg 2
      document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
      document.getElementById('authStep2').classList.add('active');
      // Fokusera första kodrutan
      setTimeout(() => {
        const first = document.querySelector('.code-digit');
        if (first) first.focus();
      }, 200);

    } catch(e) {
      if (errEl) {
        errEl.textContent = e.message || 'Något gick fel, försök igen.';
        errEl.classList.add('visible');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Skicka kod till min e-post';
      }
    }
  };

  // ── Kodinputs: tangent/input/paste ─────────────────────────
  window.codeKeydown = function(e, idx) {
    const digits = document.querySelectorAll('.code-digit');
    if (e.key === 'Backspace' && !digits[idx].value && idx > 0) {
      digits[idx - 1].focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) digits[idx - 1].focus();
    if (e.key === 'ArrowRight' && idx < 5) digits[idx + 1].focus();
    if (e.key === 'Enter') {
      const full = Array.from(digits).map(d => d.value).join('');
      if (full.length === 6) window.authVerifyCode();
    }
  };

  window.codeInput = function(e, idx) {
    const digits = document.querySelectorAll('.code-digit');
    const val = e.target.value.replace(/\D/g, '');
    e.target.value = val.slice(-1);
    if (val) {
      e.target.classList.add('filled');
      if (idx < 5) digits[idx + 1].focus();
      const full = Array.from(digits).map(d => d.value).join('');
      if (full.length === 6) window.authVerifyCode();
    } else {
      e.target.classList.remove('filled');
    }
  };

  window.codePaste = function(e) {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const digits = document.querySelectorAll('.code-digit');
    pasted.split('').forEach((ch, i) => {
      if (digits[i]) { digits[i].value = ch; digits[i].classList.add('filled'); }
    });
    const nextEmpty = Array.from(digits).findIndex(d => !d.value);
    if (nextEmpty >= 0) digits[nextEmpty].focus(); else digits[5].focus();
    if (pasted.length === 6) setTimeout(() => window.authVerifyCode(), 100);
  };

  // ── STEG 2 → verifiera kod ─────────────────────────────────
  window.authVerifyCode = async function() {
    const digits = document.querySelectorAll('.code-digit');
    const entered = Array.from(digits).map(d => d.value).join('');
    const errEl = document.getElementById('authStep2Error');
    if (errEl) errEl.classList.remove('visible');

    if (entered.length < 6) {
      if (errEl) {
        errEl.textContent = 'Ange alla 6 siffror.';
        errEl.classList.add('visible');
      }
      return;
    }

    const btn = document.getElementById('authVerifyBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="auth-spinner"></span>Verifierar...';
    }

    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_otp', email: authCurrentEmail, token: entered })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Felaktig kod');

      const userId = (data.user && data.user.id) || '';
      const accessToken = data.access_token || '';
      const refreshToken = data.refresh_token || '';
      const expiresIn = data.expires_in || 3600; // Supabase default 1h
      // Mobilen sätter isNew=true vid verify_otp → visar onboarding-steg
      authSetLoggedIn(authCurrentEmail, true, userId, accessToken, refreshToken, expiresIn);

    } catch(e) {
      if (errEl) {
        errEl.textContent = e.message || 'Felaktig eller utgången kod. Försök igen.';
        errEl.classList.add('visible');
      }
      // Skaka kodfälten
      const ci = document.getElementById('codeInputs');
      if (ci) { ci.style.animation = 'none'; setTimeout(() => { ci.style.animation = ''; }, 100); }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = 'Verifiera kod';
      }
    }
  };

  // ── Spara login-state + ladda från moln innan onboarding-beslut ─
  async function authSetLoggedIn(email, isNew, userId, accessToken, refreshToken, expiresIn) {
    // SÄKERHETSFIX: om en annan user-id loggar in än senast → rensa all data
    // för att undvika att se föregående persons CV
    try {
      const prevAuthRaw = _origSafeGet(AUTH_STORAGE_KEY);
      if (prevAuthRaw) {
        const prevAuth = JSON.parse(prevAuthRaw);
        if (prevAuth && prevAuth.userId && prevAuth.userId !== userId) {
          console.log('[security] User-byte detekterad — rensar föregående users data');
          clearAllUserData();
          // Återställ in-memory state till tomt
          cvData = createEmptyCV();
          trainingProgress = {};
        }
      }
    } catch(e) { console.warn('User-switch check fail:', e); }

    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : null;
    safeSet(AUTH_STORAGE_KEY, JSON.stringify({
      email: email,
      loggedIn: true,
      userId: userId || null,
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      expiresAt: expiresAt,
      createdAt: Date.now()
    }));
    window.authUserId = userId || null;
    window.authAccessToken = accessToken || null;
    authCurrentEmail = email;
    logEvent('login');

    const sbName = document.getElementById('sbUserName');
    if (sbName) sbName.textContent = email;
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = email;

    // Försök ladda befintliga data från molnet INNAN vi beslutar onboarding.
    // Gör att användare inte behöver fylla i namn igen i inkognito / ny enhet.
    let hasCloudData = false;
    if (userId && accessToken) {
      showAiLoader('Hämtar din data...', 'Synkar CV från molnet');
      try {
        hasCloudData = await loadAllFromSupabase(userId, accessToken);
      } catch(e) {
        console.error('loadAll failed:', e);
      }
      hideAiLoader();
      // Hämta tilldelade uppgifter i bakgrunden (silent)
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }

    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));

    // Ny användare = inkomna från verify_otp OCH inget namn lokalt/moln
    const needsOnboarding = isNew && !cvData.name && !hasCloudData;

    if (needsOnboarding) {
      const onbEmail = document.getElementById('onbEmail');
      if (onbEmail) onbEmail.textContent = email;
      const s4 = document.getElementById('authStep4');
      if (s4) s4.classList.add('active');
    } else {
      const wel = document.getElementById('authWelcomeText');
      if (wel) wel.textContent = 'Du är inloggad som ' + email;
      const s3 = document.getElementById('authStep3');
      if (s3) s3.classList.add('active');
    }
  }

  // ───── CENTRAL API-HELPER: auto-refresh + 401-handling ─────
  // Använd denna för alla /api/supabase-anrop som behöver auth
  async function sbCall(body) {
    // Steg 1: säkerställ fräscht token
    const token = await ensureFreshToken();
    if (!token) return { error: 'not_authenticated' };

    // Backend läser access_token från Authorization-header (Bearer).
    // Vi behåller även accessToken i body för bakåtkompatibilitet.
    const mergedBody = Object.assign({}, body, { accessToken: token });

    // Steg 2: gör anropet
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(mergedBody)
      });
      // 401 = token invalid → tvinga re-login
      if (r.status === 401) {
        await handleAuthExpired();
        return { error: 'unauthorized' };
      }
      const result = await r.json().catch(() => ({}));
      // Supabase kan också returnera ok=200 med result.error='unauthorized'
      if (result && result.error && String(result.error).toLowerCase().includes('unauthoriz')) {
        await handleAuthExpired();
      }
      return result || {};
    } catch(e) {
      console.warn('sbCall fail:', e);
      return { error: 'network' };
    }
  }
  window.sbCall = sbCall;

  // Ladda all användardata från Supabase — matchar mobilens loadAllFromSupabase
  async function loadAllFromSupabase(userId, accessToken) {
    try {
      // Använd sbCall så vi får auto-refresh gratis (accessToken-param ignoreras,
      // sbCall tar senaste token från getAuth)
      const result = await sbCall({ action: 'load_all', userId });
      if (!result || result.error) return false;

      let foundSomething = false;

      // CV-huvuddata
      if (result.cv && typeof result.cv === 'object') {
        cvData = Object.assign(createEmptyCV(), result.cv);
        ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
          if (!Array.isArray(cvData[k])) cvData[k] = [];
        });
        saveCVLocal();
        if (typeof loadCVIntoForm === 'function') loadCVIntoForm();
        if (typeof renderJobs === 'function') renderJobs();
        if (typeof renderEducation === 'function') renderEducation();
        if (typeof renderSkillsChips === 'function') renderSkillsChips();
        if (typeof renderLanguages === 'function') renderLanguages();
        if (typeof renderLicenses === 'function') renderLicenses();
        if (typeof renderPreview === 'function') renderPreview();
        if (typeof renderHejView === 'function') renderHejView();
        if (cvData.name) foundSomething = true;
      }

      // Sparade CV:n
      if (Array.isArray(result.savedCvs)) {
        safeSet(SAVED_CVS_KEY, JSON.stringify(result.savedCvs));
      }
      // Matchade CV:n
      if (Array.isArray(result.matchedCvs)) {
        safeSet(MATCHED_CVS_KEY, JSON.stringify(result.matchedCvs));
      }
      // Övningsprogress
      if (result.progress && typeof result.progress === 'object') {
        safeSet(TRAINING_PROGRESS_KEY, JSON.stringify(result.progress));
        trainingProgress = result.progress;
      }
      // Sparade utbildningar
      if (Array.isArray(result.savedEdu)) {
        safeSet('pf_saved_edu', JSON.stringify(result.savedEdu));
      }
      // Jobbdagbok
      if (Array.isArray(result.jobDiary)) {
        safeSet('pathfinder_job_diary', JSON.stringify(result.jobDiary));
      }

      return foundSomething;
    } catch(e) {
      console.error('loadAllFromSupabase error:', e);
      return false;
    }
  }

  window.authEnterApp = function() {
    hideAuthOverlay();
    toast('✅ Välkommen tillbaka!');
    // Rendera om aktuell vy
    if (currentView === 'profil') renderProfilView();
  };

  window.authCompleteOnboarding = function() {
    const firstName = (document.getElementById('onbFirstName').value || '').trim();
    const lastName  = (document.getElementById('onbLastName').value  || '').trim();
    const phone     = (document.getElementById('onbPhone').value     || '').trim();
    const email     = authCurrentEmail || '';
    const errEl     = document.getElementById('onbErr');

    if (!firstName) {
      errEl.textContent = 'Förnamn krävs.';
      errEl.classList.add('visible');
      return;
    }
    if (!lastName) {
      errEl.textContent = 'Efternamn krävs.';
      errEl.classList.add('visible');
      return;
    }

    cvData.name = (firstName + ' ' + lastName).trim();
    if (phone) cvData.phone = phone;
    if (email) cvData.email = email;
    saveCVLocal();

    // Synka med desktop-CV-fält
    const f = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    f('cv-name',  cvData.name);
    f('cv-email', email);
    f('cv-phone', phone);

    renderPreview();
    if (typeof renderHejView === 'function') renderHejView();
    hideAuthOverlay();
    toast('✅ Välkommen ' + firstName + '!');
    switchView('cv');
  };

  window.authGoBack = function() {
    document.querySelectorAll('.auth-step').forEach(s => s.classList.remove('active'));
    document.getElementById('authStep1').classList.add('active');
    document.querySelectorAll('.code-digit').forEach(d => {
      d.value = '';
      d.classList.remove('filled');
    });
  };

  window.authLoginMicrosoft = function() {
    const input = document.getElementById('authEmail');
    const email = input ? input.value.trim() : '';
    const url = email
      ? '/api/v1/auth/microsoft?e=' + encodeURIComponent(email)
      : '/api/v1/auth/microsoft';
    window.location.href = url;
  };

  // Bakåtkompat: om något i app.js fortfarande råkar kalla dessa
  window.loginMagicLink = window.authSendOtp;
  window.loginMicrosoft = window.authLoginMicrosoft;

  window.logout = function() {
    if (!confirm('Logga ut?')) return;
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(e) {}
    // SÄKERHETSFIX: rensa ALL CV-data så nästa person inte ser den föregåendes
    try { clearAllUserData(); } catch(e) {}
    window.location.reload();
  };

  // ── Microsoft OAuth callback (läser ?ms_token=... / ?ms_error=... ur URL) ──
  function checkMicrosoftCallback() {
    const params = new URLSearchParams(window.location.search);
    const msToken = params.get('ms_token');
    const msError = params.get('ms_error');
    const msInfo  = params.get('ms_info');

    function cleanUrl() {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (msError) {
      const errorMessages = {
        'cancelled': 'Inloggningen avbröts.',
        'unauthorized': msInfo
          ? 'Emailen ' + msInfo + ' är inte registrerad som handläggare. Kontakta support.'
          : 'Din email är inte registrerad som handläggare.',
        'invalid_state': 'Säkerhetsfel vid inloggning. Försök igen.',
        'token_exchange_failed': 'Kunde inte verifiera Microsoft-inloggning. Försök igen.',
        'graph_failed': 'Kunde inte hämta din profilinfo från Microsoft. Försök igen.',
        'no_email': 'Din Microsoft-profil har ingen email. Kontakta IT-support.',
        'config_missing': 'Serverkonfiguration saknas. Kontakta administratör.',
        'admin_check_failed': 'Kunde inte verifiera behörighet. Försök igen.',
        'missing_code': 'Ofullständig inloggning från Microsoft. Försök igen.',
        'ms_error': 'Microsoft returnerade ett fel. Försök igen.',
        'unexpected': 'Ett oväntat fel inträffade. Försök igen.'
      };
      const msg = errorMessages[msError] || ('Inloggningsfel: ' + msError);
      cleanUrl();
      showAuthOverlay();
      const errEl = document.getElementById('authStep1Error');
      if (errEl) {
        errEl.textContent = msg;
        errEl.classList.add('visible');
      }
      return false;
    }

    if (msToken) {
      try {
        const parts = msToken.split('.');
        if (parts.length !== 2) throw new Error('Invalid token format');
        let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const payload = JSON.parse(atob(b64));

        // SÄKERHETSFIX: detektera user-byte
        try {
          const prevAuthRaw = _origSafeGet(AUTH_STORAGE_KEY);
          if (prevAuthRaw) {
            const prevAuth = JSON.parse(prevAuthRaw);
            if (prevAuth && prevAuth.email && prevAuth.email !== payload.email) {
              console.log('[security] User-byte (MS OAuth) — rensar föregående users data');
              clearAllUserData();
              cvData = createEmptyCV();
              trainingProgress = {};
            }
          }
        } catch(_) {}

        safeSet(AUTH_STORAGE_KEY, JSON.stringify({
          email: payload.email,
          name: payload.name,
          role: payload.role,
          loggedIn: true,
          accessToken: msToken,
          loginMethod: 'microsoft',
          createdAt: Date.now(),
          expiresAt: payload.expiresAt
        }));
        window.authAccessToken = msToken;
        window.authUserEmail = payload.email;
        authCurrentEmail = payload.email;

        cleanUrl();
        hideAuthOverlay();
        const sbName = document.getElementById('sbUserName');
        if (sbName) sbName.textContent = payload.email;
        const pfEmail = document.getElementById('pfUserEmail');
        if (pfEmail) pfEmail.textContent = payload.email;
        logEvent('login');
        toast('✅ Inloggad som ' + payload.email);
        return true;
      } catch(e) {
        console.error('Microsoft token parse failed:', e);
        cleanUrl();
      }
    }
    return false;
  }

  // ============================================================
  // ACTIVITY LOG
  // ============================================================
  function logEvent(eventType, metadata) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;
    // Använd sbCall så token auto-refreshas vid expiry (annars failar logging
    // tyst när token gått ut, vilket gör analytics opålitlig)
    sbCall({
      action: 'log_event',
      userId: auth.userId,
      event_type: eventType,
      metadata: metadata || {}
    }).catch(() => {});
  }

  // ============================================================
  // TOAST
  // ============================================================
  function toast(msg, type) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = type === 'error' ? 'show error' : 'show';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = ''; }, 3500);
  }

  // ============================================================
  // AI LOADER
  // ============================================================
  function showAiLoader(title, sub) {
    document.getElementById('aiLoaderTitle').textContent = title || 'Laddar...';
    document.getElementById('aiLoaderSub').textContent = sub || '';
    document.getElementById('aiLoader').classList.add('show');
  }
  function hideAiLoader() {
    document.getElementById('aiLoader').classList.remove('show');
  }

  // ============================================================
  // AI-CACHE — sparar AI-svar i localStorage så samma input
  // (t.ex. "lagerarbetare" → kompetenser) inte triggar nytt API-anrop.
  // Portad från mobilen för att minska kostnader och ge snabbare UX.
  // ============================================================
  const AI_CACHE_KEY = 'pf_ai_cache';
  const AI_CACHE_MAX = 50; // Max antal sparade svar — äldsta rensas automatiskt

  function aiCacheGet(key) {
    try {
      const cache = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || '{}');
      return cache[key] || null;
    } catch(e) { return null; }
  }

  function aiCacheSet(key, value) {
    try {
      const cache = JSON.parse(localStorage.getItem(AI_CACHE_KEY) || '{}');
      cache[key] = value;
      // Rensa äldsta posten om vi når taket (FIFO)
      const keys = Object.keys(cache);
      if (keys.length > AI_CACHE_MAX) {
        delete cache[keys[0]];
      }
      localStorage.setItem(AI_CACHE_KEY, JSON.stringify(cache));
    } catch(e) {}
  }

  function aiCacheKey(...parts) {
    return parts.filter(Boolean).join('|').toLowerCase().trim();
  }

  // ============================================================
  // SETTINGS
  // ============================================================
  window.openSettings = function() {
    // apiKeyInput är borttagen — AI går via backend-proxy, inte egen nyckel
    const keyInput = document.getElementById('apiKeyInput');
    if (keyInput) keyInput.value = safeGet(API_KEY_STORAGE) || '';
    document.getElementById('settingsModal').classList.add('open');
  };
  window.closeSettings = function() {
    document.getElementById('settingsModal').classList.remove('open');
  };
  window.saveApiKey = function() {
    // Legacy stub — API-nyckel används inte längre (backend hanterar AI)
    const keyInput = document.getElementById('apiKeyInput');
    if (keyInput) {
      const key = keyInput.value.trim();
      if (key) safeSet(API_KEY_STORAGE, key);
    }
    closeSettings();
  };
  function getApiKey() {
    return safeGet(API_KEY_STORAGE) || '';
  }

  // ============================================================
  // VIEW SWITCHING
  // ============================================================
  window.switchView = function(view) {
    // ALIAS: 'intervju' och 'train' → 'ovningar' (numera "Träna"-fliken som rymmer båda)
    let openIntervju = false;
    if (view === 'intervju') {
      openIntervju = true;
      view = 'ovningar';
    } else if (view === 'train') {
      view = 'ovningar';
    }

    // Städa upp ev. pågående intervju-session när vi lämnar intervju-vyn
    if (currentView === 'intervju' && view !== 'intervju' && typeof window.ivCleanup === 'function') {
      try { window.ivCleanup(); } catch(e) {}
    }

    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    const tabEl = document.querySelector('.sb-tab[data-view="' + view + '"]');
    if (tabEl) tabEl.classList.add('active');

    if (view === 'hej') {
      renderHejView();
    }
    if (view === 'cv') {
      cvSwitchStep(currentStep);
      renderPreview();
      // Om användaren har sparade CV:n: visa picker så de kan välja vilket
      // de vill öppna, ta bort eller starta nytt — exakt som mobilen
      const savedList = pfGetSaved();
      if (savedList.length > 0 && !window._cvPickerSeenThisVisit) {
        window._cvPickerSeenThisVisit = true;
        setTimeout(() => cvShowPicker(), 100);
      }
    }
    // Reset picker-flagg när man lämnar CV-vyn så den dyker upp igen nästa gång
    if (view !== 'cv') {
      window._cvPickerSeenThisVisit = false;
    }
    if (view === 'matcha') {
      if (typeof renderMatchaView === 'function') renderMatchaView();
    }
    if (view === 'aisyv') {
      // Alltid börja på AI-SYV startsidan (inte fastna i tidigare chat)
      if (typeof window.showHome === 'function') {
        try { window.showHome(); } catch(e) { console.warn('AI-SYV showHome fail:', e); }
      }
      if (typeof window.syvUpdateSavedBtn === 'function') {
        try { window.syvUpdateSavedBtn(); } catch(e) {}
      }
    }
    if (view === 'ovningar') {
      // "Träna"-vyn — innehåller hub med Övningar + Intervjuträning + Uppgifter
      if (openIntervju) {
        // Användaren klickade på en intervju-länk eller liknande shortcut
        currentTrainCat = 'intervju';
        renderTrainingHome();
        if (typeof window.ivInit === 'function') {
          setTimeout(() => { try { window.ivInit(); } catch(e) {} }, 50);
        }
      } else {
        currentTrainCat = null;
        renderTrainingHome();
      }
      if (typeof loadMyTasks === 'function') loadMyTasks(true);
    }
    if (view === 'profil') {
      renderProfilView();
    }
  };

  // ============================================================
  // HEJ-VYN: personlig hälsning
  // ============================================================
  function renderHejView() {
    const el = document.getElementById('hejGreet');
    if (!el) return;
    const name = (cvData && cvData.name ? String(cvData.name).trim() : '');
    if (name) {
      const firstName = name.split(/\s+/)[0];
      el.textContent = 'Hej ' + firstName + ' 👋';
      el.style.display = 'block';
    } else {
      el.textContent = '';
      el.style.display = 'none';
    }
  }

  // ============================================================
  // CV: STEP SWITCHING
  // ============================================================
  window.cvSwitchStep = function(step) {
    currentStep = step;
    document.querySelectorAll('.cv-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.cv-step-content').forEach(c => c.style.display = 'none');
    const stepBtn = document.querySelector('.cv-step[data-step="' + step + '"]');
    if (stepBtn) stepBtn.classList.add('active');
    const stepContent = document.getElementById('step-' + step);
    if (stepContent) stepContent.style.display = 'block';

    // Göm preview på alla steg utom Visa — edit-panelen tar då hela bredden
    const layout = document.querySelector('#view-cv .cv-layout');
    if (layout) {
      layout.classList.toggle('preview-hidden', step !== 'visa');
    }

    // Render step-specific content
    if (step === 'profil') { if (typeof syncPhotoUI === 'function') syncPhotoUI(); }
    if (step === 'jobb') { renderJobs(); renderEducation(); }
    if (step === 'mer')  {
      renderSkillsChips(); renderLanguages(); renderLicenses();
      if (typeof renderCerts === 'function') renderCerts();
      if (typeof renderRefs === 'function')  renderRefs();
    }
    if (step === 'visa') { renderTemplates(); }

    renderPreview();
    markStepDone(step);
    updateStepNav();

    // Skrolla upp till toppen av edit-panelen
    const panel = document.querySelector('.cv-edit-panel');
    if (panel) panel.scrollTop = 0;
    // Skrolla även vyn till toppen
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const CV_STEP_ORDER = ['profil', 'jobb', 'mer', 'text', 'visa'];

  window.cvStepBack = function() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    if (i > 0) cvSwitchStep(CV_STEP_ORDER[i - 1]);
  };
  window.cvStepNext = function() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    if (i >= 0 && i < CV_STEP_ORDER.length - 1) cvSwitchStep(CV_STEP_ORDER[i + 1]);
  };

  function updateStepNav() {
    const i = CV_STEP_ORDER.indexOf(currentStep);
    const backBtn = document.getElementById('cvStepNavBack');
    const nextBtn = document.getElementById('cvStepNavNext');
    const nav = document.getElementById('cvStepNav');
    if (backBtn) {
      const hasPrev = i > 0;
      backBtn.style.display = hasPrev ? '' : 'none';
      const prev = hasPrev ? CV_STEP_ORDER[i - 1] : '';
      const labels = { profil:'Profil', jobb:'Jobb & Utb', mer:'Mer', text:'Text', visa:'Visa' };
      backBtn.textContent = prev ? '← ' + labels[prev] : '← Tillbaka';
    }
    if (nextBtn) {
      const hasNext = (i >= 0 && i < CV_STEP_ORDER.length - 1);
      // Dölj helt på sista steget (Visa) istället för disabled
      nextBtn.style.display = hasNext ? '' : 'none';
      const next = hasNext ? CV_STEP_ORDER[i + 1] : '';
      const labels = { profil:'Profil', jobb:'Jobb & Utb', mer:'Mer', text:'Text', visa:'Visa' };
      nextBtn.textContent = next ? labels[next] + ' →' : 'Nästa →';
    }
    // Om både är dolda → dölj hela navigationsraden
    if (nav) {
      const anyVisible = (backBtn && backBtn.style.display !== 'none') || (nextBtn && nextBtn.style.display !== 'none');
      nav.style.display = anyVisible ? '' : 'none';
      // På sista steget: om bara tillbaka syns, centrera den vänster
      nav.style.justifyContent = (nextBtn && nextBtn.style.display === 'none') ? 'flex-start' : 'space-between';
    }
  }

  function markStepDone(step) {
    // En enkel "done"-indikator: profilen är ifylld om name+title finns
    const done = {
      profil: !!(cvData.name && cvData.title),
      jobb:   cvData.jobs.length > 0 || cvData.education.length > 0,
      mer:    cvData.skills.length > 0,
      text:   !!cvData.summary,
      visa:   !!cvData.template,
    };
    Object.keys(done).forEach(s => {
      const btn = document.querySelector('.cv-step[data-step="' + s + '"]');
      if (!btn) return;
      btn.classList.toggle('done', done[s] && currentStep !== s);
    });
  }

  // ============================================================
  // CV: FIELD UPDATE
  // ============================================================
  window.cvUpdate = function(field, value) {
    cvData[field] = value;
    saveCVLocal();
    renderPreview();
    markStepDone(currentStep);
    // Debounce auto-save till Supabase
    clearTimeout(_saveDebounce);
    _saveDebounce = setTimeout(() => {
      // Bara auto-spara om CV redan har varit sparat
      // (annars triggar varje knapptryck en spara)
    }, 3000);
  };

  function loadCVIntoForm() {
    document.getElementById('cv-name').value    = cvData.name    || '';
    document.getElementById('cv-title').value   = cvData.title   || '';
    document.getElementById('cv-email').value   = cvData.email   || '';
    document.getElementById('cv-phone').value   = cvData.phone   || '';
    document.getElementById('cv-summary').value = cvData.summary || '';
    // Säkerställ arrays som kan saknas i äldre data
    if (!Array.isArray(cvData.certifications)) cvData.certifications = [];
    if (!Array.isArray(cvData.references))     cvData.references     = [];
    // Synka foto/cert/ref-UI om de finns
    if (typeof syncPhotoUI === 'function') syncPhotoUI();
    if (typeof renderCerts === 'function') renderCerts();
    if (typeof renderRefs  === 'function') renderRefs();
  }

  // ============================================================
  // CV: JOBS & EDUCATION
  // ============================================================
  function renderJobs() {
    const list = document.getElementById('jobsList');
    if (!cvData.jobs.length) {
      list.innerHTML = '<div class="empty">Inga jobb tillagda än</div>';
      return;
    }
    list.innerHTML = cvData.jobs.map((j, i) => {
      const period = formatJobPeriod(j) || ((j.startYear || '') + '–' + (j.endYear || 'nu'));
      const loc = j.location ? ' · ' + escape(j.location) : '';
      const descs = [j.desc1, j.desc2, j.desc3].filter(Boolean);
      const descHtml = descs.length
        ? `<div class="item-card-desc">${descs.map(d => '• ' + escape(d)).join('<br>')}</div>`
        : (j.desc ? `<div class="item-card-desc">${escape(j.desc)}</div>` : '');
      return `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(j.title || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(j.company || '')} · ${escape(period)}${loc}</div>
          ${descHtml}
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditJob(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteJob(${i})" title="Ta bort">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderEducation() {
    const list = document.getElementById('eduList');
    if (!cvData.education.length) {
      list.innerHTML = '<div class="empty">Ingen utbildning tillagd än</div>';
      return;
    }
    list.innerHTML = cvData.education.map((e, i) => {
      const from = formatPeriod(e.startMonth, e.startYear);
      const to = (e.ongoing || e.endYear === 'Pågående' || e.endYear === 'nu') ? 'nu' : formatPeriod(e.endMonth, e.endYear);
      const period = (from || to) ? (from || '') + '–' + (to || '') : '';
      const school = e.schoolName || e.school || '';
      const form = e.schoolForm ? ' · ' + escape(e.schoolForm) : '';
      return `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(e.degree || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(school)}${period ? ' · ' + escape(period) : ''}${form}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditEdu(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteEdu(${i})" title="Ta bort">✕</button>
        </div>
      </div>`;
    }).join('');
  }

  // ============================================================
  // CV: JOBB — riktig modal matchande mobilen
  // ============================================================
  const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

  // Fyll år-dropdowns (40 år tillbaka + 10 framåt)
  function populateYearDropdowns() {
    const now = new Date().getFullYear();
    const options = ['<option value="">År</option>'];
    for (let y = now + 5; y >= now - 50; y--) {
      options.push(`<option value="${y}">${y}</option>`);
    }
    const html = options.join('');
    ['jobStartYear','jobEndYear','eduStartYear','eduEndYear'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  }

  window.cvAddJob = function() { openJobModal(); };
  window.cvEditJob = function(i) { openJobModal(i); };

  window.cvDeleteJob = function(i) {
    if (!confirm('Ta bort detta jobb?')) return;
    cvData.jobs.splice(i, 1);
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
  };

  window.openJobModal = function(idx) {
    populateYearDropdowns();
    const modal = document.getElementById('jobModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('jobModalTitle').textContent = isEdit ? 'Redigera arbetslivserfarenhet' : 'Lägg till arbetslivserfarenhet';

    // Visa befintliga jobb ovanför formuläret — bara vid "Lägg till" när det redan finns jobb
    const existingBox = document.getElementById('jobModalExisting');
    const existingList = document.getElementById('jobModalExistingList');
    if (existingBox && existingList) {
      const otherJobs = (cvData.jobs || []).filter((_, i) => i !== idx);
      if (otherJobs.length > 0) {
        existingList.innerHTML = otherJobs.map(j => {
          const period = formatJobPeriod(j) || '(ingen period)';
          const label = (j.title || '(ingen titel)') + (j.company ? ' · ' + j.company : '');
          return '<div style="display:flex; justify-content:space-between; gap:10px; font-size:12px; color:rgba(255,255,255,0.75);">' +
            '<span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escape(label) + '</span>' +
            '<span style="color:var(--accent2); font-weight:600; flex-shrink:0;">' + escape(period) + '</span>' +
          '</div>';
        }).join('');
        existingBox.style.display = 'block';
      } else {
        existingBox.style.display = 'none';
      }
    }

    const e = isEdit ? (cvData.jobs[idx] || {}) : {};

    document.getElementById('jobTitle').value    = e.title    || '';
    document.getElementById('jobCompany').value  = e.company  || '';
    document.getElementById('jobLocation').value = e.location || '';

    document.getElementById('jobStartMonth').value = e.startMonth || '';
    document.getElementById('jobStartYear').value  = e.startYear  || '';

    // Pågående: backward-compat med 'nu' / 'Pågående' / ongoing:true
    const ongoing = (e.ongoing === true || e.endYear === 'nu' || e.endYear === 'Pågående');
    document.getElementById('jobOngoing').checked = !!ongoing;
    document.getElementById('jobEndMonth').value = ongoing ? '' : (e.endMonth || '');
    document.getElementById('jobEndYear').value  = ongoing ? '' : (e.endYear  || '');
    toggleJobOngoing(document.getElementById('jobOngoing'));

    // Arbetsuppgifter (backward-compat: gammal data kan ha bara `desc`)
    const desc1 = e.desc1 != null ? e.desc1 : (e.desc ? String(e.desc).split('\n')[0] || '' : '');
    const desc2 = e.desc2 != null ? e.desc2 : (e.desc ? String(e.desc).split('\n')[1] || '' : '');
    const desc3 = e.desc3 != null ? e.desc3 : (e.desc ? String(e.desc).split('\n')[2] || '' : '');
    document.getElementById('jobDesc1').value = desc1;
    document.getElementById('jobDesc2').value = desc2;
    document.getElementById('jobDesc3').value = desc3;

    modal.classList.add('open');
    setTimeout(() => document.getElementById('jobTitle').focus(), 100);
  };

  window.closeJobModal = function() {
    document.getElementById('jobModal').classList.remove('open');
  };

  window.toggleJobOngoing = function(cb) {
    const m = document.getElementById('jobEndMonth');
    const y = document.getElementById('jobEndYear');
    if (cb.checked) {
      m.value = ''; y.value = '';
      m.disabled = true; y.disabled = true;
      m.style.opacity = '0.4'; y.style.opacity = '0.4';
    } else {
      m.disabled = false; y.disabled = false;
      m.style.opacity = '1'; y.style.opacity = '1';
    }
  };

  window.clearJobDesc = function() {
    document.getElementById('jobDesc1').value = '';
    document.getElementById('jobDesc2').value = '';
    document.getElementById('jobDesc3').value = '';
  };

  window.saveJobFromModal = function() {
    const title      = document.getElementById('jobTitle').value.trim();
    const company    = document.getElementById('jobCompany').value.trim();
    const location   = document.getElementById('jobLocation').value.trim();
    const startMonth = document.getElementById('jobStartMonth').value;
    const startYear  = document.getElementById('jobStartYear').value;
    const ongoing    = document.getElementById('jobOngoing').checked;
    const endMonth   = ongoing ? '' : document.getElementById('jobEndMonth').value;
    const endYear    = ongoing ? 'Pågående' : document.getElementById('jobEndYear').value;
    const desc1      = document.getElementById('jobDesc1').value.trim();
    const desc2      = document.getElementById('jobDesc2').value.trim();
    const desc3      = document.getElementById('jobDesc3').value.trim();

    if (!title)   { toast('Fyll i jobbtitel', 'error'); document.getElementById('jobTitle').focus(); return; }
    if (!company) { toast('Fyll i företag',   'error'); document.getElementById('jobCompany').focus(); return; }

    const job = {
      title, company, location,
      startMonth, startYear,
      endMonth, endYear,
      ongoing,
      desc1, desc2, desc3
    };

    const idx = parseInt(document.getElementById('jobModal').dataset.editIdx);
    if (idx >= 0 && cvData.jobs[idx]) {
      cvData.jobs[idx] = job;
    } else {
      cvData.jobs.push(job);
    }
    sortJobsByDate();
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
    closeJobModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Arbetslivserfarenhet sparad'));
  };

  // ── AI Autofyll för arbetsuppgifter (matchar mobilens aiAutofillJobDesc) ──
  window.aiAutofillJobDesc = async function() {
    const title    = document.getElementById('jobTitle').value.trim();
    const company  = document.getElementById('jobCompany').value.trim();
    const location = document.getElementById('jobLocation').value.trim();
    const startY   = document.getElementById('jobStartYear').value.trim();
    const endY     = document.getElementById('jobEndYear').value.trim();

    if (!title) {
      toast('⚠️ Skriv in en jobbtitel först', 'error');
      return;
    }

    // Räkna dubbletter med samma titel → AI ska generera unika meningar
    const existingWithSameTitle = (cvData.jobs || []).filter(j =>
      j.title && j.title.toLowerCase().trim() === title.toLowerCase().trim()
    );
    const duplicateCount = existingWithSameTitle.length;
    const allExistingTasks = (cvData.jobs || [])
      .flatMap(j => [j.desc1, j.desc2, j.desc3].filter(Boolean));

    const periodStr = startY ? (startY + (endY ? '–' + endY : '–nu')) : '';

    const uniquenessInstruction = duplicateCount > 0
      ? `OBS: Det finns redan ${duplicateCount} jobb med titeln "${title}". Arbetsuppgifterna MÅSTE vara helt annorlunda. Fokusera på ${company ? company + ':s specifika miljö' : 'en annan aspekt av rollen'}.`
      : '';

    const forbiddenList = allExistingTasks.length > 0
      ? '\n\nFöljande meningar finns REDAN — använd INTE dessa eller liknande:\n' +
        allExistingTasks.map((t, i) => (i+1) + '. ' + t).join('\n')
      : '';

    const prompt = [
      'Skriv 3 korta, konkreta arbetsuppgiftsmeningar på svenska för:',
      'Titel: ' + title,
      company  ? 'Arbetsgivare: ' + company  : '',
      location ? 'Ort: ' + location          : '',
      periodStr ? 'Period: ' + periodStr     : '',
      uniquenessInstruction,
      forbiddenList,
      '',
      'Regler:',
      '- Varje mening unik och specifik för denna arbetsplats',
      '- Börja varje mening med ett starkt verb (Ansvarade, Ledde, Utvecklade, Samordnade)',
      '- Inga generiska fraser',
      '- Svenska, professionell ton',
      '',
      'Svara BARA med JSON: {"arbetsuppgifter": ["mening1", "mening2", "mening3"]}'
    ].filter(Boolean).join('\n');

    const btn = document.getElementById('jobAutofillBtn');
    const originalText = btn ? btn.textContent : '';

    // ── Cache-check: samma titel + bolag + period + duplicate-count → samma uppgifter ──
    // OBS: vi inkluderar duplicateCount så att cachen INTE återanvänds när
    // användaren har flera jobb med samma titel (då vill vi ha unika svar varje gång).
    const jobCacheKey = aiCacheKey('job', title, company, periodStr, String(duplicateCount));
    const cachedTasks = aiCacheGet(jobCacheKey);
    if (cachedTasks && Array.isArray(cachedTasks) && cachedTasks.length >= 1) {
      if (cachedTasks[0]) document.getElementById('jobDesc1').value = cachedTasks[0];
      if (cachedTasks[1]) document.getElementById('jobDesc2').value = cachedTasks[1];
      if (cachedTasks[2]) document.getElementById('jobDesc3').value = cachedTasks[2];
      toast('⚡ Arbetsuppgifter från cache');
      logEvent('ai_cv_analysis', { context: 'job_autofill', source: 'cache' });
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = '⏳ AI genererar...'; }
    showAiLoader('Genererar arbetsuppgifter...', 'AI skriver unika meningar');

    // Helper: försök med given modell, returnera parsed.arbetsuppgifter eller kasta fel
    async function tryModel(modelName) {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) {
        let errBody = '';
        try { errBody = await response.text(); } catch(_) {}
        throw new Error('HTTP ' + response.status + (errBody ? ' — ' + errBody.slice(0, 200) : ''));
      }
      const data = await response.json();
      // Kombinera all text från svaret (kan vara fler text-block)
      const rawText = (data.content || [])
        .filter(b => b && b.type === 'text' && typeof b.text === 'string')
        .map(b => b.text)
        .join('\n')
        .trim()
        .replace(/```json|```/g, '')
        .trim();
      if (!rawText) throw new Error('AI svarade utan text');

      // Försök parsa direkt — om det misslyckas, hitta första {…}-blocket i svaret
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch(e) {
        const m = rawText.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('AI svarade i fel format (ingen JSON hittades)');
        parsed = JSON.parse(m[0]);
      }
      const tasks = parsed && Array.isArray(parsed.arbetsuppgifter) ? parsed.arbetsuppgifter : [];
      if (!tasks.length) throw new Error('AI returnerade en tom lista');
      return tasks;
    }

    try {
      let tasks;
      let modelUsed = 'claude-sonnet-4-6';
      try {
        tasks = await tryModel('claude-sonnet-4-6');
      } catch(sonnetErr) {
        // Fallback till Haiku 4.5 om Sonnet misslyckas (rate-limit, modell ej tillgänglig osv)
        console.warn('[ai-autofill] Sonnet failed, trying Haiku:', sonnetErr.message);
        modelUsed = 'claude-haiku-4-5-20251001';
        tasks = await tryModel('claude-haiku-4-5-20251001');
      }

      if (tasks[0]) document.getElementById('jobDesc1').value = tasks[0];
      if (tasks[1]) document.getElementById('jobDesc2').value = tasks[1];
      if (tasks[2]) document.getElementById('jobDesc3').value = tasks[2];

      // Spara i cache för framtida anrop med samma titel/bolag/period
      aiCacheSet(jobCacheKey, tasks);

      hideAiLoader();
      toast('✨ AI-förslag klara!');
      logEvent('ai_cv_analysis', { context: 'job_autofill', model: modelUsed });
    } catch(e) {
      hideAiLoader();
      console.error('[ai-autofill] Båda modellerna misslyckades:', e);
      // Tydligare felmeddelande till användaren
      const msg = (e.message || '').toLowerCase();
      if (msg.includes('http 404') || msg.includes('http 405')) {
        toast('AI-tjänsten är inte tillgänglig just nu. Skriv in arbetsuppgifterna manuellt.', 'error');
      } else if (msg.includes('http 401') || msg.includes('http 403')) {
        toast('Du är utloggad. Logga in igen för att använda AI-funktioner.', 'error');
      } else if (msg.includes('http 429')) {
        toast('AI är överbelastad just nu. Vänta en stund och försök igen.', 'error');
      } else if (msg.includes('fel format') || msg.includes('tom lista')) {
        toast('AI gav ett oväntat svar. Försök igen — det brukar funka 2:a gången.', 'error');
      } else {
        toast('AI-fel: ' + (e.message || 'okänt fel'), 'error');
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = originalText || '✨ AI Autofyll'; }
    }
  };

  // ============================================================
  // CV: UTBILDNING — riktig modal matchande mobilen
  // ============================================================
  window.cvAddEdu = function() { openEduModal(); };
  window.cvEditEdu = function(i) { openEduModal(i); };

  window.cvDeleteEdu = function(i) {
    if (!confirm('Ta bort denna utbildning?')) return;
    cvData.education.splice(i, 1);
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
  };

  window.openEduModal = function(idx) {
    populateYearDropdowns();
    const modal = document.getElementById('eduModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('eduModalTitle').textContent = isEdit ? 'Redigera utbildning' : 'Lägg till utbildning';

    const e = isEdit ? (cvData.education[idx] || {}) : {};
    document.getElementById('eduDegree').value     = e.degree     || '';
    document.getElementById('eduSchoolName').value = e.schoolName || e.school || '';
    document.getElementById('eduSchoolForm').value = e.schoolForm || '';
    document.getElementById('eduStartMonth').value = e.startMonth || '';
    document.getElementById('eduStartYear').value  = e.startYear  || '';

    const ongoing = (e.ongoing === true || e.endYear === 'Pågående' || e.endYear === 'nu');
    document.getElementById('eduOngoing').checked = !!ongoing;
    document.getElementById('eduEndMonth').value = ongoing ? '' : (e.endMonth || '');
    document.getElementById('eduEndYear').value  = ongoing ? '' : (e.endYear  || '');
    toggleEduOngoing(document.getElementById('eduOngoing'));

    modal.classList.add('open');
    setTimeout(() => document.getElementById('eduDegree').focus(), 100);
  };

  window.closeEduModal = function() {
    document.getElementById('eduModal').classList.remove('open');
  };

  window.toggleEduOngoing = function(cb) {
    const m = document.getElementById('eduEndMonth');
    const y = document.getElementById('eduEndYear');
    if (cb.checked) {
      m.value = ''; y.value = '';
      m.disabled = true; y.disabled = true;
      m.style.opacity = '0.4'; y.style.opacity = '0.4';
    } else {
      m.disabled = false; y.disabled = false;
      m.style.opacity = '1'; y.style.opacity = '1';
    }
  };

  window.saveEduFromModal = function() {
    const degree     = document.getElementById('eduDegree').value.trim();
    const schoolName = document.getElementById('eduSchoolName').value.trim();
    const schoolForm = document.getElementById('eduSchoolForm').value;
    const startMonth = document.getElementById('eduStartMonth').value;
    const startYear  = document.getElementById('eduStartYear').value;
    const ongoing    = document.getElementById('eduOngoing').checked;
    const endMonth   = ongoing ? '' : document.getElementById('eduEndMonth').value;
    const endYear    = ongoing ? 'Pågående' : document.getElementById('eduEndYear').value;

    if (!degree)     { toast('Fyll i examen/utbildning', 'error'); document.getElementById('eduDegree').focus(); return; }
    if (!schoolName) { toast('Fyll i skola',             'error'); document.getElementById('eduSchoolName').focus(); return; }

    const edu = {
      degree,
      schoolName,
      school: schoolName, // alias för backward-compat med preview
      schoolForm,
      startMonth, startYear,
      endMonth, endYear,
      ongoing
    };

    const idx = parseInt(document.getElementById('eduModal').dataset.editIdx);
    if (idx >= 0 && cvData.education[idx]) {
      cvData.education[idx] = edu;
    } else {
      cvData.education.push(edu);
    }
    sortEducationByDate();
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
    closeEduModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Utbildning sparad'));
  };

  // Stäng modal vid klick på backdrop
  // Bakåtkompat: backdrop-click stänger INTE modalen — endast Spara/Avbryt/Escape.
  // (tidigare fanns en click-handler som stängde vid klick utanför, men det förstörde UX)

  // Escape-tangent stänger öppen modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.edit-modal.open').forEach(m => m.classList.remove('open'));
    }
  });

  // Hjälpare: formatera period för visning
  function formatPeriod(month, year) {
    if (!year) return '';
    return month ? (month + ' ' + year) : year;
  }
  function formatJobPeriod(j) {
    const from = formatPeriod(j.startMonth, j.startYear);
    const toYear = (j.ongoing || j.endYear === 'Pågående' || j.endYear === 'nu') ? 'nu' : (j.endYear || '');
    const toMonth = (j.ongoing || j.endYear === 'Pågående' || j.endYear === 'nu') ? '' : (j.endMonth || '');
    const to = (toYear === 'nu') ? 'nu' : formatPeriod(toMonth, toYear);
    if (!from && !to) return '';
    return (from || '') + ' – ' + (to || '');
  }
  window.formatJobPeriod = formatJobPeriod;

  // ============================================================
  // KRONOLOGISK SORTERING — nyaste/pågående överst
  // ============================================================
  const MONTH_MAP = { Jan:1, Feb:2, Mar:3, Apr:4, Maj:5, Jun:6, Jul:7, Aug:8, Sep:9, Okt:10, Nov:11, Dec:12 };

  // Returnerar en numerisk "sort-vikt" där högre = nyare
  // Pågående/ongoing jobb = Infinity (hamnar alltid överst)
  function entryEndWeight(e) {
    if (!e) return 0;
    const isOngoing = (e.ongoing === true || e.endYear === 'Pågående' || e.endYear === 'nu' || !e.endYear);
    if (isOngoing) return Infinity;
    const y = parseInt(e.endYear, 10) || 0;
    const m = MONTH_MAP[e.endMonth] || 0;
    return y * 100 + m;
  }
  // Fallback om två har samma slutdatum → sortera på start (nyaste start först)
  function entryStartWeight(e) {
    if (!e) return 0;
    const y = parseInt(e.startYear, 10) || 0;
    const m = MONTH_MAP[e.startMonth] || 0;
    return y * 100 + m;
  }

  function sortJobsByDate() {
    if (!Array.isArray(cvData.jobs)) return;
    cvData.jobs.sort((a, b) => {
      const ae = entryEndWeight(a), be = entryEndWeight(b);
      if (ae !== be) return be - ae;            // senast avslutat överst
      return entryStartWeight(b) - entryStartWeight(a); // tie: senaste start överst
    });
  }
  function sortEducationByDate() {
    if (!Array.isArray(cvData.education)) return;
    cvData.education.sort((a, b) => {
      const ae = entryEndWeight(a), be = entryEndWeight(b);
      if (ae !== be) return be - ae;
      return entryStartWeight(b) - entryStartWeight(a);
    });
  }
  window.sortJobsByDate = sortJobsByDate;
  window.sortEducationByDate = sortEducationByDate;

  // ============================================================
  // PROFILBILD
  // ============================================================
  window.handlePhotoUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Filstorleks-kontroll (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast('Bilden är för stor (max 5MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      cvData.photoData = e.target.result;
      const img = document.getElementById('profilePhoto');
      const ph  = document.getElementById('photoPreviewPlaceholder');
      img.src = cvData.photoData;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
      const removeBtn = document.getElementById('removePhotoBtn');
      if (removeBtn) removeBtn.disabled = false;
      saveCVLocal();
      renderPreview();
      toast('✅ Profilbild sparad');
    };
    reader.readAsDataURL(file);
  };

  window.removeProfilePhoto = function() {
    cvData.photoData = null;
    const img = document.getElementById('profilePhoto');
    const ph  = document.getElementById('photoPreviewPlaceholder');
    const upload = document.getElementById('photoUpload');
    if (img) { img.src = ''; img.style.display = 'none'; }
    if (ph)  ph.style.display = '';
    if (upload) upload.value = '';
    const removeBtn = document.getElementById('removePhotoBtn');
    if (removeBtn) removeBtn.disabled = true;
    saveCVLocal();
    renderPreview();
    toast('🗑️ Profilbild borttagen');
  };

  window.setShowPhoto = function(show) {
    cvData.showPhoto = !!show;
    const yes = document.getElementById('photoYesBtn');
    const no  = document.getElementById('photoNoBtn');
    const sec = document.getElementById('photoUploadSection');
    if (yes) yes.classList.toggle('active', !!show);
    if (no)  no.classList.toggle('active', !show);
    if (sec) sec.style.display = show ? 'block' : 'none';
    saveCVLocal();
    renderPreview();
  };

  function syncPhotoUI() {
    // Kör när cvData laddats in (form init eller moln-synk)
    const show = cvData.showPhoto === true;
    const yes = document.getElementById('photoYesBtn');
    const no  = document.getElementById('photoNoBtn');
    const sec = document.getElementById('photoUploadSection');
    if (yes) yes.classList.toggle('active', show);
    if (no)  no.classList.toggle('active', !show);
    if (sec) sec.style.display = show ? 'block' : 'none';

    const img = document.getElementById('profilePhoto');
    const ph  = document.getElementById('photoPreviewPlaceholder');
    const removeBtn = document.getElementById('removePhotoBtn');
    if (cvData.photoData) {
      if (img) { img.src = cvData.photoData; img.style.display = 'block'; }
      if (ph)  ph.style.display = 'none';
      if (removeBtn) removeBtn.disabled = false;
    } else {
      if (img) { img.src = ''; img.style.display = 'none'; }
      if (ph)  ph.style.display = '';
      if (removeBtn) removeBtn.disabled = true;
    }
  }
  window.syncPhotoUI = syncPhotoUI;

  // ============================================================
  // CERTIFIKAT
  // ============================================================
  window.openCertModal = function(idx) {
    const modal = document.getElementById('certModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('certModalTitle').textContent = isEdit ? 'Redigera certifikat' : 'Lägg till certifikat';

    const c = isEdit ? (cvData.certifications[idx] || {}) : {};
    document.getElementById('certName').value   = c.name   || '';
    document.getElementById('certIssuer').value = c.issuer || '';
    document.getElementById('certDate').value   = c.date   || '';

    modal.classList.add('open');
    setTimeout(() => document.getElementById('certName').focus(), 100);
  };

  window.closeCertModal = function() {
    document.getElementById('certModal').classList.remove('open');
  };

  window.saveCertFromModal = function() {
    const name   = document.getElementById('certName').value.trim();
    const issuer = document.getElementById('certIssuer').value.trim();
    const date   = document.getElementById('certDate').value.trim();

    if (!name)   { toast('Fyll i certifikatets namn', 'error'); document.getElementById('certName').focus(); return; }
    if (!issuer) { toast('Fyll i utfärdare',         'error'); document.getElementById('certIssuer').focus(); return; }

    const cert = { name, issuer, date };
    const idx = parseInt(document.getElementById('certModal').dataset.editIdx);
    if (!Array.isArray(cvData.certifications)) cvData.certifications = [];
    if (idx >= 0 && cvData.certifications[idx]) {
      cvData.certifications[idx] = cert;
    } else {
      cvData.certifications.push(cert);
    }
    saveCVLocal();
    renderCerts();
    renderPreview();
    closeCertModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Certifikat sparat'));
  };

  window.cvDeleteCert = function(i) {
    if (!confirm('Ta bort detta certifikat?')) return;
    cvData.certifications.splice(i, 1);
    saveCVLocal();
    renderCerts();
    renderPreview();
  };

  function renderCerts() {
    const list = document.getElementById('certsList');
    if (!list) return;
    if (!Array.isArray(cvData.certifications) || !cvData.certifications.length) {
      list.innerHTML = '<div class="empty">Inga certifikat tillagda än</div>';
      return;
    }
    list.innerHTML = cvData.certifications.map((c, i) => `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(c.name || 'Utan namn')}</div>
          <div class="item-card-meta">${escape(c.issuer || '')}${c.date ? ' · ' + escape(c.date) : ''}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="openCertModal(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteCert(${i})" title="Ta bort">✕</button>
        </div>
      </div>`).join('');
  }
  window.renderCerts = renderCerts;

  // ============================================================
  // REFERENSER
  // ============================================================
  window.openRefModal = function(idx) {
    const modal = document.getElementById('refModal');
    const isEdit = (typeof idx === 'number' && idx >= 0);
    modal.dataset.editIdx = isEdit ? String(idx) : '-1';
    document.getElementById('refModalTitle').textContent = isEdit ? 'Redigera referens' : 'Lägg till referens';

    const r = isEdit ? (cvData.references[idx] || {}) : {};
    document.getElementById('refName').value  = r.name  || '';
    document.getElementById('refTitle').value = r.title || '';
    document.getElementById('refEmail').value = r.email || '';
    document.getElementById('refPhone').value = r.phone || '';

    modal.classList.add('open');
    setTimeout(() => document.getElementById('refName').focus(), 100);
  };

  window.closeRefModal = function() {
    document.getElementById('refModal').classList.remove('open');
  };

  window.saveRefFromModal = function() {
    const name  = document.getElementById('refName').value.trim();
    const title = document.getElementById('refTitle').value.trim();
    const email = document.getElementById('refEmail').value.trim();
    const phone = document.getElementById('refPhone').value.trim();

    if (!name)  { toast('Fyll i namn',  'error'); document.getElementById('refName').focus(); return; }
    if (!title) { toast('Fyll i titel', 'error'); document.getElementById('refTitle').focus(); return; }

    const ref = { name, title, email, phone };
    const idx = parseInt(document.getElementById('refModal').dataset.editIdx);
    if (!Array.isArray(cvData.references)) cvData.references = [];
    if (idx >= 0 && cvData.references[idx]) {
      cvData.references[idx] = ref;
    } else {
      cvData.references.push(ref);
    }
    // Om man lägger till en referens, slå automatiskt av "på begäran"
    if (cvData.refOnRequest) {
      // Om användaren lägger till riktig referens, stäng av "på begäran" automatiskt
      cvData.refOnRequest = false;
    }
    saveCVLocal();
    renderRefs();
    renderPreview();
    closeRefModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Referens sparad'));
  };

  window.cvDeleteRef = function(i) {
    if (!confirm('Ta bort denna referens?')) return;
    cvData.references.splice(i, 1);
    saveCVLocal();
    renderRefs();
    renderPreview();
  };

  window.toggleRefOnRequest = function() {
    cvData.refOnRequest = !cvData.refOnRequest;
    saveCVLocal();
    renderRefs();
    renderPreview();
    toast(cvData.refOnRequest ? '✅ Referenser lämnas på begäran' : 'Borttagen', cvData.refOnRequest ? 'success' : 'info');
  };

  window.removeRefOnRequest = function() {
    cvData.refOnRequest = false;
    saveCVLocal();
    renderRefs();
    renderPreview();
  };

  function renderRefs() {
    const list = document.getElementById('refsList');
    if (!list) return;

    // Uppdatera knappens active-state
    const btn = document.getElementById('refOnRequestBtn');
    if (btn) {
      if (cvData.refOnRequest) {
        btn.classList.add('active');
        btn.textContent = '✓ På begäran';
      } else {
        btn.classList.remove('active');
        btn.textContent = '+ På begäran';
      }
    }

    let html = '';

    // Visa "Referenser lämnas på begäran" som ett eget kort (matchar mobilen)
    if (cvData.refOnRequest) {
      html += '<div class="ref-on-request-card">' +
        '<div class="ref-on-request-card-text">✨ Referenser lämnas på begäran</div>' +
        '<button class="icon-btn danger" onclick="removeRefOnRequest()" title="Ta bort">✕</button>' +
      '</div>';
    }

    // Faktiska referenser (kan existera samtidigt som "på begäran")
    if (Array.isArray(cvData.references) && cvData.references.length) {
      html += cvData.references.map((r, i) => {
        const contact = [r.email, r.phone].filter(Boolean).join(' · ');
        return '<div class="item-card">' +
          '<div class="item-card-body">' +
            '<div class="item-card-title">' + escape(r.name || 'Utan namn') + '</div>' +
            '<div class="item-card-meta">' + escape(r.title || '') + (contact ? ' · ' + escape(contact) : '') + '</div>' +
          '</div>' +
          '<div class="item-actions">' +
            '<button class="icon-btn" onclick="openRefModal(' + i + ')" title="Redigera">✎</button>' +
            '<button class="icon-btn danger" onclick="cvDeleteRef(' + i + ')" title="Ta bort">✕</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Tom state
    if (!html) {
      html = '<div class="empty">Inga referenser tillagda än</div>';
    }

    list.innerHTML = html;
  }
  window.renderRefs = renderRefs;

  // ============================================================
  // UPPGIFTER FRÅN HANDLÄGGARE (Supabase tasks)
  // Hämtar via action='my_tasks', visar i Profil + Övningar
  // ============================================================
  let assignedTasks = [];        // Senaste hämtade uppgifter
  let taskTimers = {};           // taskId → {startedAt, intervalId, elapsedSec}
  let tasksLoadedOnce = false;

  function tasksActive()    { return assignedTasks.filter(t => t.status === 'active');    }
  function tasksPending()   { return assignedTasks.filter(t => t.status === 'pending');   }
  function tasksOpen()      { return assignedTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled'); }
  function tasksCompleted() { return assignedTasks.filter(t => t.status === 'completed'); }

  // Ladda mina uppgifter från Supabase
  async function loadMyTasks(silent) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      assignedTasks = [];
      updateTaskBadges();
      return;
    }
    try {
      // Använd sbCall så token auto-refreshas vid expiry
      const data = await sbCall({
        action: 'my_tasks',
        userId: auth.userId
      });
      if (!data || data.error) {
        // Fail tyst — kan vara att backend saknar action
        assignedTasks = [];
        updateTaskBadges();
        return;
      }
      assignedTasks = Array.isArray(data.data) ? data.data : [];
      tasksLoadedOnce = true;
      updateTaskBadges();
      // Re-render om användaren just nu tittar på en av vyerna
      if (currentView === 'profil') renderTasksInProfil();
      if (currentView === 'ovningar' && !currentTrainCat && typeof renderTrainingHome === 'function') {
        renderTrainingHome();
      }
      if (currentView === 'ovningar' && currentTrainCat === 'uppg') {
        renderTasksCategoryView();
      }
    } catch(e) {
      console.error('Kunde inte hämta uppgifter:', e);
      if (!silent) toast('Kunde inte hämta uppgifter', 'error');
    }
  }
  window.loadMyTasks = loadMyTasks;

  function updateTaskBadges() {
    const openCount = tasksOpen().length;
    const ovBadge = document.getElementById('sbOvningarBadge');
    const pfBadge = document.getElementById('sbProfilBadge');
    [ovBadge, pfBadge].forEach(el => {
      if (!el) return;
      if (openCount > 0) {
        el.textContent = String(openCount);
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    });
  }

  // ── Formatering av deadlines ──────────────────────────────
  function formatDeadline(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    const ms = d.getTime() - now.getTime();
    const days = Math.round(ms / (24 * 3600 * 1000));
    const isOver = ms < 0;
    let text;
    if (isOver) {
      const overDays = Math.abs(days);
      text = overDays === 0 ? 'Deadline idag (försenad)' : (overDays + ' dagar försenad');
    } else if (days === 0) {
      text = 'Deadline idag';
    } else if (days === 1) {
      text = 'Deadline imorgon';
    } else if (days <= 7) {
      text = 'Deadline om ' + days + ' dagar';
    } else {
      text = 'Deadline ' + d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return { text, isOver, soon: !isOver && days <= 3 };
  }

  function formatTime(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    return (h > 0 ? h + ':' : '') + pad(m) + ':' + pad(s);
  }

  // ── Render: uppgiftskort ──────────────────────────────────
  function buildTaskCard(task) {
    const isDone = task.status === 'completed';
    const isActive = task.status === 'active';
    const isOngoing = !!taskTimers[task.id];
    const dl = formatDeadline(task.deadline);
    const overdue = dl && dl.isOver && !isDone;

    let classes = 'task-card';
    if (isDone) classes += ' done';
    if (overdue) classes += ' overdue';

    const type = task.type || 'manual';
    const typeLabel = type === 'timed' ? '⏱ Tidsuppgift' : type === 'auto' ? '✓ Auto' : '📝 Manuell';

    const dlCls  = overdue ? 'over' : (dl && dl.soon ? 'soon' : '');
    const dlHtml = dl ? `<span class="task-deadline ${dlCls}">📅 ${escape(dl.text)}</span>` : '';

    // Progress för tidsuppgift
    let progressHtml = '';
    if (type === 'timed' && task.duration_minutes) {
      const targetSec = task.duration_minutes * 60;
      const spentSec  = (task.time_spent_sec || 0) + ((isOngoing && taskTimers[task.id]) ? taskTimers[task.id].elapsedSec : 0);
      const pct = Math.min(100, Math.round((spentSec / targetSec) * 100));
      progressHtml = `
        <div class="task-progress"><div class="task-progress-fill" style="width:${pct}%;"></div></div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:4px;">
          ${formatTime(spentSec)} / ${task.duration_minutes} min (${pct}%)
        </div>`;
    }

    // Actions
    let actions = '';
    if (!isDone) {
      if (type === 'timed') {
        if (isOngoing) {
          actions = `
            <button class="task-btn active" onclick="stopTaskSession('${escape(String(task.id))}')">
              ⏸ Pausa session
            </button>
            <span class="task-timer" id="taskTimer_${escape(String(task.id))}">${formatTime(taskTimers[task.id].elapsedSec)}</span>`;
        } else {
          actions = `
            <button class="task-btn primary" onclick="startTaskSession('${escape(String(task.id))}')">
              ▶ Starta session
            </button>
            <button class="task-btn secondary" onclick="completeTask('${escape(String(task.id))}')">
              ✓ Markera klar
            </button>`;
        }
      } else {
        actions = `
          <button class="task-btn primary" onclick="completeTask('${escape(String(task.id))}')">
            ✓ Markera som slutförd
          </button>`;
      }
    } else {
      const completedAt = task.completed_at ? new Date(task.completed_at).toLocaleDateString('sv-SE') : '';
      actions = `<span style="font-size:11px;color:var(--accent2);font-weight:700;">✅ Slutförd ${completedAt ? escape(completedAt) : ''}</span>`;
    }

    return `
      <div class="${classes}" data-task-id="${escape(String(task.id))}">
        <div class="task-check">${isDone ? '✓' : ''}</div>
        <div class="task-body">
          <div class="task-title">${escape(task.title || 'Uppgift')}</div>
          ${task.description ? `<div class="task-desc">${escape(task.description)}</div>` : ''}
          <div class="task-meta">
            <span class="task-tag ${type}">${typeLabel}</span>
            ${task.category ? `<span class="task-tag">${escape(task.category)}</span>` : ''}
            ${dlHtml}
          </div>
          ${progressHtml}
          <div class="task-actions">${actions}</div>
        </div>
      </div>`;
  }

  // ── Render: Profil-sektion ────────────────────────────────
  function renderTasksInProfil() {
    const list = document.getElementById('pfTasksList');
    const countEl = document.getElementById('pfTasksCount');
    if (!list) return;

    // ÄNDRAT: Uppgifter visas nu BARA i Träna-fliken (inte längre dubblat i Profil).
    // Vi visar istället en kortfattad genväg om det finns öppna uppgifter.
    const open = tasksOpen();
    const totalAssigned = assignedTasks.length;

    if (countEl) {
      countEl.textContent = String(open.length);
      countEl.classList.toggle('warn', open.length > 0);
    }

    if (open.length > 0) {
      list.innerHTML = `
        <div class="task-empty" style="background:rgba(240,192,64,0.08);border:1px solid rgba(240,192,64,0.3);position:relative;">
          ${open.length > 0 ? `<div style="position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-size:11px;font-weight:900;border-radius:12px;padding:2px 9px;">${open.length}</div>` : ''}
          <div class="task-empty-icon" style="color:#f0c040;">✅</div>
          <div style="font-size:13px;line-height:1.5;">
            Du har <b style="color:#f0c040;">${open.length}</b> ${open.length === 1 ? 'uppgift' : 'uppgifter'} från din handläggare.<br>
            <button onclick="switchView('ovningar')" style="margin-top:10px;padding:8px 14px;background:#f0c040;color:#0a1428;border:none;border-radius:8px;font-weight:700;font-size:12px;cursor:pointer;">Gå till Träna →</button>
          </div>
        </div>`;
    } else {
      list.innerHTML = `
        <div class="task-empty">
          <div class="task-empty-icon">✅</div>
          <div style="font-size:13px;line-height:1.5;">
            ${totalAssigned > 0 ? 'Alla uppgifter slutförda — bra jobbat!' : 'Du har inga uppgifter just nu.'}<br>
            <span style="font-size:11px;opacity:0.7;">Uppgifter från din handläggare visas under <b>Träna</b>.</span>
          </div>
        </div>`;
    }
  }
  window.renderTasksInProfil = renderTasksInProfil;

  // ── Render: Uppgifter-kategori i Övningar ─────────────────
  function renderTasksCategoryView() {
    document.getElementById('ov-home').style.display = 'block';
    document.getElementById('ov-detail').style.display = 'none';
    const grid = document.getElementById('ovGrid');
    if (!grid) return;

    const open = tasksOpen();
    const done = tasksCompleted();

    const header = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <button class="ov-back" onclick="trainBackToCats()" style="margin: 0;">← Alla kategorier</button>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">✅</span>
          <div>
            <div style="font-size: 17px; font-weight: 800; color: #fff;">Uppgifter från handläggare</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.45);">
              ${open.length} öppna · ${done.length} slutförda
            </div>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="loadMyTasks()" style="font-size:12px;">🔄 Uppdatera</button>
      </div>`;

    let body;
    if (!open.length && !done.length) {
      body = `
        <div style="grid-column: 1 / -1;">
          <div class="task-empty">
            <div class="task-empty-icon">✅</div>
            <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">Inga uppgifter just nu</div>
            <div style="font-size:12px;line-height:1.5;">
              När din handläggare tilldelar dig en uppgift dyker den upp här.
            </div>
          </div>
        </div>`;
    } else {
      body = '<div style="grid-column: 1 / -1;" class="task-list">';
      body += open.map(buildTaskCard).join('');
      if (done.length) {
        body += `<div style="font-size:11px;font-weight:800;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.35);margin:16px 0 8px;">Slutförda (${done.length})</div>`;
        body += done.slice(0, 10).map(buildTaskCard).join('');
      }
      body += '</div>';
    }

    grid.innerHTML = header + body;
  }
  window.renderTasksCategoryView = renderTasksCategoryView;

  // ── Åtgärder ──────────────────────────────────────────────
  window.startTaskSession = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      toast('Logga in först', 'error');
      return;
    }
    try {
      const result = await sbCall({
        action: 'start_task_session',
        userId: auth.userId,
        taskId: taskId
      });
      if (!result || result.error) throw new Error(result && result.error || 'Backend-fel');

      // Starta lokal timer för UI-feedback
      const startAt = Date.now();
      const task = assignedTasks.find(t => String(t.id) === String(taskId));
      const alreadySpent = (task && task.time_spent_sec) || 0;
      taskTimers[taskId] = {
        startedAt: startAt,
        elapsedSec: 0,
        intervalId: setInterval(() => {
          if (!taskTimers[taskId]) return;
          taskTimers[taskId].elapsedSec = Math.floor((Date.now() - taskTimers[taskId].startedAt) / 1000);
          const el = document.getElementById('taskTimer_' + taskId);
          if (el) el.textContent = formatTime(alreadySpent + taskTimers[taskId].elapsedSec);
        }, 1000)
      };
      toast('▶ Session startad');
      if (task) task.status = 'active';
      refreshTaskViews();
    } catch(e) {
      toast('Kunde inte starta session', 'error');
    }
  };

  window.stopTaskSession = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;

    const timer = taskTimers[taskId];
    if (timer && timer.intervalId) clearInterval(timer.intervalId);
    delete taskTimers[taskId];

    try {
      const data = await sbCall({
        action: 'stop_task_session',
        userId: auth.userId,
        taskId: taskId
      });
      if (!data || data.error) throw new Error(data && data.error || 'Backend-fel');

      if (data.completed) {
        toast('✅ Uppgift slutförd!');
      } else {
        toast('⏸ Session pausad — ' + formatTime(data.duration_sec) + ' loggad');
      }
      await loadMyTasks(true);
    } catch(e) {
      toast('Kunde inte pausa session', 'error');
    }
  };

  window.completeTask = async function(taskId) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;
    if (!confirm('Markera uppgiften som slutförd?')) return;

    // Stoppa eventuell timer
    const timer = taskTimers[taskId];
    if (timer && timer.intervalId) clearInterval(timer.intervalId);
    delete taskTimers[taskId];

    try {
      const result = await sbCall({
        action: 'complete_task',
        userId: auth.userId,
        taskId: taskId
      });
      if (!result || result.error) throw new Error(result && result.error || 'Backend-fel');
      toast('✅ Uppgift slutförd!');
      logEvent('task_completed', { task_id: taskId });
      await loadMyTasks(true);
    } catch(e) {
      toast('Kunde inte slutföra uppgift', 'error');
    }
  };

  function refreshTaskViews() {
    updateTaskBadges();
    if (currentView === 'profil') renderTasksInProfil();
    if (currentView === 'ovningar') {
      if (currentTrainCat === 'uppg') renderTasksCategoryView();
      else if (!currentTrainCat && typeof renderTrainingHome === 'function') renderTrainingHome();
    }
  }
  window.refreshTaskViews = refreshTaskViews;

  // ──────────────────────────────────────────────────────────

  // ============================================================
  // MATCHA — 3-stegs flow (Välj CV → Sök jobb → AI-matcha)
  // ============================================================
  let matchaCurrentStep    = 1;
  let matchaSelectedCvId   = null;          // id från pathfinder_saved_cvs, eller 'current' för pågående
  let matchaSelectedAds    = [];            // valda jobbannonser (max 3)
  let matchaSearchQ        = '';
  let matchaOrtFilter      = 'fam';          // default: Familjen Helsingborg + Helsingør (matchar mobile)
  let matchaTidFilter      = '';
  let matchaSearchOffset   = 0;
  let matchaSearchDebounceT = null;

  // Orter — samma struktur som mobile för konsistens
  const MATCHA_ORT = {
    hbg:        'Helsingborg',
    fam:        'Helsingborg Ängelholm Landskrona Höganäs Bjuv Åstorp Klippan Örkelljunga Perstorp Båstad',
    helsingör:  '',   // Dansk ort — kräver Jobnet.dk, Jobtech har inga DK-jobb
    angeholm:   'Ängelholm',
    landskrona: 'Landskrona',
    hoganas:    'Höganäs',
    bjuv:       'Bjuv',
    astorp:     'Åstorp',
    klippan:    'Klippan',
    skane:      'Skåne',
    sthlm:      'Stockholm',
    gbg:        'Göteborg',
    malmo:      'Malmö',
    all:        ''
  };
  // Visningsetiketter (vad som visas i resultatlistan)
  const MATCHA_ORT_LABEL = {
    hbg:        'Helsingborg',
    fam:        'Familjen Helsingborg',
    helsingör:  'Helsingør 🇩🇰',
    angeholm:   'Ängelholm',
    landskrona: 'Landskrona',
    hoganas:    'Höganäs',
    bjuv:       'Bjuv',
    astorp:     'Åstorp',
    klippan:    'Klippan',
    skane:      'Skåne',
    sthlm:      'Stockholm',
    gbg:        'Göteborg',
    malmo:      'Malmö',
    all:        'Hela Sverige'
  };

  // ── Entry point från switchView('matcha') ─────────────────
  function renderMatchaView() {
    // Återgå alltid till steg 1 vid intåg
    matchaSwitchStep(1);
    renderMatchaCvGrid();
  }
  window.renderMatchaView = renderMatchaView;

  // ── Stegnavigering ────────────────────────────────────────
  window.matchaSwitchStep = function(n) {
    // Validering
    if (n === 2 && !matchaSelectedCvId) {
      toast('Välj ett CV först', 'error');
      return;
    }
    if (n === 3 && matchaSelectedAds.length === 0) {
      toast('Välj minst en annons först', 'error');
      return;
    }

    matchaCurrentStep = n;
    document.querySelectorAll('.matcha-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.matcha-tab').forEach(t => t.classList.remove('active'));
    const stepEl = document.getElementById('matchaStep' + n);
    const tabEl  = document.getElementById('matchaTab' + n);
    if (stepEl) stepEl.classList.add('active');
    if (tabEl)  tabEl.classList.add('active');

    // Enable/disable tabs
    document.getElementById('matchaTab2').disabled = !matchaSelectedCvId;
    document.getElementById('matchaTab3').disabled = matchaSelectedAds.length === 0;

    if (n === 2) {
      updateMatchaStickyBar();
    }
    if (n === 3) {
      matchaRenderStep3Cards();
      // Uppdatera röd dagsgräns-banner
      if (typeof matchUpdateDagsBanner === 'function') {
        setTimeout(matchUpdateDagsBanner, 50);
      }
    }
  };

  // ── STEG 1: Välj CV ───────────────────────────────────────
  function renderMatchaCvGrid() {
    const grid = document.getElementById('matchaCvGrid');
    if (!grid) return;
    const saved = pfGetSaved();

    // Visa bara sparade CV (max 3) — matchar mobilens logik.
    // Inget separat "Pågående CV"-kort när det finns sparade alternativ,
    // då blir det 4 kort vilket är förvirrande.
    const cards = [];
    if (saved.length > 0) {
      saved.forEach(cv => {
        cards.push({
          id: cv.id,
          title: cv.title || 'Utan titel',
          meta: ((cv.data && cv.data.name) || '') + ' · sparat ' + (pfFormatDate(cv.savedAt) || ''),
          isCurrent: false
        });
      });
    } else if (cvData.name) {
      // Fallback: ingen sparade men det finns ett pågående CV
      cards.push({
        id: 'current',
        title: (cvData.title || 'Pågående CV'),
        meta: cvData.name + (cvData.jobs.length ? ' · ' + cvData.jobs.length + ' jobb' : '') + ' · ej sparat',
        isCurrent: true
      });
    }

    if (!cards.length) {
      grid.innerHTML = `
        <div class="pf-empty" style="grid-column: 1 / -1;">
          <div class="pf-empty-icon">📄</div>
          <div class="pf-empty-text">Du har inga CV:n ännu.<br>Bygg ett CV först så kan du matcha det mot jobb.</div>
          <button class="pf-empty-cta" onclick="switchView('cv')">Bygg ditt första CV →</button>
        </div>`;
      return;
    }

    grid.innerHTML = cards.map(c => `
      <div class="matcha-cv-card ${matchaSelectedCvId === c.id ? 'selected' : ''}"
           onclick="matchaSelectCv('${c.id}')">
        <div class="matcha-cv-card-title">${escape(c.title)}</div>
        <div class="matcha-cv-card-meta">${escape(c.meta)}</div>
      </div>`).join('');

    // Om inget är valt, välj första automatiskt
    if (!matchaSelectedCvId && cards.length > 0) {
      matchaSelectCv(cards[0].id);
    }
    // Om tidigare valt CV inte längre finns (t.ex. borttaget) → välj första
    else if (matchaSelectedCvId && !cards.find(c => c.id === matchaSelectedCvId)) {
      matchaSelectCv(cards[0].id);
    }
  }

  window.matchaSelectCv = function(id) {
    matchaSelectedCvId = id;
    renderMatchaCvGrid();
    document.getElementById('matchaToStep2Btn').disabled = false;
    document.getElementById('matchaTab2').disabled = false;
  };

  // Returnerar { name, title, summary, jobs, education, skills } för valt CV
  function matchaGetSelectedCVData() {
    if (matchaSelectedCvId === 'current') return cvData;
    const saved = pfGetSaved();
    const found = saved.find(c => c.id === matchaSelectedCvId);
    return (found && found.data) || cvData;
  }

  // ── STEG 2: Sök på Platsbanken/Jobtech ────────────────────
  window.matchaSetOrt = function(val) {
    matchaOrtFilter = val;
    if (matchaSearchQ) matchaDoSearch();
  };
  window.matchaSetTid = function(val) {
    matchaTidFilter = val;
    if (matchaSearchQ) matchaDoSearch();
  };

  window.matchaSearchDebounce = function() {
    clearTimeout(matchaSearchDebounceT);
    // Avaktivera CV-titel-knappen när användaren skriver egen sökterm
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.matcha-quick-chip').forEach(c => c.classList.remove('active'));
    matchaSearchDebounceT = setTimeout(matchaDoSearch, 350);
  };

  // ── Snabbsök via branschchip ──────────────────────────────
  window.matchaQuickSearch = function(query) {
    const input = document.getElementById('matchaSearch');
    if (!input) return;
    input.value = query;

    // Markera vald chip
    document.querySelectorAll('.matcha-quick-chip').forEach(chip => {
      chip.classList.remove('active');
      const chipQ = chip.getAttribute('onclick') || '';
      if (chipQ.includes("'" + query + "'")) chip.classList.add('active');
    });
    // Avaktivera CV-titel-knappen eftersom användaren valt annan strategi
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.remove('active'));

    if (query) {
      matchaDoSearch();
    } else {
      // Tom query = "Alla jobb" — sök brett på populära yrken
      input.value = 'jobb';
      matchaDoSearch();
    }
  };

  // ── Sök jobb som matchar CV-titeln ────────────────────────
  // PRIORITERINGSLOGIK:
  // 1. Pågående jobb (jobs där endY är tomt) — det är där användaren faktiskt jobbar nu
  // 2. Senaste avslutade jobb om inget pågår
  // 3. CV:ts huvudtitel (cvData.title) som sista fallback
  // Innan: sökte alltid på cvData.title vilket missar att användaren bytt yrke.
  window.matchaSearchByCvTitle = function() {
    const selectedCV = matchaGetSelectedCVData();
    if (!selectedCV) {
      toast('Välj ett CV först', 'error');
      return;
    }

    let title = '';
    let source = '';
    const jobs = Array.isArray(selectedCV.jobs) ? selectedCV.jobs : [];

    // 1. Pågående jobb (endY tomt eller "nu")
    const ongoing = jobs.find(j => j && j.title && (!j.endYear || /^(nu|pågår|present|now)$/i.test(String(j.endYear).trim())));
    if (ongoing) {
      title = ongoing.title.trim();
      source = 'pågående roll: ' + (ongoing.company ? ('"' + ongoing.title + '" på ' + ongoing.company) : ('"' + ongoing.title + '"'));
    }
    // 2. Senaste avslutade jobb (sortera efter startår)
    if (!title && jobs.length) {
      const sorted = jobs.slice().sort((a, b) => {
        const ay = parseInt(a.endYear || a.startYear || '0', 10);
        const by = parseInt(b.endYear || b.startYear || '0', 10);
        return by - ay;
      });
      const latest = sorted[0];
      if (latest && latest.title) {
        title = latest.title.trim();
        source = 'senaste roll: "' + latest.title + '"';
      }
    }
    // 3. CV-huvudtitel som sista fallback
    if (!title && selectedCV.title) {
      title = selectedCV.title.trim();
      source = 'CV-titel';
    }

    if (!title) {
      toast('Du har varken pågående jobb eller yrkestitel i CV:t. Fyll i på CV-fliken först.', 'error');
      return;
    }

    const input = document.getElementById('matchaSearch');
    if (input) input.value = title;
    document.querySelectorAll('.matcha-quick-chip').forEach(c => c.classList.remove('active'));
    // Markera CV-titel-knappen som aktiv
    document.querySelectorAll('.matcha-cv-title-btn').forEach(b => b.classList.add('active'));
    matchaDoSearch();
    toast('🎯 Söker efter ' + source + ' (' + title + ')');
  };

  window.matchaDoSearch = async function() {
    const input = document.getElementById('matchaSearch');
    const rawQ = (input && input.value || '').trim();
    const resultsEl = document.getElementById('matchaSearchResults');
    const skeleton  = document.getElementById('matchaSkeleton');
    const visaFler  = document.getElementById('matchaVisaFler');

    if (rawQ.length < 2) {
      if (resultsEl) resultsEl.innerHTML = '';
      if (skeleton)  skeleton.style.display = 'none';
      if (visaFler)  visaFler.style.display = 'none';
      return;
    }

    const locSuffix = MATCHA_ORT[matchaOrtFilter] ? ' ' + MATCHA_ORT[matchaOrtFilter] : '';
    matchaSearchQ = rawQ + locSuffix;
    matchaSearchOffset = 0;

    if (skeleton)  skeleton.style.display = 'block';
    if (resultsEl) resultsEl.innerHTML = '';
    if (visaFler)  visaFler.style.display = 'none';

    logEvent('job_search', { query: rawQ, source: 'jobtech' });

    try {
      const data = await matchaFetchJobtech(matchaSearchQ, 0);
      if (skeleton) skeleton.style.display = 'none';
      const hits = data.hits || [];
      const total = (data.total && data.total.value) || 0;

      if (!hits.length) {
        resultsEl.innerHTML = '<div class="matcha-skeleton">Inga annonser hittades. Prova ett annat sökord.</div>';
        return;
      }

      resultsEl.innerHTML =
        `<div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:10px;">
          Visar ${hits.length} av ${total} annonser · ${escape(MATCHA_ORT_LABEL[matchaOrtFilter] || 'Hela Sverige')}
        </div>`;

      hits.forEach(hit => resultsEl.appendChild(matchaBuildJobCard(hit)));
      matchaSearchOffset = hits.length;
      if (visaFler) visaFler.style.display = matchaSearchOffset < total ? 'block' : 'none';
    } catch(e) {
      console.error('Sökfel:', e);
      if (skeleton)  skeleton.style.display = 'none';
      if (resultsEl) resultsEl.innerHTML = '<div class="matcha-skeleton" style="color:#ff8fa3;">Kunde inte hämta annonser just nu. Försök igen om en stund.</div>';
    }
  };

  window.matchaVisaFler = async function() {
    const visaFlerEl = document.getElementById('matchaVisaFler');
    const btn = visaFlerEl && visaFlerEl.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Hämtar...'; }
    try {
      const data = await matchaFetchJobtech(matchaSearchQ, matchaSearchOffset);
      const hits = data.hits || [];
      const total = (data.total && data.total.value) || 0;
      const resultsEl = document.getElementById('matchaSearchResults');
      hits.forEach(hit => resultsEl.appendChild(matchaBuildJobCard(hit)));
      matchaSearchOffset += hits.length;
      if (matchaSearchOffset >= total) visaFlerEl.style.display = 'none';
    } catch(e) {
      toast('Kunde inte hämta fler annonser', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Visa fler annonser'; }
    }
  };

  async function matchaFetchJobtech(q, offset) {
    let url = 'https://jobsearch.api.jobtechdev.se/search?q=' + encodeURIComponent(q) + '&limit=20&offset=' + offset;
    if (matchaTidFilter) url += '&working-hours-type=' + encodeURIComponent(matchaTidFilter);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Jobtech API-fel');
    return resp.json();
  }

  // Bygg ett jobbkort
  function matchaBuildJobCard(hit) {
    const title   = hit.headline || 'Okänd titel';
    const company = (hit.employer && hit.employer.name) || 'Okänd arbetsgivare';
    const muni    = (hit.workplace_address && hit.workplace_address.municipality) || '';
    const url     = hit.webpage_url || '';
    const initials = company.split(' ').slice(0,2).map(w => (w[0] || '')).join('').toUpperCase() || '?';
    const [bg, fg] = matchaAvatarColor(company);

    const card = document.createElement('div');
    card.className = 'matcha-job-card';
    if (matchaSelectedAds.find(a => a.id === hit.id)) card.classList.add('selected');

    const isPicked = !!matchaSelectedAds.find(a => a.id === hit.id);
    const pickIdx  = matchaSelectedAds.findIndex(a => a.id === hit.id);

    // ── Bygg chips-HTML (arbetstid, anställningstyp, körkort, lön, varaktighet) ──
    // Identiskt med steg 3 för konsistent UX
    const chips = [];
    const chipBase = 'display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;color:rgba(255,255,255,0.7);';
    const chipBg = 'rgba(255,255,255,0.07)';
    const chipBgWarn = 'rgba(240,192,64,0.25)';

    const hoursType = (hit.working_hours_type && hit.working_hours_type.label) || '';
    if (hoursType) chips.push(`<span style="${chipBase}background:${chipBg};">⏱ ${escape(hoursType)}</span>`);

    const empType = (hit.employment_type && hit.employment_type.label) || '';
    if (empType) chips.push(`<span style="${chipBase}background:${chipBg};">📋 ${escape(empType)}</span>`);

    const licRequired = hit.driving_license_required;
    const licTypes = (hit.driving_license || []).map(l => l.label).filter(Boolean).join(', ');
    if (licRequired) {
      chips.push(`<span style="${chipBase}background:${chipBgWarn};">🚗 Körkort krävs${licTypes ? ': ' + escape(licTypes) : ''}</span>`);
    } else if (licRequired === false) {
      chips.push(`<span style="${chipBase}background:${chipBg};">🚗 Inget körkort</span>`);
    }

    const salDesc = hit.salary_description || '';
    const salType = (hit.salary_type && hit.salary_type.label) || '';
    chips.push(`<span style="${chipBase}background:${chipBg};">💰 ${escape(salDesc.substring(0, 40) || salType || 'Lön ej uppgiven')}</span>`);

    const duration = (hit.duration && hit.duration.label) || '';
    if (duration && duration !== 'Tillsvidare') {
      chips.push(`<span style="${chipBase}background:${chipBg};">📅 ${escape(duration)}</span>`);
    }

    const chipsHtml = chips.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;margin-bottom:4px;">${chips.join('')}</div>`
      : '';

    card.innerHTML = `
      <div class="matcha-job-head">
        <div class="matcha-job-avatar" style="background:${bg};color:${fg};">${initials}</div>
        <div class="matcha-job-info">
          <div class="matcha-job-title">${escape(title)}</div>
          <div class="matcha-job-meta">
            <span>🏢 ${escape(company)}</span>
            ${muni ? `<span>📍 ${escape(muni)}</span>` : ''}
          </div>
        </div>
      </div>
      ${chipsHtml}
      <div class="matcha-job-actions">
        <button class="matcha-job-btn ${isPicked ? 'picked' : 'pick'}"
                data-hitid="${escape(hit.id)}">
          ${isPicked ? '✓ Vald (' + (pickIdx+1) + '/3)' : '+ Välj jobb'}
        </button>
        ${url ? `<a class="matcha-job-btn link" href="${escape(url)}" target="_blank" rel="noopener">Läs annons ↗</a>` : ''}
      </div>
    `;

    const pickBtn = card.querySelector('.matcha-job-btn');
    if (pickBtn) {
      pickBtn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        matchaToggleAd(hit);
      });
    }

    return card;
  }

  function matchaAvatarColor(name) {
    const colors = [
      ['rgba(62,180,137,0.2)',  '#3eb489'],
      ['rgba(124,58,237,0.2)',  '#c4b5fd'],
      ['rgba(240,192,64,0.2)',  '#f0c040'],
      ['rgba(232,93,38,0.2)',   '#e85d26'],
      ['rgba(59,130,246,0.2)',  '#93c5fd'],
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = (hash + name.charCodeAt(i)) % colors.length;
    return colors[hash];
  }

  window.matchaToggleAd = function(hit) {
    const idx = matchaSelectedAds.findIndex(a => a.id === hit.id);
    if (idx >= 0) {
      matchaSelectedAds.splice(idx, 1);
      updateMatchaStickyBar();
      matchaDoSearchFromCache();
    } else if (matchaSelectedAds.length >= 3) {
      toast('Max 3 annonser åt gången', 'error');
      return;
    } else {
      matchaSelectedAds.push(hit);
      updateMatchaStickyBar();
      matchaDoSearchFromCache();
      // Visa pedagogisk modal: "Matcha nu eller fortsätt söka?"
      matchaShowAddedModal(matchaSelectedAds.length);
    }
  };

  // Modal som dyker upp när ett jobb lagts till — frågar om användaren
  // vill matcha direkt eller fortsätta söka fler jobb. Skippar vid 3/3
  // (då går vi automatiskt vidare till steg 3 efter kort paus).
  function matchaShowAddedModal(count) {
    if (count === 3) {
      toast('✨ 3 av 3 jobb valda — tar dig till matcha-steget!');
      setTimeout(() => window.matchaSwitchStep(3), 1200);
      return;
    }

    const modal = document.getElementById('matchaAddedModal');
    const emoji = document.getElementById('matchaAddedEmoji');
    const title = document.getElementById('matchaAddedTitle');
    const body  = document.getElementById('matchaAddedBody');
    if (!modal) return;

    if (count === 1) {
      emoji.textContent = '✨';
      title.textContent = '1 av 3 jobb valda!';
      body.innerHTML =
        'Nu har du två val:<br><br>' +
        '<strong style="color:#3eb489;">Matcha direkt</strong> — AI skriver tre skräddarsydda profiltexter för just detta jobb.<br><br>' +
        '<strong style="color:#f0c040;">Fortsätt söka</strong> — lägg till upp till 2 jobb till och matcha alla i samma sving. Bra om du söker brett.';
    } else {
      emoji.textContent = '✨✨';
      title.textContent = '2 av 3 jobb valda!';
      body.innerHTML =
        'Du kan matcha de två redan nu — eller lägga till ett tredje jobb för bredast möjlig matchning.<br><br>' +
        '<span style="color:rgba(255,255,255,0.45);font-size:12px;">💡 Tips: välj jobb inom samma område — AI:n blir bäst då.</span>';
    }

    modal.style.display = 'flex';
  }

  // Används av modalens "Matcha nu"-knapp
  window.matchaGoToStep3 = function() {
    const modal = document.getElementById('matchaAddedModal');
    if (modal) modal.style.display = 'none';
    setTimeout(() => window.matchaSwitchStep(3), 50);
  };

  function matchaDoSearchFromCache() {
    // Uppdatera pick-buttons på alla kort utan att göra nytt API-anrop
    const cards = document.querySelectorAll('#matchaSearchResults .matcha-job-card');
    cards.forEach(card => {
      const btn = card.querySelector('.matcha-job-btn[data-hitid]');
      if (!btn) return;
      const hitId = btn.getAttribute('data-hitid');
      const idx = matchaSelectedAds.findIndex(a => String(a.id) === hitId);
      const isPicked = idx >= 0;
      btn.className = 'matcha-job-btn ' + (isPicked ? 'picked' : 'pick');
      btn.textContent = isPicked ? ('✓ Vald (' + (idx+1) + '/3)') : '+ Välj jobb';
      card.classList.toggle('selected', isPicked);
    });
  }

  function updateMatchaStickyBar() {
    const bar = document.getElementById('matchaStickyBar');
    const cnt = document.getElementById('matchaStickyCount');
    if (!bar) return;
    if (matchaSelectedAds.length) {
      bar.style.display = 'flex';
      if (cnt) cnt.textContent = matchaSelectedAds.length + '/3 valda';
    } else {
      bar.style.display = 'none';
    }
    const tab3 = document.getElementById('matchaTab3');
    if (tab3) tab3.disabled = matchaSelectedAds.length === 0;
  }

  // ── STEG 3: Rendera annons-kort med chips + manuell "Matcha"-knapp ──
  // Matchar mobilens UX: användaren ser kort med all metadata (chips för
  // arbetstid, körkort, lön etc.), klickar "Matcha mot CV" per kort, och
  // får loading-state med timglas medan AI:n jobbar.
  function matchaRenderStep3Cards() {
    const container = document.getElementById('matchaAdsContainer');
    if (!container) return;

    if (!matchaSelectedAds.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);font-size:13px;">Välj annonser i steg 2 först</div>';
      return;
    }

    // Pedagogisk intro-ruta — påminner användaren om vikten av att antingen
    // läsa annonsen igen eller matcha CV:t. Syns bara innan första matchningen.
    const introHtml =
      '<div id="matchaStep3Intro" style="background:rgba(62,180,137,0.08);border:1.5px solid rgba(62,180,137,0.3);border-radius:14px;padding:16px 18px;margin-bottom:18px;">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
          '<span style="font-size:22px;">💡</span>' +
          '<span style="font-size:14px;font-weight:800;color:#3eb489;">Innan du matchar — två tips</span>' +
        '</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.7;">' +
          '🔍 <strong style="color:#fff;">Läs igenom annonsen noga</strong> först — vilka ord och krav lyfter de fram? Klicka <em style="color:#3eb489;">Läs annons ↗</em> på kortet för att öppna den.<br><br>' +
          '✨ <strong style="color:#fff;">Matcha sedan ditt CV</strong> — AI:n skriver tre personliga profiltexter som lyfter fram just det som passar jobbet.<br><br>' +
          '<span style="color:rgba(255,255,255,0.5);font-size:12px;">Ett anpassat CV ökar dina chanser <strong style="color:#3eb489;">markant</strong> — generiska ansökningar sorteras ofta bort direkt.</span>' +
        '</div>' +
      '</div>';

    container.innerHTML = introHtml;

    matchaSelectedAds.forEach((hit, i) => {
      const title   = hit.headline || '';
      const company = (hit.employer && hit.employer.name) || '';
      const muni    = (hit.workplace_address && hit.workplace_address.municipality) || '';
      const url     = hit.webpage_url || '';
      const adId    = String(hit.id);

      const section = document.createElement('div');
      section.className = 'matcha-ad-card-s3';
      section.dataset.adId = adId;
      section.style.cssText = 'position:relative;background:rgba(62,180,137,0.06);border:1.5px solid rgba(62,180,137,0.2);border-radius:14px;padding:16px;margin-bottom:16px;transition:all 0.2s;';

      // ── Header rad: "Annons X av Y" + ta bort-knapp ──
      const hdr = document.createElement('div');
      hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
      const hdrLabel = document.createElement('div');
      hdrLabel.style.cssText = 'font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(62,180,137,0.6);';
      hdrLabel.textContent = 'Annons ' + (i + 1) + ' av ' + matchaSelectedAds.length;
      const rmBtn = document.createElement('button');
      rmBtn.innerHTML = '✕ Ta bort';
      rmBtn.style.cssText = 'background:rgba(220,50,50,0.25);border:1.5px solid rgba(220,50,50,0.6);color:#ff6b6b;font-size:11px;font-weight:800;cursor:pointer;padding:4px 10px;border-radius:8px;line-height:1;letter-spacing:0.3px;font-family:inherit;';
      rmBtn.onclick = () => matchaRemoveAdS3(adId);
      hdr.appendChild(hdrLabel);
      hdr.appendChild(rmBtn);
      section.appendChild(hdr);

      // ── Titel + bolag/ort ──
      const titleEl = document.createElement('div');
      titleEl.style.cssText = 'font-size:15px;font-weight:700;color:#fff;margin-bottom:2px;';
      titleEl.textContent = title;
      section.appendChild(titleEl);

      const metaEl = document.createElement('div');
      metaEl.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.45);';
      metaEl.textContent = company + (muni ? ' · ' + muni : '');
      section.appendChild(metaEl);

      // ── Chips med metadata-symboler (matchar mobilens design) ──
      function makeChip(label, color) {
        const c = document.createElement('span');
        c.style.cssText = 'display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;margin:2px;background:' + (color || 'rgba(255,255,255,0.07)') + ';color:rgba(255,255,255,0.7);';
        c.textContent = label;
        return c;
      }

      const chipsRow = document.createElement('div');
      chipsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;';

      // ⏱ Arbetstid (heltid/deltid)
      const hoursType = (hit.working_hours_type && hit.working_hours_type.label) || '';
      if (hoursType) chipsRow.appendChild(makeChip('⏱ ' + hoursType));

      // 📋 Anställningstyp
      const empType = (hit.employment_type && hit.employment_type.label) || '';
      if (empType) chipsRow.appendChild(makeChip('📋 ' + empType));

      // 🚗 Körkort
      const licRequired = hit.driving_license_required;
      const licTypes = (hit.driving_license || []).map(l => l.label).filter(Boolean).join(', ');
      if (licRequired) {
        chipsRow.appendChild(makeChip('🚗 Körkort krävs' + (licTypes ? ': ' + licTypes : ''), 'rgba(240,192,64,0.25)'));
      } else if (licRequired === false) {
        chipsRow.appendChild(makeChip('🚗 Inget körkort'));
      }

      // 💰 Lön
      const salDesc = hit.salary_description || '';
      const salType = (hit.salary_type && hit.salary_type.label) || '';
      chipsRow.appendChild(makeChip('💰 ' + (salDesc.substring(0, 40) || salType || 'Lön ej uppgiven')));

      // 📅 Varaktighet (om annan än Tillsvidare)
      const duration = (hit.duration && hit.duration.label) || '';
      if (duration && duration !== 'Tillsvidare') chipsRow.appendChild(makeChip('📅 ' + duration));

      if (chipsRow.children.length) section.appendChild(chipsRow);

      // ── Annonstext-snippet ──
      const rawDesc = (hit.description && hit.description.text) || '';
      const adSnippet = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 140);
      if (adSnippet) {
        const snipEl = document.createElement('div');
        snipEl.style.cssText = 'margin-top:10px;font-size:12px;color:rgba(255,255,255,0.5);line-height:1.6;';
        snipEl.textContent = adSnippet + (rawDesc.length > 140 ? '…' : '');
        section.appendChild(snipEl);
      }

      // ── Läs annons-länk ──
      if (url) {
        const readLink = document.createElement('a');
        readLink.href = url;
        readLink.target = '_blank';
        readLink.rel = 'noopener';
        readLink.onclick = (e) => e.stopPropagation();
        readLink.style.cssText = 'display:inline-block;margin-top:10px;font-size:11px;font-weight:700;color:#3eb489;text-decoration:none;padding:6px 12px;border:1px solid rgba(62,180,137,0.4);border-radius:8px;background:rgba(62,180,137,0.08);';
        readLink.textContent = 'Läs annons ↗';
        section.appendChild(readLink);
      }

      // ── "Matcha mot CV"-knapp (eller "redan matchad"-badge) ──
      const extrasDiv = document.createElement('div');
      extrasDiv.id = 'matchaExtras_' + adId;

      const alreadyMatched = matchaIsAdAlreadyMatched(hit);
      const genBtn = document.createElement('button');
      if (alreadyMatched) {
        genBtn.textContent = '✅ CV redan matchat mot detta jobb';
        genBtn.disabled = true;
        genBtn.style.cssText = 'margin-top:14px;width:100%;padding:13px;background:rgba(62,180,137,0.1);border:1.5px solid rgba(62,180,137,0.35);color:#3eb489;font-size:13px;font-weight:700;border-radius:10px;cursor:default;font-family:inherit;opacity:0.8;';
      } else {
        genBtn.id = 'matchaGenBtn_' + adId;
        genBtn.textContent = '✨ Matcha mot CV';
        genBtn.style.cssText = 'margin-top:14px;width:100%;padding:13px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;color:#fff;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;transition:transform 0.15s, box-shadow 0.15s;';
        genBtn.onmouseenter = () => { genBtn.style.transform = 'translateY(-1px)'; genBtn.style.boxShadow = '0 4px 12px rgba(108,92,231,0.3)'; };
        genBtn.onmouseleave = () => { genBtn.style.transform = ''; genBtn.style.boxShadow = ''; };
        genBtn.onclick = (e) => {
          e.stopPropagation();
          // Visa pedagogisk modal "Har du läst annonsen?" INNAN AI körs
          // (matchar mobilens UX exakt)
          matchShowReadAnnonsModal(hit, () => {
            // Callback när användaren bekräftat → kör AI-matchning
            const allSections = document.querySelectorAll('#matchaAdsContainer > div[data-ad-id]');
            allSections.forEach(s => {
              if (s.dataset.adId !== adId) {
                s.style.opacity = '0.2';
                s.style.pointerEvents = 'none';
              }
            });
            matchaRunAiForAd(hit).finally(() => {
              const existingReset = document.getElementById('matchaResetFocus');
              if (!existingReset) {
                const resetBtn = document.createElement('button');
                resetBtn.id = 'matchaResetFocus';
                resetBtn.textContent = '← Visa alla annonser';
                resetBtn.style.cssText = 'display:block;margin:0 auto 16px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;padding:7px 14px;border-radius:20px;cursor:pointer;font-family:inherit;';
                resetBtn.onclick = () => {
                  allSections.forEach(s => { s.style.opacity = ''; s.style.pointerEvents = ''; });
                  resetBtn.remove();
                };
                container.parentNode.insertBefore(resetBtn, container);
              }
            });
          });
        };
      }
      extrasDiv.appendChild(genBtn);
      section.appendChild(extrasDiv);

      // ── Loading-state (timglas, dold tills click) ──
      const loadingEl = document.createElement('div');
      loadingEl.id = 'matchaAdLoading_' + adId;
      loadingEl.className = 'matcha-skeleton';
      loadingEl.style.cssText = 'display:none;margin-top:14px;padding:20px;background:rgba(108,92,231,0.08);border:1.5px solid rgba(108,92,231,0.3);border-radius:12px;text-align:center;color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;';
      loadingEl.innerHTML = '<span style="display:inline-block;animation:matchaHourglassSpin 2s linear infinite;font-size:24px;">⏳</span><div style="margin-top:8px;">AI analyserar och skriver 3 profiltexter...</div>';
      section.appendChild(loadingEl);

      // ── Resultat-container (dold tills AI:n returnerat) ──
      const resultDiv = document.createElement('div');
      resultDiv.id = 'matchaAdBody_' + adId;
      resultDiv.style.cssText = 'display:none;margin-top:14px;';
      section.appendChild(resultDiv);

      container.appendChild(section);
    });
  }

  // Ta bort en annons från step 3-listan
  function matchaRemoveAdS3(adId) {
    matchaSelectedAds = matchaSelectedAds.filter(a => String(a.id) !== String(adId));
    matchaRenderStep3Cards();
    updateMatchaStickyBar();
    if (!matchaSelectedAds.length) {
      // Tillbaka till step 2 om inga annonser kvar
      window.matchaSwitchStep(2);
    }
  }

  // Kollar om hit redan finns som "matchat CV" i sparade
  function matchaIsAdAlreadyMatched(hit) {
    if (!hit) return false;
    const list = pfGetSaved();
    return list.some(c => {
      if (!c || c.id.indexOf('match_') !== 0) return false;
      const sameUrl = c.jobUrl && hit.webpage_url && c.jobUrl === hit.webpage_url;
      const sameTitle = c._hit && hit.headline && c._hit.headline === hit.headline
        && (c._hit.employer && hit.employer && c._hit.employer.name === hit.employer.name);
      return sameUrl || sameTitle;
    });
  }

  // ═════════════════════════════════════════════════════
  // DAGSGRÄNS — max 3 matchade CV per dag (resetar midnatt)
  // ═════════════════════════════════════════════════════
  const MATCH_VIP_EMAILS = ['oliver.pettersson2@gmail.com'];

  function matchIsVIP() {
    try {
      const auth = JSON.parse(localStorage.getItem('pathfinder_auth') || '{}');
      return MATCH_VIP_EMAILS.indexOf(auth.email) !== -1;
    } catch(e) { return false; }
  }

  function matchedToday() {
    const idag = new Date().toDateString();
    try {
      return (pfGetMatched() || [])
        .filter(c => new Date(c.savedAt).toDateString() === idag).length;
    } catch(e) { return 0; }
  }

  function matchTimeLeft() {
    const m = new Date(); m.setHours(24, 0, 0, 0);
    const d = m - new Date();
    return Math.floor(d / 3600000) + ' tim ' + Math.floor((d % 3600000) / 60000) + ' min';
  }

  // Visa "Dagsgränsen nådd" modal (när man försöker matcha efter 3 idag)
  function matchShowBlockModal() {
    const existing = document.getElementById('_matchBlockModal');
    if (existing) existing.remove();
    const m = document.createElement('div');
    m.id = '_matchBlockModal';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);padding:20px;backdrop-filter:blur(4px);';
    m.innerHTML =
      '<div style="background:#1e2440;border-radius:20px;padding:32px 28px;max-width:440px;width:100%;border:2px solid rgba(232,93,38,0.4);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="font-size:48px;margin-bottom:14px;">🔒</div>' +
        '<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:10px;">Dagsgränsen nådd</div>' +
        '<div style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;margin-bottom:10px;">Du har redan matchat <strong style="color:#fff;">3 CV idag</strong>. Nya matcher öppnar vid midnatt.</div>' +
        '<div style="font-size:13px;color:rgba(232,93,38,0.85);margin-bottom:24px;font-weight:600;">⏰ ' + matchTimeLeft() + ' kvar</div>' +
        '<button onclick="document.getElementById(\'_matchBlockModal\').remove()" style="width:100%;padding:14px;background:#e85d26;border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">Stäng</button>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  }

  // Visa "Sista matchen!" modal (när man just matchat sin 3:e)
  function matchShowLimitReachedModal() {
    const existing = document.getElementById('_matchLimitModal');
    if (existing) existing.remove();
    const m = document.createElement('div');
    m.id = '_matchLimitModal';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);padding:20px;backdrop-filter:blur(4px);';
    m.innerHTML =
      '<div style="background:#1e2440;border-radius:20px;padding:32px 28px;max-width:460px;width:100%;border-top:4px solid #e85d26;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
        '<div style="font-size:52px;margin-bottom:14px;">🌙</div>' +
        '<div style="font-size:21px;font-weight:900;color:#fff;margin-bottom:10px;">Du har matchat 3 CV idag!</div>' +
        '<div style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.7;margin-bottom:12px;">Bra jobbat — max antal matcher nådd för idag. 💪<br>Nya matcher öppnar vid midnatt.</div>' +
        '<div style="font-size:13px;color:rgba(232,93,38,0.85);margin-bottom:24px;font-weight:600;">⏰ ' + matchTimeLeft() + ' kvar</div>' +
        '<button onclick="document.getElementById(\'_matchLimitModal\').remove()" style="width:100%;padding:14px;background:#e85d26;border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">Okej, ses imorgon! 👋</button>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.remove(); });
  }

  // Röd banner i steg 3: "X av 3 matcher kvar idag"
  function matchUpdateDagsBanner() {
    const step3 = document.getElementById('matchaStep3');
    if (!step3 || !step3.classList.contains('active')) return;

    const count = matchedToday();
    const left  = 3 - count;
    const vip   = matchIsVIP();

    let banner = document.getElementById('_matchDagsBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = '_matchDagsBanner';
      step3.insertBefore(banner, step3.firstChild);
    }

    if (vip) { banner.style.display = 'none'; return; }

    banner.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;gap:12px;' +
      'background:' + (left === 0 ? 'rgba(232,93,38,0.18)' : 'rgba(232,93,38,0.1)') + ';' +
      'border:2px solid ' + (left === 0 ? '#e85d26' : 'rgba(232,93,38,0.4)') + ';' +
      'border-radius:12px;padding:12px 16px;margin-bottom:16px;';
    banner.innerHTML =
      '<div>' +
        '<div style="font-size:14px;font-weight:900;color:#e85d26;margin-bottom:3px;">' +
          (left === 0 ? '🔒 Inga matcher kvar idag' : '🎯 ' + left + ' av 3 matcher kvar idag') +
        '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.45);">Resetar om ' + matchTimeLeft() + '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0;">' +
        '<div style="font-size:22px;font-weight:900;color:' + (left === 0 ? '#e85d26' : '#fff') + ';">' + count + '/3</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:0.5px;">MATCHER</div>' +
      '</div>';
  }
  window.matchUpdateDagsBanner = matchUpdateDagsBanner;

  // Stor fullskärms-timglas overlay (inga klick igenom)
  function matchShowHourglassOverlay(role) {
    const existing = document.getElementById('_matchHourglass');
    if (existing) existing.remove();
    const o = document.createElement('div');
    o.id = '_matchHourglass';
    o.style.cssText = 'position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;background:rgba(10,12,28,0.85);backdrop-filter:blur(6px);pointer-events:all;';
    o.innerHTML =
      '<div style="background:#1e2440;border:1.5px solid rgba(108,92,231,0.35);border-radius:24px;padding:40px 36px;max-width:420px;width:calc(100% - 40px);text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:68px;margin-bottom:20px;animation:matchaHourglassSpin 2.5s linear infinite;display:inline-block;">⏳</div>' +
        '<div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:10px;">AI skriver 3 profiltexter</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;margin-bottom:8px;">riktade mot <strong style="color:#f0c040;">' + (role || 'ditt jobb') + '</strong></div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.35);line-height:1.6;">Det tar oftast 10-20 sekunder.<br>Stäng inte fönstret.</div>' +
      '</div>';
    document.body.appendChild(o);
    // Blockera alla klick bakåt
    o.addEventListener('click', e => e.stopPropagation());
  }

  function matchHideHourglassOverlay() {
    const o = document.getElementById('_matchHourglass');
    if (o) o.remove();
  }

  // Pedagogisk "Har du läst annonsen?"-modal — visas INNAN AI-matchning
  // startar. Samma UX som mobilen: 3 val (läs annons / matcha / gå tillbaka).
  function matchShowReadAnnonsModal(hit, onConfirmed) {
    const existing = document.getElementById('_matchaReadConfirm');
    if (existing) existing.remove();

    const annonsUrl = (hit && hit.webpage_url) || '';

    const modal = document.createElement('div');
    modal.id = '_matchaReadConfirm';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);padding:20px;';

    modal.innerHTML =
      '<div style="background:#1e2440;border-radius:20px;padding:32px 28px;width:100%;max-width:460px;border:1.5px solid rgba(255,255,255,0.1);box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:44px;text-align:center;margin-bottom:14px;">🧐</div>' +
        '<div style="font-size:20px;font-weight:900;color:#fff;text-align:center;margin-bottom:10px;">Har du läst annonsen?</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.7;margin-bottom:26px;">' +
          'Det är viktigt att du vet om jobbet faktiskt passar dig och dina kompetenser — innan AI skriver din profiltext. Vill du läsa annonsen igen?' +
        '</div>' +

        // 1. Läs annonsen först (grön) - bara om URL finns
        (annonsUrl
          ? '<a href="' + escape(annonsUrl) + '" target="_blank" rel="noopener" ' +
            'style="display:block;width:100%;padding:15px;background:linear-gradient(135deg,#3eb489,#10b981);border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;text-align:center;text-decoration:none;margin-bottom:10px;box-sizing:border-box;">' +
            '🔗 Läs annonsen först</a>'
          : '') +

        // 2. Ja, matcha med AI (lila)
        '<button id="_matchaReadJa" ' +
          'style="width:100%;padding:15px;background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;margin-bottom:16px;">' +
          '✨ Ja, matcha mitt CV med AI</button>' +

        // 3. Gå tillbaka (liten röd outline)
        '<button id="_matchaReadNej" ' +
          'style="display:block;margin:0 auto;padding:9px 22px;background:none;border:1.5px solid rgba(232,93,38,0.5);color:rgba(232,93,38,0.85);font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">' +
          '← Gå tillbaka</button>' +
      '</div>';

    document.body.appendChild(modal);

    document.getElementById('_matchaReadJa').onclick = function() {
      modal.remove();
      if (typeof onConfirmed === 'function') onConfirmed();
    };

    document.getElementById('_matchaReadNej').onclick = function() {
      modal.remove();
    };

    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  }

  async function matchaRunAiForAd(hit) {
    const loadEl = document.getElementById('matchaAdLoading_' + hit.id);
    const bodyEl = document.getElementById('matchaAdBody_' + hit.id);
    const genBtn = document.getElementById('matchaGenBtn_' + hit.id);
    if (!loadEl || !bodyEl) return;

    // Blockera om dagsgränsen redan nådd (och ej VIP)
    if (!matchIsVIP() && matchedToday() >= 3) {
      matchShowBlockModal();
      return;
    }

    // Visa inline-loading + stor overlay med timglas (blockerar klick)
    loadEl.style.display = 'block';
    if (genBtn) genBtn.style.display = 'none';
    const role = hit.headline || '';
    matchShowHourglassOverlay(role);

    const selectedCV = matchaGetSelectedCVData();
    const company = (hit.employer && hit.employer.name) || '';
    const adText  = (hit.description && hit.description.text) || '';

    const cvSummary = [
      selectedCV.name    ? 'Namn: '     + selectedCV.name    : '',
      selectedCV.title   ? 'Yrke: '     + selectedCV.title   : '',
      selectedCV.summary ? 'Profil: '   + selectedCV.summary : '',
      selectedCV.jobs && selectedCV.jobs.length
        ? 'Jobb: ' + selectedCV.jobs.map(j => j.title + (j.company ? ' hos ' + j.company : '')).join(', ')
        : '',
      selectedCV.education && selectedCV.education.length
        ? 'Utbildning: ' + selectedCV.education.map(e => (e.degree || '') + (e.school || e.schoolName ? ' vid ' + (e.school || e.schoolName) : '')).join('; ')
        : '',
      selectedCV.skills && selectedCV.skills.length
        ? 'Kompetenser: ' + selectedCV.skills.join(', ')
        : ''
    ].filter(Boolean).join('\n');

    const prompt = 'CV:\n' + cvSummary +
      '\n\nJobbet: ' + role + ' hos ' + company +
      (adText ? '\nAnnonsinfo: ' + adText.substring(0, 800) : '') +
      '\n\nSkriv 3 profiltexter som UNDVIKER AI-känsla. Skriv som en riktig människa — personligt, konkret, utan klichéer.' +
      '\n\n===== SKRIVREGLER =====' +
      '\n• Använd "jag"-form genomgående' +
      '\n• Blanda långa och korta meningar — naturligt flöde, inte stel symmetri' +
      '\n• Minst en mening per text ska börja med ett verb eller en personlig observation ("Efter fem år i...", "Det jag tar med mig från...", "På DSV lärde jag mig att...")' +
      '\n• Referera till KONKRETA saker från CV:t — företagsnamn, antal år, specifika uppgifter — inte bara abstrakta egenskaper' +
      '\n• Undvik floskler och klichéer: "driven", "resultatorienterad", "utvecklat en kombination av", "lugnt och metodiskt sätt", "direkt överförbara", "teamplayer", "passion för"' +
      '\n• Undvik meningar som börjar "Med min erfarenhet av..." eller "Jag är en person som..."' +
      '\n• Skriv så som en människa pratar till en rekryterare på ett fikapaus — professionellt men äkta' +
      '\n• Varje text ska kännas unik — inte omskrivning av samma mall' +
      '\n\n===== FORMAT =====' +
      '\n• TVÅ stycken per text, separerade med \\n\\n' +
      '\n• Stycke 1 (3-4 meningar): vad du gjort och vad du tar med dig — konkret och berättande' +
      '\n• Stycke 2 (3-4 meningar): vad du bidrar med, vad som driver dig — avsluta ALLTID med exakt: "Jag ser fram emot att berätta mer om mig själv på en intervju, bli en del av ert team eller få höra mer om ert företag och jobbmöjligheterna."' +
      '\n\n===== TRE VINKLAR (en per alternativ) =====' +
      '\n• Alt 1 (ERFARENHET): börja med en konkret situation från ett tidigare jobb i CV:t' +
      '\n• Alt 2 (MOTIVATION): börja med vad som fick dig att söka just detta jobb / denna bransch' +
      '\n• Alt 3 (KOMPETENS & RESULTAT): börja med en kompetens du byggt upp och vad den har lett till' +
      '\n\n===== SVAR =====' +
      '\nSvara ENDAST med giltig JSON, inget annat:' +
      '\n{"keywords": [{"word": "nyckelord", "status": "match|partial|missing"}], "alternatives": ["alt1-text", "alt2-text", "alt3-text"]}' +
      '\nMax 6 keywords.';

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1800,
          system: 'Du är en svensk CV-coach som hjälper jobbsökare att skriva profiltexter som INTE låter AI-genererade. Din specialitet: mänsklig, konkret, berättande svenska — inte corporate buzzwords. Du undviker ord som "driven", "resultatorienterad", "direkt överförbar", "lugnt och metodiskt", "teamplayer". Istället refererar du till konkreta saker personen gjort, som en vän som hjälper till med brev. Svara ALLTID med giltig JSON och inget annat.',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!resp.ok) throw new Error('API-fel ' + resp.status);
      const data = await resp.json();
      const raw = (data.content && data.content[0] && data.content[0].text) || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

      // Dölj loading + overlay + visa resultat
      loadEl.style.display = 'none';
      matchHideHourglassOverlay();
      renderMatchaAiResult(hit, parsed);
      logEvent('cv_matched', { role: role, company: company });
    } catch(err) {
      console.error('AI-match fel:', err);
      matchHideHourglassOverlay();
      loadEl.style.color = '#ff8fa3';
      loadEl.innerHTML = '<span style="font-size:24px;">❌</span><div style="margin-top:8px;">AI kunde inte matcha just nu. Försök igen om en stund.</div>';
      // Återställ knappen så användaren kan försöka igen
      if (genBtn) {
        genBtn.style.display = '';
        genBtn.textContent = '🔄 Försök igen';
      }
    }
  }

  function renderMatchaAiResult(hit, parsed) {
    const loadEl = document.getElementById('matchaAdLoading_' + hit.id);
    const bodyEl = document.getElementById('matchaAdBody_' + hit.id);
    if (loadEl) loadEl.style.display = 'none';
    if (!bodyEl) return;

    const keywords     = parsed.keywords     || [];
    const alternatives = parsed.alternatives || [];
    const role         = hit.headline || '';

    // Spara alts globalt så klick kan hämta dem
    if (!window._matchaAlts) window._matchaAlts = {};
    window._matchaAlts[hit.id] = alternatives;

    const labels = ['🎯 Erfarenhetsfokus', '💫 Motivationsfokus', '⭐ Kompetens & resultat'];
    const accents     = ['#3eb489',                  '#f0c040',                  '#a78bfa'];
    const borderCols  = ['rgba(62,180,137,0.4)',     'rgba(240,192,64,0.35)',    'rgba(124,58,237,0.4)'];
    const bgCols      = ['rgba(62,180,137,0.07)',    'rgba(240,192,64,0.07)',    'rgba(124,58,237,0.07)'];

    let html = '';

    // Keywords-rad (om vi fick nyckelord från AI:n)
    if (keywords.length) {
      html += '<div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">Nyckelord i annonsen</div>';
      html += '<div class="matcha-keywords" style="margin-bottom:18px;">';
      keywords.forEach(k => {
        const status = (k.status || 'partial').toLowerCase();
        const icon = status === 'match' ? '✓ ' : status === 'partial' ? '◐ ' : '✕ ';
        html += '<span class="matcha-kw ' + escape(status) + '">' + icon + escape(k.word || '') + '</span>';
      });
      html += '</div>';
    }

    // Rubrik (matchar mobilen)
    html += '<div style="text-align:center;margin-bottom:20px;">';
    html += '<div style="font-size:24px;margin-bottom:8px;">✨</div>';
    html += '<div style="font-size:17px;font-weight:900;color:#fff;margin-bottom:6px;">AI har skrivit 3 profiltexter åt dig!</div>';
    html += '<div style="font-size:13px;color:rgba(255,255,255,0.55);font-weight:600;margin-bottom:4px;">som matchar <span style="color:#f0c040;">' + escape(role) + '</span></div>';
    html += '<div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">Klicka på ett alternativ för att välja det</div>';
    html += '</div>';

    // Profiltext-kort (hela kortet klickbart)
    alternatives.forEach((text, ai) => {
      html += '<div id="matchaCard_' + escape(String(hit.id)) + '_' + ai + '" ' +
              'style="cursor:pointer;background:' + bgCols[ai] + ';border:2px solid ' + borderCols[ai] + ';border-radius:16px;padding:18px;margin-bottom:14px;transition:all 0.15s;">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">';
      html += '<span style="font-size:16px;">📋</span>';
      html += '<span style="font-size:12px;font-weight:800;letter-spacing:0.5px;color:' + accents[ai] + ';">' + escape(labels[ai] || 'Alternativ ' + (ai + 1)) + '</span>';
      html += '</div>';
      // Bevara stycke-brytningar med white-space: pre-wrap
      html += '<div style="font-size:13px;line-height:1.8;color:rgba(255,255,255,0.88);white-space:pre-wrap;">' + escape(text) + '</div>';
      html += '</div>';
    });

    // "Se matchningarna igen"-knapp (visar tillbaka annonskortet + andra kort)
    html += '<button id="matchaBack_' + escape(String(hit.id)) + '" ' +
            'style="width:100%;padding:12px;background:none;border:1.5px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.45);font-size:13px;font-weight:600;border-radius:10px;cursor:pointer;font-family:inherit;margin-top:4px;">' +
            '← Tillbaka till alla annonser</button>';

    bodyEl.style.display = 'block';
    bodyEl.innerHTML = html;

    setTimeout(() => { bodyEl.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);

    // "Tillbaka till alla annonser" — återställ vyn
    const backBtn = document.getElementById('matchaBack_' + hit.id);
    if (backBtn) {
      backBtn.onclick = () => {
        const section = bodyEl.closest('[data-ad-id]');
        if (section) {
          Array.from(section.children).forEach(c => { c.style.display = ''; });
          bodyEl.style.display = 'none';
          bodyEl.innerHTML = '';
        }
        // Återställ opacity på andra kort
        document.querySelectorAll('#matchaAdsContainer > div[data-ad-id]').forEach(s => {
          s.style.opacity = ''; s.style.pointerEvents = '';
        });
        const reset = document.getElementById('matchaResetFocus');
        if (reset) reset.remove();
      };
    }

    // Klick på kort → bekräftelse-overlay (som mobilen)
    alternatives.forEach((text, ai) => {
      const card = document.getElementById('matchaCard_' + hit.id + '_' + ai);
      if (!card) return;
      card.onmouseenter = () => {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
      };
      card.onmouseleave = () => {
        card.style.transform = '';
        card.style.boxShadow = '';
      };
      card.onclick = () => matchShowConfirmOverlay(hit, ai, accents[ai]);
    });
  }

  // Bekräftelse-overlay som dyker upp när användaren klickar ett profiltext-kort
  // (matchar mobilens UX: "Välj denna profiltext?" → Ja/Nej)
  function matchShowConfirmOverlay(hit, altIdx, accent) {
    const existing = document.getElementById('_matchConfirmOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = '_matchConfirmOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99990;background:rgba(10,12,28,0.88);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#1e2440;border:1.5px solid ' + (accent || 'rgba(62,180,137,0.35)') + ';border-radius:20px;padding:32px 28px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:44px;text-align:center;margin-bottom:14px;">✨</div>' +
        '<div style="font-size:19px;font-weight:900;color:#fff;text-align:center;margin-bottom:10px;">Välj denna profiltext?</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.55);text-align:center;line-height:1.7;margin-bottom:24px;">Den läggs direkt in i ditt CV. Ett matchat CV sparas under <strong style="color:#fff;">👤 Profil</strong> och kan redigeras efteråt.</div>' +
        '<button class="_conf-ja" style="width:100%;padding:15px;background:linear-gradient(135deg,#3eb489,#10b981);border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;margin-bottom:10px;">✅ Ja, välj denna</button>' +
        '<button class="_conf-nej" style="width:100%;padding:13px;background:none;border:1.5px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.55);font-size:14px;font-weight:600;border-radius:12px;cursor:pointer;font-family:inherit;">Nej, visa alternativen igen</button>' +
      '</div>';

    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('._conf-nej').onclick = () => overlay.remove();
    overlay.querySelector('._conf-ja').onclick = () => {
      overlay.remove();
      window.matchaApplyText(String(hit.id), altIdx);
    };
  }

  // "📄 Exportera CV & öppna annons" — samma flöde som mobilen:
  // visar påminnelse-modal, exporterar PDF, öppnar annons i ny flik
  window.matchSavedExportAndOpen = function() {
    const id     = window._matchaLastSavedId;
    const jobUrl = window._matchaLastJobUrl || '';
    if (!id) {
      toast('Kunde inte hitta matchat CV', 'error');
      return;
    }

    // Stäng sparat-modalen först
    const savedModal = document.getElementById('matchaSavedModal');
    if (savedModal) savedModal.style.display = 'none';

    // Visa pedagogisk påminnelse INNAN export
    const existing = document.getElementById('_pdfReminderModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = '_pdfReminderModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.78);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

    modal.innerHTML =
      '<div style="background:#1a1a2e;border:1.5px solid rgba(62,180,137,0.3);border-radius:20px;padding:28px 26px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:36px;text-align:center;margin-bottom:14px;">✨</div>' +
        '<div style="font-size:18px;font-weight:900;color:#fff;text-align:center;margin-bottom:12px;">Innan du exporterar — gör det personligt!</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.75;margin-bottom:22px;">' +
          '🔍 <strong style="color:rgba(255,255,255,0.85);">Läs igenom annonsen noga</strong> — vilka ord och krav lyfter de fram?<br><br>' +
          '✨ <strong style="color:rgba(255,255,255,0.85);">Förbättra din profiltext</strong> för att göra den mer personlig — AI har redan matchat den mot annonsen!<br><br>' +
          '👀 <strong style="color:rgba(255,255,255,0.85);">Kolla igenom ditt CV en extra gång</strong> så att allt ser bra ut innan du skickar.<br><br>' +
          'Ett anpassat CV ökar dina chanser <strong style="color:#3eb489;">markant</strong>.' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="_pdfRemBack" style="flex:1;padding:13px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">← Gå tillbaka</button>' +
          '<button id="_pdfRemGo"   style="flex:1.4;padding:13px;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;font-family:inherit;">📄 Exportera & öppna annons</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('_pdfRemBack').onclick = function() {
      modal.remove();
      // Öppna saved-modalen igen så användaren kan välja annat
      if (savedModal) savedModal.style.display = 'flex';
    };

    document.getElementById('_pdfRemGo').onclick = function() {
      modal.remove();
      // 1. Exportera PDF
      if (typeof window.pfExportMatched === 'function') {
        window.pfExportMatched(id);
      }
      // 2. Öppna annonsen i ny flik (liten fördröjning så PDF hinner starta)
      if (jobUrl) {
        setTimeout(() => {
          window.open(jobUrl, '_blank', 'noopener');
        }, 600);
      } else {
        toast('Ingen annons-URL sparad för denna match', 'error');
      }
    };
  };

  window.matchaApplyText = function(hitId, altIdx) {
    // Blockera om dagsgränsen nådd (ej VIP)
    if (!matchIsVIP() && matchedToday() >= 3) {
      matchShowBlockModal();
      return;
    }

    const alts = window._matchaAlts && window._matchaAlts[hitId];
    if (!alts || !alts[altIdx]) {
      toast('Kunde inte hitta texten', 'error');
      return;
    }
    const text = alts[altIdx];
    const hit  = matchaSelectedAds.find(a => String(a.id) === String(hitId));

    // Applicera på pågående CV
    cvData.summary = text;
    const summaryEl = document.getElementById('cv-summary');
    if (summaryEl) summaryEl.value = text;
    saveCVLocal();
    renderPreview();

    // Spara som matchat CV (14 dagars TTL)
    const jobTitle = (hit && hit.headline) || cvData.title || 'Okänt yrke';
    const matchTitle = 'Matchat CV – ' + jobTitle;
    const snapshot = {
      id: 'match_' + Date.now(),
      title: matchTitle,
      savedAt: Date.now(),
      jobUrl: (hit && hit.webpage_url) || '',
      company: (hit && hit.employer && hit.employer.name) || '',
      adText: (hit && hit.description && hit.description.text) || '',
      _hit: hit ? JSON.parse(JSON.stringify(hit)) : null,
      data: JSON.parse(JSON.stringify(cvData))
    };
    const mlist = pfGetMatched();
    const ei = mlist.findIndex(c => c.title === matchTitle);
    if (ei >= 0) mlist[ei] = snapshot;
    else mlist.unshift(snapshot);
    pfPutMatched(mlist);

    logEvent('cv_saved_from_match', {
      title: matchTitle,
      role: (hit && hit.headline) || '',
      company: (hit && hit.employer && hit.employer.name) || ''
    });

    // Uppdatera dagsbanner direkt så nya räknaren syns
    setTimeout(matchUpdateDagsBanner, 100);

    // Om detta var 3:e matchen idag — visa "Sista matchen!"-modal istället
    // för standard "Sparat!"-modalen
    if (!matchIsVIP() && matchedToday() >= 3) {
      setTimeout(matchShowLimitReachedModal, 600);
      return;
    }

    // Visa pedagogisk "Sparat!"-modal — fyll i dynamiska fält först
    const savedModal = document.getElementById('matchaSavedModal');
    if (savedModal) {
      // Spara referens till senaste matchade CV + annons-URL så
      // "📄 Exportera CV & öppna annons"-knappen kan använda dem
      window._matchaLastSavedId = snapshot.id;
      window._matchaLastJobUrl = snapshot.jobUrl || '';

      // Räknar-pill: "CV 1/3" eller "CV 2/3 · VIP 👑"
      const counter = document.getElementById('matchaSavedCounter');
      if (counter) {
        const count = matchedToday();
        const vip = matchIsVIP();
        counter.textContent = vip
          ? 'CV ' + count + '/∞ · VIP 👑'
          : 'CV ' + count + '/3 idag';
        counter.style.display = 'inline-block';
      }

      // Jobbtitel
      const jobTitleEl = document.getElementById('matchaSavedJobTitle');
      if (jobTitleEl) jobTitleEl.textContent = jobTitle;

      // Limit-note (3/dag-påminnelse, eller dagens kvot)
      const noteEl = document.getElementById('matchaSavedLimitNote');
      if (noteEl) {
        const left = 3 - matchedToday();
        if (matchIsVIP()) {
          noteEl.textContent = '👑 VIP — ingen dagsgräns för dig.';
        } else if (left > 0) {
          noteEl.innerHTML = '🎯 Du har <strong style="color:#fff;">' + left + ' matchning' + (left === 1 ? '' : 'ar') + '</strong> kvar idag. Räknaren nollställs vid midnatt.';
        } else {
          noteEl.innerHTML = '🌙 Du har använt dagens alla 3 matchningar. Räknaren nollställs vid midnatt.';
        }
      }

      savedModal.style.display = 'flex';
    } else {
      toast('✅ Sparat! Ditt matchade CV finns nu under 👤 Profil');
    }
  };

  // ──────────────────────────────────────────────────────────

  // ============================================================
  // CV: SKILLS
  // ============================================================
  function renderSkillsChips() {
    const grid = document.getElementById('skillsChips');
    if (!cvData.skills.length) {
      grid.innerHTML = '<div class="empty">Inga kompetenser tillagda än — skriv eller klicka på AI</div>';
      return;
    }
    grid.innerHTML = cvData.skills.map((s, i) => `
      <span class="chip">
        ${escape(s)}
        <button class="chip-remove" onclick="cvRemoveSkill(${i})" title="Ta bort">×</button>
      </span>
    `).join('');
  }

  window.cvAddSkill = function() {
    const inp = document.getElementById('newSkill');
    const v = inp.value.trim();
    if (!v) return;
    if (cvData.skills.includes(v)) {
      toast('Den kompetensen finns redan');
      inp.value = '';
      return;
    }
    cvData.skills.push(v);
    inp.value = '';
    saveCVLocal();
    renderSkillsChips();
    renderPreview();
    markStepDone('mer');
  };

  window.cvRemoveSkill = function(i) {
    cvData.skills.splice(i, 1);
    saveCVLocal();
    renderSkillsChips();
    renderPreview();
  };

  window.cvAiSkills = async function() {
    const title = (cvData.title || document.getElementById('cv-title').value || '').trim();
    const jobs = (cvData.jobs || []);

    if (!title && !jobs.length) {
      toast('Fyll i en jobbtitel (Profil) eller lägg till minst ett jobb först', 'error');
      return;
    }

    // Bygg en sammanfattning av CV-kontext för AI:n
    const jobSummary = jobs.slice(0, 5).map(j => {
      const bullets = [j.desc1, j.desc2, j.desc3].filter(Boolean).join(' | ');
      return '- ' + (j.title || '') + (j.company ? ' på ' + j.company : '') + (bullets ? ': ' + bullets : '');
    }).join('\n');

    const educationSummary = (cvData.education || []).slice(0, 3).map(e =>
      '- ' + (e.degree || '') + (e.schoolName || e.school ? ' (' + (e.schoolName || e.school) + ')' : '')
    ).join('\n');

    // ── Cache-check: samma titel + jobb-summary → samma kompetenser ──
    const skillsCacheKey = aiCacheKey('skills', title, jobSummary.slice(0, 80));
    const cachedSkills = aiCacheGet(skillsCacheKey);
    if (cachedSkills && Array.isArray(cachedSkills) && cachedSkills.length) {
      cachedSkills.forEach(s => { if (!cvData.skills.includes(s)) cvData.skills.push(s); });
      saveCVLocal();
      renderSkillsChips();
      renderPreview();
      markStepDone('mer');
      toast('⚡ ' + cachedSkills.length + ' kompetenser från cache');
      logEvent('ai_skill_match', { title, source: 'cache', count: cachedSkills.length });
      return;
    }

    showAiLoader('Hämtar kompetenser...', 'AI analyserar dina jobb och utbildning');
    try {
      const userContent =
        'Baserat på följande CV, föreslå 6 relevanta yrkeskompetenser. Basera dig FRÄMST på användarens faktiska arbetslivserfarenhet — inte bara yrkestiteln.\n\n' +
        (title ? 'Önskad/nuvarande yrkestitel: ' + title + '\n\n' : '') +
        (jobSummary ? 'Arbetslivserfarenhet:\n' + jobSummary + '\n\n' : '') +
        (educationSummary ? 'Utbildning:\n' + educationSummary + '\n\n' : '') +
        'Ge 6 konkreta yrkeskompetenser (1-3 ord vardera) som direkt matchar jobberfarenheten ovan. Välj kompetenser som framgår TYDLIGT av arbetsuppgifterna. Svara ENBART med JSON: {"kompetenser": ["k1","k2","k3","k4","k5","k6"]}';

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: 'Du är en CV-expert. Svara ALLTID med giltig JSON och inget annat. Basera kompetenser på användarens faktiska arbetslivserfarenhet.',
          messages: [{ role: 'user', content: userContent }]
        })
      });
      if (!r.ok) throw new Error('API-fel ' + r.status);
      const data = await r.json();
      const raw = (data.content && data.content[0] && data.content[0].text || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      const skills = (parsed.kompetenser || []).slice(0, 6);
      if (!skills.length) throw new Error('Inga kompetenser');
      // Spara i cache för framtida anrop med samma titel/jobb
      aiCacheSet(skillsCacheKey, skills);
      // Slå ihop med existerande, dedupe
      skills.forEach(s => { if (!cvData.skills.includes(s)) cvData.skills.push(s); });
      saveCVLocal();
      renderSkillsChips();
      renderPreview();
      markStepDone('mer');
      hideAiLoader();
      toast('✨ ' + skills.length + ' kompetenser tillagda');
      logEvent('ai_skill_match', { title, source: 'ai', count: skills.length });
    } catch(e) {
      hideAiLoader();
      toast('Kunde inte hämta kompetenser: ' + e.message, 'error');
    }
  };

  // ============================================================
  // ============================================================
  // CV: LANGUAGES & LICENSES (chip-baserat + nivåer)
  // ============================================================

  // Normalisera cvData.languages — backward-compat med gamla string-arrays
  function normalizeLanguages() {
    if (!Array.isArray(cvData.languages)) cvData.languages = [];
    cvData.languages = cvData.languages.map(l => {
      if (typeof l === 'string') return { name: l, level: 'Flytande' };
      if (l && typeof l === 'object' && l.name) return { name: l.name, level: l.level || 'Flytande' };
      return null;
    }).filter(Boolean);
  }

  function renderLanguages() {
    normalizeLanguages();
    const chips = document.getElementById('languagesChips');
    if (!chips) return;
    if (!cvData.languages.length) { chips.innerHTML = ''; return; }
    chips.innerHTML = cvData.languages.map((l, idx) =>
      '<span class="lang-chip" data-level="' + escapeAttr(l.level) + '" onclick="cvEditLanguage(' + idx + ')">' +
        '<span class="lang-chip-dot"></span>' +
        '<span>' + escape(l.name) + '</span>' +
        '<span class="lang-chip-level">' + escape(l.level) + '</span>' +
        '<button class="chip-remove" onclick="event.stopPropagation(); cvRemoveLanguage(' + idx + ')">✕</button>' +
      '</span>'
    ).join('');
  }

  let _pendingLangName = null; // språk som väntar på nivå-val
  let _editingLangIdx = -1;    // -1 = lägger till, annars index som redigeras

  window.openLanguagePicker = function() {
    normalizeLanguages();
    const list = document.getElementById('languagePickerList');
    if (!list) return;
    const taken = new Set(cvData.languages.map(l => l.name));
    list.innerHTML = ALL_LANGUAGES.map(lang => {
      const isTaken = taken.has(lang);
      return '<div class="picker-option' + (isTaken ? ' selected' : '') + '" onclick="cvPickLanguage(\'' + escapeAttr(lang) + '\')">' +
        '<div class="picker-option-check"></div>' +
        '<span>' + escape(lang) + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('languagePicker').classList.add('open');
  };
  window.closeLanguagePicker = function() {
    document.getElementById('languagePicker').classList.remove('open');
  };

  window.cvPickLanguage = function(lang) {
    normalizeLanguages();
    const existingIdx = cvData.languages.findIndex(l => l.name === lang);
    if (existingIdx >= 0) {
      // Redan tillagt → ta bort
      cvData.languages.splice(existingIdx, 1);
      saveCVLocal();
      renderLanguages();
      renderPreview();
      // Uppdatera picker-lista
      openLanguagePicker();
      return;
    }
    // Nytt språk → öppna nivå-väljare
    _pendingLangName = lang;
    _editingLangIdx = -1;
    document.getElementById('languageLevelTitle').textContent = 'Välj nivå för ' + lang;
    document.getElementById('languagePicker').classList.remove('open');
    document.getElementById('languageLevelPicker').classList.add('open');
  };

  window.cvEditLanguage = function(idx) {
    normalizeLanguages();
    const l = cvData.languages[idx];
    if (!l) return;
    _pendingLangName = l.name;
    _editingLangIdx = idx;
    document.getElementById('languageLevelTitle').textContent = 'Ändra nivå för ' + l.name;
    document.getElementById('languageLevelPicker').classList.add('open');
  };

  window.setLanguageLevel = function(level) {
    if (!_pendingLangName) return;
    if (_editingLangIdx >= 0) {
      // Uppdatera befintligt språk
      cvData.languages[_editingLangIdx].level = level;
    } else {
      // Nytt språk
      cvData.languages.push({ name: _pendingLangName, level: level });
    }
    _pendingLangName = null;
    _editingLangIdx = -1;
    saveCVLocal();
    renderLanguages();
    renderPreview();
    closeLanguageLevelPicker();
    markStepDone('mer');
  };
  window.closeLanguageLevelPicker = function() {
    _pendingLangName = null;
    _editingLangIdx = -1;
    document.getElementById('languageLevelPicker').classList.remove('open');
  };

  window.cvRemoveLanguage = function(idx) {
    normalizeLanguages();
    cvData.languages.splice(idx, 1);
    saveCVLocal();
    renderLanguages();
    renderPreview();
  };

  // Gammal API för bakåtkompatibilitet — används av annan kod som kanske anropar det
  window.cvToggleLanguage = function(lang) {
    cvPickLanguage(lang);
  };

  // ───── KÖRKORT (utan nivåer, bara val) ─────
  function renderLicenses() {
    const chips = document.getElementById('licensesChips');
    if (!chips) return;
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    if (!cvData.licenses.length) { chips.innerHTML = ''; return; }
    chips.innerHTML = cvData.licenses.map((lic, idx) =>
      '<span class="chip">' +
        '<span>🚗 ' + escape(lic) + '</span>' +
        '<button class="chip-remove" onclick="cvRemoveLicense(' + idx + ')">✕</button>' +
      '</span>'
    ).join('');
  }

  window.openLicensePicker = function() {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    const list = document.getElementById('licensePickerList');
    if (!list) return;
    const taken = new Set(cvData.licenses);
    list.innerHTML = ALL_LICENSES.map(lic => {
      const isTaken = taken.has(lic);
      return '<div class="picker-option' + (isTaken ? ' selected' : '') + '" onclick="cvPickLicense(\'' + escapeAttr(lic) + '\')">' +
        '<div class="picker-option-check"></div>' +
        '<span>' + escape(lic) + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('licensePicker').classList.add('open');
  };
  window.closeLicensePicker = function() {
    document.getElementById('licensePicker').classList.remove('open');
  };

  window.cvPickLicense = function(lic) {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    const i = cvData.licenses.indexOf(lic);
    if (i >= 0) cvData.licenses.splice(i, 1);
    else cvData.licenses.push(lic);
    saveCVLocal();
    renderLicenses();
    renderPreview();
    // Uppdatera picker-vyn så kryss/avkryss syns direkt
    openLicensePicker();
    markStepDone('mer');
  };
  window.cvRemoveLicense = function(idx) {
    if (!Array.isArray(cvData.licenses)) cvData.licenses = [];
    cvData.licenses.splice(idx, 1);
    saveCVLocal();
    renderLicenses();
    renderPreview();
  };

  window.cvToggleLicense = function(lic) { cvPickLicense(lic); };

  // ============================================================
  // CV: PROFILTEXT (AI)
  // ============================================================
  window.cvClearSummary = function() {
    cvData.summary = '';
    document.getElementById('cv-summary').value = '';
    saveCVLocal();
    renderPreview();
    toast('Profiltext rensad');
  };

  window.cvAiSummary = async function() {
    const name = cvData.name || '';
    const title = cvData.title || '';
    const skills = (cvData.skills || []).join(', ');
    const jobs = (cvData.jobs || []);
    const education = (cvData.education || []);

    if (!title && !jobs.length) {
      toast('Fyll i en jobbtitel (Profil) eller lägg till minst ett jobb först', 'error');
      return;
    }

    // Bygg ett detaljerat kontext av alla jobb
    const jobSummary = jobs.slice(0, 5).map(j => {
      const bullets = [j.desc1, j.desc2, j.desc3].filter(Boolean).join(' | ');
      return '- ' + (j.title || '') + (j.company ? ' på ' + j.company : '') +
             (j.startYear ? ' (' + j.startYear + (j.endYear ? '–' + j.endYear : '') + ')' : '') +
             (bullets ? ': ' + bullets : '');
    }).join('\n');

    const educationSummary = education.slice(0, 3).map(e =>
      '- ' + (e.degree || '') + (e.schoolName || e.school ? ' (' + (e.schoolName || e.school) + ')' : '')
    ).join('\n');

    // ── Cache-check: samma titel + jobb + kompetenser → samma profiltext ──
    const profileCacheKey = aiCacheKey('summary', title, jobSummary.slice(0, 80), skills.slice(0, 40));
    const cachedSummary = aiCacheGet(profileCacheKey);
    if (cachedSummary && typeof cachedSummary === 'string' && cachedSummary.length > 20) {
      cvData.summary = cachedSummary;
      document.getElementById('cv-summary').value = cachedSummary;
      saveCVLocal();
      renderPreview();
      markStepDone('text');
      toast('⚡ Profiltext från cache');
      logEvent('profile_generated', { source: 'cache' });
      return;
    }

    showAiLoader('Skriver profiltext...', 'AI bygger en personlig presentation baserat på din bakgrund');
    try {
      const userContent =
        'Skriv en CV-profiltext på svenska i TVÅ stycken separerade med \\n\\n. Text-struktur som i matchade profiltexter — personlig och konkret.\n\n' +
        'Namn: ' + (name || '(okänt)') + '\n' +
        (title ? 'Önskad/nuvarande yrkestitel: ' + title + '\n' : '') +
        (jobSummary ? '\nArbetslivserfarenhet:\n' + jobSummary + '\n' : '') +
        (educationSummary ? '\nUtbildning:\n' + educationSummary + '\n' : '') +
        (skills ? '\nKompetenser: ' + skills + '\n' : '') +
        '\n===== SKRIVREGLER =====\n' +
        '• Skriv i FÖRSTA PERSON ("jag har...", "mitt arbete...")\n' +
        '• TVÅ stycken, separerade med \\n\\n:\n' +
        '  - Stycke 1 (3-4 meningar): vad du gjort, vilka konkreta erfarenheter du tar med dig. Referera till FAKTISKA företag och år från CV:t ovan.\n' +
        '  - Stycke 2 (2-3 meningar): vad du bidrar med och vad som driver dig. Kan avsluta med vad du söker nu eller hur du vill bidra.\n' +
        '• Blanda långa och korta meningar — naturligt flöde\n' +
        '• UNDVIK dessa AI-klichéer: "driven", "resultatorienterad", "utvecklat en kombination av", "direkt överförbara", "lugnt och metodiskt", "teamplayer", "passion för", "Med min erfarenhet av...", "Jag är en person som..."\n' +
        '• Skriv som en människa pratar — professionellt men äkta, som ett brev till en kollega\n' +
        '• Nämn KONKRETA saker (företagsnamn, antal år, specifika uppgifter) — inte abstrakta egenskaper\n\n' +
        'Returnera ENBART profiltexten — inga rubriker, inga bullets, ingen markdown, inga inledningsord som "Här är din text:".';

      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: 'Du är en svensk CV-coach som skriver profiltexter som INTE låter AI-genererade. Mänsklig, konkret, berättande svenska — inte corporate buzzwords. Du undviker ord som "driven", "resultatorienterad", "direkt överförbar", "lugnt och metodiskt", "teamplayer". Istället refererar du till konkreta saker personen gjort, som en vän som hjälper till. Alltid i FÖRSTA PERSON. Alltid i TVÅ stycken separerade med dubbel radbrytning.',
          messages: [{ role: 'user', content: userContent }]
        })
      });
      if (!r.ok) throw new Error('API-fel ' + r.status);
      const data = await r.json();
      const text = (data.content && data.content[0] && data.content[0].text || '').trim();
      if (!text) throw new Error('Tomt svar');

      cvData.summary = text;
      document.getElementById('cv-summary').value = text;
      saveCVLocal();
      renderPreview();
      markStepDone('text');
      hideAiLoader();
      // Spara i cache för framtida anrop med samma kontext
      aiCacheSet(profileCacheKey, text);
      toast('✨ Profiltext genererad');
      logEvent('profile_generated');
    } catch(e) {
      hideAiLoader();
      toast('Kunde inte generera: ' + e.message, 'error');
    }
  };

  // ============================================================
  // CV: PROFILTEXT — 3 ALTERNATIV (portad från mobilen)
  // ============================================================
  // Genererar 3 olika profiltextsförslag och visar dem i en modal där
  // användaren väljer det som passar bäst. Komplement till cvAiSummary
  // som ger ett enda direkt-svar.
  // ============================================================
  window.cvAiSummary3 = async function() {
    const title = (cvData.title || document.getElementById('cv-title').value || '').trim();
    const existingSummary = (cvData.summary || '').trim();

    // Om varken titel eller befintlig profiltext finns — kräv titel
    if (!title && !existingSummary) {
      toast('Skriv in en jobbtitel först', 'error');
      return;
    }
    const effectiveTitle = title || 'samma yrkestitel som tidigare';

    const jobSummary = (cvData.jobs || []).map(j =>
      j.title + (j.company ? ' på ' + j.company : '') +
      ([j.desc1, j.desc2, j.desc3].filter(Boolean).length
        ? ': ' + [j.desc1, j.desc2, j.desc3].filter(Boolean).join('; ')
        : '')
    ).join('\n') || 'Ingen arbetslivserfarenhet angiven';

    const skillsList = (cvData.skills || []).join(', ') || '';
    const eduList = (cvData.education || []).map(e =>
      [e.degree, e.schoolName || e.school].filter(Boolean).join(' på ')
    ).join(', ') || '';

    const firstName = (cvData.name || '').trim().split(' ')[0] || '';

    // ── Cache-check: samma kontext → samma 3 alternativ ──
    const cacheKey = aiCacheKey('summary3', effectiveTitle, jobSummary.slice(0, 80), skillsList.slice(0, 40));
    const cached = aiCacheGet(cacheKey);
    if (cached && Array.isArray(cached) && cached.length >= 1) {
      showSummaryAlternativesModal(cached);
      toast('⚡ Alternativ från cache', 'ai');
      logEvent('profile_generated', { source: 'cache', variant: '3-alt' });
      return;
    }

    const prompt = [
      'Du ska skriva 3 profiltexter på svenska för ett CV.',
      'Texterna ska kännas äkta, varma och mänskligt skrivna — INTE som AI-text.',
      '',
      'Info om personen:',
      firstName ? 'Förnamn: ' + firstName : '',
      'Sökt titel: ' + effectiveTitle,
      jobSummary ? 'Erfarenhet:\n' + jobSummary : '',
      skillsList ? 'Kompetenser: ' + skillsList : '',
      eduList    ? 'Utbildning: ' + eduList    : '',
      '',
      'VIKTIGA REGLER:',
      '- Skriv ALLTID i första person (jag/mig/min — ALDRIG "han/hon/de")',
      '- Varje alternativ: TVÅ stycken separerade med \\n\\n, totalt minst 120 ord',
      '- Stycke 1 (3-4 meningar): presentera dig, din bakgrund och dina styrkor',
      '- Stycke 2 (3-4 meningar): vad du bidrar med, vad som driver dig',
      firstName ? '- Alt 1 ska börja med "' + firstName + ' heter jag" eller liknande varm inledning' : '- Alt 1: varm, personlig inledning i jagform',
      '- Alt 2: börja med en konkret styrka eller passion, fortfarande i jagform',
      '- Alt 3: fokus på samarbete och vad du bidrar med, jagform',
      '- Naturligt talspråk, inte stelt "CV-språk"',
      '- Variera inledningarna kraftigt — inga upprepningar mellan alternativen',
      '- Basera enbart på given info, hitta inte på fakta',
      '- Undvik klichéer som "driven", "passionerad", "dedikerad", "resultatorienterad"',
      '',
      'Svara BARA med JSON: {"alternativ": ["text1\\n\\ntext2", "text1\\n\\ntext2", "text1\\n\\ntext2"]}'
    ].filter(Boolean).join('\n');

    showAiLoader('Genererar 3 profiltexter...', 'AI skapar olika varianter att välja mellan');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1200,
          system: 'Du är en svensk CV-coach som skriver profiltexter som INTE låter AI-genererade. Mänsklig, konkret, berättande svenska — inte corporate buzzwords. Alltid i FÖRSTA PERSON.',
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error('API-fel ' + response.status);

      const data = await response.json();
      const rawText = (data.content && data.content[0] && data.content[0].text || '')
        .trim().replace(/```json|```/g, '').trim();

      let parsed;
      try { parsed = JSON.parse(rawText); }
      catch(e) {
        // Fallback: hitta första {…}-blocket
        const m = rawText.match(/\{[\s\S]*\}/);
        if (!m) throw new Error('AI svarade i fel format');
        parsed = JSON.parse(m[0]);
      }

      const alts = (parsed.alternativ || []).filter(a => a && typeof a === 'string');
      if (alts.length < 1) throw new Error('Inga alternativ returnerades');

      // Spara i cache
      aiCacheSet(cacheKey, alts);

      hideAiLoader();
      showSummaryAlternativesModal(alts);
      logEvent('profile_generated', { source: 'ai', variant: '3-alt', count: alts.length });

    } catch(e) {
      hideAiLoader();
      console.error('[cvAiSummary3] Fel:', e);
      toast('Kunde inte generera alternativ: ' + (e.message || 'okänt fel'), 'error');
    }
  };

  // Visar de 3 alternativen i en modal — användaren väljer ett
  function showSummaryAlternativesModal(alts) {
    // Spara på window så selectProfileSummary kan läsa dem
    window.currentSummaryAlternatives = alts;

    const overlay = document.createElement('div');
    overlay.id = 'summaryAlternativesOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(10,12,28,0.85);display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);overflow-y:auto;';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    const card = document.createElement('div');
    card.style.cssText = 'max-width:720px;width:100%;background:#1a1f3a;border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:28px;color:#fff;font-family:inherit;max-height:90vh;overflow-y:auto;';

    let html =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
        '<div style="font-size:28px;">✨</div>' +
        '<div style="font-size:20px;font-weight:800;">Välj profiltext</div>' +
      '</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:20px;">' +
        'AI har skrivit ' + alts.length + ' alternativ. Klicka på det som känns mest som du.' +
      '</div>';

    alts.forEach((text, i) => {
      const escaped = (text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      html +=
        '<button class="summary-alt-btn" data-idx="' + i + '" style="' +
          'width:100%;padding:18px;margin-bottom:12px;' +
          'background:rgba(124,58,237,0.12);border:1.5px solid rgba(124,58,237,0.35);' +
          'border-radius:14px;color:#fff;cursor:pointer;font-family:inherit;text-align:left;' +
          'transition:all 0.15s;line-height:1.6;font-size:13px;">' +
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<span style="font-size:18px;">📋</span>' +
            '<strong style="font-size:13px;font-weight:800;color:#a78bfa;">Alternativ ' + (i + 1) + '</strong>' +
          '</div>' +
          '<div style="white-space:pre-wrap;color:rgba(255,255,255,0.92);">' + escaped + '</div>' +
        '</button>';
    });

    html +=
      '<button id="summaryAltCancelBtn" style="' +
        'margin-top:8px;width:100%;padding:14px;' +
        'background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);' +
        'border-radius:12px;color:rgba(255,255,255,0.7);font-size:14px;font-weight:700;' +
        'cursor:pointer;font-family:inherit;">Avbryt</button>';

    card.innerHTML = html;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Hover-effekter och klick-handlers
    card.querySelectorAll('.summary-alt-btn').forEach(btn => {
      btn.onmouseenter = () => { btn.style.background = 'rgba(124,58,237,0.22)'; btn.style.borderColor = 'rgba(124,58,237,0.55)'; };
      btn.onmouseleave = () => { btn.style.background = 'rgba(124,58,237,0.12)'; btn.style.borderColor = 'rgba(124,58,237,0.35)'; };
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx, 10);
        selectProfileSummary(idx);
      };
    });
    document.getElementById('summaryAltCancelBtn').onclick = () => overlay.remove();
  }

  // Sätter vald profiltext på CV:t (anropas från modal-knappen)
  window.selectProfileSummary = function(idx) {
    const alts = window.currentSummaryAlternatives;
    if (!alts || !alts[idx]) return;

    cvData.summary = alts[idx];
    const ta = document.getElementById('cv-summary');
    if (ta) ta.value = alts[idx];

    if (typeof saveCVLocal === 'function') saveCVLocal();
    if (typeof renderPreview === 'function') renderPreview();
    if (typeof markStepDone === 'function') markStepDone('text');

    // Stäng modalen
    const overlay = document.getElementById('summaryAlternativesOverlay');
    if (overlay) overlay.remove();

    toast('✨ Profiltext vald!', 'ai');
    logEvent('profile_selected', { idx });
  };

  // ============================================================
  // CV: TEMPLATES
  // ============================================================
  function renderTemplates() {
    const sel = document.getElementById('templateSelect');
    if (!sel) return;
    sel.innerHTML = TEMPLATES.map(t =>
      '<option value="' + t.id + '"' + (cvData.template === t.id ? ' selected' : '') + '>' +
        t.icon + '  ' + t.name +
      '</option>'
    ).join('');
    sel.value = cvData.template || 'classic';
  }

  window.cvSelectTemplate = function(id) {
    cvData.template = id;
    saveCVLocal();
    renderTemplates();
    renderPreview();
  };

  // ============================================================
  // CV: PREVIEW (live) — bygger EXAKT samma DOM som mobilen
  // så alla 10 mallar funkar pixelperfect.
  // ============================================================
  function renderPreview() {
    const doc = document.getElementById('cvDocument');
    if (!doc) return;
    // Mall-klass: alla mallar prefixas med "cv-" för att matcha mobilens CSS
    //   classic    → cv-classic
    //   minimal    → cv-minimal
    //   template-3 → cv-template-3
    //   template-N → cv-template-N
    const tpl = cvData.template || 'classic';
    const tplClass = 'cv-' + tpl;
    doc.className = 'cv-document ' + tplClass;

    const html = [];

    // ── HEADER ──
    const hasPhoto = cvData.showPhoto === true && !!cvData.photoData;
    html.push('<div class="cv-header">');
    // Foto-container finns alltid i DOM (för CSS som stylar header) men döljs om inget foto
    html.push('<div class="cv-header-photo" style="' + (hasPhoto ? 'display:block;' : 'display:none;') + '">');
    if (hasPhoto) {
      html.push('<img src="' + cvData.photoData + '" alt="Foto" style="display:block;">');
    }
    html.push('</div>');
    // Text-innehåll
    html.push('<div class="cv-header-content">');
    html.push('<div class="cv-name">' + escape(cvData.name || 'Ditt namn') + '</div>');
    if (cvData.title) html.push('<div class="cv-title">' + escape(cvData.title) + '</div>');
    const contact = [];
    if (cvData.email) contact.push('✉ ' + escape(cvData.email));
    if (cvData.phone) contact.push('📞 ' + escape(cvData.phone));
    if (contact.length) html.push('<div class="cv-contact">' + contact.join(' · ') + '</div>');
    html.push('</div>'); // end cv-header-content
    html.push('</div>'); // end cv-header

    // ── BODY ──
    html.push('<div class="cv-body">');

    // Summary
    if (cvData.summary) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Profil</div>');
      html.push('<div class="cv-summary">' + escape(cvData.summary) + '</div>');
      html.push('</div>');
    }

    // Jobs
    if (cvData.jobs.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Arbetslivserfarenhet</div>');
      cvData.jobs.forEach(j => {
        const period = formatJobPeriod(j) || ((j.startYear || '') + '–' + (j.endYear || 'nu'));
        const loc = j.location ? ' · ' + escape(j.location) : '';
        const descs = [j.desc1, j.desc2, j.desc3].filter(Boolean);
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(j.title || '') + '</div>');
        html.push('<div class="cv-entry-subtitle">' + escape(j.company || '') + ' · ' + escape(period) + loc + '</div>');
        if (descs.length) {
          html.push('<ul style="margin:8px 0 0 0; padding-left:16px; font-size:12px; color:#555; line-height:1.6;">');
          descs.forEach(d => html.push('<li style="margin-bottom:4px;">' + escape(d) + '</li>'));
          html.push('</ul>');
        } else if (j.desc) {
          html.push('<div style="font-size:12px; color:#555; line-height:1.6; margin-top:6px;">' + escape(j.desc) + '</div>');
        }
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Education
    if (cvData.education.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Utbildning</div>');
      cvData.education.forEach(e => {
        const from = formatPeriod(e.startMonth, e.startYear);
        const to = (e.ongoing || e.endYear === 'Pågående' || e.endYear === 'nu') ? 'nu' : formatPeriod(e.endMonth, e.endYear);
        const period = (from || to) ? (from || '') + '–' + (to || '') : '';
        const school = e.schoolName || e.school || '';
        const form = e.schoolForm ? ' (' + escape(e.schoolForm) + ')' : '';
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(e.degree || '') + '</div>');
        html.push('<div class="cv-entry-subtitle">' + escape(school) + form + (period ? ' · ' + escape(period) : '') + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Skills — chip-stil matchar mobilen
    if (cvData.skills.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Kompetenser</div>');
      html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
      cvData.skills.forEach(s => {
        html.push('<span style="display:inline-block; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' + escape(s) + '</span>');
      });
      html.push('</div>');
      html.push('</div>');
    }

    // Languages — chip-stil med formatet "Svenska – Modersmål"
    if (cvData.languages.length) {
      const langs = cvData.languages.map(l =>
        typeof l === 'string' ? { name: l, level: 'Flytande' } : l
      ).filter(l => l && l.name);
      if (langs.length) {
        html.push('<div class="cv-section">');
        html.push('<div class="cv-section-title">Språk</div>');
        html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
        langs.forEach(l => {
          const lvl = l.level || 'Flytande';
          html.push('<span style="display:inline-flex; align-items:baseline; gap:4px; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' +
            '<strong style="font-weight:700;">' + escape(l.name) + '</strong>' +
            '<span style="font-weight:500; opacity:0.7; font-style:italic;"> – ' + escape(lvl) + '</span>' +
          '</span>');
        });
        html.push('</div>');
        html.push('</div>');
      }
    }

    // Licenses — chip-stil
    if (cvData.licenses.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Körkort</div>');
      html.push('<div style="display:flex; flex-wrap:wrap; gap:6px;">');
      cvData.licenses.forEach(lic => {
        html.push('<span style="display:inline-block; background:rgba(26,26,46,0.07); border:1px solid rgba(26,26,46,0.15); border-radius:20px; padding:3px 12px; font-size:11px; font-weight:600; color:#1a1a2e; letter-spacing:0.2px; white-space:nowrap;">' + escape(lic) + '</span>');
      });
      html.push('</div>');
      html.push('</div>');
    }

    // Certifikat
    if (Array.isArray(cvData.certifications) && cvData.certifications.length) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Certifikat</div>');
      cvData.certifications.forEach(c => {
        const meta = [c.issuer, c.date].filter(Boolean).map(escape).join(' · ');
        html.push('<div class="cv-entry">');
        html.push('<div class="cv-entry-title">' + escape(c.name || '') + '</div>');
        if (meta) html.push('<div class="cv-entry-subtitle">' + meta + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Referenser
    const hasRefs = Array.isArray(cvData.references) && cvData.references.length;
    if (hasRefs || cvData.refOnRequest) {
      html.push('<div class="cv-section">');
      html.push('<div class="cv-section-title">Referenser</div>');
      if (cvData.refOnRequest && !hasRefs) {
        html.push('<div style="font-style:italic; color:#666; font-size:12.5px;">Referenser lämnas på begäran</div>');
      } else if (hasRefs) {
        cvData.references.forEach(r => {
          const contactLine = [r.email, r.phone].filter(Boolean).map(escape).join(' · ');
          html.push('<div class="cv-entry">');
          html.push('<div class="cv-entry-title">' + escape(r.name || '') + '</div>');
          if (r.title) html.push('<div class="cv-entry-subtitle">' + escape(r.title) + '</div>');
          if (contactLine) html.push('<div class="cv-entry-subtitle" style="opacity:0.85;">' + contactLine + '</div>');
          html.push('</div>');
        });
        if (cvData.refOnRequest) {
          html.push('<div style="font-style:italic; color:#666; font-size:12px; margin-top:8px;">Ytterligare referenser lämnas på begäran</div>');
        }
      }
      html.push('</div>');
    }

    html.push('</div>'); // end cv-body

    doc.innerHTML = html.join('');
  }

  // ============================================================
  // CV-PICKER: välj bland sparade CV (3 max) eller starta nytt
  // Speglar mobilens mobShowCVPicker-flow
  // ============================================================
  window.cvShowPicker = function() {
    const existing = document.getElementById('_cvPickerOverlay');
    if (existing) existing.remove();

    const saved = pfGetSaved();
    const MAX = MAX_SAVED_CVS;

    // Bygg slots: sparade + tomma "Nytt CV"-slots upp till MAX
    const slots = [];
    for (let i = 0; i < MAX; i++) {
      if (i < saved.length) slots.push({ type: 'saved', cv: saved[i] });
      else slots.push({ type: 'new' });
    }

    const overlay = document.createElement('div');
    overlay.id = '_cvPickerOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(6px);';
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    const drawer = document.createElement('div');
    drawer.style.cssText = 'background:#1a1a2e;border:1.5px solid rgba(255,255,255,0.08);border-radius:20px;padding:28px 24px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,0.5);max-height:90vh;overflow-y:auto;';

    drawer.innerHTML =
      '<div style="font-size:20px;font-weight:900;color:#fff;margin-bottom:14px;letter-spacing:-0.3px;">📄 Dina CV:n</div>' +
      '<div style="background:rgba(62,180,137,0.07);border:1px solid rgba(62,180,137,0.2);border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7;">' +
        'Du fyller i namn, jobb och utbildning — <span style="color:#3eb489;font-weight:700;">AI skriver din profiltext</span>, föreslår kompetenser och hjälper med arbetsuppgifter. ' +
        'Välj bland <span style="color:#3eb489;font-weight:700;">10+ mallar</span> och spara som PDF. ' +
        'Du kan ha upp till <span style="color:#fff;font-weight:700;">3 olika CV</span> — ett per yrkesroll. ' +
        'Alla CV sparas under <span style="color:#3eb489;font-weight:700;">👤 Profil</span> och kan öppnas, redigeras eller delas när som helst.' +
      '</div>';

    const slotsDiv = document.createElement('div');
    slotsDiv.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    slots.forEach(function(slot) {
      const row = document.createElement('div');
      if (slot.type === 'saved') {
        const cv = slot.cv;
        const date = cv.savedAt
          ? new Date(cv.savedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' })
          : '';
        row.style.cssText = 'display:flex;align-items:center;gap:10px;';

        // Öppna-knapp (huvuddelen av raden)
        const btn = document.createElement('button');
        btn.style.cssText = 'flex:1;padding:14px 16px;background:rgba(62,180,137,0.1);border:1.5px solid rgba(62,180,137,0.35);border-radius:14px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:inherit;text-align:left;min-width:0;transition:all 0.15s;';
        btn.onmouseenter = () => { btn.style.background = 'rgba(62,180,137,0.18)'; };
        btn.onmouseleave = () => { btn.style.background = 'rgba(62,180,137,0.1)'; };
        btn.innerHTML =
          '<div style="width:44px;height:44px;border-radius:12px;background:rgba(62,180,137,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📄</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:14px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escape(cv.title || 'Namnlöst CV') + '</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:3px;">' +
              ((cv.data && cv.data.name) ? escape(cv.data.name) + ' · ' : '') + escape(date) +
            '</div>' +
          '</div>' +
          '<span style="font-size:12px;font-weight:700;color:#3eb489;background:rgba(62,180,137,0.15);border:1px solid rgba(62,180,137,0.3);border-radius:8px;padding:6px 12px;white-space:nowrap;flex-shrink:0;">👁 Öppna</span>';
        btn.onclick = function() {
          overlay.remove();
          if (typeof window.pfOpenSaved === 'function') {
            window.pfOpenSaved(cv.id);
          }
        };

        // Ta bort-knapp
        const delBtn = document.createElement('button');
        delBtn.style.cssText = 'flex-shrink:0;width:46px;height:46px;background:rgba(220,38,38,0.1);border:1.5px solid rgba(220,38,38,0.3);border-radius:12px;color:rgba(252,165,165,0.9);font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.15s;';
        delBtn.innerHTML = '🗑';
        delBtn.title = 'Ta bort detta CV';
        delBtn.onmouseenter = () => { delBtn.style.background = 'rgba(220,38,38,0.2)'; };
        delBtn.onmouseleave = () => { delBtn.style.background = 'rgba(220,38,38,0.1)'; };
        delBtn.onclick = function() {
          if (!confirm('Ta bort "' + (cv.title || 'CV') + '"?\n\nDetta går inte att ångra.')) return;
          if (typeof window.pfDeleteSaved === 'function') {
            window.pfDeleteSaved(cv.id);
          }
          overlay.remove();
          // Visa picker igen så användaren ser uppdaterad lista
          setTimeout(() => {
            const stillHas = pfGetSaved().length > 0;
            if (stillHas) cvShowPicker();
          }, 100);
        };

        row.appendChild(btn);
        row.appendChild(delBtn);
      } else {
        // Tomt slot = "Nytt CV"-knapp
        const btn = document.createElement('button');
        btn.style.cssText = 'width:100%;padding:14px 16px;background:rgba(255,255,255,0.03);border:1.5px dashed rgba(255,255,255,0.15);border-radius:14px;display:flex;align-items:center;gap:12px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s;';
        btn.onmouseenter = () => { btn.style.background = 'rgba(255,255,255,0.06)'; btn.style.borderColor = 'rgba(255,255,255,0.25)'; };
        btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,0.03)'; btn.style.borderColor = 'rgba(255,255,255,0.15)'; };
        btn.innerHTML =
          '<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">➕</div>' +
          '<div style="flex:1;">' +
            '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.7);">Skapa nytt CV</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:2px;">Behåller jobb och utbildning</div>' +
          '</div>';
        btn.onclick = function() {
          overlay.remove();
          // Använd bekräftelse-modal — behåller jobb/utbildning/språk/körkort/cert/refs
          if (typeof window.nyttCV === 'function') {
            window.nyttCV();
          } else {
            // Fallback: gamla beteendet (rensar allt) om nyttCV inte finns
            cvData = createEmptyCV();
            saveCVLocal();
            loadCVIntoForm();
            renderJobs(); renderEducation();
            renderSkillsChips(); renderLanguages(); renderLicenses();
            renderTemplates();
            renderPreview();
            cvSwitchStep('profil');
            toast('🎯 Nytt CV startat — fyll i informationen');
          }
        };
        row.appendChild(btn);
      }
      slotsDiv.appendChild(row);
    });

    drawer.appendChild(slotsDiv);

    // Stäng-knapp
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'margin-top:18px;width:100%;padding:14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);border-radius:14px;color:rgba(255,255,255,0.6);font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;';
    closeBtn.textContent = 'Stäng — fortsätt med nuvarande CV';
    closeBtn.onclick = function() { overlay.remove(); };
    drawer.appendChild(closeBtn);

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);
  };

  // ============================================================
  // CV: SAVE
  // ============================================================
  window.cvSaveAndStore = async function() {
    saveCVLocal();

    // Validera innan vi sparar version till listan
    const title = (cvData.title || '').trim();
    if (!cvData.name) {
      toast('Fyll i ditt namn först', 'error');
      cvSwitchStep('profil');
      return;
    }
    if (!title) {
      toast('Fyll i en yrkestitel först', 'error');
      cvSwitchStep('profil');
      return;
    }

    // Lägg till / uppdatera i listan över sparade CV:n (max 3, samma logik som mobilen)
    const list = pfGetSaved();
    const existing = list.findIndex(c => c.title === title);
    const snapshot = {
      id: existing >= 0 ? list[existing].id : 'cv_' + Date.now(),
      title: title,
      savedAt: Date.now(),
      data: JSON.parse(JSON.stringify(cvData))
    };

    if (existing >= 0) {
      list[existing] = snapshot;
      pfPutSaved(list);
    } else if (list.length >= MAX_SAVED_CVS) {
      // Lista full — fråga om äldsta ska ersättas
      list.sort((a, b) => a.savedAt - b.savedAt);
      const oldest = list[0];
      const oldestDate = new Date(oldest.savedAt).toLocaleDateString('sv-SE',
        { day: 'numeric', month: 'long' });
      const ok = confirm(
        'Du har redan ' + MAX_SAVED_CVS + ' sparade CV:n.\n\n' +
        'Vill du ersätta det äldsta ("' + oldest.title + '" sparat ' + oldestDate + ') ' +
        'med detta nya?'
      );
      if (!ok) {
        toast('CV inte sparat', 'error');
        return;
      }
      const filtered = list.filter(c => c.id !== oldest.id);
      filtered.push(snapshot);
      pfPutSaved(filtered);
    } else {
      list.push(snapshot);
      pfPutSaved(list);
    }

    logEvent('cv_saved', { title: title });

    // Synka till molnet
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      toast('✅ CV sparat lokalt. Logga in för molnsynk.');
      if (currentView === 'profil') renderProfilView();
      return;
    }

    showAiLoader('Sparar i molnet...', 'Synkar med dina enheter');
    try {
      // Använd sbCall så token auto-refreshas + 401 hanteras snyggt
      // OBS: action heter 'save_cv' (snake_case) — det är vad backend förstår
      const result = await sbCall({
        action: 'save_cv',
        userId: auth.userId,
        cvData: cvData
      });

      // Synka även listan över sparade CV:n (kan failsafe ignoreras om den funktionen saknas)
      try { sbSync('saved_cvs', pfGetSaved()); } catch(_) {}

      hideAiLoader();
      if (result && !result.error) {
        toast('✅ CV sparat — synligt på alla enheter');
      } else if (result && result.error === 'not_authenticated') {
        toast('Sparat lokalt — logga in igen för molnsynk', 'error');
      } else {
        // Logga vad servern faktiskt returnerade så det går att debugga
        console.warn('saveCV cloud-fel:', result);
        toast('Sparat lokalt, molnsynk misslyckades', 'error');
      }
    } catch(e) {
      hideAiLoader();
      console.error('saveCV exception:', e);
      toast('Sparat lokalt, nätverksfel', 'error');
    }

    if (currentView === 'profil') renderProfilView();
  };

  // ============================================================
  // CV: PDF EXPORT
  // ============================================================
  window.cvExportPDF = async function() {
    if (!window.jspdf) {
      toast('PDF-bibliotek laddar fortfarande, försök igen', 'error');
      return;
    }
    if (!cvData.name) {
      toast('Lägg till åtminstone ditt namn först', 'error');
      cvSwitchStep('profil');
      return;
    }

    showAiLoader('Genererar PDF...', 'Detta tar några sekunder');
    try {
      const { jsPDF } = window.jspdf;
      const cvDoc = document.getElementById('cvDocument');

      // Klona för att rendera fritt utan layout-begränsningar
      const clone = cvDoc.cloneNode(true);
      clone.style.cssText = 'position:absolute; left:-9999px; top:0; width:794px; padding:0; background:#fff; color:#1a1a2e; font-size:13px; line-height:1.5; border-radius:0; box-shadow:none; overflow:hidden;';
      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 400));

      // ─────────────────────────────────────────────────────────────
      // STEG 1: KARTLÄGG SÄKRA BRYTPUNKTER
      // En säker brytpunkt är toppen av en .cv-section (rubrik följer med sitt
      // innehåll) eller en .cv-entry (hel jobbpost hålls intakt). Vi samlar
      // Y-koordinaten i clone-koordinatsystemet för varje sådant element.
      // ─────────────────────────────────────────────────────────────
      const cloneRect = clone.getBoundingClientRect();
      const safePointsDomPx = [];
      clone.querySelectorAll('.cv-section, .cv-entry').forEach(el => {
        const rect = el.getBoundingClientRect();
        const y = Math.round(rect.top - cloneRect.top);
        if (y > 0) safePointsDomPx.push(y);
      });
      // Dedupe + sortera stigande
      const uniqueDomPoints = [...new Set(safePointsDomPx)].sort((a, b) => a - b);

      // ─────────────────────────────────────────────────────────────
      // STEG 2: RENDERA TILL CANVAS
      // ─────────────────────────────────────────────────────────────
      const scale = 2;
      const canvas = await html2canvas(clone, {
        scale: scale, useCORS: true, backgroundColor: '#ffffff', logging: false,
        width: 794, windowHeight: clone.scrollHeight
      });

      // Konvertera brytpunkter till canvas-pixlar (skalade)
      const canvasBreakPoints = uniqueDomPoints.map(p => p * scale);

      document.body.removeChild(clone);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageW = 210, pageH = 297, margin = 0;
      const imgW = pageW - margin * 2;
      const contentH = pageH - margin * 2;
      const pageHpx = (contentH * canvas.width) / imgW;

      const imgH = canvas.height * imgW / canvas.width;
      const fullImgData = canvas.toDataURL('image/jpeg', 0.92);

      if (imgH <= contentH) {
        // Allt får plats på en sida
        pdf.addImage(fullImgData, 'JPEG', margin, margin, imgW, imgH);
      } else {
        // ─────────────────────────────────────────────────────────
        // STEG 3: SMART MULTI-PAGE SLICING
        // Bryt vid närmaste säkra brytpunkt (rubrik/post-start) istället
        // för vid fast höjd. Regler:
        //   - Aldrig mitt i en .cv-entry
        //   - Aldrig en ensam rubrik (break FÖRE .cv-section håller ihop)
        //   - OK att bryta mellan två .cv-entry i samma sektion
        // ─────────────────────────────────────────────────────────
        let srcY = 0;
        let pageNum = 0;
        const MIN_PAGE_CONTENT = 50; // undviker oändlig loop om brytpunkt ligger direkt vid srcY

        while (srcY < canvas.height - 1) {
          const theoreticalEnd = srcY + pageHpx;
          let pageEnd;

          if (theoreticalEnd >= canvas.height) {
            // Sista sidan — ta resten
            pageEnd = canvas.height;
          } else {
            // Hitta största säkra brytpunkt som är:
            //   - tillräckligt efter srcY (inte bara en pixel senare)
            //   - före eller vid teoretisk sid-slut
            const validBreaks = canvasBreakPoints.filter(
              p => p > srcY + MIN_PAGE_CONTENT && p <= theoreticalEnd
            );
            if (validBreaks.length > 0) {
              // Välj LARGEST — packa så mycket som möjligt på sidan
              pageEnd = validBreaks[validBreaks.length - 1];
            } else {
              // Ingen säker brytpunkt inom rimligt avstånd → hård brytning.
              // Händer bara om en enskild post är större än en A4-sida.
              pageEnd = theoreticalEnd;
              console.warn('[PDF] Ingen säker brytpunkt hittad för sida ' + (pageNum + 1) + ', hårdbryts');
            }
          }

          const sliceH = pageEnd - srcY;

          if (pageNum > 0) pdf.addPage();

          const tmp = document.createElement('canvas');
          tmp.width = canvas.width;
          tmp.height = sliceH;
          const ctx = tmp.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, tmp.width, tmp.height);
          ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
          const sliceImg = tmp.toDataURL('image/jpeg', 0.92);
          const sliceMm = (sliceH / canvas.width) * imgW;
          pdf.addImage(sliceImg, 'JPEG', margin, margin, imgW, sliceMm);

          srcY = pageEnd;
          pageNum++;

          // Säkerhet: avbryt om något gått fel och vi loopar i evighet
          if (pageNum > 20) {
            console.error('[PDF] Abort: >20 sidor — fel i pagineringen');
            break;
          }
        }
      }

      const fileName = (cvData.name || 'CV').replace(/\s+/g, '_') + '_' + new Date().getFullYear() + '.pdf';
      pdf.save(fileName);
      hideAiLoader();
      toast('📥 PDF nedladdad: ' + fileName);
      logEvent('cv_exported');
    } catch(e) {
      hideAiLoader();
      toast('Export misslyckades: ' + e.message, 'error');
      console.error(e);
    }
  };

  // ============================================================
  // PROFIL — sparade & matchade CV:n
  // (samma datastrukturer som mobilen: pathfinder_saved_cvs / pathfinder_matched_cvs)
  // ============================================================
  function pfGetSaved() {
    try {
      const raw = safeGet(SAVED_CVS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function pfPutSaved(list) {
    safeSet(SAVED_CVS_KEY, JSON.stringify(list));
    sbSync('saved_cvs', list);
  }

  function pfGetMatched() {
    try {
      const raw = safeGet(MATCHED_CVS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function pfPutMatched(list) {
    safeSet(MATCHED_CVS_KEY, JSON.stringify(list));
    sbSync('matched_cvs', list);
  }

  function pfMatchedActiveList() {
    const now = Date.now();
    return pfGetMatched().filter(cv => now - (cv.savedAt || 0) < MATCHED_TTL_MS);
  }

  function pfMatchedDaysLeft(cv) {
    const ms = MATCHED_TTL_MS - (Date.now() - (cv.savedAt || 0));
    return Math.max(1, Math.ceil(ms / (24 * 3600 * 1000)));
  }

  // Supabase-synk för listor (saved_cvs, matched_cvs).
  // Mobilen använder samma action 'save_table' med {table, data}.
  // Tystfailar om ej inloggad eller nätverksfel.
  let _sbSyncTimers = {};
  function sbSync(table, data) {
    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) return;
    clearTimeout(_sbSyncTimers[table]);
    _sbSyncTimers[table] = setTimeout(() => {
      // sbCall sköter token-refresh + 401-hantering automatiskt
      sbCall({
        action: 'save_table',
        userId: auth.userId,
        table: table,
        data: data
      }).catch(() => {});
    }, 1500);
  }

  // ── Format & escape ────────────────────────────────────────
  function pfFormatDate(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    today.setHours(0,0,0,0);
    const that = new Date(ts); that.setHours(0,0,0,0);
    const diff = Math.round((today - that) / (24*3600*1000));
    if (diff === 0) return 'Idag';
    if (diff === 1) return 'Igår';
    if (diff < 7)   return diff + ' dagar sedan';
    return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ── Render ─────────────────────────────────────────────────
  // Nuvarande aktiv detaljvy: 'saved' | 'matched' | 'diary' | null
  let pfActiveTile = null;

  function renderProfilView() {
    // Email
    const auth = getAuth();
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = (auth && auth.email) ? auth.email : 'Inte inloggad';

    // Tasks — ladda innan vi bygger grid
    if (!tasksLoadedOnce && typeof loadMyTasks === 'function') loadMyTasks(true);
    else if (typeof loadMyTasks === 'function') loadMyTasks(true);

    renderProfilHub();
    renderProfilDetail();
  }

  function renderProfilHub() {
    const grid = document.getElementById('pfHubGrid');
    if (!grid) return;

    const saved   = pfGetSaved() || [];
    const matched = pfMatchedActiveList() || [];
    const tasks   = (window._myTasks && Array.isArray(window._myTasks)) ? window._myTasks : [];
    const pendingTasks = tasks.filter(t => !t.done).length;
    const diary   = (typeof getDiary === 'function') ? (getDiary() || []).filter(e => e.applied) : [];

    // Övningar-procent
    let ovnPct = 0;
    if (typeof window.getOvningsPct === 'function') ovnPct = window.getOvningsPct();

    // Sparade utbildningar
    let eduSaved = [];
    try { eduSaved = JSON.parse(localStorage.getItem('cvmatchen_edu_saved') || '[]'); } catch(e) {}

    // Dagar kvar för matchade
    let soonestDays = null;
    if (matched.length) {
      soonestDays = Math.min.apply(null, matched.map(pfMatchedDaysLeft));
    }

    const tiles = [
      {
        id: 'tasks',
        emoji: '✅',
        label: 'Uppgifter<br>från handläggare',
        count: pendingTasks,
        badge: pendingTasks,
        variant: ''
      },
      {
        id: 'saved',
        emoji: '📄',
        label: 'Mina CV',
        count: saved.length,
        max: MAX_SAVED_CVS,
        variant: ''
      },
      {
        id: 'matched',
        emoji: '🎯',
        label: 'Mina matchningar',
        count: matched.length,
        badge: matched.length,
        badgeDays: soonestDays,
        variant: ''
      },
      {
        id: 'ovningar',
        emoji: '🏋️',
        label: 'Övningar',
        counterText: ovnPct + '% klarat',
        variant: 'variant-ovningar',
        clickAction: "switchView('ovningar')"
      },
      {
        id: 'edu',
        emoji: '🎓',
        label: 'Sparade<br>utbildningar',
        count: eduSaved.length,
        counterText: eduSaved.length > 0 ? eduSaved.length + ' sparad' + (eduSaved.length > 1 ? 'e' : '') : '0 sparade',
        badge: eduSaved.length,
        variant: 'variant-utbildningar',
        clickAction: "switchView('aisyv')"
      },
      {
        id: 'diary',
        emoji: '💼',
        label: 'Sökta<br>arbeten',
        count: diary.length,
        variant: ''
      },
      {
        id: 'settings',
        emoji: '⚙️',
        label: 'Avtal &<br>inställningar',
        counterText: 'Villkor · GDPR',
        variant: 'variant-settings'
      }
    ];

    grid.innerHTML = tiles.map(t => {
      const isActive = pfActiveTile === t.id;
      const activeCls = isActive ? ' active' : '';
      const clickAttr = t.clickAction ? 'onclick="' + t.clickAction + '"' : 'onclick="pfSetActiveTile(\'' + t.id + '\')"';

      const badgeCorner = (t.badge && t.badge > 0)
        ? '<div class="pf-hub-tile-red-badge">' + t.badge + '</div>'
        : '';

      let counter;
      if (t.counterText) {
        counter = '<div class="pf-hub-tile-badge-count">' + t.counterText + '</div>';
      } else {
        counter = '<div class="pf-hub-tile-badge-count">' + t.count + (t.max ? '/' + t.max : '') + '</div>';
      }

      let urgent = '';
      if (t.id === 'matched' && t.badgeDays !== null && t.badgeDays <= 7 && t.count > 0) {
        urgent = '<div class="pf-hub-tile-urgent">' + t.count + ' ann. försvinner om ' + t.badgeDays + ' dag' + (t.badgeDays === 1 ? '' : 'ar') + '</div>';
      } else if (t.id === 'matched' && t.count > 0) {
        urgent = '<div class="pf-hub-tile-subnote">' + t.count + ' aktiv' + (t.count === 1 ? '' : 'a') + '</div>';
      }

      return '<div class="pf-hub-tile ' + (t.variant || '') + activeCls + '" ' + clickAttr + '>' +
        badgeCorner +
        '<div class="pf-hub-tile-emoji">' + t.emoji + '</div>' +
        '<div class="pf-hub-tile-label">' + t.label + '</div>' +
        counter +
        urgent +
        '</div>';
    }).join('');
  }

  window.pfSetActiveTile = function(tileId) {
    // Toggla av om samma tile klickas igen
    if (pfActiveTile === tileId) {
      pfActiveTile = null;
    } else {
      pfActiveTile = tileId;
    }
    renderProfilHub();
    renderProfilDetail();
  };

  function renderProfilDetail() {
    const area = document.getElementById('pfDetailArea');
    if (!area) return;

    if (!pfActiveTile) {
      area.innerHTML = '';
      return;
    }

    if (pfActiveTile === 'tasks')    { area.innerHTML = renderProfilTasksDetail(); return; }
    if (pfActiveTile === 'saved')    { area.innerHTML = renderProfilSavedDetail(); return; }
    if (pfActiveTile === 'matched')  { area.innerHTML = renderProfilMatchedDetail(); return; }
    if (pfActiveTile === 'diary')    { area.innerHTML = renderProfilDiaryDetail(); return; }
    if (pfActiveTile === 'settings') { area.innerHTML = renderProfilSettingsDetail(); return; }
  }

  function renderProfilTasksDetail() {
    const tasks = (window._myTasks && Array.isArray(window._myTasks)) ? window._myTasks : [];
    const pending = tasks.filter(t => !t.done);

    let html = '<div class="pf-detail-header"><div class="pf-detail-title">✅ Uppgifter från handläggare</div></div>';
    if (!pending.length) {
      html += '<div class="pf-detail-empty"><div class="pf-detail-empty-icon">✅</div>' +
        '<div class="pf-detail-empty-text">Du har inga uppgifter just nu.<br>Uppgifter från din handläggare dyker upp här.</div></div>';
    } else {
      // Delegera till befintliga renderTasksInProfil om den finns — den bygger till pfTasksList
      // Men eftersom vi ändrat DOM'en, skapa en enkel lista inline
      html += '<div id="pfTasksList" class="task-list"></div>';
      setTimeout(() => {
        if (typeof renderTasksInProfil === 'function') renderTasksInProfil();
      }, 0);
    }
    return html;
  }

  function renderProfilSavedDetail() {
    const list = pfGetSaved() || [];
    let html = '<div class="pf-detail-header"><div class="pf-detail-title">📄 Mina CV (' + list.length + '/' + MAX_SAVED_CVS + ')</div></div>';

    if (!list.length) {
      html += '<div class="pf-detail-empty"><div class="pf-detail-empty-icon">📄</div>' +
        '<div class="pf-detail-empty-text">Du har inga sparade CV:n än.<br>Bygg ett CV och tryck <strong>Spara CV</strong>.</div>' +
        '<button class="pf-empty-cta" onclick="switchView(\'cv\')" style="margin-top:14px;">Bygg ditt första CV →</button></div>';
      return html;
    }

    const sorted = list.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    sorted.forEach(cv => {
      const title = escape(cv.title || 'Utan titel');
      const name  = escape((cv.data && cv.data.name) || '');
      const date  = pfFormatDate(cv.savedAt);
      html += '<div class="pf-detail-card">' +
        '<div class="pf-detail-card-icon"><span style="color:#f0c040;">CV</span><span style="color:#fff;">m</span></div>' +
        '<div class="pf-detail-card-info">' +
          '<div class="pf-detail-card-title">' + title + '</div>' +
          '<div class="pf-detail-card-meta">' + (name ? name + ' · ' : '') + escape(date) + '</div>' +
        '</div>' +
        '<div class="pf-detail-card-actions">' +
          '<button class="pf-card-btn primary" onclick="pfOpenSaved(\'' + cv.id + '\')">Öppna</button>' +
          '<button class="pf-card-btn" onclick="pfExportSaved(\'' + cv.id + '\')">📤 PDF</button>' +
          '<button class="pf-card-btn danger" onclick="pfDeleteSaved(\'' + cv.id + '\')" title="Ta bort">✕</button>' +
        '</div>' +
      '</div>';
    });
    return html;
  }

  function renderProfilMatchedDetail() {
    const active = pfMatchedActiveList() || [];
    let html = '<div class="pf-detail-header"><div class="pf-detail-title">🎯 Mina matchningar (' + active.length + ')</div></div>';

    if (!active.length) {
      html += '<div class="pf-detail-empty"><div class="pf-detail-empty-icon">🎯</div>' +
        '<div class="pf-detail-empty-text">Inga matchningar än.<br>Gå till <strong>Matcha</strong> och matcha ditt CV mot ett jobb.<br><span style="font-size:11px;opacity:0.6;">Matchade CV:n sparas i 14 dagar.</span></div></div>';
      return html;
    }

    const sorted = active.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    sorted.forEach((cv, idx) => {
      const title   = escape(cv.title || 'Utan titel').replace('Matchat CV – ', '');
      const company = escape(cv.company || '');
      const days    = pfMatchedDaysLeft(cv);
      const urgent  = days <= 3;
      const jobUrlBtn = cv.jobUrl
        ? '<a href="' + escape(cv.jobUrl) + '" target="_blank" rel="noopener" class="pf-card-btn" style="text-decoration:none;text-align:center;" onclick="event.stopPropagation()">↗ Annons</a>'
        : '';

      html += '<div class="pf-detail-card matched">' +
        '<div class="pf-detail-card-icon" style="background:rgba(62,180,137,0.18);">🎯</div>' +
        '<div class="pf-detail-card-info">' +
          '<div class="pf-detail-card-title">' + title + '</div>' +
          '<div class="pf-detail-card-meta">' + (company ? company + ' · ' : '') +
            '<span style="color:' + (urgent ? '#ef4444' : 'rgba(255,255,255,0.45)') + ';">' +
            days + ' dag' + (days === 1 ? '' : 'ar') + ' kvar</span></div>' +
        '</div>' +
        '<div class="pf-detail-card-actions">' +
          '<button class="pf-card-btn primary" onclick="pfOpenMatched(\'' + cv.id + '\')">Öppna</button>' +
          '<button class="pf-card-btn" onclick="pfExportMatched(\'' + cv.id + '\')">📤 PDF</button>' +
          jobUrlBtn +
          '<button class="pf-card-btn danger" onclick="pfDeleteMatched(\'' + cv.id + '\')" title="Ta bort">✕</button>' +
        '</div>' +
      '</div>';
    });
    return html;
  }

  function renderProfilDiaryDetail() {
    const diary = (typeof getDiary === 'function') ? (getDiary() || []).filter(e => e.applied) : [];
    let html = '<div class="pf-detail-header"><div class="pf-detail-title">💼 Sökta arbeten (' + diary.length + ')</div></div>';

    if (!diary.length) {
      html += '<div class="pf-detail-empty"><div class="pf-detail-empty-icon">💼</div>' +
        '<div class="pf-detail-empty-text">Inga sökta arbeten än.<br>Tryck <strong>"Jag har sökt detta"</strong> i Mina matchningar för att spara ett jobb här.</div></div>';
      return html;
    }

    const sorted = diary.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
    sorted.forEach(e => {
      const title = escape(e.jobTitle || 'Okänt jobb');
      const comp  = escape(e.company || '');
      const date  = pfFormatDate(e.savedAt);
      html += '<div class="pf-detail-card">' +
        '<div class="pf-detail-card-icon" style="background:rgba(255,255,255,0.08);">💼</div>' +
        '<div class="pf-detail-card-info">' +
          '<div class="pf-detail-card-title">' + title + '</div>' +
          '<div class="pf-detail-card-meta">' + (comp ? comp + ' · ' : '') + 'Sökt ' + escape(date) + '</div>' +
        '</div>' +
        (e.jobUrl
          ? '<a class="pf-card-btn" href="' + escape(e.jobUrl) + '" target="_blank" rel="noopener" style="text-decoration:none;">↗ Annons</a>'
          : '') +
      '</div>';
    });

    // Export-knapp för aktivitetsrapport (Arbetsförmedlingen)
    html += '<div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.08);">' +
      '<button onclick="diaryExport()" class="btn btn-secondary" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;">' +
        '📋 Exportera aktivitetsrapport' +
      '</button>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:8px;text-align:center;line-height:1.5;">' +
        'Sammanställer alla sökta jobb veckovis — användbart för Arbetsförmedlingen' +
      '</div>' +
    '</div>';

    return html;
  }

  // ============================================================
  // JOBBDAGBOK — getDiary + diaryExport (portad från mobilen)
  // ============================================================
  // Läser jobbdagboken från localStorage med 45 dagars TTL.
  // Samma nyckel som mobilen ('pathfinder_job_diary') så datan delas.
  if (typeof window.getDiary !== 'function') {
    window.getDiary = function() {
      const TTL = 45 * 24 * 3600 * 1000;
      try {
        return JSON.parse(localStorage.getItem('pathfinder_job_diary') || '[]')
          .filter(e => Date.now() - e.savedAt < TTL);
      } catch(e) { return []; }
    };
  }

  // Exporterar aktivitetsrapport som text — försöker dela via Web Share API,
  // faller tillbaka till clipboard, sist en prompt-dialog.
  window.diaryExport = function() {
    const allDiary = (typeof getDiary === 'function') ? getDiary() : [];
    const diary = allDiary.filter(e => e.applied);
    if (!diary.length) {
      toast('Markera jobb som sökta först!', 'error');
      return;
    }

    const statusLabels = {
      sokt:     'Sökt',
      intervju: 'Kallad på intervju',
      fatt:     'Fått jobbet!',
      nej:      'Inget svar / Nej'
    };

    // Gruppera jobb veckovis (måndag-söndag)
    const weeks = {};
    diary.forEach(e => {
      const d = new Date(e.savedAt);
      const mon = new Date(d);
      mon.setDate(d.getDate() - d.getDay() + 1);
      const wk = 'Vecka ' + mon.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
      if (!weeks[wk]) weeks[wk] = [];
      weeks[wk].push(e);
    });

    const today = new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });
    let text = 'JOBBSÖKNING — AKTIVITETSRAPPORT\n';
    text += '='.repeat(35) + '\n';
    text += 'Skapad: ' + today + '\n\n';

    Object.entries(weeks).forEach(([week, entries]) => {
      text += week + '\n';
      entries.forEach(e => {
        const dStr = new Date(e.savedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });
        const statusTxt = statusLabels[e.status] || 'Sökt';
        text += '  • ' + (e.jobTitle || 'Okänt jobb') + (e.company ? ' hos ' + e.company : '') + ' (' + dStr + ')\n';
        text += '    Status: ' + statusTxt + '\n';
        if (e.jobUrl) text += '    ' + e.jobUrl + '\n';
      });
      text += '\n';
    });

    // Sammanfattning
    const counts = { sokt: 0, intervju: 0, fatt: 0, nej: 0 };
    diary.forEach(e => {
      const s = e.status || 'sokt';
      if (counts[s] !== undefined) counts[s]++;
    });
    text += '-'.repeat(35) + '\n';
    text += 'Totalt sökta: ' + diary.length + ' jobb\n';
    if (counts.intervju) text += 'Kallad på intervju: ' + counts.intervju + '\n';
    if (counts.fatt)     text += 'Fått jobbet: ' + counts.fatt + '\n';
    if (counts.nej)      text += 'Inget svar: ' + counts.nej + '\n';
    text += '\nSkapad med CVmatchen av PathfinderAI';

    // Försök dela via OS-share (mobil/PWA), annars clipboard, annars prompt
    if (navigator.share) {
      const blob = new Blob([text], { type: 'text/plain' });
      const file = new File([blob], 'aktivitetsrapport.txt', { type: 'text/plain' });
      navigator.share({ files: [file], title: 'Jobbsökning aktivitetsrapport' })
        .then(() => { if (typeof logEvent === 'function') logEvent('diary_exported', { method: 'share', count: diary.length }); })
        .catch(() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => toast('✅ Kopierat till urklipp!'));
          }
        });
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast('✅ Kopierat till urklipp!');
          if (typeof logEvent === 'function') logEvent('diary_exported', { method: 'clipboard', count: diary.length });
        })
        .catch(() => prompt('Kopiera texten nedan:', text));
    } else {
      prompt('Kopiera texten nedan:', text);
    }
  };

  // ============================================================
  // PROFIL: AVTAL & INSTÄLLNINGAR (speglar mobilen)
  // ============================================================
  function renderProfilSettingsDetail() {
    const auth = getAuth();
    const email = (auth && auth.email) ? auth.email : 'Inte inloggad';

    return (
      '<div class="pf-detail-header"><div class="pf-detail-title">⚙️ Avtal &amp; inställningar</div></div>' +

      // Visa nuvarande inloggad
      '<div style="background:rgba(62,180,137,0.07);border:1px solid rgba(62,180,137,0.2);border-radius:12px;padding:14px 16px;margin-bottom:14px;">' +
        '<div style="font-size:11px;font-weight:800;color:rgba(62,180,137,0.8);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px;">Inloggad som</div>' +
        '<div style="font-size:14px;color:#fff;font-weight:600;word-break:break-all;">' + escape(email) + '</div>' +
      '</div>' +

      // Logga ut (röd)
      '<div onclick="logout()" class="pf-settings-row" ' +
        'style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;cursor:pointer;background:rgba(220,38,38,0.06);border:1px solid rgba(220,38,38,0.2);margin-bottom:8px;transition:all 0.15s;" ' +
        'onmouseenter="this.style.background=\'rgba(220,38,38,0.12)\'" ' +
        'onmouseleave="this.style.background=\'rgba(220,38,38,0.06)\'">' +
        '<div style="font-size:22px;flex-shrink:0;">🚪</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:700;color:rgba(252,165,165,0.95);">Logga ut</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.4);">Logga ut från ditt konto</div>' +
        '</div>' +
        '<span style="font-size:16px;color:rgba(220,38,38,0.3);">›</span>' +
      '</div>' +

      // Integritetspolicy / GDPR
      '<div onclick="showPrivacyPolicy()" class="pf-settings-row" ' +
        'style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);margin-bottom:8px;transition:all 0.15s;" ' +
        'onmouseenter="this.style.background=\'rgba(255,255,255,0.07)\'" ' +
        'onmouseleave="this.style.background=\'rgba(255,255,255,0.04)\'">' +
        '<div style="font-size:22px;flex-shrink:0;">📄</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">Integritetspolicy / GDPR</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.4);">Hur CVmatchen hanterar dina uppgifter</div>' +
        '</div>' +
        '<span style="font-size:16px;color:rgba(255,255,255,0.2);">›</span>' +
      '</div>' +

      // Allmänna villkor
      '<div onclick="showTermsModal()" class="pf-settings-row" ' +
        'style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);margin-bottom:8px;transition:all 0.15s;" ' +
        'onmouseenter="this.style.background=\'rgba(255,255,255,0.07)\'" ' +
        'onmouseleave="this.style.background=\'rgba(255,255,255,0.04)\'">' +
        '<div style="font-size:22px;flex-shrink:0;">📋</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.85);">Allmänna villkor</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.4);">Användarvillkor för CVmatchen</div>' +
        '</div>' +
        '<span style="font-size:16px;color:rgba(255,255,255,0.2);">›</span>' +
      '</div>' +

      // Radera konto (lila)
      '<div onclick="handleDeleteAccount()" class="pf-settings-row" ' +
        'style="display:flex;align-items:center;gap:14px;padding:16px;border-radius:12px;cursor:pointer;background:rgba(124,58,237,0.07);border:1px solid rgba(124,58,237,0.22);margin-bottom:8px;transition:all 0.15s;" ' +
        'onmouseenter="this.style.background=\'rgba(124,58,237,0.14)\'" ' +
        'onmouseleave="this.style.background=\'rgba(124,58,237,0.07)\'">' +
        '<div style="font-size:22px;flex-shrink:0;">🗑️</div>' +
        '<div style="flex:1;">' +
          '<div style="font-size:14px;font-weight:700;color:rgba(167,139,250,0.95);">Radera konto</div>' +
          '<div style="font-size:12px;color:rgba(255,255,255,0.4);">Ta bort ditt konto och all data permanent</div>' +
        '</div>' +
        '<span style="font-size:16px;color:rgba(124,58,237,0.3);">›</span>' +
      '</div>' +

      // Footer
      '<div style="padding:28px 0 8px;text-align:center;">' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.2);line-height:2;">CVmatchen av PathfinderAI</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.15);">' +
          '<a href="mailto:info@cvmatchen.com" style="color:rgba(255,255,255,0.3);text-decoration:none;">info@cvmatchen.com</a>' +
        '</div>' +
      '</div>'
    );
  }

  // Öppna integritetspolicy-modal
  window.showPrivacyPolicy = function() {
    const m = document.getElementById('privacyPolicyModal');
    if (m) m.style.display = 'block';
  };

  // Öppna allmänna villkor-modal
  window.showTermsModal = function() {
    const m = document.getElementById('termsModal');
    if (m) m.style.display = 'block';
  };

  // Radera konto med bekräftelse + Supabase-anrop
  window.handleDeleteAccount = async function() {
    const auth = getAuth();
    const email = (auth && auth.email) ? auth.email : 'ditt konto';

    const confirmed = confirm(
      'Radera konto för: ' + email + '\n\n' +
      'All data raderas permanent:\n' +
      '• Ditt konto\n' +
      '• Sparade CV:n\n' +
      '• Matcher och jobbdagbok\n' +
      '• Övningsframsteg\n\n' +
      'Detta går inte att ångra.\n\n' +
      'Vill du fortsätta?'
    );
    if (!confirmed) return;

    // Dubbel-bekräftelse — be användaren skriva "RADERA"
    const typed = prompt('Skriv RADERA (med versaler) för att bekräfta:');
    if (typed !== 'RADERA') {
      toast('Konto inte raderat', 'error');
      return;
    }

    try {
      // Rensa all lokal data — både user-scoped (säkerhetsfix) och övriga
      try { clearAllUserData(); } catch(_) {}
      const localKeys = [
        SAVED_CVS_KEY, MATCHED_CVS_KEY,
        '_matchaSelectedAds', 'pf_saved_edu', 'pf_diary',
        'pf_ai_cache', 'cvmovn4',
        TRAINING_PROGRESS_KEY, STORAGE_KEY,
        'cvmatchen_edu_saved'
      ];
      localKeys.forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });

      // Försök radera serverside (kan saknas — då fortsätter vi ändå)
      const token = auth && auth.accessToken;
      if (token) {
        try {
          await fetch('/api/delete-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
            }
          });
        } catch(e) { /* tyst — backend kan saknas */ }
      }

      // Logga ut + rensa auth
      try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(_) {}
      window.authUserId = null;
      window.authAccessToken = null;

      toast('✅ Konto raderat — du kommer loggas ut');

      // Reload efter 1.5s så användaren ser bekräftelsen
      setTimeout(() => {
        window.location.href = window.location.pathname;
      }, 1500);
    } catch(err) {
      console.warn('Delete account error:', err);
      toast('⚠️ Något gick fel — kontakta info@cvmatchen.com', 'error');
    }
  };

  // Bakåtkompatibilitet — om något gammalt anropar dessa så finns de fortfarande
  function pfRenderSavedList() {
    // Uppdatera via nya hub:en istället
    if (typeof renderProfilHub === 'function') renderProfilHub();
    if (pfActiveTile === 'saved') renderProfilDetail();
  }

  function pfRenderMatchedList() {
    // Rensa utgångna
    const all = pfGetMatched();
    const active = pfMatchedActiveList();
    if (active.length !== all.length) pfPutMatched(active);

    if (typeof renderProfilHub === 'function') renderProfilHub();
    if (pfActiveTile === 'matched') renderProfilDetail();
  }

  // ── Actions: Sparade CV ───────────────────────────────────
  window.pfOpenSaved = function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('CV hittades inte', 'error'); return; }

    cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
    ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
      if (!Array.isArray(cvData[k])) cvData[k] = [];
    });
    saveCVLocal();
    switchView('cv');
    cvSwitchStep('profil');
    loadCVIntoForm();
    renderJobs(); renderEducation();
    renderSkillsChips(); renderLanguages(); renderLicenses();
    renderTemplates();
    renderPreview();
    toast('✅ ' + (entry.title || 'CV') + ' öppnat');
  };

  window.pfDeleteSaved = function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) return;
    if (!confirm('Ta bort "' + (entry.title || 'CV') + '"?\nDetta kan inte ångras.')) return;
    pfPutSaved(list.filter(c => c.id !== id));
    pfRenderSavedList();
    toast('🗑️ ' + (entry.title || 'CV') + ' borttaget');
  };

  window.pfExportSaved = async function(id) {
    const list = pfGetSaved();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('CV hittades inte', 'error'); return; }

    // Spara nuvarande state, ladda in det sparade tillfälligt, exportera, återställ
    const prev = JSON.parse(JSON.stringify(cvData));
    try {
      cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      renderPreview();
      await new Promise(r => setTimeout(r, 100));
      await window.cvExportPDF();
    } finally {
      cvData = prev;
      renderPreview();
    }
  };

  // ── Actions: Matchade CV ──────────────────────────────────
  window.pfOpenMatched = function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('Matchat CV hittades inte', 'error'); return; }

    cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
    ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
      if (!Array.isArray(cvData[k])) cvData[k] = [];
    });
    saveCVLocal();
    switchView('cv');
    cvSwitchStep('profil');
    loadCVIntoForm();
    renderJobs(); renderEducation();
    renderSkillsChips(); renderLanguages(); renderLicenses();
    renderTemplates();
    renderPreview();
    toast('✅ ' + (entry.title || 'Matchat CV') + ' öppnat');
  };

  window.pfDeleteMatched = function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) return;
    if (!confirm('Ta bort matchat CV "' + (entry.title || 'Utan titel') + '"?')) return;
    pfPutMatched(list.filter(c => c.id !== id));
    pfRenderMatchedList();
    toast('🗑️ Borttaget');
  };

  window.pfExportMatched = async function(id) {
    const list = pfGetMatched();
    const entry = list.find(c => c.id === id);
    if (!entry) { toast('Matchat CV hittades inte', 'error'); return; }
    const prev = JSON.parse(JSON.stringify(cvData));
    try {
      cvData = Object.assign(createEmptyCV(), JSON.parse(JSON.stringify(entry.data)));
      ['jobs','education','languages','certifications','licenses','references','skills'].forEach(k => {
        if (!Array.isArray(cvData[k])) cvData[k] = [];
      });
      renderPreview();
      await new Promise(r => setTimeout(r, 100));
      await window.cvExportPDF();
    } finally {
      cvData = prev;
      renderPreview();
    }
  };

  // ============================================================
  // ÖVNINGAR (TRAINING)
  // ============================================================
  function getTrainingPct(modId) {
    const p = trainingProgress[modId];
    if (!p) return 0;
    const mod = TRAINING_MODULES.find(m => m.id === modId);
    if (!mod) return 0;
    const lessonsLen = (mod.lessons || []).length;
    const quizLen    = (mod.quiz    || []).length;
    const total = lessonsLen + quizLen;
    if (!total) return 0;
    const done = (p.lessonsRead || 0) + (p.quizCorrect || 0);
    return Math.min(100, Math.round((done / total) * 100));
  }

  function getCatPct(cat) {
    if (!cat.mods || !cat.mods.length) return 0;
    let tot = 0, done = 0;
    cat.mods.forEach(m => {
      const lessonsLen = (m.lessons || []).length;
      const quizLen    = (m.quiz    || []).length;
      tot += lessonsLen + quizLen;
      const p = trainingProgress[m.id];
      if (p) done += (p.lessonsRead || 0) + (p.quizCorrect || 0);
    });
    return tot > 0 ? Math.round((done / tot) * 100) : 0;
  }

  // State för att veta om vi visar kategori-grid eller en specifik kategori
  let currentTrainCat = null; // null = kategori-hem, annars ett cat-id

  function renderTrainingHome() {
    document.getElementById('ov-home').style.display = 'block';
    document.getElementById('ov-detail').style.display = 'none';

    const grid = document.getElementById('ovGrid');

    // Specialfall: intervjuträning vald — använd intervju.js (laddad i HTML:en)
    if (currentTrainCat === 'intervju') {
      document.getElementById('ov-home').style.display = 'none';
      document.getElementById('ov-detail').style.display = 'block';
      const detail = document.getElementById('ov-detail');
      detail.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
          <button class="train-back ov-back" onclick="trainBackToHub()" style="margin:0;">← Tillbaka till Träna</button>
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:22px;">🎤</span>
            <div>
              <div style="font-size:17px;font-weight:800;color:#fff;">Intervjuträning</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.45);">Öva på vanliga intervjufrågor</div>
            </div>
          </div>
        </div>
        <div id="trainView-intervju"></div>`;
      setTimeout(() => {
        if (typeof window.ivInit === 'function') {
          try { window.ivInit(); } catch(e) { console.warn('ivInit fail:', e); }
        }
      }, 50);
      return;
    }

    // Specialfall: "Övningar" — visa kategorier-grid
    if (currentTrainCat === 'ovningar_grid') {
      document.getElementById('ov-home').style.display = 'block';
      document.getElementById('ov-detail').style.display = 'none';
      const grid = document.getElementById('ovGrid');
      const backBtn = `
        <div style="grid-column:1/-1;margin-bottom:6px;">
          <button class="ov-back" onclick="trainBackToHub()" style="margin:0 0 12px;">← Tillbaka till Träna</button>
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.3px;margin-bottom:4px;">Övningar</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);">Välj ett område — lektioner, praktiska övningar och quiz i din egen takt.</div>
        </div>`;
      const catsHtml = TRAINING_CATS.map(c => {
        const pct = getCatPct(c);
        return `
          <div class="ov-card train-cat-card" onclick="trainOpenCat('${c.id}')"
               style="border-color: ${c.color}40; background: ${c.color}0d;">
            <div class="ov-card-icon" style="background: ${c.color}20; color: ${c.color};">${c.icon}</div>
            <div class="ov-card-title" style="color: #fff;">${escape(c.label)}</div>
            <div class="ov-card-desc">${c.mods.length} moduler</div>
            <div class="ov-card-meta">
              <span style="color: ${c.color}; font-weight: 700;">${pct > 0 ? pct + '% klart' : 'Starta'}</span>
              <div style="width: 80px; height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: ${c.color}; transition: width 0.3s;"></div>
              </div>
            </div>
          </div>
        `;
      }).join('');
      grid.innerHTML = backBtn + catsHtml;
      return;
    }

    // Om ingen kategori vald: visa hub med 3 stora rutor (Övningar / Intervjuträning / Uppgifter)
    if (!currentTrainCat) {
      const openTaskCount = (typeof tasksOpen === 'function') ? tasksOpen().length : 0;
      const totalTasks    = assignedTasks.length;

      // Övergripande progress över alla kategorier
      const totalMods   = TRAINING_CATS.reduce((sum, c) => sum + c.mods.filter(m => ACTIVE_MODS.indexOf(m.id) !== -1).length, 0);
      const totalDone   = TRAINING_CATS.reduce((sum, c) => sum + c.mods.filter(m => ACTIVE_MODS.indexOf(m.id) !== -1 && (trainingProgress[m.id] || {}).done).length, 0);
      const overallPct  = totalMods > 0 ? Math.round((totalDone / totalMods) * 100) : 0;

      const grid = document.getElementById('ovGrid');
      const taskColor = '#f0c040';
      grid.innerHTML = `
        <div style="grid-column:1/-1;margin-bottom:8px;">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.3px;margin-bottom:4px;">Träna</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.5);">Förbered dig för arbetslivet — välj ett område nedan.</div>
        </div>
        <div style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;">
          <!-- Övningar — leder till kategori-grid -->
          <div class="ov-card train-cat-card" onclick="trainOpenCat('ovningar_grid')"
               style="border-color:rgba(62,180,137,0.4);background:linear-gradient(135deg,rgba(62,180,137,0.10),rgba(62,180,137,0.04));padding:22px 20px;display:flex;flex-direction:column;gap:14px;min-height:170px;">
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div class="ov-card-icon" style="background:rgba(62,180,137,0.2);color:#3eb489;font-size:26px;flex-shrink:0;">📚</div>
              <div>
                <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:2px;">Övningar</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.45;">${TRAINING_CATS.length} kategorier · ${totalMods} aktiva moduler</div>
              </div>
            </div>
            <div style="margin-top:auto;">
              <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:4px;">
                <span style="color:rgba(255,255,255,0.6);font-weight:600;">${overallPct > 0 ? 'Din progress' : 'Starta'}</span>
                <span style="color:#3eb489;font-weight:700;">${overallPct}%</span>
              </div>
              <div style="width:100%;height:4px;background:rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">
                <div style="width:${overallPct}%;height:100%;background:#3eb489;transition:width 0.3s;"></div>
              </div>
            </div>
          </div>

          <!-- Intervjuträning -->
          <div class="ov-card train-cat-card" onclick="trainOpenCat('intervju')"
               style="border-color:rgba(167,139,250,0.4);background:linear-gradient(135deg,rgba(167,139,250,0.12),rgba(167,139,250,0.04));padding:22px 20px;display:flex;flex-direction:column;gap:14px;min-height:170px;">
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div class="ov-card-icon" style="background:rgba(167,139,250,0.2);color:#a78bfa;font-size:26px;flex-shrink:0;">🎤</div>
              <div>
                <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:2px;">Intervjuträning</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.45;">Öva på vanliga intervjufrågor med exempelsvar.</div>
              </div>
            </div>
            <div style="margin-top:auto;font-size:12px;color:#a78bfa;font-weight:700;">Öppna →</div>
          </div>

          <!-- Uppgifter från handläggare -->
          <div class="ov-card train-cat-card" onclick="trainOpenCat('uppg')"
               style="border-color:${taskColor}40;background:linear-gradient(135deg,${taskColor}1a,${taskColor}06);padding:22px 20px;display:flex;flex-direction:column;gap:14px;min-height:170px;position:relative;">
            ${openTaskCount > 0 ? `<div style="position:absolute;top:12px;right:12px;background:#ef4444;color:#fff;font-size:12px;font-weight:900;border-radius:13px;padding:3px 11px;animation:pulse 2s ease-in-out infinite;">${openTaskCount}</div>` : ''}
            <div style="display:flex;align-items:flex-start;gap:14px;">
              <div class="ov-card-icon" style="background:${taskColor}20;color:${taskColor};font-size:26px;flex-shrink:0;">✅</div>
              <div>
                <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:2px;">Uppgifter</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.45;">${totalTasks > 0 ? 'Från din handläggare' : 'Inga uppgifter ännu'}</div>
              </div>
            </div>
            <div style="margin-top:auto;font-size:12px;color:${taskColor};font-weight:700;">
              ${openTaskCount > 0 ? openTaskCount + ' att göra' : (totalTasks > 0 ? 'Alla klara!' : 'Väntar på tilldelning')}
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Specialfall: uppgifter-kategorin
    if (currentTrainCat === 'uppg') {
      renderTasksCategoryView();
      return;
    }

    // Visa modulerna inom vald kategori
    const cat = TRAINING_CATS.find(c => c.id === currentTrainCat);
    if (!cat) { currentTrainCat = null; renderTrainingHome(); return; }
    // Använder central ACTIVE_MODS — ändra listan högst upp i filen.

    const catHeader = `
      <div style="grid-column: 1 / -1; display: flex; align-items: center; gap: 14px; margin-bottom: 8px;">
        <button class="ov-back" onclick="trainBackToCats()" style="margin: 0;">← Alla kategorier</button>
        <div style="flex: 1; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">${cat.icon}</span>
          <div>
            <div style="font-size: 17px; font-weight: 800; color: #fff;">${escape(cat.label)}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.45);">${cat.mods.length} moduler · ${getCatPct(cat)}% klart</div>
          </div>
        </div>
      </div>
    `;

    const moduleCards = cat.mods.map(m => {
      const pct = getTrainingPct(m.id);
      const desc = m.sub || m.desc || '';
      const lessonsLen = (m.lessons || []).length;
      const quizLen    = (m.quiz    || []).length;
      const isActive   = ACTIVE_MODS.indexOf(m.id) !== -1;
      if (!isActive) {
        return `
          <div class="ov-card" style="opacity:0.45; cursor:not-allowed; position:relative; pointer-events:none;">
            <div style="position:absolute; top:10px; right:12px; font-size:10px; font-weight:900; letter-spacing:1px; padding:4px 8px; background:rgba(251,146,60,0.15); border:1px solid rgba(251,146,60,0.4); border-radius:6px; color:#fb923c; text-transform:uppercase;">🚧 Snart</div>
            <div class="ov-card-icon" style="filter:grayscale(0.6);">${m.icon || '📘'}</div>
            <div class="ov-card-title">${escape(m.title || '')}</div>
            <div class="ov-card-desc">${escape(desc)}</div>
            <div class="ov-card-meta">
              <span style="color:rgba(251,146,60,0.85); font-weight:700;">Under arbete</span>
              <span class="ov-card-pct" style="color:rgba(255,255,255,0.3);">—</span>
            </div>
          </div>
        `;
      }
      return `
        <div class="ov-card" onclick="trainOpen('${escape(m.id)}')">
          <div class="ov-card-icon">${m.icon || '📘'}</div>
          <div class="ov-card-title">${escape(m.title || '')}</div>
          <div class="ov-card-desc">${escape(desc)}</div>
          <div class="ov-card-meta">
            <span>${lessonsLen} lektioner${quizLen ? ' · ' + quizLen + ' quiz' : ''}</span>
            <span class="ov-card-pct">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');

    grid.innerHTML = catHeader + moduleCards;
  }

  window.trainOpenCat = function(catId) {
    currentTrainCat = catId;
    renderTrainingHome();
  };

  // Från Övningar-kategori-grid tillbaka till Träna-hub (3 rutor)
  window.trainBackToHub = function() {
    currentTrainCat = null;
    renderTrainingHome();
  };

  // Från en specifik kategori tillbaka till kategori-grid (Övningar)
  window.trainBackToCats = function() {
    currentTrainCat = 'ovningar_grid';
    renderTrainingHome();
  };


  window.trainOpen = function(modId) {
    const mod = TRAINING_MODULES.find(m => m.id === modId);
    if (!mod) return;

    document.getElementById('ov-home').style.display = 'none';
    const det = document.getElementById('ov-detail');
    det.style.display = 'block';

    // Spara modul i state och börja på lektion 0
    currentTrainMod = mod;
    currentTrainStep = { type: 'lesson', idx: 0 };
    renderTrainStep();
    if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
  };


  // ── SLIDE-LÄGE: ett kort i taget ──
  let currentTrainMod = null;
  let currentTrainStep = { type: 'lesson', idx: 0 }; // type: 'lesson' | 'ex' | 'quiz' | 'done'

  function renderTrainStep() {
    const mod = currentTrainMod;
    if (!mod) return;
    const det = document.getElementById('ov-detail');
    if (!det) return;

    const lessons = mod.lessons || [];
    const ex      = mod.ex || null;
    const quiz    = mod.quiz || [];
    const totalSteps = lessons.length + (ex ? 1 : 0) + (quiz.length ? 1 : 0);

    // Stega-räkning för progress-bar
    let stepNum = 0;
    if (currentTrainStep.type === 'lesson') stepNum = currentTrainStep.idx + 1;
    else if (currentTrainStep.type === 'ex') stepNum = lessons.length + 1;
    else if (currentTrainStep.type === 'quiz') stepNum = lessons.length + (ex ? 1 : 0) + 1;
    else if (currentTrainStep.type === 'done') stepNum = totalSteps;
    const pct = totalSteps ? Math.round(stepNum / totalSteps * 100) : 0;

    const backLabel = currentTrainCat
      ? ('← Tillbaka till ' + (TRAINING_CATS.find(c => c.id === currentTrainCat) || {}).label)
      : '← Tillbaka till alla kategorier';

    let html = '<button class="ov-back" onclick="trainBack()">' + escape(backLabel) + '</button>';

    // Hero — modul-titel + progress-bar
    html += '<div class="ov-hero" style="text-align:left; padding:0 0 18px;">';
    html += '<div class="ov-title">' + (mod.icon || '📘') + ' ' + escape(mod.title || '') + '</div>';
    if (mod.sub) html += '<div class="ov-sub" style="margin:0 0 14px;">' + escape(mod.sub) + '</div>';
    html += '<div style="display:flex; align-items:center; gap:10px; margin-top:8px;">';
    html += '<div style="flex:1; height:6px; background:rgba(255,255,255,0.07); border-radius:3px; overflow:hidden;">';
    html += '<div style="height:100%; width:' + pct + '%; background:' + (mod.color || '#60a5fa') + '; transition:width .3s;"></div>';
    html += '</div>';
    html += '<div style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.55); min-width:54px; text-align:right;">' + stepNum + ' / ' + totalSteps + '</div>';
    html += '</div></div>';

    // Innehåll baserat på typ av steg
    if (currentTrainStep.type === 'lesson') {
      const i = currentTrainStep.idx;
      const l = lessons[i] || {};
      const text = l.s || '';
      const deep = l.a || '';
      const yt   = l.yt || '';
      const pre  = l.pre || '';
      html += '<div style="font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:' + (mod.color || '#60a5fa') + '; margin-bottom:10px;">📘 LEKTION ' + (i + 1) + ' / ' + lessons.length + '</div>';
      html += '<div class="lesson-card">';
      html += '<div class="lesson-title">' + escape(l.t || '') + '</div>';
      // Pre-intro (syfte/mål/innehåll) FÖRE videon
      if (pre) {
        html += '<div style="background:rgba(62,180,137,0.07); border:1px solid rgba(62,180,137,0.25); border-radius:10px; padding:14px 16px; margin:10px 0 16px; white-space:pre-wrap; font-size:14px; line-height:1.6; color:rgba(255,255,255,0.85);">' + escape(pre) + '</div>';
      }
      // YouTube-embed om lektionen har yt-fält (och det inte är Rick Roll-placeholdern)
      if (yt && yt.indexOf('dQw4w9WgXcQ') === -1) {
        html += '<div style="margin:12px 0 16px; position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:10px; background:#000;">';
        html += '<iframe src="' + escapeAttr(yt) + '" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen allow="accelerometer; encrypted-media; picture-in-picture"></iframe>';
        html += '</div>';
      }
      html += '<div class="lesson-text">' + escape(text) + '</div>';
      if (deep) {
        html += '<details style="margin-top:14px;">';
        html += '<summary style="cursor:pointer; color:rgba(255,255,255,0.5); font-size:12px; font-weight:700;">Visa fördjupning</summary>';
        html += '<div class="lesson-deep">' + escape(deep) + '</div>';
        html += '</details>';
      }
      html += '</div>';

      // Navigation — Nästa-knapp är låst 2 sek (tvingar läsning)
      html += '<div style="display:flex; gap:10px; margin-top:18px;">';
      if (i > 0) {
        html += '<button class="ov-back" onclick="trainGoStep(\'lesson\',' + (i - 1) + ')" style="margin:0;">← Föregående</button>';
      }
      html += '<div style="flex:1;"></div>';
      const nextLabel = (i < lessons.length - 1)
        ? 'Nästa lektion →'
        : (ex ? 'Gå till övning →' : (quiz.length ? 'Gå till quiz →' : 'Klar →'));
      const nextStep = (i < lessons.length - 1)
        ? "trainGoStep('lesson'," + (i + 1) + ")"
        : (ex ? "trainGoStep('ex',0)" : (quiz.length ? "trainGoStep('quiz',0)" : "trainGoStep('done',0)"));
      html += '<button id="trainNextBtn" disabled onclick="' + nextStep + '" style="background:' + (mod.color || '#60a5fa') + '; color:#fff; border:none; padding:10px 22px; border-radius:8px; font-weight:700; cursor:not-allowed; font-family:inherit; opacity:0.4;">⏳ ' + nextLabel + '</button>';
      html += '</div>';
      // Lås Nästa-knappen: 5 sek för textlektion, 15 sek om videon finns (tvingar att se videon)
      const hasVideo = yt && yt.indexOf('dQw4w9WgXcQ') === -1;
      const lockMs = hasVideo ? 15000 : 5000;
      const lockSec = hasVideo ? 15 : 5;
      // Visa nedräkning i knapptexten
      let remain = lockSec;
      const tickInt = setInterval(function() {
        remain--;
        const b = document.getElementById('trainNextBtn');
        if (!b || remain <= 0) { clearInterval(tickInt); return; }
        b.textContent = '⏳ ' + nextLabel + ' (' + remain + 's)';
      }, 1000);
      setTimeout(function() {
        clearInterval(tickInt);
        const b = document.getElementById('trainNextBtn');
        if (b) { b.disabled = false; b.style.cursor = 'pointer'; b.style.opacity = '1'; b.textContent = nextLabel; }
      }, lockMs);

      // Markera lektion som läst
      if (!trainingProgress[mod.id]) trainingProgress[mod.id] = { lessonsRead: 0, quizCorrect: 0 };
      trainingProgress[mod.id].lessonsRead = Math.max(trainingProgress[mod.id].lessonsRead || 0, i + 1);
      saveTrainingProgress();
    }
    else if (currentTrainStep.type === 'ex' && ex) {
      html += '<div style="font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:' + (mod.color || '#60a5fa') + '; margin-bottom:10px;">✏️ ÖVNING</div>';
      html += '<div class="lesson-card">';
      if (ex.title) html += '<div class="lesson-title">' + escape(ex.title) + '</div>';
      if (ex.desc)  html += '<div class="lesson-text">' + escape(ex.desc) + '</div>';
      if (ex.fields && ex.fields.length) {
        html += '<ul style="margin:12px 0 0 0; padding-left:20px; color:rgba(255,255,255,0.75); font-size:14px; line-height:1.6;">';
        ex.fields.forEach(f => {
          html += '<li style="margin-bottom:6px;">' + escape(f.l || '') + (f.hint ? ' <span style="color:rgba(255,255,255,0.45); font-size:12px;">— ' + escape(f.hint) + '</span>' : '') + '</li>';
        });
        html += '</ul>';
      }
      if (ex.links && ex.links.length) {
        html += '<div style="margin-top:16px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.08);">';
        html += '<div style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.55); margin-bottom:10px; text-transform:uppercase; letter-spacing:0.5px;">🔗 Länkar</div>';
        ex.links.forEach(lk => {
          html += '<a href="' + escapeAttr(lk.u || '#') + '" target="_blank" rel="noopener noreferrer" style="display:block; padding:10px 12px; margin-bottom:8px; background:rgba(96,165,250,0.08); border:1px solid rgba(96,165,250,0.25); border-radius:8px; color:#60a5fa; text-decoration:none; font-size:14px;">'
              + '<div style="font-weight:600;">' + escape(lk.t || lk.u || '') + '</div>'
              + (lk.d ? '<div style="font-size:12px; color:rgba(255,255,255,0.55); margin-top:3px; font-weight:400;">' + escape(lk.d) + '</div>' : '')
              + '</a>';
        });
        html += '</div>';
      }
      html += '</div>';

      html += '<div style="display:flex; gap:10px; margin-top:18px;">';
      if (lessons.length) {
        html += '<button class="ov-back" onclick="trainGoStep(\'lesson\',' + (lessons.length - 1) + ')" style="margin:0;">← Föregående</button>';
      }
      html += '<div style="flex:1;"></div>';
      const nextLabel2 = quiz.length ? 'Gå till quiz →' : 'Klar →';
      const nextStep2 = quiz.length ? "trainGoStep('quiz',0)" : "trainGoStep('done',0)";
      html += '<button id="trainExNextBtn" disabled onclick="' + nextStep2 + '" style="background:' + (mod.color || '#60a5fa') + '; color:#fff; border:none; padding:10px 22px; border-radius:8px; font-weight:700; cursor:not-allowed; font-family:inherit; opacity:0.4;">⏳ ' + nextLabel2 + '</button>';
      html += '</div>';
      // Lås i 2 sek
      setTimeout(function() {
        const b = document.getElementById('trainExNextBtn');
        if (b) { b.disabled = false; b.style.cursor = 'pointer'; b.style.opacity = '1'; b.textContent = nextLabel2; }
      }, 2000);
    }
    else if (currentTrainStep.type === 'quiz' && quiz.length) {
      // Quiz i slide-mode — en fråga i taget
      const qi = currentTrainStep.idx || 0;
      const q = quiz[qi] || {};
      html += '<div style="font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:' + (mod.color || '#60a5fa') + '; margin-bottom:10px;">🎯 QUIZ — FRÅGA ' + (qi + 1) + ' / ' + quiz.length + '</div>';
      html += '<div class="quiz-card" data-quiz-idx="' + qi + '" style="text-align:left;">';
      html += '<div class="quiz-q" style="text-align:left;">' + escape(q.q || '') + '</div>';
      (q.o || []).forEach((opt, oi) => {
        html += '<button class="quiz-opt" id="quizOpt' + oi + '" disabled style="text-align:left; cursor:not-allowed; opacity:0.4;" onclick="trainAnswerSlide(\'' + escape(mod.id) + '\', ' + qi + ', ' + oi + ', ' + q.c + ', this)">' + escape(opt) + '</button>';
      });
      html += '</div>';

      // Feedback + Nästa-område (fylls i efter svar)
      html += '<div id="quizFeedback" style="margin-top:18px; min-height:30px;"></div>';

      // Tillbaka-knapp (alltid aktiv)
      html += '<div style="display:flex; gap:10px; margin-top:18px;">';
      if (qi > 0) {
        html += '<button class="ov-back" onclick="trainGoStep(\'quiz\',' + (qi - 1) + ')" style="margin:0;">← Föregående fråga</button>';
      } else {
        const prevType = ex ? 'ex' : 'lesson';
        const prevIdx  = ex ? 0 : Math.max(0, lessons.length - 1);
        html += '<button class="ov-back" onclick="trainGoStep(\'' + prevType + '\',' + prevIdx + ')" style="margin:0;">← Tillbaka</button>';
      }
      html += '</div>';

      // Lås svarsknappar i 2 sek
      setTimeout(function() {
        (q.o || []).forEach((_, oi) => {
          const b = document.getElementById('quizOpt' + oi);
          if (b) { b.disabled = false; b.style.cursor = 'pointer'; b.style.opacity = '1'; }
        });
      }, 2000);
    }
    else if (currentTrainStep.type === 'done') {
      // Slutsida efter sista quiz-fråga
      const modColor = mod.color || '#60a5fa';
      const correct  = (trainingProgress[mod.id] && trainingProgress[mod.id].quizCorrect) || 0;
      const total    = quiz.length;
      const pctScore = total ? Math.round(correct / total * 100) : 0;
      html += '<div style="text-align:center; padding:30px 20px;">';
      html += '<div style="font-size:56px; margin-bottom:16px;">🎉</div>';
      html += '<div style="font-size:20px; font-weight:800; color:#fff; margin-bottom:8px;">Klar!</div>';
      html += '<div style="font-size:14px; color:rgba(255,255,255,0.6); margin-bottom:24px;">Du har slutfört modulen <strong style="color:' + modColor + ';">' + escape(mod.title || '') + '</strong>.</div>';
      if (total) {
        html += '<div style="display:inline-block; padding:16px 24px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:24px;">';
        html += '<div style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Ditt resultat</div>';
        html += '<div style="font-size:26px; font-weight:900; color:' + modColor + ';">' + correct + ' / ' + total + ' rätt</div>';
        html += '<div style="font-size:13px; color:rgba(255,255,255,0.55); margin-top:4px;">' + pctScore + '%</div>';
        html += '</div>';
      }
      html += '<div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">';
      html += '<button class="ov-back" onclick="trainBack()" style="margin:0;">← Tillbaka till kategorin</button>';
      html += '<button onclick="trainGoStep(\'lesson\',0)" style="background:' + modColor + '; color:#fff; border:none; padding:10px 22px; border-radius:8px; font-weight:700; cursor:pointer; font-family:inherit;">🔁 Gör om modulen</button>';
      html += '</div></div>';
    }

    det.innerHTML = html;
    // Skrolla upp till början
    try { det.scrollTop = 0; window.scrollTo({ top: det.offsetTop - 20, behavior: 'smooth' }); } catch(e) {}
  }

  window.trainGoStep = function(type, idx) {
    // När användaren börjar quizet från början — nollställ räknaren så poäng blir korrekt
    if (type === 'quiz' && idx === 0 && currentTrainMod) {
      const mid = currentTrainMod.id;
      if (!trainingProgress[mid]) trainingProgress[mid] = { lessonsRead: 0, quizCorrect: 0 };
      trainingProgress[mid].quizCorrect = 0;
      // Rensa per-fråga flaggor (q_0, q_1, ...)
      Object.keys(trainingProgress[mid]).forEach(k => {
        if (k.indexOf('q_') === 0) delete trainingProgress[mid][k];
      });
      saveTrainingProgress();
    }
    currentTrainStep = { type: type, idx: idx };
    renderTrainStep();
  };

  window.trainBack = function() {
    renderTrainingHome();
  };

  window.trainAnswer = function(modId, qIdx, optIdx, correctIdx, btn) {
    const card = btn.closest('.quiz-card');
    if (card.dataset.answered) return; // bara ett svar per fråga

    card.dataset.answered = 'true';
    if (optIdx === correctIdx) {
      btn.classList.add('correct');
      if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
      trainingProgress[modId].quizCorrect = (trainingProgress[modId].quizCorrect || 0) + 1;
      saveTrainingProgress();
    } else {
      btn.classList.add('wrong');
      // Markera även rätt svar
      card.querySelectorAll('.quiz-opt').forEach((b, i) => {
        if (i === correctIdx) b.classList.add('correct');
      });
    }
  };

  // Quiz-svar i slide-mode: markera + visa Nästa-knapp (låst 2 sek)
  window.trainAnswerSlide = function(modId, qIdx, optIdx, correctIdx, btn) {
    const card = btn.closest('.quiz-card');
    if (card.dataset.answered) return;
    card.dataset.answered = 'true';

    // Lås alla knappar
    card.querySelectorAll('.quiz-opt').forEach(b => { b.disabled = true; b.style.cursor = 'default'; });

    const isCorrect = (optIdx === correctIdx);
    if (isCorrect) {
      btn.classList.add('correct');
      if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
      // Räkna rätt bara en gång per fråga (första försöket räknas)
      if (!trainingProgress[modId]['q_' + qIdx]) {
        trainingProgress[modId]['q_' + qIdx] = true;
        trainingProgress[modId].quizCorrect = (trainingProgress[modId].quizCorrect || 0) + 1;
        saveTrainingProgress();
      }
    } else {
      btn.classList.add('wrong');
      card.querySelectorAll('.quiz-opt').forEach((b, i) => {
        if (i === correctIdx) b.classList.add('correct');
      });
    }

    // Feedback + Nästa-knapp
    const mod = currentTrainMod;
    if (!mod) return;
    const quiz = mod.quiz || [];
    const isLast = qIdx === quiz.length - 1;
    const nextLbl = isLast ? 'Visa resultat →' : 'Nästa fråga →';
    const nextStep = isLast ? "trainGoStep('done',0)" : "trainGoStep('quiz'," + (qIdx + 1) + ")";

    const fb = document.getElementById('quizFeedback');
    if (fb) {
      let html = '';
      html += '<div style="padding:12px 14px; border-radius:10px; margin-bottom:14px; '
           + (isCorrect ? 'background:rgba(62,180,137,0.10); border:1px solid rgba(62,180,137,0.35); color:#3eb489;' : 'background:rgba(248,113,113,0.08); border:1px solid rgba(248,113,113,0.35); color:#f87171;')
           + ' font-size:14px; font-weight:700;">';
      html += (isCorrect ? '✅ Rätt!' : '❌ Fel. Det rätta svaret är markerat.');
      html += '</div>';
      html += '<div style="display:flex; justify-content:flex-end;">';
      html += '<button id="quizNextBtn" disabled onclick="' + nextStep + '" style="background:' + (mod.color || '#60a5fa') + '; color:#fff; border:none; padding:10px 22px; border-radius:8px; font-weight:700; cursor:not-allowed; font-family:inherit; opacity:0.4;">⏳ ' + nextLbl + '</button>';
      html += '</div>';
      fb.innerHTML = html;
      setTimeout(function() {
        const b = document.getElementById('quizNextBtn');
        if (b) { b.disabled = false; b.style.cursor = 'pointer'; b.style.opacity = '1'; b.textContent = nextLbl; }
      }, 2000);
    }
  };

  // ============================================================
  // UTILITIES
  // ============================================================
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ============================================================
  // INIT
  // ============================================================
  // ═══════════════════════════════════════════════════════════════
  // NAV-SETUP: en flik "Träna" istället för separat Övningar/Intervju
  // ═══════════════════════════════════════════════════════════════
  function setupTrainNav() {
    try {
      // 1. Döp om "Övningar"-tabben till "Träna"
      const ovTab = document.querySelector('.sb-tab[data-view="ovningar"]');
      if (ovTab) {
        // Logga DOM-strukturen så vi ser vad som faktiskt finns där
        try {
          console.log('[setupTrainNav] ovTab innerHTML:', ovTab.innerHTML);
        } catch(_){}

        // Rensa alla textnoder som innehåller "Övningar" (rekursivt)
        const nodesToReplace = [];
        const walker = document.createTreeWalker(ovTab, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = walker.nextNode()) {
          if (n.textContent && /Övningar/i.test(n.textContent)) {
            nodesToReplace.push(n);
          }
        }
        nodesToReplace.forEach(node => {
          node.textContent = node.textContent.replace(/Övningar/gi, 'Träna');
        });

        // Uppdatera attribut som kan ha "Övningar"
        ['title', 'aria-label', 'data-tooltip', 'data-label'].forEach(attr => {
          const v = ovTab.getAttribute(attr);
          if (v && /Övningar/i.test(v)) {
            ovTab.setAttribute(attr, v.replace(/Övningar/gi, 'Träna'));
          }
        });

        // KRITISK FIX: dolda CSS pseudo-elements (::before/::after) kan ha "Övningar"
        // som innehåll. Vi kan inte komma åt dem via JS, men vi kan injicera CSS
        // som tvingar dem att visa något annat.
        if (!document.getElementById('_trainNavOverride')) {
          const style = document.createElement('style');
          style.id = '_trainNavOverride';
          style.textContent = `
            /* Tvinga om eventuella pseudo-element på Träna-tabben */
            .sb-tab[data-view="ovningar"]::before,
            .sb-tab[data-view="ovningar"]::after {
              content: none !important;
            }
          `;
          document.head.appendChild(style);
        }
      }
      // 2. Dölj "Intervjuträning"-tabben (vyn finns kvar men nås via Träna-hub)
      const ivTab = document.querySelector('.sb-tab[data-view="intervju"]');
      if (ivTab) {
        ivTab.style.display = 'none';
      }
      // 3. Flagga: uppgifter visas bara inom Träna, inte i Profil
      window._tasksOnlyInTrain = true;

      // 4. Kör om efter en kort stund i fall sidofältet renderas dynamiskt
      // (t.ex. efter inloggning eller async data-laddning)
      setTimeout(() => {
        const t = document.querySelector('.sb-tab[data-view="ovningar"]');
        if (t && /Övningar/i.test(t.textContent)) {
          console.log('[setupTrainNav] Övningar finns kvar — kör igen');
          setupTrainNav();
        }
      }, 500);
    } catch(e) {
      console.warn('setupTrainNav failed:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // ═══════════════════════════════════════════════════════════════
    // SÄKERHETSMIGRATION: rensa eventuella gamla GLOBALA data-nycklar
    // (från före user-scoping). Vi vet inte vilken användare de tillhör,
    // så det är säkrast att rensa dem helt — moln-laddning fyller på
    // korrekt user-scoped data när auth är klar.
    // ═══════════════════════════════════════════════════════════════
    try {
      let migrated = false;
      USER_KEYS.forEach(k => {
        if (_origSafeGet(k) !== null) {
          _origSafeRemove(k);
          migrated = true;
        }
      });
      if (migrated) console.log('[security] Migrerade till user-scoped storage — gammal global data rensad');
    } catch(e) {}

    loadCV();
    loadCVIntoForm();
    renderPreview();
    renderHejView();

    // ═══════════════════════════════════════════════════════════════
    // NAV-SETUP: slå ihop "Övningar" + "Intervjuträning" → "Träna"
    // ═══════════════════════════════════════════════════════════════
    setupTrainNav();

    // Steg 1: kolla magic link-redirect (#access_token=... i URL-hashen)
    let magicHandled = false;
    try {
      magicHandled = await handleMagicLinkRedirect();
    } catch(e) {
      console.warn('Magic link check failed:', e);
    }

    // Steg 2: kolla Microsoft OAuth callback (?ms_token=... eller ?ms_error=...)
    const msHandled = magicHandled ? false : checkMicrosoftCallback();

    // Steg 3: om inget externt callback, kör normal auth-check
    if (!magicHandled && !msHandled) {
      checkAuth();
    }

    // Steg 4: kör initial token-refresh om det är nära expiry (håller session alltid fräsch)
    setTimeout(() => { ensureFreshToken().catch(() => {}); }, 2000);

    // ═══════════════════════════════════════════════════════════════
    // PROAKTIV BAKGRUNDS-REFRESH (tyst för användaren)
    // ═══════════════════════════════════════════════════════════════
    // Tre triggers som tillsammans garanterar att användaren aldrig
    // märker att token förnyas:
    //
    // 1. setInterval var 45:e min — håller token fräsch under aktiv
    //    användning (default access_token livstid är 1h)
    // 2. visibilitychange — när användaren kommer tillbaka till fliken
    //    efter att ha varit borta (webbläsare kan pausa setInterval)
    // 3. online — när nätverket kommer tillbaka efter avbrott
    //
    // Resultat: så länge refresh_token är giltig (30 dagar default,
    // kan utökas till 1 år i Supabase-inställningar) så behöver
    // användaren aldrig logga in igen.

    // Primär: var 45:e minut
    setInterval(() => {
      ensureFreshToken().catch(() => {});
    }, 45 * 60 * 1000);

    // Fallback 1: när fliken blir synlig igen
    // (webbläsare pausar ofta setInterval när fliken är i bakgrunden)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        ensureFreshToken().catch(() => {});
      }
    });

    // Fallback 2: när nätverket kommer tillbaka efter avbrott
    window.addEventListener('online', () => {
      ensureFreshToken().catch(() => {});
    });
  });

  // Borttagen: gammal magic link-delegation till mobilen — desktop hanterar det själv nu
  // (se handleMagicLinkRedirect ovan)

})();
