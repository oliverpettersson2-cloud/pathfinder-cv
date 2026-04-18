/* =====================================================================
   CVmatchen — Intervjuträning (vanilla JS)
   Matchar befintlig edu-chat stil. Prefix: iv / ivInit
   
   Externa beroenden som redan finns i index.html:
   - window.authUserId + window.authAccessToken (CVmatchen-auth)
   - /api/supabase endpoint med intervju-actions + gemini_call
   
   Gemini-nyckeln ligger SÄKERT i Vercel env vars (GEMINI_API_KEY).
   Den anropas via backend-proxy - ingen nyckel i klienten.
   
   Bygger UI:t dynamiskt in i #trainView-intervju vid sidladdning.
   ===================================================================== */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // KONFIGURATION
  // ══════════════════════════════════════════════════════════════
  var CONFIG = {
    geminiModel: 'gemini-2.0-flash',
    maxSpeechHistoryChars: 8000, // trunkera om historiken blir enorm
    defaultVoiceLang: 'sv-SE',
    ttsRate: 0.95,
    ttsPitch: 1.0
  };

  // ══════════════════════════════════════════════════════════════
  // DATA: 10 TIPSEN
  // ══════════════════════════════════════════════════════════════
  var TIPS = [
    { n: 1, e: '🧥', t: 'Ta av dig jackan när du kommer in',
      d: 'Visar att du tänker stanna och är närvarande. Jackan på = "jag vill härifrån".' },
    { n: 2, e: '☕', t: 'Tacka ja till kaffe eller vatten',
      d: 'Även om du inte är törstig — att ta en klunk ger dig sekunder att tänka på svåra frågor.' },
    { n: 3, e: '📱', t: 'Stäng av mobilen synligt',
      d: 'Plocka upp den, ljud av, lägg ner den nedåt. Visar respekt utan ord.' },
    { n: 4, e: '🤝', t: 'Hälsa med ögonkontakt och ett tydligt namn',
      d: 'Första 7 sekunderna formar intrycket. Svettiga händer? Torka diskret mot byxan innan.' },
    { n: 5, e: '🪑', t: 'Sitt framåtlutad, inte tillbakalutad',
      d: 'Framåtlutad signalerar engagemang. Fötterna platt i golvet, händerna synliga.' },
    { n: 6, e: '❓', t: 'Ställ egna frågor — förbered minst tre',
      d: 'Att inte ha frågor är en röd flagga. Fråga om teamet, utmaningar, hur framgång mäts.' },
    { n: 7, e: '🎯', t: 'Ha två-tre STAR-exempel redo',
      d: 'Situation, Task, Action, Result. Passar in på 80% av "berätta om en gång..."-frågorna.' },
    { n: 8, e: '🤔', t: 'Det är okej att tänka innan du svarar',
      d: '"Ska jag fundera en sekund..." är bättre än att rabbla dåligt genomtänkt.' },
    { n: 9, e: '🔄', t: 'Spegla intervjuarens energinivå',
      d: 'Lugn → var lugn. Energisk → lyft din energi. Folk anställer de som känns "som oss".' },
    { n: 10, e: '👋', t: 'Avsluta starkt — fråga om nästa steg',
      d: '"När kan jag förvänta mig att höra något?" visar intresse och ger konkret tidslinje.' }
  ];

  // ══════════════════════════════════════════════════════════════
  // DATA: BRANSCHER
  // ══════════════════════════════════════════════════════════════
  var BRANCHES = [
    'IT & utveckling', 'Logistik & transport', 'Vård & omsorg',
    'Ekonomi & finans', 'Försäljning', 'Marknadsföring',
    'HR & rekrytering', 'Pedagogik & utbildning',
    'Bygg & anläggning', 'Industri & produktion',
    'Restaurang & service', 'Handel & detaljhandel',
    'Kundservice', 'Ingenjör & teknik', 'Juridik',
    'Annat'
  ];

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════
  var state = {
    setup: { branch: '', company: '', roleTitle: '', difficulty: 'medium', jobMatchId: null },
    tipsChecked: {}, // {1: true, 2: true, ...}
    session: null,   // {id, started_at, branch, ...} från Supabase
    messages: [],    // [{id, role, content, ...}]
    phase: 'setup',  // setup | tips | session | feedback
    ai: {
      isSpeaking: false,
      isListening: false,
      isThinking: false
    },
    savedMessageIds: {},
    rating: null
  };

  // ══════════════════════════════════════════════════════════════
  // HJÄLPFUNKTIONER
  // ══════════════════════════════════════════════════════════════
  function $(sel, root) { return (root || document).querySelector(sel); }
  function escapeHtml(s) {
    if (!s) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function getAuth() {
    // Hämta befintliga CVmatchen-auth-credentials
    return {
      userId: window.authUserId || null,
      accessToken: window.authAccessToken || null
    };
  }

  async function apiSupabase(payload) {
    // Wrapper runt /api/supabase - samma pattern som resten av CVmatchen
    var resp = await fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || ('HTTP ' + resp.status));
    }
    return data;
  }

  function showError(msg) {
    var err = $('#ivError');
    if (err) {
      err.textContent = msg;
      err.style.display = 'block';
      setTimeout(function() { err.style.display = 'none'; }, 6000);
    } else {
      console.error('[Intervju]', msg);
    }
    ivDebug.log('❌ ' + msg);
  }

  // ══════════════════════════════════════════════════════════════
  // DEBUG-PANEL (synlig på mobil utan DevTools)
  // Aktivera genom att sätta window.IV_DEBUG = true i index.html
  // ══════════════════════════════════════════════════════════════
  var ivDebug = {
    panel: null,
    buffer: [],
    init: function() {
      if (!window.IV_DEBUG) return;
      if (ivDebug.panel) return;

      var panel = document.createElement('div');
      panel.id = 'ivDebugPanel';
      panel.style.cssText = [
        'position:fixed',
        'bottom:0',
        'left:0',
        'right:0',
        'max-height:40vh',
        'overflow-y:auto',
        'background:rgba(0,0,0,0.92)',
        'color:#0f0',
        'font-family:monospace',
        'font-size:11px',
        'line-height:1.4',
        'padding:8px 12px 8px 8px',
        'z-index:99999',
        'border-top:2px solid #0f0',
        'white-space:pre-wrap',
        'word-break:break-word'
      ].join(';');

      var header = document.createElement('div');
      header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;position:sticky;top:0;background:rgba(0,0,0,0.95);padding:4px 0';
      header.innerHTML = '<strong style="color:#0f0">🐛 DEBUG</strong>';

      var btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:6px';

      var clearBtn = document.createElement('button');
      clearBtn.textContent = 'Rensa';
      clearBtn.style.cssText = 'background:#222;border:1px solid #0f0;color:#0f0;padding:2px 8px;font-size:10px;border-radius:3px;font-family:inherit;cursor:pointer';
      clearBtn.onclick = function(){ ivDebug.clear(); };

      var copyBtn = document.createElement('button');
      copyBtn.textContent = 'Kopiera';
      copyBtn.style.cssText = 'background:#222;border:1px solid #0f0;color:#0f0;padding:2px 8px;font-size:10px;border-radius:3px;font-family:inherit;cursor:pointer';
      copyBtn.onclick = function(){
        var text = ivDebug.buffer.join('\n');
        try {
          navigator.clipboard.writeText(text);
          copyBtn.textContent = '✓ Kopierat';
          setTimeout(function(){ copyBtn.textContent = 'Kopiera'; }, 1500);
        } catch(e) {}
      };

      var closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.cssText = 'background:#222;border:1px solid #0f0;color:#0f0;padding:2px 8px;font-size:10px;border-radius:3px;font-family:inherit;cursor:pointer';
      closeBtn.onclick = function(){ panel.style.display = 'none'; };

      btns.appendChild(copyBtn);
      btns.appendChild(clearBtn);
      btns.appendChild(closeBtn);
      header.appendChild(btns);
      panel.appendChild(header);

      var content = document.createElement('div');
      content.id = 'ivDebugContent';
      panel.appendChild(content);

      document.body.appendChild(panel);
      ivDebug.panel = panel;

      // Fånga okaraktäriserade fel globalt
      window.addEventListener('error', function(e){
        ivDebug.log('💥 JS-FEL: ' + (e.message || e) + ' @ ' + (e.filename || '?') + ':' + (e.lineno || '?'));
      });
      window.addEventListener('unhandledrejection', function(e){
        var reason = e.reason && (e.reason.message || e.reason.toString()) || 'okänt';
        ivDebug.log('💥 PROMISE-FEL: ' + reason);
      });

      ivDebug.log('✓ Debug-panel startad');
      ivDebug.checkEnvironment();
    },
    log: function(msg) {
      var ts = new Date().toTimeString().slice(0,8);
      var line = '[' + ts + '] ' + msg;
      ivDebug.buffer.push(line);
      if (!window.IV_DEBUG) return;
      if (!ivDebug.panel) ivDebug.init();
      var content = document.getElementById('ivDebugContent');
      if (content) {
        var div = document.createElement('div');
        div.textContent = line;
        content.appendChild(div);
        ivDebug.panel.scrollTop = ivDebug.panel.scrollHeight;
      }
    },
    clear: function() {
      ivDebug.buffer = [];
      var content = document.getElementById('ivDebugContent');
      if (content) content.innerHTML = '';
      ivDebug.log('✓ Rensat');
    },
    checkEnvironment: function() {
      ivDebug.log('--- Miljö-check ---');
      ivDebug.log('window.authUserId: ' + (window.authUserId ? '✓ ' + window.authUserId.slice(0,8) + '...' : '✗ SAKNAS (ej inloggad?)'));
      ivDebug.log('window.authAccessToken: ' + (window.authAccessToken ? '✓ finns (' + window.authAccessToken.length + ' tecken)' : '✗ SAKNAS'));
      ivDebug.log('Gemini: via /api/supabase proxy ✓ (säker backend)');
      ivDebug.log('SpeechRecognition: ' + ((window.SpeechRecognition || window.webkitSpeechRecognition) ? '✓' : '✗ (textfallback)'));
      ivDebug.log('speechSynthesis: ' + ('speechSynthesis' in window ? '✓' : '✗'));
      ivDebug.log('--- Check klar ---');
    }
  };

  // Kör debug-panel init tidigt om IV_DEBUG är satt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ ivDebug.init(); });
  } else {
    ivDebug.init();
  }

  // ══════════════════════════════════════════════════════════════
  // GEMINI-KLIENT (via /api/supabase proxy - nyckeln i backend)
  // ══════════════════════════════════════════════════════════════
  async function callGemini(history, systemPrompt, opts) {
    opts = opts || {};
    var auth = requireAuth();
    var data = await apiSupabase({
      action: 'gemini_call',
      accessToken: auth.accessToken,
      userId: auth.userId,
      systemPrompt: systemPrompt,
      history: history,
      config: {
        model: CONFIG.geminiModel,
        temperature: opts.temperature || 0.85,
        maxOutputTokens: opts.maxOutputTokens || 300
      }
    });
    if (!data.text) throw new Error('Gemini returnerade tomt svar.');
    return data.text;
  }

  function toGeminiHistory(msgs) {
    return msgs.map(function(m) {
      return {
        role: m.role === 'interviewer' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });
  }

  // ══════════════════════════════════════════════════════════════
  // SYSTEM-PROMPTS
  // ══════════════════════════════════════════════════════════════
  function buildInterviewerPrompt(s) {
    var diffLine = {
      easy:   'Håll intervjun vänlig och uppmuntrande. Ställ raka, förutsägbara frågor. Ge gott om tid.',
      medium: 'Håll en realistisk intervjunivå. Blandning av enkla och mer utmanande frågor. Utmana vaga svar med följdfrågor.',
      hard:   'Spela en krävande intervjuare. Pressa på svaga punkter. Ställ svåra situationsfrågor. Var professionell — aldrig otrevlig.'
    }[s.difficulty || 'medium'];

    var companyLine = s.company
      ? 'Du företräder ' + s.company + '. Spela rollen som en rekryterare eller rekryterande chef därifrån. Om du är osäker på företagsdetaljer — håll dig generell istället för att hitta på.'
      : 'Ingen specifik arbetsgivare är angiven — agera som en erfaren rekryterare inom branschen generellt.';

    var roleLine = s.roleTitle
      ? 'Rollen som diskuteras är: ' + s.roleTitle + '.'
      : 'Rollen är inte specificerad — fråga kandidaten tidigt vilken typ av roll hen söker.';

    return [
      'Du är en erfaren svensk rekryterare som genomför en jobbintervju på svenska.',
      '',
      'KONTEXT',
      '- Bransch: ' + s.branch,
      '- ' + companyLine,
      '- ' + roleLine,
      '- Svårighetsgrad: ' + diffLine,
      '',
      'DITT SPRÅK OCH TONFALL',
      '- Prata som en vanlig svensk människa i ett riktigt samtal. Du-tilltal direkt.',
      '- ALDRIG formellt skriftspråk, byråkratisvenska eller punktlistor.',
      '- Använd naturliga markörer: "Mm", "Okej", "Aha", "Precis", "Intressant", "Alltså...", "Så...", "Just det".',
      '- Varje svar är KORT — 1-3 meningar. Som riktigt samtal, inte monolog.',
      '- Ställ EN fråga i taget. Aldrig flera i samma tur.',
      '',
      'HUR INTERVJUN FLYTER',
      '1. Börja med kort hälsning och 1-2 småpratsfrågor (hittade du hit, vill du ha kaffe/vatten).',
      '2. Gå sen in i intervjun. Öppet: "Så... berätta lite om dig själv" eller "Vad fick dig att söka just den här rollen?"',
      '3. Blanda: bakgrund, motivation, situationsfrågor ("berätta om en gång..."), branschspecifika fackfrågor, värderingar.',
      '4. LYSSNA på svaren. Ställ följdfrågor på vad kandidaten faktiskt säger — inte en förskriven lista.',
      '   - Vagt svar: gräv djupare. "Kan du ge ett konkret exempel?"',
      '   - Intressant svar: reagera. "Åh, spännande — vad lärde du dig av det?"',
      '5. Mot slutet: "Har du några frågor till mig?" — svara kort och realistiskt.',
      '6. Avsluta proffsigt: "Tack för att du tog dig tid. Vi hör av oss inom X dagar."',
      '   Skriv EXAKT markören [INTERVIEW_COMPLETE] på en egen rad när intervjun är helt färdig — inte innan.',
      '',
      'VIKTIGT',
      '- Hitta ALDRIG på specifika fakta om företaget. Om du inte vet — håll dig allmän.',
      '- Avslöja ALDRIG att du är en AI om inte kandidaten tydligt frågar. Spela rollen.',
      '- Om kandidaten är tyst eller skriver kort: fråga uppmuntrande "Vill du utveckla?" innan du går vidare.',
      '- Håll intervjun till ungefär 8-12 frågor totalt om inget annat sägs.',
      '',
      'BÖRJA NU med en kort, avslappnad hälsning. Inte "Välkommen till intervjun" — något mer naturligt.'
    ].join('\n');
  }

  function buildFeedbackPrompt(s, transcriptText) {
    return [
      'Du är en erfaren svensk intervjucoach. Nedan är transkriptet av en jobbintervju.',
      'Ge kandidaten konstruktiv, ärlig och VARM feedback på svenska.',
      '',
      'KONTEXT',
      '- Bransch: ' + s.branch,
      '- Roll: ' + (s.roleTitle || 'ej specificerad'),
      '',
      'STRUKTUR (använd exakt dessa rubriker i fet stil):',
      '',
      '**Tre saker du gjorde bra**',
      '(Konkret, koppla till vad kandidaten faktiskt sa)',
      '',
      '**Tre saker att jobba på**',
      '(Konstruktivt, inte nedsättande. Ge konkreta exempel.)',
      '',
      '**Frågor där du kunde svarat starkare**',
      '(Lista 2-3 frågor från intervjun och förklara kort hur svaret kunde förbättrats.)',
      '',
      '**Ett råd till nästa intervju**',
      '(En enda, tydlig, genomförbar grej.)',
      '',
      'Var rak men vänlig. Skriv som en människa, inte som en mall.',
      '',
      'TRANSKRIPT:',
      transcriptText
    ].join('\n');
  }

  // ══════════════════════════════════════════════════════════════
  // STORAGE via /api/supabase (samma pattern som edu-chat)
  // ══════════════════════════════════════════════════════════════
  function requireAuth() {
    var a = getAuth();
    if (!a.userId || !a.accessToken) {
      throw new Error('Du måste vara inloggad för att starta en intervju.');
    }
    return a;
  }

  async function createSession(input) {
    var auth = requireAuth();
    var r = await apiSupabase({
      action: 'create_interview_session',
      accessToken: auth.accessToken,
      userId: auth.userId,
      branch: input.branch,
      company: input.company || null,
      roleTitle: input.roleTitle || null,
      difficulty: input.difficulty || 'medium',
      jobMatchId: input.jobMatchId || null
    });
    return r.session;
  }

  async function addMessage(sessionId, role, content) {
    var auth = requireAuth();
    var r = await apiSupabase({
      action: 'add_interview_message',
      accessToken: auth.accessToken,
      userId: auth.userId,
      sessionId: sessionId,
      role: role,
      content: content
    });
    return r.message;
  }

  async function completeSession(sessionId, feedback) {
    var auth = requireAuth();
    var startedAt = state.session ? new Date(state.session.started_at).getTime() : Date.now();
    var durSec = Math.round((Date.now() - startedAt) / 1000);
    await apiSupabase({
      action: 'complete_interview_session',
      accessToken: auth.accessToken,
      userId: auth.userId,
      sessionId: sessionId,
      durationSeconds: durSec,
      overallFeedback: feedback || null,
      userRating: state.rating,
      userNotes: ($('#ivNotes') && $('#ivNotes').value) || null
    });
    return true;
  }

  async function abandonSession(sessionId) {
    try {
      var auth = getAuth();
      if (!auth.userId || !auth.accessToken) return;
      await apiSupabase({
        action: 'complete_interview_session',
        accessToken: auth.accessToken,
        userId: auth.userId,
        sessionId: sessionId,
        status: 'abandoned'
      });
    } catch (e) { /* tyst */ }
  }

  async function saveQuestionRow(sessionId, messageId, text, userAnswer) {
    var auth = requireAuth();
    var r = await apiSupabase({
      action: 'save_interview_question',
      accessToken: auth.accessToken,
      userId: auth.userId,
      sessionId: sessionId,
      messageId: messageId,
      questionText: text,
      userAnswer: userAnswer || null,
      difficulty: state.session ? state.session.difficulty : null
    });
    return r.savedQuestion;
  }

  // ══════════════════════════════════════════════════════════════
  // RÖST: SYNTHESIS (TTS) — AI PRATAR
  // ══════════════════════════════════════════════════════════════
  var tts = {
    voice: null,
    voices: [],
    ready: false,

    init: function() {
      if (!('speechSynthesis' in window)) return;
      var pick = function() {
        tts.voices = window.speechSynthesis.getVoices()
          .filter(function(v) { return v.lang && v.lang.toLowerCase().indexOf('sv') === 0; });
        var prefNames = ['Alva (Förbättrad)','Alva','Klara','Hedvig','Bengt','Google svenska'];
        for (var i = 0; i < prefNames.length; i++) {
          var match = tts.voices.find(function(v) { return v.name.indexOf(prefNames[i]) !== -1; });
          if (match) { tts.voice = match; break; }
        }
        if (!tts.voice && tts.voices.length) tts.voice = tts.voices[0];
        tts.ready = true;
      };
      pick();
      window.speechSynthesis.onvoiceschanged = pick;
    },

    speak: function(text) {
      return new Promise(function(resolve) {
        if (!('speechSynthesis' in window) || !text) return resolve();
        try { window.speechSynthesis.cancel(); } catch(e) {}
        var u = new SpeechSynthesisUtterance(text);
        u.lang = CONFIG.defaultVoiceLang;
        u.rate = CONFIG.ttsRate;
        u.pitch = CONFIG.ttsPitch;
        if (tts.voice) u.voice = tts.voice;
        u.onstart = function() {
          state.ai.isSpeaking = true;
          updateStatusPill();
        };
        u.onend = function() {
          state.ai.isSpeaking = false;
          updateStatusPill();
          resolve();
        };
        u.onerror = function() {
          state.ai.isSpeaking = false;
          updateStatusPill();
          resolve();
        };
        try { window.speechSynthesis.speak(u); } catch(e) { resolve(); }
      });
    },

    cancel: function() {
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch(e) {}
      }
      state.ai.isSpeaking = false;
      updateStatusPill();
    }
  };

  // ══════════════════════════════════════════════════════════════
  // RÖST: RECOGNITION (STT) — ANVÄNDAREN PRATAR
  // ══════════════════════════════════════════════════════════════
  var stt = {
    rec: null,
    finalText: '',
    supported: false,

    init: function() {
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { stt.supported = false; return; }
      stt.supported = true;
      stt.rec = new SR();
      stt.rec.lang = CONFIG.defaultVoiceLang;
      stt.rec.continuous = true;
      stt.rec.interimResults = true;

      stt.rec.onstart = function() {
        state.ai.isListening = true;
        updateStatusPill();
      };
      stt.rec.onresult = function(ev) {
        var interim = '';
        for (var i = ev.resultIndex; i < ev.results.length; i++) {
          var t = ev.results[i][0].transcript;
          if (ev.results[i].isFinal) stt.finalText = (stt.finalText + ' ' + t).trim();
          else interim += t;
        }
        var box = $('#ivInterim');
        if (box) {
          box.textContent = stt.finalText + (interim ? ' ' + interim : '');
          box.style.display = (stt.finalText || interim) ? 'block' : 'none';
        }
      };
      stt.rec.onerror = function(ev) {
        if (ev.error !== 'no-speech' && ev.error !== 'aborted') {
          showError('Mikrofonfel: ' + ev.error);
        }
        state.ai.isListening = false;
        updateStatusPill();
      };
      stt.rec.onend = function() {
        state.ai.isListening = false;
        updateStatusPill();
      };
    },

    start: function() {
      if (!stt.supported) { showError('Din webbläsare stöder inte röstinspelning. Använd textinput.'); return; }
      stt.finalText = '';
      var box = $('#ivInterim');
      if (box) box.style.display = 'none';
      try { stt.rec.start(); } catch(e) {}
    },

    stop: function() {
      try { stt.rec.stop(); } catch(e) {}
      return stt.finalText.trim();
    }
  };

  // ══════════════════════════════════════════════════════════════
  // UI: HÄMTA ROT
  // ══════════════════════════════════════════════════════════════
  function getRoot() {
    return $('#trainView-intervju');
  }

  // ══════════════════════════════════════════════════════════════
  // UI: BYGG HELA VYN
  // ══════════════════════════════════════════════════════════════
  function buildUI() {
    var root = getRoot();
    if (!root) return false;
    if (root.dataset.ivBuilt === '1') return true;

    // Bevara befintliga "Tillbaka"-knappen — ersätt allt annat
    var backBtn = root.querySelector('.train-back');
    root.innerHTML = '';
    if (backBtn) root.appendChild(backBtn);

    var container = document.createElement('div');
    container.className = 'iv-root';
    container.innerHTML = [
      '<div id="ivError" class="iv-error" style="display:none"></div>',

      // ─── SETUP ────────────────────────────
      '<div class="iv-screen iv-screen--active" id="ivScreenSetup">',
      '  <div class="iv-title">🎤 Intervjuträning</div>',
      '  <div class="iv-sub">Fyll i vad du vill öva inför. Ju mer specifikt, desto bättre frågor.</div>',

      '  <div class="iv-field">',
      '    <label class="iv-label">Bransch / yrkesområde <span style="color:#ef4444">*</span></label>',
      '    <select class="iv-select" id="ivBranch"><option value="">Välj bransch...</option>',
      BRANCHES.map(function(b){ return '<option value="'+escapeHtml(b)+'">'+escapeHtml(b)+'</option>'; }).join(''),
      '    </select>',
      '    <input class="iv-input" id="ivCustomBranch" placeholder="Skriv din bransch" style="display:none;margin-top:8px">',
      '  </div>',

      '  <div class="iv-field">',
      '    <label class="iv-label">Företag<span class="iv-label-opt">(valfritt)</span></label>',
      '    <input class="iv-input" id="ivCompany" placeholder="t.ex. DSV, Spotify, Region Stockholm">',
      '  </div>',

      '  <div class="iv-field">',
      '    <label class="iv-label">Roll / titel<span class="iv-label-opt">(valfritt)</span></label>',
      '    <input class="iv-input" id="ivRole" placeholder="t.ex. Lagerarbetare, Frontend-utvecklare">',
      '  </div>',

      '  <div class="iv-field">',
      '    <label class="iv-label">Svårighetsgrad</label>',
      '    <div class="iv-diff-grid">',
      '      <button type="button" class="iv-diff-btn" data-diff="easy">Vänlig</button>',
      '      <button type="button" class="iv-diff-btn iv-diff-btn--active" data-diff="medium">Realistisk</button>',
      '      <button type="button" class="iv-diff-btn" data-diff="hard">Tuff</button>',
      '    </div>',
      '    <div class="iv-diff-hint" id="ivDiffHint">Normal intervjunivå. Blandning av enkla och krävande frågor.</div>',
      '  </div>',

      '  <button class="iv-btn" id="ivStartSetupBtn" style="margin-top:8px">Fortsätt till tips →</button>',
      '</div>',

      // ─── TIPS ─────────────────────────────
      '<div class="iv-screen" id="ivScreenTips">',
      '  <div class="iv-title">10 saker att tänka på</div>',
      '  <div class="iv-sub">Läs igenom innan intervjun. Bocka av — eller hoppa bara över.</div>',
      '  <div class="iv-tips-list" id="ivTipsList"></div>',
      '  <div class="iv-tips-progress" id="ivTipsProgress">Bocka av det du tar med dig</div>',
      '  <div style="display:flex;gap:8px">',
      '    <button class="iv-btn iv-btn--ghost" id="ivTipsBackBtn" style="flex:1">← Tillbaka</button>',
      '    <button class="iv-btn" id="ivTipsStartBtn" style="flex:2">Starta intervjun →</button>',
      '  </div>',
      '</div>',

      // ─── SESSION (CHAT) ──────────────────
      '<div class="iv-screen" id="ivScreenSession">',
      '  <div class="iv-session-header">',
      '    <div class="iv-session-info" id="ivSessionInfo"></div>',
      '    <div class="iv-status-pill" id="ivStatusPill">Väntar</div>',
      '  </div>',
      '  <div class="iv-messages" id="ivMessages"></div>',
      '  <div class="iv-interim" id="ivInterim" style="display:none;padding:0 12px 4px;font-size:13px;color:rgba(255,255,255,0.4)"></div>',
      '  <div class="iv-input-bar">',
      '    <button class="iv-icon-btn iv-icon-btn--mic" id="ivMicBtn" title="Spela in svar">🎤</button>',
      '    <textarea class="iv-input-text" id="ivUserInput" rows="1" placeholder="Skriv ditt svar..."></textarea>',
      '    <button class="iv-icon-btn iv-icon-btn--send" id="ivSendBtn" title="Skicka">➤</button>',
      '  </div>',
      '  <div class="iv-actions-row">',
      '    <button class="iv-btn iv-btn--ghost" id="ivEndBtn" style="flex:1">Avsluta intervjun</button>',
      '  </div>',
      '</div>',

      // ─── FEEDBACK ─────────────────────────
      '<div class="iv-screen" id="ivScreenFeedback">',
      '  <div class="iv-title">Intervjun är klar 🎉</div>',
      '  <div class="iv-sub" id="ivFeedbackMeta"></div>',

      '  <h3 style="font-size:14px;color:#a78bfa;margin:8px 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Feedback från AI-coachen</h3>',
      '  <div class="iv-feedback-box" id="ivFeedbackText">Laddar...</div>',

      '  <h3 style="font-size:14px;color:rgba(255,255,255,0.6);margin:16px 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Ditt betyg</h3>',
      '  <div class="iv-rating" id="ivRating">',
      '    <button class="iv-star" data-star="1">★</button>',
      '    <button class="iv-star" data-star="2">★</button>',
      '    <button class="iv-star" data-star="3">★</button>',
      '    <button class="iv-star" data-star="4">★</button>',
      '    <button class="iv-star" data-star="5">★</button>',
      '  </div>',

      '  <h3 style="font-size:14px;color:rgba(255,255,255,0.6);margin:8px 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Anteckningar</h3>',
      '  <textarea class="iv-notes" id="ivNotes" placeholder="Vad vill du komma ihåg till nästa gång?"></textarea>',

      '  <h3 style="font-size:14px;color:rgba(255,255,255,0.6);margin:16px 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Intervjuns gång — spara frågor att öva på</h3>',
      '  <div id="ivTranscript"></div>',

      '  <div style="display:flex;gap:8px;margin-top:20px">',
      '    <button class="iv-btn iv-btn--ghost" id="ivFbBackBtn" style="flex:1">Tillbaka</button>',
      '    <button class="iv-btn" id="ivFbSaveBtn" style="flex:1">Spara & stäng</button>',
      '  </div>',
      '</div>'
    ].join('\n');

    root.appendChild(container);
    root.dataset.ivBuilt = '1';
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // UI: RENDER OCH VIEW-BYTE
  // ══════════════════════════════════════════════════════════════
  function showScreen(name) {
    state.phase = name;
    ['Setup','Tips','Session','Feedback'].forEach(function(s){
      var el = $('#ivScreen' + s);
      if (!el) return;
      el.classList.toggle('iv-screen--active', s.toLowerCase() === name);
    });
  }

  function renderTips() {
    var list = $('#ivTipsList');
    if (!list) return;
    list.innerHTML = TIPS.map(function(t){
      var checked = !!state.tipsChecked[t.n];
      return [
        '<div class="iv-tip' + (checked ? ' iv-tip--checked' : '') + '" data-tip="' + t.n + '">',
        '  <div class="iv-tip-emoji">' + t.e + '</div>',
        '  <div class="iv-tip-body">',
        '    <div class="iv-tip-num">#' + t.n + '</div>',
        '    <div class="iv-tip-title">' + escapeHtml(t.t) + '</div>',
        '    <div class="iv-tip-desc">' + escapeHtml(t.d) + '</div>',
        '  </div>',
        '  <div class="iv-tip-check">' + (checked ? '✓' : '') + '</div>',
        '</div>'
      ].join('');
    }).join('');

    // Bind clicks
    list.querySelectorAll('.iv-tip').forEach(function(el){
      el.addEventListener('click', function(){
        var n = parseInt(el.getAttribute('data-tip'), 10);
        state.tipsChecked[n] = !state.tipsChecked[n];
        renderTips();
        updateTipsProgress();
      });
    });
    updateTipsProgress();
  }

  function updateTipsProgress() {
    var count = Object.keys(state.tipsChecked).filter(function(k){ return state.tipsChecked[k]; }).length;
    var p = $('#ivTipsProgress');
    if (!p) return;
    if (count === 0) p.textContent = 'Bocka av det du tar med dig';
    else if (count < 10) p.textContent = count + ' av 10 avbockade';
    else p.textContent = '✅ Du är redo — lycka till!';
  }

  function updateStatusPill() {
    var pill = $('#ivStatusPill');
    if (!pill) return;
    pill.classList.remove('iv-status-pill--listening','iv-status-pill--speaking','iv-status-pill--thinking');
    if (state.ai.isListening) { pill.textContent = 'Lyssnar'; pill.classList.add('iv-status-pill--listening'); }
    else if (state.ai.isSpeaking) { pill.textContent = 'Pratar'; pill.classList.add('iv-status-pill--speaking'); }
    else if (state.ai.isThinking) { pill.textContent = 'Tänker'; pill.classList.add('iv-status-pill--thinking'); }
    else { pill.textContent = 'Väntar'; }

    // Toggle mic-knapp visuellt
    var mic = $('#ivMicBtn');
    if (mic) mic.classList.toggle('iv-icon-btn--recording', state.ai.isListening);
  }

  function renderSessionInfo() {
    var info = $('#ivSessionInfo');
    if (!info || !state.session) return;
    var parts = ['<strong>' + escapeHtml(state.session.branch) + '</strong>'];
    if (state.session.company) parts.push(escapeHtml(state.session.company));
    if (state.session.role_title) parts.push(escapeHtml(state.session.role_title));
    info.innerHTML = parts.join(' · ');
  }

  function appendMessage(msg) {
    var msgs = $('#ivMessages');
    if (!msgs) return;
    var wrap = document.createElement('div');
    wrap.className = 'iv-msg' + (msg.role === 'candidate' ? ' iv-msg--user' : '');

    if (msg.role === 'interviewer') {
      var av = document.createElement('div');
      av.className = 'iv-msg-avatar';
      av.textContent = '🤖';
      wrap.appendChild(av);
    }

    var bubble = document.createElement('div');
    bubble.className = 'iv-msg-bubble';
    bubble.textContent = msg.content;
    wrap.appendChild(bubble);

    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderAllMessages() {
    var msgs = $('#ivMessages');
    if (!msgs) return;
    msgs.innerHTML = '';
    state.messages.forEach(appendMessage);
  }

  // ══════════════════════════════════════════════════════════════
  // LOGIC: INTERVJU-LOOP
  // ══════════════════════════════════════════════════════════════
  async function askInterviewerNext() {
    ivDebug.log('  → askInterviewerNext()');
    state.ai.isThinking = true;
    updateStatusPill();
    try {
      var history = toGeminiHistory(state.messages);
      ivDebug.log('    historik-längd: ' + history.length);
      var prompt = buildInterviewerPrompt({
        branch: state.session.branch,
        company: state.session.company,
        roleTitle: state.session.role_title,
        difficulty: state.session.difficulty
      });

      ivDebug.log('    anropar Gemini...');
      var rawText = await callGemini(history, prompt, { maxOutputTokens: 250 });
      ivDebug.log('    ✓ Gemini svarade (' + rawText.length + ' tecken)');

      var isComplete = rawText.indexOf('[INTERVIEW_COMPLETE]') !== -1;
      var clean = rawText.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim();

      ivDebug.log('    sparar meddelande i Supabase...');
      var saved = await addMessage(state.session.id, 'interviewer', clean);
      ivDebug.log('    ✓ Meddelande sparat');
      state.messages.push(saved);
      appendMessage(saved);

      state.ai.isThinking = false;
      updateStatusPill();

      // AI läser upp svaret
      ivDebug.log('    startar TTS...');
      await tts.speak(clean);
      ivDebug.log('    ✓ TTS klart');

      if (isComplete) {
        endInterview();
      }
    } catch (e) {
      ivDebug.log('    ✗ askInterviewerNext kraschade: ' + (e.message || e));
      state.ai.isThinking = false;
      updateStatusPill();
      showError('AI-fel: ' + (e.message || e));
    }
  }

  async function submitUserAnswer(text) {
    if (!text || !text.trim() || !state.session) return;
    text = text.trim();

    try {
      var saved = await addMessage(state.session.id, 'candidate', text);
      state.messages.push(saved);
      appendMessage(saved);

      await askInterviewerNext();
    } catch (e) {
      showError('Kunde inte skicka: ' + (e.message || e));
    }
  }

  async function startInterview() {
    ivDebug.log('▶ startInterview() anropad');
    ivDebug.log('  Setup: bransch=' + state.setup.branch + ', företag=' + (state.setup.company||'-') + ', roll=' + (state.setup.roleTitle||'-') + ', svårighet=' + state.setup.difficulty);
    try {
      tts.cancel();

      // Pre-flight: är användaren inloggad i CVmatchen?
      ivDebug.log('  Kollar CVmatchen-auth...');
      var auth = getAuth();
      if (!auth.userId || !auth.accessToken) {
        throw new Error('Du måste vara inloggad för att starta en intervju.');
      }
      ivDebug.log('  ✓ Inloggad (userId=' + auth.userId.slice(0, 8) + '...)');

      // Skapa session via /api/supabase
      ivDebug.log('  Skapar session via /api/supabase...');
      state.session = await createSession(state.setup);
      ivDebug.log('  ✓ Session skapad: id=' + state.session.id);

      state.messages = [];
      state.savedMessageIds = {};
      state.rating = null;

      showScreen('session');
      ivDebug.log('  ✓ Bytte till session-skärm');
      renderSessionInfo();
      renderAllMessages();

      // Be AI ställa första frågan
      ivDebug.log('  Anropar Gemini för första frågan...');
      await askInterviewerNext();
      ivDebug.log('  ✓ startInterview klart');
    } catch (e) {
      ivDebug.log('✗ startInterview kraschade: ' + (e.message || e));
      if (e.stack) ivDebug.log('  stack: ' + e.stack.slice(0, 300));
      showError('Kunde inte starta: ' + (e.message || e));
      showScreen('tips');
    }
  }

  async function endInterview() {
    tts.cancel();
    stt.stop();
    showScreen('feedback');

    // Bygg transkript för feedback
    var transcriptText = state.messages.map(function(m){
      return (m.role === 'interviewer' ? 'Intervjuare' : 'Kandidat') + ': ' + m.content;
    }).join('\n\n');

    // Skriv meta
    var meta = $('#ivFeedbackMeta');
    if (meta && state.session) {
      var dur = state.session.started_at
        ? Math.max(0, Math.round((Date.now() - new Date(state.session.started_at).getTime()) / 1000))
        : 0;
      var mins = Math.floor(dur / 60), secs = dur % 60;
      var parts = ['<strong>' + escapeHtml(state.session.branch) + '</strong>'];
      if (state.session.company) parts.push(escapeHtml(state.session.company));
      if (state.session.role_title) parts.push(escapeHtml(state.session.role_title));
      parts.push('Längd: ' + mins + ' min ' + secs + ' s');
      meta.innerHTML = parts.join(' · ');
    }

    // Rendera transkript
    renderTranscript();

    // Generera AI-feedback
    var fbBox = $('#ivFeedbackText');
    if (fbBox) fbBox.textContent = 'Analyserar intervjun...';
    try {
      var prompt = buildFeedbackPrompt({
        branch: state.session.branch,
        roleTitle: state.session.role_title
      }, transcriptText);

      var feedback = await callGemini(
        [{ role: 'user', parts: [{ text: 'Ge feedback enligt instruktionerna.' }] }],
        prompt,
        { maxOutputTokens: 800, temperature: 0.6 }
      );

      if (fbBox) {
        // Enkel markdown: **fet** → <strong>
        fbBox.innerHTML = escapeHtml(feedback).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      }

      // Spara i databasen (utan rating/notes ännu, sparas vid "Spara & stäng")
      await completeSession(state.session.id, feedback);
    } catch (e) {
      if (fbBox) fbBox.textContent = 'Kunde inte generera feedback: ' + (e.message || e);
    }
  }

  function renderTranscript() {
    var box = $('#ivTranscript');
    if (!box) return;
    box.innerHTML = state.messages.map(function(m, i){
      var cls = m.role === 'interviewer' ? 'iv-transcript-item--ai' : 'iv-transcript-item--user';
      var role = m.role === 'interviewer' ? 'Intervjuare' : 'Du';
      var saveBtn = '';
      if (m.role === 'interviewer') {
        var isSaved = !!state.savedMessageIds[m.id];
        saveBtn = '<button class="iv-save-btn' + (isSaved ? ' iv-save-btn--saved' : '') + '" data-msg="' + m.id + '">' +
                  (isSaved ? '✓ Sparad' : '⭐ Spara') + '</button>';
      }
      return [
        '<div class="iv-transcript-item ' + cls + '">',
        '  <div class="iv-transcript-role">' + role + '</div>',
        '  <div class="iv-transcript-text">' + escapeHtml(m.content) + '</div>',
        saveBtn,
        '</div>'
      ].join('');
    }).join('');

    // Bind spara-knappar
    box.querySelectorAll('.iv-save-btn').forEach(function(btn){
      btn.addEventListener('click', async function(){
        if (btn.classList.contains('iv-save-btn--saved')) return;
        var msgId = btn.getAttribute('data-msg');
        var msg = state.messages.find(function(m){ return m.id === msgId; });
        if (!msg) return;
        var idx = state.messages.indexOf(msg);
        var nextAnswer = state.messages[idx + 1];
        var userAnswer = (nextAnswer && nextAnswer.role === 'candidate') ? nextAnswer.content : null;
        try {
          await saveQuestionRow(state.session.id, msg.id, msg.content, userAnswer);
          state.savedMessageIds[msgId] = true;
          btn.textContent = '✓ Sparad';
          btn.classList.add('iv-save-btn--saved');
        } catch (e) {
          showError('Kunde inte spara: ' + (e.message || e));
        }
      });
    });
  }

  // ══════════════════════════════════════════════════════════════
  // EVENT BINDINGS
  // ══════════════════════════════════════════════════════════════
  function bindEvents() {
    var root = getRoot();
    if (!root || root.dataset.ivBound === '1') return;

    // ─── SETUP ─────────────────────
    var branchSel = $('#ivBranch');
    if (branchSel) {
      branchSel.addEventListener('change', function(){
        var v = branchSel.value;
        state.setup.branch = v;
        var custom = $('#ivCustomBranch');
        if (custom) {
          custom.style.display = (v === 'Annat') ? 'block' : 'none';
          if (v !== 'Annat') custom.value = '';
        }
      });
    }
    var customBranch = $('#ivCustomBranch');
    if (customBranch) customBranch.addEventListener('input', function(){
      state.setup.branch = customBranch.value;
    });
    var companyI = $('#ivCompany');
    if (companyI) companyI.addEventListener('input', function(){ state.setup.company = companyI.value; });
    var roleI = $('#ivRole');
    if (roleI) roleI.addEventListener('input', function(){ state.setup.roleTitle = roleI.value; });

    root.querySelectorAll('.iv-diff-btn').forEach(function(b){
      b.addEventListener('click', function(){
        root.querySelectorAll('.iv-diff-btn').forEach(function(x){ x.classList.remove('iv-diff-btn--active'); });
        b.classList.add('iv-diff-btn--active');
        state.setup.difficulty = b.getAttribute('data-diff');
        var hint = $('#ivDiffHint');
        if (hint) {
          hint.textContent = ({
            easy: 'Avslappnad ton, raka frågor. Bra för nybörjare.',
            medium: 'Normal intervjunivå. Blandning av enkla och krävande frågor.',
            hard: 'AI:n pressar dig på svaga punkter. Bra inför viktiga intervjuer.'
          })[state.setup.difficulty];
        }
      });
    });

    var startSetupBtn = $('#ivStartSetupBtn');
    if (startSetupBtn) startSetupBtn.addEventListener('click', function(){
      var b = (state.setup.branch || '').trim();
      if (!b) { showError('Välj bransch först.'); return; }
      if (state.setup.branch === 'Annat' && customBranch) {
        state.setup.branch = (customBranch.value || '').trim();
        if (!state.setup.branch) { showError('Skriv in din bransch.'); return; }
      }
      renderTips();
      showScreen('tips');
    });

    // ─── TIPS ─────────────────────
    var tipsBack = $('#ivTipsBackBtn');
    if (tipsBack) tipsBack.addEventListener('click', function(){ showScreen('setup'); });
    var tipsStart = $('#ivTipsStartBtn');
    if (tipsStart) tipsStart.addEventListener('click', function(){
      ivDebug.log('🎤 "Starta intervjun" klickad');
      startInterview();
    });

    // ─── SESSION ──────────────────
    var sendBtn = $('#ivSendBtn');
    var userInput = $('#ivUserInput');
    var micBtn = $('#ivMicBtn');
    var endBtn = $('#ivEndBtn');

    function handleSend() {
      if (!userInput) return;
      var text = userInput.value.trim();
      if (!text) return;
      userInput.value = '';
      userInput.style.height = 'auto';
      submitUserAnswer(text);
    }

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (userInput) {
      userInput.addEventListener('keydown', function(e){
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
      });
      userInput.addEventListener('input', function(){
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
      });
    }

    if (micBtn) micBtn.addEventListener('click', function(){
      if (state.ai.isListening) {
        var text = stt.stop();
        if (text && userInput) { userInput.value = text; handleSend(); }
      } else {
        // Avbryt AI-tal om det pågår (barge-in)
        tts.cancel();
        stt.start();
      }
    });

    if (endBtn) endBtn.addEventListener('click', function(){
      if (confirm('Avsluta intervjun och få feedback?')) endInterview();
    });

    // ─── FEEDBACK ─────────────────
    var rating = $('#ivRating');
    if (rating) rating.addEventListener('click', function(e){
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains('iv-star')) return;
      var n = parseInt(t.getAttribute('data-star'), 10);
      state.rating = n;
      rating.querySelectorAll('.iv-star').forEach(function(s, i){
        s.classList.toggle('iv-star--on', i < n);
      });
    });

    var fbBack = $('#ivFbBackBtn');
    if (fbBack) fbBack.addEventListener('click', function(){
      resetToSetup();
    });

    var fbSave = $('#ivFbSaveBtn');
    if (fbSave) fbSave.addEventListener('click', async function(){
      if (state.session) {
        try {
          var fb = $('#ivFeedbackText') ? $('#ivFeedbackText').textContent : null;
          await completeSession(state.session.id, fb);
        } catch(e) {}
      }
      resetToSetup();
      if (window.trainSwitchView) window.trainSwitchView('hub');
    });

    root.dataset.ivBound = '1';
  }

  function resetToSetup() {
    state.session = null;
    state.messages = [];
    state.savedMessageIds = {};
    state.rating = null;
    showScreen('setup');
  }

  // ══════════════════════════════════════════════════════════════
  // PUBLIK API
  // ══════════════════════════════════════════════════════════════
  window.ivInit = function(opts) {
    opts = opts || {};

    if (!buildUI()) {
      console.warn('[Intervju] #trainView-intervju hittades inte');
      return;
    }
    bindEvents();
    tts.init();
    stt.init();

    // Prefill från matchat jobb
    if (opts.prefill) {
      if (opts.prefill.branch && $('#ivBranch')) {
        $('#ivBranch').value = opts.prefill.branch;
        state.setup.branch = opts.prefill.branch;
      }
      if (opts.prefill.company && $('#ivCompany')) {
        $('#ivCompany').value = opts.prefill.company;
        state.setup.company = opts.prefill.company;
      }
      if (opts.prefill.roleTitle && $('#ivRole')) {
        $('#ivRole').value = opts.prefill.roleTitle;
        state.setup.roleTitle = opts.prefill.roleTitle;
      }
      state.setup.jobMatchId = opts.prefill.jobMatchId || null;
    }

    showScreen('setup');
  };

  // Cleanup om användaren lämnar intervju-viewen mitt i en session
  window.ivCleanup = function() {
    tts.cancel();
    stt.stop();
    if (state.session && state.phase === 'session') {
      abandonSession(state.session.id).catch(function(){});
    }
  };

  // Auto-init när DOM är klart
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { window.ivInit(); });
  } else {
    window.ivInit();
  }

})();
