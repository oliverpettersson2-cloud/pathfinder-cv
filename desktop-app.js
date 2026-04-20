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
  // AUTH
  // ============================================================
  function getAuth() {
    const raw = safeGet(AUTH_STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch(e) { return null; }
  }

  function checkAuth() {
    const auth = getAuth();
    if (!auth || !auth.email) {
      document.getElementById('loginOverlay').style.display = 'flex';
      return false;
    }
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('sbUserName').textContent = auth.email;
    window.authUserId = auth.userId || null;
    window.authAccessToken = auth.accessToken || null;
    return true;
  }

  window.loginMagicLink = async function() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email || !email.includes('@')) {
      toast('Fyll i en giltig e-postadress', 'error');
      return;
    }
    showAiLoader('Skickar länk...', email);
    try {
      const r = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendMagicLink', email })
      });
      hideAiLoader();
      if (r.ok) {
        toast('✉️ Inloggningslänk skickad till ' + email);
      } else {
        toast('Kunde inte skicka länk — försök igen', 'error');
      }
    } catch(e) {
      hideAiLoader();
      toast('Nätverksfel — försök igen', 'error');
    }
  };

  window.loginMicrosoft = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const url = email
      ? '/api/v1/auth/microsoft?e=' + encodeURIComponent(email)
      : '/api/v1/auth/microsoft';
    window.location.href = url;
  };

  window.logout = function() {
    if (!confirm('Logga ut?')) return;
    try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch(e) {}
    window.location.reload();
  };

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
    if (step === 'jobb') { renderJobs(); renderEducation(); }
    if (step === 'mer')  { renderSkillsChips(); renderLanguages(); renderLicenses(); }
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
    list.innerHTML = cvData.jobs.map((j, i) => `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(j.title || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(j.company || '')} · ${escape(j.startYear || '')}–${escape(j.endYear || 'nu')}</div>
          ${j.desc ? `<div class="item-card-desc">${escape(j.desc)}</div>` : ''}
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditJob(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteJob(${i})" title="Ta bort">✕</button>
        </div>
      </div>
    `).join('');
  }

  function renderEducation() {
    const list = document.getElementById('eduList');
    if (!cvData.education.length) {
      list.innerHTML = '<div class="empty">Ingen utbildning tillagd än</div>';
      return;
    }
    list.innerHTML = cvData.education.map((e, i) => `
      <div class="item-card">
        <div class="item-card-body">
          <div class="item-card-title">${escape(e.degree || 'Utan titel')}</div>
          <div class="item-card-meta">${escape(e.school || '')} · ${escape(e.startYear || '')}–${escape(e.endYear || '')}</div>
        </div>
        <div class="item-actions">
          <button class="icon-btn" onclick="cvEditEdu(${i})" title="Redigera">✎</button>
          <button class="icon-btn danger" onclick="cvDeleteEdu(${i})" title="Ta bort">✕</button>
        </div>
      </div>
    `).join('');
  }

  window.cvAddJob = function() {
    const job = promptJobModal();
    if (!job) return;
    cvData.jobs.push(job);
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
  };

  window.cvEditJob = function(i) {
    const job = promptJobModal(cvData.jobs[i]);
    if (!job) return;
    cvData.jobs[i] = job;
    saveCVLocal();
    renderJobs();
    renderPreview();
  };

  window.cvDeleteJob = function(i) {
    if (!confirm('Ta bort detta jobb?')) return;
    cvData.jobs.splice(i, 1);
    saveCVLocal();
    renderJobs();
    renderPreview();
    markStepDone('jobb');
  };

  function promptJobModal(existing) {
    // Enkel prompt-baserad inmatning. Kan ersättas med riktig modal senare.
    const e = existing || {};
    const title = prompt('Jobbtitel:', e.title || '');
    if (title === null) return null;
    const company = prompt('Företag:', e.company || '');
    if (company === null) return null;
    const startYear = prompt('Startår (t.ex. 2020):', e.startYear || '');
    if (startYear === null) return null;
    const endYear = prompt('Slutår (eller "nu"):', e.endYear || 'nu');
    if (endYear === null) return null;
    const desc = prompt('Kort beskrivning av rollen:', e.desc || '');
    return { title, company, startYear, endYear, desc: desc || '' };
  }

  window.cvAddEdu = function() {
    const edu = promptEduModal();
    if (!edu) return;
    cvData.education.push(edu);
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
  };

  window.cvEditEdu = function(i) {
    const edu = promptEduModal(cvData.education[i]);
    if (!edu) return;
    cvData.education[i] = edu;
    saveCVLocal();
    renderEducation();
    renderPreview();
  };

  window.cvDeleteEdu = function(i) {
    if (!confirm('Ta bort denna utbildning?')) return;
    cvData.education.splice(i, 1);
    saveCVLocal();
    renderEducation();
    renderPreview();
    markStepDone('jobb');
  };

  function promptEduModal(existing) {
    const e = existing || {};
    const degree = prompt('Examen / utbildning:', e.degree || '');
    if (degree === null) return null;
    const school = prompt('Skola:', e.school || '');
    if (school === null) return null;
    const startYear = prompt('Startår:', e.startYear || '');
    if (startYear === null) return null;
    const endYear = prompt('Slutår:', e.endYear || '');
    if (endYear === null) return null;
    return { degree, school, startYear, endYear };
  }

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
    // Header
    html.push('<div class="cv-doc-header">');
    html.push('<div class="cv-doc-name">' + escape(cvData.name || 'Ditt namn') + '</div>');
    if (cvData.title) html.push('<div class="cv-doc-title">' + escape(cvData.title) + '</div>');
    const contact = [];
    if (cvData.email) contact.push('✉ ' + escape(cvData.email));
    if (cvData.phone) contact.push('📞 ' + escape(cvData.phone));
    if (contact.length) html.push('<div class="cv-doc-contact">' + contact.join('') + '</div>');
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
        html.push('<div class="cv-doc-entry">');
        html.push('<div class="cv-doc-entry-title">' + escape(j.title || '') + '</div>');
        html.push('<div class="cv-doc-entry-meta">' + escape(j.company || '') + ' · ' + escape(j.startYear || '') + '–' + escape(j.endYear || 'nu') + '</div>');
        if (j.desc) html.push('<div class="cv-doc-entry-desc">' + escape(j.desc) + '</div>');
        html.push('</div>');
      });
      html.push('</div>');
    }

    // Education
    if (cvData.education.length) {
      html.push('<div class="cv-doc-section">');
      html.push('<div class="cv-doc-section-title">Utbildning</div>');
      cvData.education.forEach(e => {
        html.push('<div class="cv-doc-entry">');
        html.push('<div class="cv-doc-entry-title">' + escape(e.degree || '') + '</div>');
        html.push('<div class="cv-doc-entry-meta">' + escape(e.school || '') + ' · ' + escape(e.startYear || '') + '–' + escape(e.endYear || '') + '</div>');
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
      html.push('<div class="cv-doc-section-title">Körkort & certifikat</div>');
      html.push('<div>' + cvData.licenses.map(escape).join(', ') + '</div>');
      html.push('</div>');
    }

    doc.innerHTML = html.join('');
  }

  // ============================================================
  // CV: SAVE
  // ============================================================
  window.cvSaveAndStore = async function() {
    saveCVLocal();
    logEvent('cv_saved', { title: cvData.title || 'Utan titel' });

    const auth = getAuth();
    if (!auth || !auth.accessToken || !auth.userId) {
      toast('Sparat lokalt. Logga in för molnsynk.');
      return;
    }

    showAiLoader('Sparar i molnet...', 'Synkar med dina enheter');
    try {
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
    if (checkAuth()) {
      logEvent('login');
    }
  });

  // Kolla magic link callback
  (function checkMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || params.get('access_token');
    if (token) {
      // Låt mobilversionen hantera magic-link callback för konsistens
      window.location.href = '/?' + window.location.search.substring(1);
    }
  })();

})();
