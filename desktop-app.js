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
  const AUTH_STORAGE_KEY = 'cvmatchen_auth';
  const API_KEY_STORAGE  = 'cvmatchen_api_key';
  const TRAINING_PROGRESS_KEY = 'cvmatchen_ovning_progress';
  const SAVED_CVS_KEY    = 'pathfinder_saved_cvs';
  const MATCHED_CVS_KEY  = 'pathfinder_matched_cvs';
  const MATCHED_TTL_MS   = 14 * 24 * 3600 * 1000; // 14 dagar — samma som mobilen
  const MAX_SAVED_CVS    = 3;

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
    { id: 'classic', name: 'Klassisk', icon: '📜' },
    { id: 'modern',  name: 'Modern',   icon: '✨' },
  ];

  // Träningsmoduler — komprimerad version för desktop
  const TRAINING_MODULES = [
    {
      id: 'kompetenser',
      icon: '🎯',
      title: 'Kompetenser & styrkor',
      desc: 'Lär dig identifiera dina kompetenser och beskriva dem på ett professionellt sätt.',
      lessons: [
        {
          t: 'Vad är kompetenser?',
          s: 'Kompetenser är saker du kan. Det kan vara något du lärt dig i skolan, på jobbet eller i livet.\n\nExempel: köra bil, prata med kunder, laga mat, lösa problem.',
          a: 'Kompetenser är förmågor du använder för att utföra arbetsuppgifter. De delas in i hårda (tekniska, mätbara) och mjuka (sociala, beteendemässiga) kompetenser.'
        },
        {
          t: 'Hårda vs mjuka kompetenser',
          s: 'Hårda = saker du kan mäta (Excel, truckkort, programmering).\n\nMjuka = hur du är med andra (samarbete, tålamod, kommunikation).',
          a: 'Hårda kompetenser kan testas eller certifieras. Mjuka handlar om beteenden, kommunikation och problemlösning. Båda är viktiga — många arbetsgivare värderar mjuka högre idag.'
        },
        {
          t: 'Överförbara kompetenser',
          s: 'Överförbara kompetenser är saker du kan använda i många jobb.\n\nExempel: service, planering, ansvar, ledarskap.',
          a: 'Generella förmågor som fungerar i olika branscher. Viktiga när du byter yrke eller saknar specifik branscherfarenhet.'
        }
      ],
      quiz: [
        { q: 'Vad är hårda kompetenser?', o: ['Mätbara, tekniska kunskaper', 'Hur du är med andra', 'Personliga egenskaper'], c: 0 },
        { q: 'Vad är överförbara kompetenser?', o: ['Bara för ett specifikt jobb', 'Kompetenser som fungerar i många jobb', 'Hårda kompetenser'], c: 1 },
        { q: 'Vilket är ett exempel på mjuk kompetens?', o: ['Truckkort', 'Samarbetsförmåga', 'Excel'], c: 1 },
      ]
    },
    {
      id: 'pitch',
      icon: '🎤',
      title: 'Personlig pitch',
      desc: 'Träna på att presentera dig själv kort och tydligt — för intervjuer och nätverkande.',
      lessons: [
        {
          t: 'Vad är en pitch?',
          s: 'En kort presentation av vem du är, vad du kan och vad du söker.\n\nMax 30 sekunder.',
          a: 'En strukturerad, kortfattad presentation för intervjuer, nätverksevent och första möten. Ska vara så pass tydlig att åhöraren minns dig efteråt.'
        },
        {
          t: '3-stegsmodellen',
          s: '1. Vem jag är\n2. Vad jag kan\n3. Vad jag söker',
          a: 'Tre delar som bygger upp en tydlig bild. Håll det under 30 sekunder. Öva högt — det ska sitta i ryggraden.'
        },
        {
          t: 'Bra exempel',
          s: 'Svagt: "Jag heter Sara. Jag är bra på service. Jag söker jobb i butik."\n\nStarkt: "Jag heter Sara och har 4 års erfarenhet av kundservice. Stark på problemlösning och språk. Söker butik eller reception där jag kan utvecklas."',
          a: 'Det starka exemplet är konkret (siffror), visar styrkor (problemlösning, språk) och berättar tydligt vad du söker. Det ger arbetsgivaren något att hänga upp dig på.'
        }
      ],
      quiz: [
        { q: 'Hur lång ska en pitch vara?', o: ['1 minut', 'Max 30 sekunder', '5 minuter'], c: 1 },
        { q: 'Vilka tre delar har 3-stegsmodellen?', o: ['Vem, vad, varför', 'Vem jag är, vad jag kan, vad jag söker', 'Namn, ålder, jobb'], c: 1 },
        { q: 'Vad gör en pitch stark?', o: ['Att den är lång', 'Att den är konkret med exempel och siffror', 'Att man pratar snabbt'], c: 1 },
      ]
    },
    {
      id: 'intervju',
      icon: '🤝',
      title: 'Intervjuträning',
      desc: 'Förbered dig för de vanligaste intervjufrågorna — och ge svar som imponerar.',
      lessons: [
        {
          t: 'Vad är en intervju?',
          s: 'Intervjun är ett samtal där arbetsgivaren vill lära känna dig — och tvärtom.',
          a: 'En strukturerad bedömning av kompetens, beteende och motivation. Det är också ditt tillfälle att bedöma om jobbet och företaget passar dig.'
        },
        {
          t: 'De vanligaste frågorna',
          s: '• Berätta om dig själv\n• Varför söker du jobbet?\n• Vad är dina styrkor?\n• Vad är dina svagheter?\n• Var ser du dig om 5 år?',
          a: 'Förbered konkreta svar i förväg. Använd din pitch för "berätta om dig själv". Var ärlig med svagheter — visa att du jobbar på dem.'
        },
        {
          t: 'Kroppsspråk & röst',
          s: 'Sitt rakt, le, titta i kameran (om digitalt) eller på den som frågar.\n\nLugn röst. Pauser är okej — visar att du tänker.',
          a: 'Kroppsspråk står för en stor del av intrycket. Övar du framför spegel eller med någon i förväg känns det lugnare i den riktiga intervjun.'
        }
      ],
      quiz: [
        { q: 'Vad är intervjuns syfte?', o: ['Testa dina kunskaper', 'Lära känna dig och bedöma om du passar', 'Skriva kontrakt'], c: 1 },
        { q: 'Hur ska du svara på "berätta om dig själv"?', o: ['Hela ditt CV högt', 'Använd din pitch — kort och konkret', 'Säga så lite som möjligt'], c: 1 },
        { q: 'Vad är bra kroppsspråk?', o: ['Sitta hopkrupen', 'Sitta rakt, le, ögonkontakt', 'Titta ner mest av tiden'], c: 1 },
      ]
    }
  ];

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
  // STORAGE
  // ============================================================
  function safeGet(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch(e) { return false; }
  }

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

    // Synka från molnet i bakgrunden så data är up-to-date även efter page reload
    if (auth.userId && auth.accessToken) {
      loadAllFromSupabase(auth.userId, auth.accessToken).catch(() => {});
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
      // Mobilen sätter isNew=true vid verify_otp → visar onboarding-steg
      authSetLoggedIn(authCurrentEmail, true, userId, accessToken);

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
  async function authSetLoggedIn(email, isNew, userId, accessToken) {
    safeSet(AUTH_STORAGE_KEY, JSON.stringify({
      email: email,
      loggedIn: true,
      userId: userId || null,
      accessToken: accessToken || null,
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

  // Ladda all användardata från Supabase — matchar mobilens loadAllFromSupabase
  async function loadAllFromSupabase(userId, accessToken) {
    try {
      const resp = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load_all', accessToken, userId })
      });
      const result = await resp.json();
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
    if (!window.authUserId || !window.authAccessToken) return;
    fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'log_event',
        accessToken: window.authAccessToken,
        userId: window.authUserId,
        event_type: eventType,
        metadata: metadata || {}
      })
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
  // SETTINGS
  // ============================================================
  window.openSettings = function() {
    document.getElementById('apiKeyInput').value = safeGet(API_KEY_STORAGE) || '';
    document.getElementById('settingsModal').classList.add('open');
  };
  window.closeSettings = function() {
    document.getElementById('settingsModal').classList.remove('open');
  };
  window.saveApiKey = function() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (key) {
      safeSet(API_KEY_STORAGE, key);
      toast('API-nyckel sparad');
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
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sb-tab').forEach(t => t.classList.remove('active'));
    const viewEl = document.getElementById('view-' + view);
    if (viewEl) viewEl.classList.add('active');
    const tabEl = document.querySelector('.sb-tab[data-view="' + view + '"]');
    if (tabEl) tabEl.classList.add('active');

    if (view === 'cv') {
      cvSwitchStep(currentStep);
      renderPreview();
    }
    if (view === 'ovningar') {
      renderTrainingHome();
    }
    if (view === 'profil') {
      renderProfilView();
    }
  };

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
  };

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
    if (btn) { btn.disabled = true; btn.textContent = '⏳ AI genererar...'; }
    showAiLoader('Genererar arbetsuppgifter...', 'AI skriver unika meningar');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      if (!response.ok) throw new Error('API-fel: ' + response.status);
      const data = await response.json();
      const rawText = (data.content && data.content[0] && data.content[0].text || '').trim().replace(/```json|```/g, '').trim();
      let parsed;
      try { parsed = JSON.parse(rawText); } catch(e) { parsed = { arbetsuppgifter: [] }; }

      const tasks = parsed.arbetsuppgifter || [];
      if (tasks[0]) document.getElementById('jobDesc1').value = tasks[0];
      if (tasks[1]) document.getElementById('jobDesc2').value = tasks[1];
      if (tasks[2]) document.getElementById('jobDesc3').value = tasks[2];

      hideAiLoader();
      toast('✨ AI-förslag klara!');
      logEvent('ai_cv_analysis', { context: 'job_autofill' });
    } catch(e) {
      hideAiLoader();
      toast('AI-fel: ' + (e.message || 'okänt'), 'error');
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
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
    closeEduModal();
    toast('✅ ' + (idx >= 0 ? 'Uppdaterat' : 'Utbildning sparad'));
  };

  // Stäng modal vid klick på backdrop
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList && e.target.classList.contains('edit-modal')) {
      e.target.classList.remove('open');
    }
  });

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
      cvData.refOnRequest = false;
      const cb = document.getElementById('refOnRequestCheck');
      if (cb) cb.checked = false;
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

  window.toggleRefOnRequest = function(checked) {
    cvData.refOnRequest = !!checked;
    saveCVLocal();
    renderPreview();
  };

  function renderRefs() {
    const list = document.getElementById('refsList');
    if (!list) return;
    const cb = document.getElementById('refOnRequestCheck');
    if (cb) cb.checked = !!cvData.refOnRequest;

    if (!Array.isArray(cvData.references) || !cvData.references.length) {
      list.innerHTML = cvData.refOnRequest
        ? '<div class="empty">Referenser lämnas på begäran</div>'
        : '<div class="empty">Inga referenser tillagda än</div>';
      return;
    }
    list.innerHTML = cvData.references.map((r, i) => {
      const contact = [r.email, r.phone].filter(Boolean).join(' · ');
      return `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(r.name || 'Utan namn')}</div>
          <div class="item-card-meta">${escape(r.title || '')}${contact ? ' · ' + escape(contact) : ''}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="openRefModal(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteRef(${i})" title="Ta bort">✕</button>
        </div>
      </div>`;
    }).join('');
  }
  window.renderRefs = renderRefs;

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
    if (!title) {
      toast('Skriv in en jobbtitel först (Profil-fliken)', 'error');
      return;
    }
    showAiLoader('Hämtar kompetenser...', 'AI tänker ut passande kompetenser för "' + title + '"');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: 'Du är en CV-expert. Svara ALLTID med giltig JSON och inget annat.',
          messages: [{
            role: 'user',
            content: 'Generera 6 konkreta yrkeskompetenser på svenska för yrket: ' + title +
              '. Korta (1-3 ord), konkreta. Svara ENBART med JSON: {"kompetenser": ["k1","k2","k3","k4","k5","k6"]}'
          }]
        })
      });
      if (!r.ok) throw new Error('API-fel ' + r.status);
      const data = await r.json();
      const raw = (data.content && data.content[0] && data.content[0].text || '{}').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      const skills = (parsed.kompetenser || []).slice(0, 6);
      if (!skills.length) throw new Error('Inga kompetenser');
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
  // CV: LANGUAGES & LICENSES
  // ============================================================
  function renderLanguages() {
    const grid = document.getElementById('languagesGrid');
    grid.innerHTML = ALL_LANGUAGES.map(lang => {
      const checked = cvData.languages.includes(lang);
      return `
        <label class="check-item ${checked ? 'checked' : ''}">
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="cvToggleLanguage('${escapeAttr(lang)}')">
          <span>${escape(lang)}</span>
        </label>
      `;
    }).join('');
  }

  window.cvToggleLanguage = function(lang) {
    const i = cvData.languages.indexOf(lang);
    if (i >= 0) cvData.languages.splice(i, 1);
    else cvData.languages.push(lang);
    saveCVLocal();
    renderLanguages();
    renderPreview();
  };

  function renderLicenses() {
    const grid = document.getElementById('licensesGrid');
    grid.innerHTML = ALL_LICENSES.map(lic => {
      const checked = cvData.licenses.includes(lic);
      return `
        <label class="check-item ${checked ? 'checked' : ''}">
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="cvToggleLicense('${escapeAttr(lic)}')">
          <span>${escape(lic)}</span>
        </label>
      `;
    }).join('');
  }

  window.cvToggleLicense = function(lic) {
    const i = cvData.licenses.indexOf(lic);
    if (i >= 0) cvData.licenses.splice(i, 1);
    else cvData.licenses.push(lic);
    saveCVLocal();
    renderLicenses();
    renderPreview();
  };

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
    const skills = cvData.skills.join(', ');
    const job = cvData.jobs[0] ? `${cvData.jobs[0].title} på ${cvData.jobs[0].company}` : '';

    if (!title) {
      toast('Skriv in en jobbtitel först (Profil-fliken)', 'error');
      return;
    }

    showAiLoader('Skriver profiltext...', 'AI bygger en personlig presentation');
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: 'Du skriver professionella, personliga CV-profiltexter på svenska. Aldrig generiska.',
          messages: [{
            role: 'user',
            content: 'Skriv en professionell profiltext (3-5 meningar, max 80 ord) för ett CV.\n\n' +
              'Namn: ' + (name || '(okänt)') + '\n' +
              'Yrkestitel: ' + title + '\n' +
              (job    ? 'Senaste jobb: ' + job + '\n' : '') +
              (skills ? 'Kompetenser: ' + skills + '\n' : '') +
              '\nReturnera ENBART profiltexten, inga rubriker, inga bullets, ingen markdown.'
          }]
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
      toast('✨ Profiltext genererad');
      logEvent('profile_generated');
    } catch(e) {
      hideAiLoader();
      toast('Kunde inte generera: ' + e.message, 'error');
    }
  };

  // ============================================================
  // CV: TEMPLATES
  // ============================================================
  function renderTemplates() {
    const grid = document.getElementById('templateGrid');
    grid.innerHTML = TEMPLATES.map(t => `
      <div class="template-card ${cvData.template === t.id ? 'active' : ''}" onclick="cvSelectTemplate('${t.id}')">
        <div class="template-card-icon">${t.icon}</div>
        <div>${t.name}</div>
      </div>
    `).join('');
  }

  window.cvSelectTemplate = function(id) {
    cvData.template = id;
    saveCVLocal();
    renderTemplates();
    renderPreview();
  };

  // ============================================================
  // CV: PREVIEW (live)
  // ============================================================
  function renderPreview() {
    const doc = document.getElementById('cvDocument');
    if (!doc) return;
    doc.className = 'cv-document ' + (cvData.template || 'classic');

    const html = [];
    // Header — med valfri profilbild
    const hasPhoto = cvData.showPhoto === true && !!cvData.photoData;
    html.push('<div class="cv-doc-header"' + (hasPhoto ? ' style="display:flex;align-items:center;gap:20px;"' : '') + '>');
    if (hasPhoto) {
      html.push('<img src="' + cvData.photoData + '" alt="Profilbild" style="width:88px;height:88px;border-radius:50%;object-fit:cover;flex-shrink:0;border:3px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.15);">');
      html.push('<div style="flex:1;">');
    }
    html.push('<div class="cv-doc-name">' + escape(cvData.name || 'Ditt namn') + '</div>');
    if (cvData.title) html.push('<div class="cv-doc-title">' + escape(cvData.title) + '</div>');
    const contact = [];
    if (cvData.email) contact.push('✉ ' + escape(cvData.email));
    if (cvData.phone) contact.push('📞 ' + escape(cvData.phone));
    if (contact.length) html.push('<div class="cv-doc-contact">' + contact.join('') + '</div>');
    if (hasPhoto) html.push('</div>');
    html.push('</div>');

    // Summary
    if (cvData.summary) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Profil</div>');
      html.push('<div class="cv-doc-summary">' + escape(cvData.summary) + '</div>');
      html.push('</div>');
    }

    // Jobs
    if (cvData.jobs.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Arbetslivserfarenhet</div>');
      cvData.jobs.forEach(j => {
        const period = formatJobPeriod(j) || ((j.startYear || '') + '–' + (j.endYear || 'nu'));
        const loc = j.location ? ' · ' + escape(j.location) : '';
        const descs = [j.desc1, j.desc2, j.desc3].filter(Boolean);
        html.push('<div class="cv-doc-entry">');
        html.push('<div class="cv-doc-entry-title">' + escape(j.title || '') + '</div>');
        html.push('<div class="cv-doc-entry-meta">' + escape(j.company || '') + ' · ' + escape(period) + loc + '</div>');
        if (descs.length) {
          html.push('<ul class="cv-doc-entry-desc" style="margin:4px 0 0 16px; padding:0;">');
          descs.forEach(d => html.push('<li>' + escape(d) + '</li>'));
          html.push('</ul>');
        } else if (j.desc) {
          html.push('<div class="cv-doc-entry-desc">' + escape(j.desc) + '</div>');
        }
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Education
    if (cvData.education.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Utbildning</div>');
      cvData.education.forEach(e => {
        const from = formatPeriod(e.startMonth, e.startYear);
        const to = (e.ongoing || e.endYear === 'Pågående' || e.endYear === 'nu') ? 'nu' : formatPeriod(e.endMonth, e.endYear);
        const period = (from || to) ? (from || '') + '–' + (to || '') : '';
        const school = e.schoolName || e.school || '';
        const form = e.schoolForm ? ' (' + escape(e.schoolForm) + ')' : '';
        html.push('<div class="cv-doc-entry">');
        html.push('<div class="cv-doc-entry-title">' + escape(e.degree || '') + '</div>');
        html.push('<div class="cv-doc-entry-meta">' + escape(school) + form + (period ? ' · ' + escape(period) : '') + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Skills
    if (cvData.skills.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Kompetenser</div>');
      html.push('<div class="cv-doc-skills">');
      cvData.skills.forEach(s => {
        html.push('<span class="cv-doc-skill">' + escape(s) + '</span>');
      });
      html.push('</div>');
      html.push('</div>');
    }

    // Languages
    if (cvData.languages.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Språk</div>');
      html.push('<div>' + cvData.languages.map(escape).join(', ') + '</div>');
      html.push('</div>');
    }

    // Licenses
    if (cvData.licenses.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Körkort</div>');
      html.push('<div>' + cvData.licenses.map(escape).join(', ') + '</div>');
      html.push('</div>');
    }

    // Certifikat
    if (Array.isArray(cvData.certifications) && cvData.certifications.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Certifikat</div>');
      cvData.certifications.forEach(c => {
        const meta = [c.issuer, c.date].filter(Boolean).map(escape).join(' · ');
        html.push('<div class="cv-doc-entry">');
        html.push('<div class="cv-doc-entry-title">' + escape(c.name || '') + '</div>');
        if (meta) html.push('<div class="cv-doc-entry-meta">' + meta + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Referenser
    const hasRefs = Array.isArray(cvData.references) && cvData.references.length;
    if (hasRefs || cvData.refOnRequest) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Referenser</div>');
      if (hasRefs) {
        cvData.references.forEach(r => {
          const contact = [r.email, r.phone].filter(Boolean).map(escape).join(' · ');
          html.push('<div class="cv-doc-entry">');
          html.push('<div class="cv-doc-entry-title">' + escape(r.name || '') + '</div>');
          if (r.title) html.push('<div class="cv-doc-entry-meta">' + escape(r.title) + '</div>');
          if (contact) html.push('<div class="cv-doc-entry-meta" style="opacity:0.85;">' + contact + '</div>');
          html.push('</div>');
        });
      } else {
        html.push('<div class="cv-doc-entry-meta" style="font-style:italic;">Lämnas på begäran</div>');
      }
      html.push('</div>');
    }

    doc.innerHTML = html.join('');
  }

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
      // Spara nuvarande CV-state (action: saveCV — befintlig)
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCV',
          accessToken: auth.accessToken,
          userId: auth.userId,
          cvData: cvData
        })
      });
      // Synka även listan över sparade CV:n
      sbSync('saved_cvs', pfGetSaved());

      hideAiLoader();
      if (r.ok) {
        toast('✅ CV sparat — synligt på alla enheter');
      } else {
        toast('Sparat lokalt, molnsynk misslyckades', 'error');
      }
    } catch(e) {
      hideAiLoader();
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
      clone.style.cssText = 'position:absolute; left:-9999px; top:0; width:794px; padding:48px; background:#fff; color:#1a1a2e; font-size:13px; line-height:1.5; border-radius:0; box-shadow:none;';
      document.body.appendChild(clone);

      await new Promise(r => setTimeout(r, 400));

      const canvas = await html2canvas(clone, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
        width: 794, windowHeight: clone.scrollHeight
      });

      document.body.removeChild(clone);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
      const pageW = 210, pageH = 297, margin = 10;
      const imgW = pageW - margin * 2;
      const imgH = canvas.height * imgW / canvas.width;

      // Slice till flera sidor om för långt
      const contentH = pageH - margin * 2;
      let y = 0;
      const fullImgData = canvas.toDataURL('image/jpeg', 0.92);

      if (imgH <= contentH) {
        pdf.addImage(fullImgData, 'JPEG', margin, margin, imgW, imgH);
      } else {
        // Multi-page slicing
        const pageHpx = (contentH * canvas.width) / imgW;
        let srcY = 0;
        let pageNum = 0;
        while (srcY < canvas.height) {
          if (pageNum > 0) pdf.addPage();
          const sliceH = Math.min(pageHpx, canvas.height - srcY);
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
          srcY += sliceH;
          pageNum++;
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
      fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_table',
          accessToken: auth.accessToken,
          userId: auth.userId,
          table: table,
          data: data
        })
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
  function renderProfilView() {
    // Email
    const auth = getAuth();
    const pfEmail = document.getElementById('pfUserEmail');
    if (pfEmail) pfEmail.textContent = (auth && auth.email) ? auth.email : 'Inte inloggad';

    pfRenderSavedList();
    pfRenderMatchedList();
  }

  function pfRenderSavedList() {
    const container = document.getElementById('pfSavedList');
    const countEl   = document.getElementById('pfSavedCount');
    if (!container) return;

    const list = pfGetSaved();
    if (countEl) {
      countEl.textContent = list.length + '/' + MAX_SAVED_CVS;
      countEl.classList.toggle('warn', list.length >= MAX_SAVED_CVS);
    }

    if (!list.length) {
      container.innerHTML =
        '<div class="pf-empty">' +
          '<div class="pf-empty-icon">📄</div>' +
          '<div class="pf-empty-text">Du har inga sparade CV:n än.<br>Bygg ett CV och tryck <strong>Spara CV</strong> för att lägga till det här.</div>' +
          '<button class="pf-empty-cta" onclick="switchView(\'cv\')">Bygg ditt första CV →</button>' +
        '</div>';
      return;
    }

    // Sortera: nyaste först
    const sorted = list.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    container.innerHTML = sorted.map(cv => {
      const title = escape(cv.title || 'Utan titel');
      const name  = escape((cv.data && cv.data.name) || '');
      const date  = pfFormatDate(cv.savedAt);
      return `
        <div class="pf-card">
          <div class="pf-card-head">
            <div class="pf-card-icon">📄</div>
            <div class="pf-card-info">
              <div class="pf-card-title">${title}</div>
              <div class="pf-card-meta">${name ? name + ' · ' : ''}${escape(date)}</div>
            </div>
          </div>
          <div class="pf-card-actions">
            <button class="pf-card-btn primary" onclick="pfOpenSaved('${cv.id}')">Öppna</button>
            <button class="pf-card-btn" onclick="pfExportSaved('${cv.id}')">📤 PDF</button>
            <button class="pf-card-btn danger" onclick="pfDeleteSaved('${cv.id}')" title="Ta bort">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  function pfRenderMatchedList() {
    const container = document.getElementById('pfMatchedList');
    const countEl   = document.getElementById('pfMatchedCount');
    if (!container) return;

    // Rensa utgångna i bakgrunden
    const all = pfGetMatched();
    const active = pfMatchedActiveList();
    if (active.length !== all.length) {
      pfPutMatched(active);
    }

    if (countEl) countEl.textContent = String(active.length);

    if (!active.length) {
      container.innerHTML =
        '<div class="pf-empty">' +
          '<div class="pf-empty-icon">🎯</div>' +
          '<div class="pf-empty-text">Inga matchade CV:n än.<br>Använd <strong>Matcha</strong> för att skräddarsy ett CV mot en jobbannons.<br><span style="font-size:11px;opacity:0.6;">Matchade CV:n sparas i 14 dagar.</span></div>' +
        '</div>';
      return;
    }

    const sorted = active.slice().sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    container.innerHTML = sorted.map(cv => {
      const title   = escape(cv.title || 'Utan titel');
      const company = escape(cv.company || '');
      const days    = pfMatchedDaysLeft(cv);
      let badgeCls  = 'ok';
      if (days <= 3) badgeCls = 'danger';
      else if (days <= 7) badgeCls = 'warn';
      const jobUrlBtn = cv.jobUrl
        ? `<a href="${escape(cv.jobUrl)}" target="_blank" rel="noopener" class="pf-card-btn" style="text-decoration:none; text-align:center;" onclick="event.stopPropagation()">↗ Annons</a>`
        : '';
      return `
        <div class="pf-card matched">
          <div class="pf-card-head">
            <div class="pf-card-icon">🎯</div>
            <div class="pf-card-info">
              <div class="pf-card-title">${title}</div>
              <div class="pf-card-meta">${company ? company + ' · ' : ''}${pfFormatDate(cv.savedAt)}</div>
            </div>
          </div>
          <div class="pf-card-badge ${badgeCls}">⏳ ${days} dag${days === 1 ? '' : 'ar'} kvar</div>
          <div class="pf-card-actions">
            <button class="pf-card-btn primary" onclick="pfOpenMatched('${cv.id}')">Öppna</button>
            <button class="pf-card-btn" onclick="pfExportMatched('${cv.id}')">📤 PDF</button>
            ${jobUrlBtn}
            <button class="pf-card-btn danger" onclick="pfDeleteMatched('${cv.id}')" title="Ta bort">✕</button>
          </div>
        </div>`;
    }).join('');
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
    const total = mod.lessons.length + mod.quiz.length;
    const done = (p.lessonsRead || 0) + (p.quizCorrect || 0);
    return Math.min(100, Math.round((done / total) * 100));
  }

  function renderTrainingHome() {
    document.getElementById('ov-home').style.display = 'block';
    document.getElementById('ov-detail').style.display = 'none';

    const grid = document.getElementById('ovGrid');
    grid.innerHTML = TRAINING_MODULES.map(m => {
      const pct = getTrainingPct(m.id);
      return `
        <div class="ov-card" onclick="trainOpen('${m.id}')">
          <div class="ov-card-icon">${m.icon}</div>
          <div class="ov-card-title">${escape(m.title)}</div>
          <div class="ov-card-desc">${escape(m.desc)}</div>
          <div class="ov-card-meta">
            <span>${m.lessons.length} lektioner · ${m.quiz.length} quiz</span>
            <span class="ov-card-pct">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  window.trainOpen = function(modId) {
    const mod = TRAINING_MODULES.find(m => m.id === modId);
    if (!mod) return;

    document.getElementById('ov-home').style.display = 'none';
    const det = document.getElementById('ov-detail');
    det.style.display = 'block';

    let html = '<button class="ov-back" onclick="trainBack()">← Tillbaka till alla övningar</button>';
    html += '<div class="ov-hero" style="text-align:left; padding:0 0 24px;">';
    html += '<div class="ov-title">' + mod.icon + ' ' + escape(mod.title) + '</div>';
    html += '<div class="ov-sub" style="margin:0;">' + escape(mod.desc) + '</div>';
    html += '</div>';

    // Lektioner
    html += '<div class="cv-section-title" style="margin-bottom:12px;">Lektioner</div>';
    mod.lessons.forEach((l, i) => {
      html += `
        <div class="lesson-card">
          <div class="lesson-title">${i+1}. ${escape(l.t)}</div>
          <div class="lesson-text">${escape(l.s)}</div>
          <details style="margin-top:12px;">
            <summary style="cursor:pointer; color:rgba(255,255,255,0.5); font-size:12px; font-weight:700;">Visa fördjupning</summary>
            <div class="lesson-deep">${escape(l.a)}</div>
          </details>
        </div>
      `;
    });

    // Quiz
    html += '<div class="cv-section-title" style="margin:28px 0 12px;">Quiz — testa dina kunskaper</div>';
    mod.quiz.forEach((q, i) => {
      html += `
        <div class="quiz-card" data-quiz-idx="${i}">
          <div class="quiz-q">${i+1}. ${escape(q.q)}</div>
      `;
      q.o.forEach((opt, oi) => {
        html += `<button class="quiz-opt" onclick="trainAnswer('${modId}', ${i}, ${oi}, ${q.c}, this)">${escape(opt)}</button>`;
      });
      html += '</div>';
    });

    det.innerHTML = html;

    // Markera lektioner som lästa när de öppnas (enklast: alla på en gång)
    if (!trainingProgress[modId]) trainingProgress[modId] = { lessonsRead: 0, quizCorrect: 0 };
    trainingProgress[modId].lessonsRead = mod.lessons.length;
    saveTrainingProgress();
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
  document.addEventListener('DOMContentLoaded', () => {
    loadCV();
    loadCVIntoForm();
    renderPreview();

    // Steg 1: kolla Microsoft OAuth callback (?ms_token=... eller ?ms_error=...)
    const msHandled = checkMicrosoftCallback();

    // Steg 2: om inget MS-callback, kör normal auth-check
    if (!msHandled) {
      if (checkAuth()) {
        // redan inloggad — logEvent anropas av checkMicrosoftCallback om det var MS,
        // annars behövs det inte just här då 'login' redan loggats vid senaste inlogg
      }
    }
  });

  // Magic link callback — desktop stödjer inte magic link (vi använder OTP)
  // Men om någon råkar landa här med en magic-link-token, delegera till mobilen
  // där authHandleMagicLinkRedirect är implementerat.
  (function checkMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('access_token');
    // Endast delegera om det INTE är ett ms_token (det har egen handler ovan)
    if (token && !params.get('ms_token')) {
      window.location.href = '/?' + window.location.search.substring(1);
    }
  })();

})();
