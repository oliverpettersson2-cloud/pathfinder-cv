/* =====================================================================
   CVmatchen — Intervjuträning (vanilla JS)
   Matchar befintlig edu-chat stil. Prefix: iv / ivInit
   
   Externa beroenden som redan finns i index.html:
   - window.authUserId + window.authAccessToken (CVmatchen-auth)
   - /api/chat endpoint (proxy till Anthropic Claude — samma som AI-SYV använder)
   - /api/supabase endpoint med intervju-actions (sessions, messages, etc)
   
   AI drivs av Claude via /api/chat-proxyn. Ingen Gemini-nyckel krävs.
   ANTHROPIC_API_KEY ligger säkert i Vercel env vars.
   
   Bygger UI:t dynamiskt in i #trainView-intervju vid sidladdning.
   ===================================================================== */

(function() {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // KONFIGURATION
  // ══════════════════════════════════════════════════════════════
  var CONFIG = {
    claudeModel: 'claude-haiku-4-5-20251001',  // Samma modell som AI-SYV/edu-chat använder. Snabb, bra på samtals-AI.
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
      d: 'STAR-metoden hjälper dig strukturera berättelser om din erfarenhet:\n\n' +
         '• S (Situation) — beskriv kort sammanhanget, var var du och när.\n' +
         '• T (Task) — vad var din uppgift eller utmaning.\n' +
         '• A (Action) — vad DU gjorde konkret (inte teamet, utan du).\n' +
         '• R (Result) — vad ledde det till, helst med siffror.\n\n' +
         'Exempel: "På mitt jobb som lagerarbetare (S) blev det plötsligt akut med en stor order (T). Jag organiserade om arbetslaget och tog ansvar för plockningen (A). Vi levererade i tid och fick beröm från kunden (R)."\n\n' +
         'Passar ~80% av frågorna som börjar med "Berätta om en gång då..."' },
    { n: 8, e: '🤔', t: 'Det är okej att tänka innan du svarar',
      d: '"Ska jag fundera en sekund..." är bättre än att rabbla dåligt genomtänkt.' },
    { n: 9, e: '😊', t: 'Var dig själv — men din bästa version',
      d: 'Du ska inte spela en roll, utan visa vem du faktiskt är — bara lite mer förberedd och fokuserad. ' +
         'Var ärlig om dina styrkor OCH om det du vill utvecklas inom. Arbetsgivare anställer människor, inte perfekta robotar. ' +
         'Äkthet bygger förtroende snabbare än ett polerat skal.' },
    { n: 10, e: '👋', t: 'Avsluta starkt — fråga om nästa steg',
      d: '"När kan jag förvänta mig att höra något?" visar intresse och ger konkret tidslinje.' }
  ];

  // ══════════════════════════════════════════════════════════════
  // DATA: BRANSCHER
  // Matchar exakt kategorierna på "Matcha" → Steg 2 (snabbsök-chips)
  // så användaren känner igen sig mellan flödena.
  // ══════════════════════════════════════════════════════════════
  var BRANCHES = [
    '📦 Lager & logistik',
    '🤝 Vård & omsorg',
    '🏗️ Bygg & anläggning',
    '🧹 Städ & service',
    '🍽️ Restaurang & kök',
    '🛒 Butik & handel',
    '🏭 Industri & tillverkning',
    '📋 Administration & kontor',
    '🚚 Transport & chaufför',
    '👶 Barn & skola',
    '💻 IT & tech',
    '📚 Annat / Eget val'
  ];

  // ══════════════════════════════════════════════════════════════
  // FRÅGEBANK per bransch — 10 vanliga frågor att öva på hemma (PDF)
  // Mix: personliga, kompetens, situation, motivation, STAR-triggers
  // ══════════════════════════════════════════════════════════════
  var PRACTICE_QUESTIONS = {
    'generic': [
      'Berätta lite om dig själv och din bakgrund.',
      'Varför söker du just detta jobb?',
      'Vilka är dina tre största styrkor?',
      'Vad är din största svaghet, och hur jobbar du med den?',
      'Berätta om en gång då du löste ett problem på jobbet.',
      'Hur hanterar du stress eller tajta deadlines?',
      'Varför lämnar (eller lämnade) du ditt förra jobb?',
      'Var ser du dig själv om 3–5 år?',
      'Hur jobbar du bäst — ensam eller i team?',
      'Har du några frågor till oss?'
    ],
    '📦 Lager & logistik': [
      'Berätta om din tidigare erfarenhet av lagerarbete.',
      'Har du truckkort? I så fall vilka klasser (A, B, C, D)?',
      'Hur noggrann är du när du plockar order? Berätta om en gång du upptäckte ett fel.',
      'Hur hanterar du tunga lyft och hög arbetstakt under en hel dag?',
      'Berätta om hur du samarbetar med kollegor under en stressig inleveransdag.',
      'Vad vet du om WMS-system (lagerhanteringssystem)?',
      'Hur prioriterar du när det är många brådskande uppgifter samtidigt?',
      'Berätta om en gång du föreslog ett bättre sätt att göra något på lagret.',
      'Hur ser du på säkerhet — vad gör du om du ser en kollega ta en genväg som är farlig?',
      'Är du beredd på skiftarbete eller helger? Vad föredrar du?'
    ],
    '🤝 Vård & omsorg': [
      'Vad fick dig att välja vård- och omsorgsyrket?',
      'Berätta om en gång du mötte en krävande anhörig eller brukare och hur du löste det.',
      'Hur hanterar du det emotionellt när en brukare du känner försämras eller går bort?',
      'Vad betyder "personcentrerad vård" för dig i praktiken?',
      'Berätta om en gång du behövde sätta gränser på ett respektfullt sätt.',
      'Hur dokumenterar du avvikelser och varför är det viktigt?',
      'Vad gör du om du ser en kollega göra något som går emot rutinerna?',
      'Hur bemöter du någon med demenssjukdom som är orolig eller arg?',
      'Hur är du som kollega under ett tufft pass?',
      'Är du bekväm med delegerade uppgifter (exempelvis läkemedel) — berätta om din erfarenhet.'
    ],
    '🏗️ Bygg & anläggning': [
      'Berätta om din yrkesbakgrund och vilka byggtyper du jobbat med.',
      'Har du certifikat som ställningsbygge, heta arbeten, fallskydd eller liftutbildning?',
      'Berätta om ett projekt där du är extra stolt över resultatet.',
      'Hur gör du för att jobba säkert när tempot är högt?',
      'Beskriv en konflikt på en byggarbetsplats och hur du hanterade den.',
      'Hur läser du ritningar — visa ett exempel där detaljer gjorde skillnad.',
      'Vad gör du om materialet som levereras är fel eller skadat?',
      'Är du van att jobba med UE (underentreprenörer) — hur fungerar samarbetet?',
      'Hur hanterar du fysiskt tunga dagar i kyla eller värme?',
      'Är du beredd att resa eller bo på ort? Hur ser din flexibilitet ut?'
    ],
    '🧹 Städ & service': [
      'Berätta om din erfarenhet av städarbete — vilka miljöer har du jobbat i?',
      'Vilka kemikalier och maskiner är du van att använda?',
      'Hur gör du för att hinna med allt på ett avgränsat tidsfönster?',
      'Berätta om en gång du upptäckte något viktigt under ett städpass (t.ex. skador, läckage).',
      'Hur hanterar du kundkontakt om du städar hos privatpersoner eller kontor?',
      'Vad vet du om miljövänlig städning eller gröna kemikalier?',
      'Hur noggrann är du med egenkontroll och avprickning?',
      'Berätta om en gång du fick klagomål — hur löste du det?',
      'Är du beredd på obekväma arbetstider (tidiga morgnar, kvällar)?',
      'Hur samarbetar du i ett städteam när ni är flera på samma objekt?'
    ],
    '🍽️ Restaurang & kök': [
      'Berätta om din erfarenhet av restaurang eller kök.',
      'Hur håller du kvalitet och tempo under en stressig lunch-rush?',
      'Vad vet du om egenkontroll (HACCP) och hygienregler?',
      'Berätta om en gång du hanterade en missnöjd gäst bra.',
      'Hur samarbetar du med köket om du jobbar i sal (eller tvärtom)?',
      'Vilka rätter eller kök är du starkast inom?',
      'Berätta om en stökig service-kväll — vad gjorde du konkret för att rädda den?',
      'Hur hanterar du allergier och specialkost?',
      'Är du bekväm med kassa, Swish och kortbetalningar?',
      'Är du beredd på sena kvällar och helgarbete?'
    ],
    '🛒 Butik & handel': [
      'Berätta om din säljerfarenhet och vilka branscher du sålt inom.',
      'Hur närmar du dig en kund som ser "bara tittar"-typen ut?',
      'Berätta om ditt bästa försäljningsögonblick — vad gjorde du annorlunda?',
      'Hur hanterar du en arg eller besviken kund vid kassan?',
      'Vad vet du om varuexponering (VM) och varför gör det skillnad?',
      'Hur är du på att mersälja utan att pressa kunden?',
      'Berätta om en gång du upptäckte stöld eller svinn — hur agerade du?',
      'Vilka kassasystem och betalningslösningar har du jobbat med?',
      'Hur hanterar du att ensamjobba i butiken?',
      'Är du flexibel med kväll och helg? Hur ser din tillgänglighet ut?'
    ],
    '🏭 Industri & tillverkning': [
      'Berätta om din erfarenhet av industri eller produktion.',
      'Vilka maskiner eller processer är du van att jobba med?',
      'Hur jobbar du med kvalitet och kontroll på din arbetsplats?',
      'Berätta om en gång du upptäckte ett produktionsfel — vad gjorde du?',
      'Vad vet du om LEAN, 5S eller Kaizen?',
      'Hur ser du på säkerhet och skyddsutrustning — berätta om en situation.',
      'Är du van vid 2- eller 3-skift? Hur påverkar det dig?',
      'Berätta om en gång du förbättrade något i din arbetsprocess.',
      'Hur hanterar du repetitivt arbete utan att bli oengagerad?',
      'Hur är du i ett team där vi alla ska leverera samma takt?'
    ],
    '📋 Administration & kontor': [
      'Berätta om din administrativa erfarenhet.',
      'Vilka system är du van vid (Office 365, Google Workspace, affärssystem)?',
      'Hur prioriterar du när du har fem saker på bordet samtidigt?',
      'Berätta om en gång du upptäckte ett viktigt fel i en rapport eller dokumentation.',
      'Hur hanterar du konfidentiell information?',
      'Är du bekväm med att hantera kundkontakt via telefon och mejl?',
      'Berätta om en gång du förbättrade en rutin eller process.',
      'Hur är du på att skriva mejl — formell eller avslappnad ton?',
      'Hur hanterar du en chef som ofta ändrar prioriteringar?',
      'Vad tycker du är viktigast: noggrannhet eller tempo? Varför?'
    ],
    '🚚 Transport & chaufför': [
      'Berätta om din kör-erfarenhet — vilka fordon och behörigheter har du?',
      'Har du ADR, YKB eller andra certifikat aktiva?',
      'Hur planerar du din körning för att hinna allt utan att bryta kör- och vilotider?',
      'Berätta om en gång det hände något oväntat på vägen — vad gjorde du?',
      'Hur hanterar du en stressad kund vid leverans?',
      'Vad gör du om ditt fordon får ett problem på vägen?',
      'Är du van vid digital fraktsedel och leveransappar?',
      'Hur hanterar du ensamarbete över långa sträckor?',
      'Berätta om en gång du gjorde extra för en kund — vad blev resultatet?',
      'Är du flexibel med övernattningar eller långa pass?'
    ],
    '👶 Barn & skola': [
      'Berätta om din erfarenhet av att jobba med barn.',
      'Hur bygger du trygghet hos ett barn som är ledsen eller arg?',
      'Berätta om en konflikt mellan barn — hur löste du den?',
      'Hur samarbetar du med vårdnadshavare, särskilt när de är oroliga?',
      'Vad betyder inkludering i praktiken för dig?',
      'Hur bemöter du ett barn med särskilda behov som du inte mött tidigare?',
      'Berätta om ett tillfälle du är stolt över i ditt arbete med barn.',
      'Hur hanterar du en högljudd grupp utan att höja rösten?',
      'Är du bekväm med att dokumentera i system som Unikum, InfoMentor eller Schoolsoft?',
      'Hur tar du hand om dig själv i ett yrke som är känslomässigt krävande?'
    ],
    '💻 IT & tech': [
      'Berätta om din tekniska bakgrund och vilka språk/verktyg du är starkast på.',
      'Berätta om ett projekt du är särskilt stolt över — vad var din roll?',
      'Hur felsöker du en bugg du aldrig sett förut?',
      'Vad vet du om agila arbetssätt (Scrum, Kanban)?',
      'Berätta om en gång du behövde lära dig en ny teknik snabbt.',
      'Hur hanterar du code reviews — både ge och ta feedback?',
      'Vad är skillnaden mellan bra och dålig kod för dig?',
      'Berätta om en gång du gjort ett tekniskt val du ångrar — vad lärde du dig?',
      'Hur samarbetar du med icke-tekniska kollegor (design, produkt, affär)?',
      'Vad intresserar du dig för på sidan av — open source, egna projekt, läsning?'
    ],
    '📚 Annat / Eget val': null // fallback till generic
  };

  function getPracticeQuestionsFor(branch) {
    return PRACTICE_QUESTIONS[branch] || PRACTICE_QUESTIONS['generic'];
  }

  // ══════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════
  var state = {
    setup: { branch: '', company: '', roleTitle: '', difficulty: 'medium', jobMatchId: null },
    tipsChecked: {}, // {1: true, 2: true, ...}
    session: null,   // {id, started_at, branch, ...} från Supabase
    messages: [],    // [{id, role, content, ...}]
    phase: 'setup',  // setup | tips | session | feedback
    inputMode: 'speak', // 'speak' | 'type' — hur användaren svarar (snabbval borttagna)
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
    // Hämta auth från lokalStorage (single source of truth) istället för
    // gamla window.auth* variabler — så vi alltid får senaste/färska token
    try {
      var raw = localStorage.getItem('pathfinder_auth');
      if (raw) {
        var a = JSON.parse(raw);
        return {
          userId: a.userId || window.authUserId || null,
          accessToken: a.accessToken || window.authAccessToken || null
        };
      }
    } catch(_) {}
    return {
      userId: window.authUserId || null,
      accessToken: window.authAccessToken || null
    };
  }

  async function apiSupabase(payload) {
    // Använd window.sbCall (definierad i index.html / desktop-app.js)
    // som automatiskt:
    //  1. Refreshar token om den är nära expiry (tyst för användaren)
    //  2. Skickar Authorization: Bearer-header (vilket backend kräver)
    //
    // VIKTIGT: Intervju-actions (create_interview_session, add_interview_message,
    // etc.) är OPTIONELLA på backend — de är bara för historik-loggning.
    // Om backend inte stödjer dem (eller returnerar 401) ska vi INTE logga ut
    // användaren — intervjun ska fungera lokalt ändå.
    if (typeof window.sbCall === 'function') {
      try {
        var data = await window.sbCall(payload);
        if (data && data.error) {
          // Tyst varning men kasta inte error → låt intervjun fortsätta lokalt
          console.warn('[Intervju] Backend-fel (icke-kritiskt):', data.error);
          return { _failedSilently: true, error: data.error };
        }
        return data || {};
      } catch (e) {
        console.warn('[Intervju] sbCall-undantag (icke-kritiskt):', e);
        return { _failedSilently: true, error: e.message };
      }
    }

    // Fallback: backend-anrop med Authorization-header om sbCall saknas
    var auth = getAuth();
    var headers = { 'Content-Type': 'application/json' };
    if (auth.accessToken) {
      headers['Authorization'] = 'Bearer ' + auth.accessToken;
    }
    try {
      var resp = await fetch('/api/supabase', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      var data = await resp.json();
      if (!resp.ok) {
        // Tyst — låt intervjun köra lokalt
        console.warn('[Intervju] Backend HTTP ' + resp.status + ' (icke-kritiskt)');
        return { _failedSilently: true, error: data.error || ('HTTP ' + resp.status) };
      }
      return data;
    } catch (e) {
      console.warn('[Intervju] Network-fel (icke-kritiskt):', e);
      return { _failedSilently: true, error: e.message };
    }
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
      ivDebug.log('Claude: via /api/chat proxy ✓ (ANTHROPIC_API_KEY i backend)');
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
  // CLAUDE-KLIENT (via /api/chat proxy - Anthropic-nyckeln i backend)
  // Använder samma /api/chat-endpoint som resten av CVmatchen (AI-SYV,
  // CV-generering, kompetens-match). Ingen separat Gemini-nyckel krävs.
  // ══════════════════════════════════════════════════════════════
  async function callClaude(messages, systemPrompt, opts) {
    opts = opts || {};
    // Kick-off: om messages är tom är det första intervjufrågan som ska
    // genereras — skicka då ett user-meddelande som triggar intervjuaren.
    // (Anthropic kräver att `messages` har minst ett element och börjar med user.)
    var msgs = (Array.isArray(messages) && messages.length > 0)
      ? messages
      : [{ role: 'user', content: 'Starta intervjun nu. Hälsa kort och ställ din första fråga.' }];

    var resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CONFIG.claudeModel,
        max_tokens: opts.maxOutputTokens || 400,
        temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.85,
        system: systemPrompt,
        messages: msgs
      })
    });
    var data = await resp.json();
    if (!resp.ok) {
      var errMsg = (data && data.error && (data.error.message || data.error)) || ('HTTP ' + resp.status);
      throw new Error('Claude-fel: ' + errMsg);
    }
    // Anthropic Messages-API returnerar content som array av block ({type:'text', text:'...'}).
    var text = (data.content || [])
      .filter(function(b){ return b.type === 'text'; })
      .map(function(b){ return b.text; })
      .join('')
      .trim();
    if (!text) throw new Error('Claude returnerade tomt svar.');
    return text;
  }

  // Konvertera intervju-meddelanden till Anthropic-format.
  // Anthropic kräver strikt alternering user/assistant/user/assistant...
  // och att första meddelandet är från user.
  function toClaudeMessages(msgs) {
    if (!msgs || !msgs.length) return [];
    var out = [];
    msgs.forEach(function(m) {
      var role = m.role === 'interviewer' ? 'assistant' : 'user';
      // Slå ihop konsekutiva meddelanden från samma roll (annars avvisar API:t dem)
      if (out.length > 0 && out[out.length - 1].role === role) {
        out[out.length - 1].content += '\n\n' + m.content;
      } else {
        out.push({ role: role, content: m.content });
      }
    });
    // Anthropic kräver att första meddelandet är user — om intervjuaren skulle
    // råka vara först (bör inte hända), droppa det.
    while (out.length > 0 && out[0].role !== 'user') {
      out.shift();
    }
    return out;
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
      '- Ställ EN fråga åt gången, kort och tydlig. Inga uppräkningar.',
      '- Lyssna aktivt: bygg gärna nästa fråga på vad kandidaten just sa.',
      '',
      'FORMAT',
      'Skriv bara din fråga som en kort, naturlig replik (1-3 meningar). Inga listor, ingen formatering.',
      '',
      'BÖRJA NU med en kort, avslappnad hälsning följd av första småpratsfrågan.',
      'Inte "Välkommen till intervjun" — något mer naturligt.'
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

    // Om backend failar tyst — skapa lokal session så intervjun ändå kan köra
    if (!r || r._failedSilently || !r.session) {
      console.warn('[Intervju] Backend skapade ej session — kör lokalt');
      return {
        id: 'local_' + Date.now(),
        _local: true,
        branch: input.branch,
        company: input.company || null,
        role_title: input.roleTitle || null,
        difficulty: input.difficulty || 'medium',
        started_at: new Date().toISOString()
      };
    }
    return r.session;
  }

  async function addMessage(sessionId, role, content) {
    var auth = requireAuth();
    // Skippa backend-anrop för lokala sessioner (sparar bara i minnet)
    if (typeof sessionId === 'string' && sessionId.indexOf('local_') === 0) {
      return { id: 'msg_' + Date.now(), role: role, content: content };
    }
    var r = await apiSupabase({
      action: 'add_interview_message',
      accessToken: auth.accessToken,
      userId: auth.userId,
      sessionId: sessionId,
      role: role,
      content: content
    });
    if (!r || r._failedSilently) {
      // Tyst — meddelandet finns ändå i state lokalt
      return { id: 'msg_' + Date.now(), role: role, content: content };
    }
    return r.message;
  }

  async function completeSession(sessionId, feedback) {
    var auth = requireAuth();
    var startedAt = state.session ? new Date(state.session.started_at).getTime() : Date.now();
    var durSec = Math.round((Date.now() - startedAt) / 1000);
    // Skippa backend för lokala sessioner
    if (typeof sessionId === 'string' && sessionId.indexOf('local_') === 0) {
      return true;
    }
    await apiSupabase({
      action: 'complete_interview_session',
      accessToken: auth.accessToken,
      userId: auth.userId,
      sessionId: sessionId,
      durationSeconds: durSec,
      overallFeedback: feedback || null
      // userRating + userNotes borttagna — betyg och anteckningar används inte längre i UI
    });
    return true;
  }

  async function abandonSession(sessionId) {
    try {
      var auth = getAuth();
      if (!auth.userId || !auth.accessToken) return;
      // Skippa för lokala sessioner
      if (typeof sessionId === 'string' && sessionId.indexOf('local_') === 0) return;
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
    // Skippa backend för lokala sessioner
    if (typeof sessionId === 'string' && sessionId.indexOf('local_') === 0) {
      return null;
    }
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
    if (!r || r._failedSilently) return null;
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
    networkRetries: 0,        // räknare för auto-retry vid network-fel
    maxNetworkRetries: 2,     // 2 tysta retries innan vi visar fel + fallback

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
        // Lyckat resultat → nollställ retry-räknare
        stt.networkRetries = 0;
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
        if (window.ivDebug && ivDebug.log) ivDebug.log('🎤 STT-fel: ' + ev.error);
        state.ai.isListening = false;

        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          showError('Mikrofon blockerad. Tillåt mikrofon i webbläsarinställningarna och försök igen.');
          updateStatusPill();
          return;
        }
        if (ev.error === 'no-speech' || ev.error === 'aborted') {
          // Tyst — inget fel att visa
          updateStatusPill();
          return;
        }
        if (ev.error === 'network') {
          // Auto-retry tyst — Web Speech API kräver internet och Googles servrar
          // är ibland överbelastade. Försök igen innan vi visar fel.
          if (stt.networkRetries < stt.maxNetworkRetries) {
            stt.networkRetries++;
            if (window.ivDebug && ivDebug.log) {
              ivDebug.log('🔄 Tyst retry ' + stt.networkRetries + '/' + stt.maxNetworkRetries + ' efter network-fel');
            }
            // Visa subtilt återförsök i interim-rutan istället för error
            var box = $('#ivInterim');
            if (box) {
              box.textContent = '🔄 Försöker igen...';
              box.style.display = 'block';
            }
            updateStatusPill();
            // Vänta 1.5s och försök igen
            setTimeout(function() {
              try { stt.rec.start(); }
              catch(e) {
                // rec är i invalid state — skapa om
                stt.init();
                try { stt.rec.start(); } catch(_) { stt.fallbackToText(); }
              }
            }, 1500);
            return;
          }
          // Alla retries misslyckades → fallback till textläge
          stt.networkRetries = 0;
          stt.fallbackToText();
          updateStatusPill();
          return;
        }
        // Övrigt fel
        showError('Mikrofonfel: ' + ev.error);
        updateStatusPill();
      };
      stt.rec.onend = function() {
        state.ai.isListening = false;
        updateStatusPill();
        // Rensa "Försöker igen..."-text om den är kvar
        var box = $('#ivInterim');
        if (box && box.textContent === '🔄 Försöker igen...') {
          box.textContent = '';
          box.style.display = 'none';
        }
      };
    },

    // Användaren får meddelande om att röst inte funkar och byts till text
    fallbackToText: function() {
      if (window.ivDebug && ivDebug.log) ivDebug.log('🔄 Fallback till textläge');
      // Rensa interim
      var box = $('#ivInterim');
      if (box) { box.textContent = ''; box.style.display = 'none'; }

      // Byt mode → text
      state.inputMode = 'type';
      if (typeof applyInputMode === 'function') applyInputMode();

      // Visa förklarande popup
      showError('🎤 Rösttjänsten är överbelastad just nu — du har bytt till skrivläge. Du kan byta tillbaka senare via ✍️-knappen.');

      // Sätt fokus i textfältet så användaren kan skriva direkt
      setTimeout(function() {
        var ta = $('#ivUserInput');
        if (ta) ta.focus();
      }, 200);
    },

    start: function() {
      if (!stt.supported) {
        showError('Din webbläsare stöder inte röstinspelning. Skriv istället i textfältet.');
        return;
      }
      if (window.ivDebug && ivDebug.log) ivDebug.log('🎤 stt.start() anropad');
      // Nollställ retry-räknaren vid manuell start (bara auto-retries räknar)
      stt.networkRetries = 0;
      stt.finalText = '';
      var box = $('#ivInterim');
      if (box) box.style.display = 'none';
      // iOS Safari kräver ibland en explicit mic-permission via getUserMedia
      // innan webkitSpeechRecognition fungerar. Vi begär tillstånd först.
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(function(stream) {
            // Vi behöver inte själva streamen — stäng den direkt
            stream.getTracks().forEach(function(t) { t.stop(); });
            try { stt.rec.start(); }
            catch(e) {
              if (window.ivDebug && ivDebug.log) ivDebug.log('🎤 rec.start kastade: ' + e.message);
              // Om rec är i invalid state, skapa om det
              stt.init();
              try { stt.rec.start(); } catch(e2) {
                showError('Kunde inte starta röstinspelning. Försök igen.');
              }
            }
          })
          .catch(function(err) {
            if (window.ivDebug && ivDebug.log) ivDebug.log('🎤 getUserMedia fel: ' + err.name);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              showError('Mikrofonbehörighet nekad. Tillåt i webbläsarinställningarna och försök igen.');
            } else if (err.name === 'NotFoundError') {
              showError('Ingen mikrofon hittades på din enhet.');
            } else {
              showError('Kunde inte komma åt mikrofonen: ' + err.name);
            }
          });
      } else {
        // Fallback: inget getUserMedia-stöd
        try { stt.rec.start(); }
        catch(e) { showError('Röstinspelning kunde inte startas.'); }
      }
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

      // ─── TIPS (en i taget med timer) ─────────────────────────────
      '<div class="iv-screen" id="ivScreenTips">',
      '  <div class="iv-title">Tips inför intervjun</div>',
      '  <div class="iv-sub" id="ivTipsStepLabel">Läs igenom noga — varje tips har några sekunders lästid.</div>',
      '  <div class="iv-tip-stepper" id="ivTipsStepper"></div>',
      '  <div class="iv-tips-progress" id="ivTipsProgress">1 av 10</div>',
      '  <div style="display:flex;gap:8px">',
      '    <button class="iv-btn iv-btn--ghost" id="ivTipsBackBtn" style="flex:1">← Tillbaka</button>',
      '    <button class="iv-btn" id="ivTipsNextBtn" disabled style="flex:2;opacity:0.4;cursor:not-allowed;">Läser...</button>',
      '  </div>',
      '</div>',

      // ─── METOD-VÄLJARE ─────────────────────
      '<div class="iv-screen" id="ivScreenMethod">',
      '  <div class="iv-title">Hur vill du svara?</div>',
      '  <div class="iv-sub">Välj hur det känns bekvämast. Du kan byta när som helst under intervjun.</div>',
      '  <div class="iv-method-grid">',
      '    <button type="button" class="iv-method-card" data-method="speak">',
      '      <div class="iv-method-icon">🎤</div>',
      '      <div class="iv-method-title">Röstinspelning</div>',
      '      <div class="iv-method-desc">Prata som i en riktig intervju. Texten transkriberas automatiskt — bästa träningen för verkligheten.</div>',
      '    </button>',
      '    <button type="button" class="iv-method-card" data-method="type">',
      '      <div class="iv-method-icon">✍️</div>',
      '      <div class="iv-method-title">Skriv fritt</div>',
      '      <div class="iv-method-desc">Formulera dina egna svar i lugn och ro via tangentbordet. Bra för att tänka igenom.</div>',
      '    </button>',
      '  </div>',
      '  <button class="iv-btn" id="ivMethodStartBtn" disabled style="margin-top:16px;opacity:0.4">Starta intervjun →</button>',
      '</div>',

      // ─── SESSION (CHAT) ──────────────────
      '<div class="iv-screen" id="ivScreenSession">',
      '  <div class="iv-session-header">',
      '    <div class="iv-session-info" id="ivSessionInfo"></div>',
      '    <button type="button" class="iv-method-switch" id="ivMethodSwitchBtn" title="Byt svarsmetod">',
      '      <span id="ivMethodIcon">✍️</span>',
      '    </button>',
      '    <div class="iv-status-pill" id="ivStatusPill">Väntar</div>',
      '  </div>',
      '  <div class="iv-messages" id="ivMessages"></div>',
      '  <div class="iv-interim" id="ivInterim" style="display:none;padding:0 12px 4px;font-size:13px;color:rgba(255,255,255,0.4)"></div>',
      '  <div class="iv-input-bar" id="ivInputBar">',
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

      '  <h3 style="font-size:14px;color:#a78bfa;margin:16px 0 8px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Feedback från AI-coachen</h3>',
      '  <div class="iv-feedback-box" id="ivFeedbackText">Laddar...</div>',

      '  <h3 style="font-size:14px;color:rgba(255,255,255,0.6);margin:24px 0 10px;font-weight:800;text-transform:uppercase;letter-spacing:1px">Intervjuns frågor &amp; dina svar</h3>',
      '  <div style="font-size:12px;color:rgba(255,255,255,0.4);margin-bottom:12px;">Tryck på en fråga för att läsa ditt svar.</div>',
      '  <div id="ivTranscript" class="iv-qa-list"></div>',

      // Erbjudande: Ladda ner 10 övningsfrågor för branschen som PDF
      '  <div id="ivPracticePdfCard" style="margin-top:22px;background:linear-gradient(135deg,rgba(240,192,64,0.08),rgba(240,192,64,0.04));border:1.5px solid rgba(240,192,64,0.35);border-radius:14px;padding:18px 20px;">',
      '    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">',
      '      <span style="font-size:26px;">📋</span>',
      '      <div style="font-size:15px;font-weight:900;color:#f0c040;">10 frågor att öva på hemma</div>',
      '    </div>',
      '    <div style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.6;margin-bottom:14px;">Förbered dig inför din riktiga intervju — vi har samlat 10 vanliga frågor för <strong id="ivPracticeBranchLabel" style="color:#fff;">din bransch</strong> som du kan öva på när du vill.</div>',
      '    <button class="iv-btn" id="ivPracticePdfBtn" style="width:100%;background:linear-gradient(135deg,#f0c040,#d4a836);color:#1a1a2e;font-weight:900;">📄 Ladda ner som PDF</button>',
      '  </div>',

      '  <div style="display:flex;gap:8px;margin-top:24px">',
      '    <button class="iv-btn iv-btn--ghost" id="ivFbBackBtn" style="flex:1">Tillbaka</button>',
      '    <button class="iv-btn" id="ivFbSaveBtn" style="flex:1">Spara &amp; stäng</button>',
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
    ['Setup','Tips','Method','Session','Feedback'].forEach(function(s){
      var el = $('#ivScreen' + s);
      if (!el) return;
      el.classList.toggle('iv-screen--active', s.toLowerCase() === name);
    });

    // När vi kommer till tips → börja om på första tipset + starta timer
    if (name === 'tips') {
      state.currentTipIdx = 0;
      if (typeof renderTips === 'function') renderTips();
    } else {
      // Lämnar tips → rensa timers så de inte fortsätter bakgrunds
      if (typeof clearTipTimers === 'function') clearTipTimers();
    }
  }

  // Alias för läsbarhet inom tips-stepper
  function goToScreen(name) { showScreen(name); }

  // ══════════════════════════════════════════════════════════════
  // TIPS: visas 1 och 1, tvångsläsning innan "Nästa" blir klickbar
  // (5s för korta tips, upp till 10s för långa som STAR-metoden)
  // ══════════════════════════════════════════════════════════════
  var _tipsTimer = null;

  function clearTipTimers() {
    if (_tipsTimer) { clearInterval(_tipsTimer); _tipsTimer = null; }
  }

  function renderTips() {
    // Initiera state om första gången
    if (typeof state.currentTipIdx !== 'number') state.currentTipIdx = 0;

    var stepper = $('#ivTipsStepper');
    if (!stepper) return;

    var t = TIPS[state.currentTipIdx];
    if (!t) return;

    // Rensa gamla timers om användaren navigerar bakåt/framåt
    clearTipTimers();

    // Rendera nuvarande tips
    // Rendera texten med radbrytningar (\n → <br>) så strukturerade tips
    // som STAR-metoden blir läsbara. Långa tips vänsterjusteras för bättre
    // läsbarhet; korta är kvar centrerade.
    var descHtml = escapeHtml(t.d).replace(/\n/g, '<br>');
    var isLongTip = (t.d || '').length > 200;
    var descAlign = isLongTip ? 'left' : 'center';

    stepper.innerHTML = [
      '<div class="iv-tip iv-tip--single">',
      '  <div class="iv-tip-emoji" style="font-size:48px;text-align:center;">' + t.e + '</div>',
      '  <div class="iv-tip-body">',
      '    <div class="iv-tip-num" style="font-size:11px;font-weight:800;color:rgba(62,180,137,0.7);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;text-align:center;">Tips ' + t.n + ' av ' + TIPS.length + '</div>',
      '    <div class="iv-tip-title" style="font-size:20px;font-weight:900;color:#fff;margin-bottom:14px;line-height:1.3;text-align:center;">' + escapeHtml(t.t) + '</div>',
      '    <div class="iv-tip-desc" style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.8;text-align:' + descAlign + ';">' + descHtml + '</div>',
      '  </div>',
      '</div>'
    ].join('');

    // Progress-indikator (prickar)
    var progEl = $('#ivTipsProgress');
    if (progEl) {
      var dots = '';
      for (var i = 0; i < TIPS.length; i++) {
        var cls = 'iv-tip-dot';
        if (i < state.currentTipIdx) cls += ' iv-tip-dot--done';
        else if (i === state.currentTipIdx) cls += ' iv-tip-dot--active';
        dots += '<span class="' + cls + '"></span>';
      }
      progEl.innerHTML = '<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px;">' + dots + '</div>' +
        '<div>' + (state.currentTipIdx + 1) + ' av ' + TIPS.length + '</div>';
    }

    // Uppdatera nästa-knappens text beroende på om vi är på sista tipset
    var nextBtn = $('#ivTipsNextBtn');
    if (nextBtn) {
      var isLast = state.currentTipIdx === TIPS.length - 1;
      // Börja nedräkning — knappen grå tills timern är klar.
      // Snabbare än tidigare eftersom många användare gör intervjuträning
      // flera gånger. 3s för korta tips, upp till 7s för STAR-exemplet.
      var textLen = (t.d || '').length;
      var secondsLeft = 3;
      if (textLen > 300) secondsLeft = 7;       // långa tips (STAR etc.)
      else if (textLen > 150) secondsLeft = 5;  // medellånga
      // korta tips → 3s (default)

      nextBtn.disabled = true;
      nextBtn.style.opacity = '0.4';
      nextBtn.style.cursor = 'not-allowed';
      nextBtn.style.background = 'rgba(255,255,255,0.08)';
      nextBtn.style.color = 'rgba(255,255,255,0.4)';

      nextBtn.textContent = 'Läser... ' + secondsLeft + 's';

      _tipsTimer = setInterval(function() {
        secondsLeft--;
        if (secondsLeft > 0) {
          nextBtn.textContent = 'Läser... ' + secondsLeft + 's';
        } else {
          // Klar
          clearTipTimers();
          nextBtn.disabled = false;
          nextBtn.style.opacity = '1';
          nextBtn.style.cursor = 'pointer';
          nextBtn.style.background = '';
          nextBtn.style.color = '';
          nextBtn.textContent = isLast ? 'Starta intervjun →' : 'Nästa tips →';
        }
      }, 1000);
    }
  }

  function nextTipOrStart() {
    if (state.currentTipIdx < TIPS.length - 1) {
      state.currentTipIdx++;
      renderTips();
    } else {
      // Sista tipset klart → gå till metod-väljaren
      clearTipTimers();
      state.currentTipIdx = 0; // reset för nästa gång
      goToScreen('method');
    }
  }

  function prevTipOrBack() {
    if (state.currentTipIdx > 0) {
      state.currentTipIdx--;
      renderTips();
    } else {
      // Första tipset → tillbaka till setup
      clearTipTimers();
      goToScreen('setup');
    }
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

  // ══════════════════════════════════════════════════════════════
  // SNABBVAL (OPTIONS): Parsa + rendera 3 klickbara svar
  // ══════════════════════════════════════════════════════════════
  function parseOptions(rawText) {
    // Hitta [OPTIONS]...[/OPTIONS]-blocket och extrahera 1-3 numrerade rader.
    var match = rawText.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
    if (!match) return { cleanText: rawText.trim(), options: [] };
    var block = match[1];
    var cleanText = rawText.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/, '').trim();
    // Matcha rader som börjar med "1.", "2.", "3." (tål ledande whitespace)
    var lines = block.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
    var options = [];
    lines.forEach(function(line) {
      var m = line.match(/^\d+[\.\)]\s*(.+)$/);
      if (m && m[1]) options.push(m[1].trim());
    });
    // Begränsa till max 3
    return { cleanText: cleanText, options: options.slice(0, 3) };
  }

  function clearAllQuickOptions() {
    // Ta bort ev. gamla snabbvals-containers när en ny intervjuarsturn kommer
    var msgs = $('#ivMessages');
    if (!msgs) return;
    var old = msgs.querySelectorAll('.iv-quick-options');
    old.forEach(function(el) { el.remove(); });
  }

  // ══════════════════════════════════════════════════════════════
  // THINKING-INDIKATOR — timglas i chattbubblan medan Claude tänker
  // Återanvänder @keyframes _spin som redan finns globalt i appen.
  // ══════════════════════════════════════════════════════════════
  function showThinking() {
    var msgs = $('#ivMessages');
    if (!msgs) return;
    // Ta bort ev. tidigare indikator
    hideThinking();
    var wrap = document.createElement('div');
    wrap.className = 'iv-msg iv-thinking';
    wrap.id = 'ivThinkingIndicator';
    wrap.innerHTML = [
      '<div class="iv-msg-avatar">🤖</div>',
      '<div class="iv-msg-bubble iv-thinking-bubble">',
      '  <span class="iv-thinking-icon" style="animation:_spin 1.2s linear infinite;display:inline-block;">⏳</span>',
      '  <span class="iv-thinking-text">Intervjuaren tänker...</span>',
      '</div>'
    ].join('');
    msgs.appendChild(wrap);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function hideThinking() {
    var el = $('#ivThinkingIndicator');
    if (el) el.remove();
  }

  // ══════════════════════════════════════════════════════════════
  // INPUT-MODE: applicera vald svarsmetod på UI
  // 'speak' → mic-knapp primärt, textarea som fallback för redigering
  // 'type'  → bara textarea, dölj mic-knappen
  // ══════════════════════════════════════════════════════════════
  function applyInputMode() {
    var mode = state.inputMode || 'speak';
    var bar = $('#ivInputBar');
    var mic = $('#ivMicBtn');
    var textarea = $('#ivUserInput');
    var sendBtn = $('#ivSendBtn');
    var methodIcon = $('#ivMethodIcon');

    // Uppdatera header-ikonen som visar nuvarande metod
    if (methodIcon) {
      methodIcon.textContent = mode === 'speak' ? '🎤' : '✍️';
    }

    if (!bar) return;
    bar.style.display = 'flex';

    if (mode === 'speak') {
      // Röst-läge: mic primärt, textarea som fallback för redigering
      if (mic) mic.style.display = 'flex';
      if (textarea) textarea.placeholder = 'Tryck 🎤 för att prata (eller skriv)';
    } else {
      // Type-läge: dölj mic-knappen
      if (mic) mic.style.display = 'none';
      if (textarea) textarea.placeholder = 'Skriv ditt svar...';
    }
  }

  // Visa en enkel byt-metod-dialog (använder confirm-liknande UI)
  function showMethodSwitcher() {
    var current = state.inputMode;
    // Enkel lösning: använd prompt() för att välja — eller rendera en inline-dialog
    // Vi gör en enkel inline-dialog överlagd på session
    var existing = $('#ivMethodDialog');
    if (existing) { existing.remove(); return; }

    var dialog = document.createElement('div');
    dialog.id = 'ivMethodDialog';
    dialog.className = 'iv-method-dialog';
    dialog.innerHTML = [
      '<div class="iv-method-dialog-title">Byt svarsmetod</div>',
      '<button type="button" class="iv-method-card iv-method-card--compact' + (current==='speak'?' iv-method-card--active':'') + '" data-method="speak">',
      '  <span class="iv-method-icon">🎤</span><span class="iv-method-label">Röstinspelning</span>',
      '</button>',
      '<button type="button" class="iv-method-card iv-method-card--compact' + (current==='type'?' iv-method-card--active':'') + '" data-method="type">',
      '  <span class="iv-method-icon">✍️</span><span class="iv-method-label">Skriv fritt</span>',
      '</button>',
      '<button type="button" class="iv-btn iv-btn--ghost" id="ivMethodDialogClose" style="margin-top:6px">Stäng</button>'
    ].join('');

    // Positionera i sessions-headern
    var root = getRoot();
    root.appendChild(dialog);

    dialog.querySelectorAll('.iv-method-card').forEach(function(btn) {
      btn.addEventListener('click', function() {
        state.inputMode = btn.getAttribute('data-method');
        ivDebug.log('🔄 Metod bytt till: ' + state.inputMode);
        applyInputMode();
        dialog.remove();
      });
    });
    var closeBtn = $('#ivMethodDialogClose');
    if (closeBtn) closeBtn.addEventListener('click', function() { dialog.remove(); });
  }

  function renderQuickOptions(options) {
    var msgs = $('#ivMessages');
    if (!msgs || !options || !options.length) return;
    var container = document.createElement('div');
    container.className = 'iv-quick-options';
    var label = document.createElement('div');
    label.className = 'iv-quick-options-label';
    label.textContent = 'Snabbsvar — eller skriv eget:';
    container.appendChild(label);
    options.forEach(function(opt) {
      var btn = document.createElement('button');
      btn.className = 'iv-quick-option';
      btn.type = 'button';
      btn.textContent = opt;
      btn.addEventListener('click', function() {
        // Ta bort alla snabbvals så de inte kan tryckas igen
        clearAllQuickOptions();
        // Skicka som användarens svar (samma flöde som manuell text)
        submitUserAnswer(opt);
      });
      container.appendChild(btn);
    });
    msgs.appendChild(container);
    msgs.scrollTop = msgs.scrollHeight;
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
    showThinking();
    try {
      var messages = toClaudeMessages(state.messages);
      ivDebug.log('    meddelanden: ' + messages.length);
      var prompt = buildInterviewerPrompt({
        branch: state.session.branch,
        company: state.session.company,
        roleTitle: state.session.role_title,
        difficulty: state.session.difficulty
      });

      ivDebug.log('    anropar Claude...');
      var rawText = await callClaude(messages, prompt, { maxOutputTokens: 350 });
      ivDebug.log('    ✓ Claude svarade (' + rawText.length + ' tecken)');

      var isComplete = rawText.indexOf('[INTERVIEW_COMPLETE]') !== -1;
      // Rensa bort [INTERVIEW_COMPLETE]-markören; resten är frågetexten
      var clean = rawText.replace(/\[INTERVIEW_COMPLETE\]/g, '').trim();
      // Bakåtkompat: rensa även gamla [OPTIONS]-block om AI råkar inkludera dem
      clean = clean.replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/g, '').trim();

      // Ta bort timglaset INNAN vi lägger till intervjuarens bubbla
      hideThinking();

      // Spara meddelandet i bakgrunden — failar det är det OK, bara förlust av historik
      ivDebug.log('    sparar meddelande i Supabase...');
      var saved;
      try {
        saved = await addMessage(state.session.id, 'interviewer', clean);
      } catch (saveErr) {
        ivDebug.log('    ⚠ addMessage failade — fortsätter lokalt');
        saved = null;
      }
      // Garantera att vi har ett message-objekt
      if (!saved || !saved.role) {
        saved = {
          id: 'local_msg_' + Date.now(),
          role: 'interviewer',
          content: clean
        };
      }
      ivDebug.log('    ✓ Meddelande hanterat');

      state.messages.push(saved);
      appendMessage(saved);

      state.ai.isThinking = false;
      updateStatusPill();

      // AI läser upp svaret (bara texten, inte snabbvalen)
      ivDebug.log('    startar TTS...');
      try {
        await tts.speak(clean);
        ivDebug.log('    ✓ TTS klart');
      } catch (ttsErr) {
        ivDebug.log('    ⚠ TTS-fel (icke-kritiskt): ' + (ttsErr.message || ttsErr));
      }

      if (isComplete) {
        endInterview();
      }
    } catch (e) {
      ivDebug.log('    ✗ askInterviewerNext kraschade: ' + (e.message || e));
      showError('AI-fel: ' + (e.message || e));
    } finally {
      // ALLTID återställ thinking-status — annars fastnar pillen på "Väntar"
      state.ai.isThinking = false;
      hideThinking();
      updateStatusPill();
    }
  }

  async function submitUserAnswer(text) {
    if (!text || !text.trim() || !state.session) return;
    text = text.trim();

    try {
      ivDebug.log('  → submitUserAnswer: "' + text.slice(0,40) + '..."');

      // 1. Spara meddelandet (i molnet om möjligt, annars lokalt)
      var saved;
      try {
        saved = await addMessage(state.session.id, 'candidate', text);
      } catch (e) {
        ivDebug.log('    ⚠ addMessage failade — använder lokal fallback');
        saved = null;
      }
      // Säkerställ att vi alltid har ett message-objekt med rätt fält
      if (!saved || !saved.role) {
        saved = {
          id: 'local_msg_' + Date.now(),
          role: 'candidate',
          content: text
        };
      }
      state.messages.push(saved);
      appendMessage(saved);

      // Uppdatera end-knappens lås-status (låses upp efter 5:e svaret)
      if (typeof updateEndBtnLockStyle === 'function') updateEndBtnLockStyle();

      // 2. Be AI om nästa fråga — detta är det viktiga steget
      ivDebug.log('    → triggar askInterviewerNext()');
      await askInterviewerNext();
    } catch (e) {
      ivDebug.log('    ✗ submitUserAnswer kraschade: ' + (e.message || e));
      showError('Kunde inte skicka: ' + (e.message || e));
      // Återställ status-pillen så den inte fastnar på "Väntar"
      state.ai.isThinking = false;
      hideThinking();
      updateStatusPill();
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
      applyInputMode();
      ivDebug.log('  ✓ Input-mode applicerad: ' + state.inputMode);
      renderSessionInfo();
      renderAllMessages();

      // Be AI ställa första frågan
      ivDebug.log('  Anropar Claude för första frågan...');
      await askInterviewerNext();
      ivDebug.log('  ✓ startInterview klart');
    } catch (e) {
      ivDebug.log('✗ startInterview kraschade: ' + (e.message || e));
      if (e.stack) ivDebug.log('  stack: ' + e.stack.slice(0, 300));
      showError('Kunde inte starta: ' + (e.message || e));
      showScreen('tips');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // LÅS: Förhindra "Avsluta intervjun" om för få svar / för kort tid
  // Regel: minst 5 svar ELLER minst 5 minuter
  // ══════════════════════════════════════════════════════════════
  var MIN_ANSWERS_TO_END = 5;
  var MIN_MINUTES_TO_END = 5;

  function getAnswerCount() {
    if (!state.messages) return 0;
    return state.messages.filter(function(m) { return m.role === 'candidate'; }).length;
  }

  function getMinutesElapsed() {
    if (!state.session || !state.session.started_at) return 0;
    var started = new Date(state.session.started_at).getTime();
    if (!started || isNaN(started)) return 0;
    return (Date.now() - started) / 60000;
  }

  function canEndInterview() {
    return getAnswerCount() >= MIN_ANSWERS_TO_END || getMinutesElapsed() >= MIN_MINUTES_TO_END;
  }

  function updateEndBtnLockStyle() {
    var btn = $('#ivEndBtn');
    if (!btn) return;
    if (canEndInterview()) {
      // Upplåst — grön/tydlig
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.classList.remove('iv-btn--locked');
      btn.textContent = '✓ Avsluta intervjun';
    } else {
      // Låst — grå/förtydligad
      btn.style.opacity = '0.55';
      btn.style.cursor = 'pointer'; // fortfarande klickbar, men klick visar modal
      btn.classList.add('iv-btn--locked');
      var answers = getAnswerCount();
      var minsLeft = Math.max(0, Math.ceil(MIN_MINUTES_TO_END - getMinutesElapsed()));
      // Visa hur nära man är
      btn.textContent = '🔒 Avsluta (' + answers + '/' + MIN_ANSWERS_TO_END + ' svar)';
    }
  }

  // Klick-hanterare för end-knappen
  function checkEndInterviewLock() {
    if (canEndInterview()) {
      // Upplåst — dubbelkolla med confirm
      showEndConfirmModal();
    } else {
      // Låst — visa förklarings-modal
      showLockedEndModal();
    }
  }

  // Modal när låset är aktivt
  function showLockedEndModal() {
    var answers = getAnswerCount();
    var minsElapsed = Math.floor(getMinutesElapsed());
    var minsLeft = Math.max(0, Math.ceil(MIN_MINUTES_TO_END - getMinutesElapsed()));
    var answersLeft = Math.max(0, MIN_ANSWERS_TO_END - answers);

    hideLockedEndModal();
    var overlay = document.createElement('div');
    overlay.id = '_ivLockedModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,28,0.92);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#1e2440;border:1.5px solid rgba(167,139,250,0.4);border-radius:20px;padding:32px 28px;width:100%;max-width:460px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:52px;text-align:center;margin-bottom:16px;">🔒</div>' +
        '<div style="font-size:20px;font-weight:900;color:#fff;text-align:center;margin-bottom:12px;">Intervjun är för kort ännu</div>' +
        '<div style="font-size:14px;color:rgba(255,255,255,0.65);text-align:center;line-height:1.7;margin-bottom:20px;">Öva lite till innan du får feedback — AI behöver tillräckligt med material för att kunna ge dig konstruktiva råd.</div>' +
        '<div style="background:rgba(167,139,250,0.08);border:1px solid rgba(167,139,250,0.25);border-radius:12px;padding:16px 18px;margin-bottom:20px;">' +
          '<div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:rgba(167,139,250,0.75);margin-bottom:10px;">Du kan avsluta när:</div>' +
          '<div style="font-size:13px;color:#fff;line-height:1.9;">' +
            '• Minst <strong style="color:#a78bfa;">5 svar</strong> — nu: ' + answers + '/5 (' + (answersLeft > 0 ? answersLeft + ' kvar' : 'klart ✓') + ')<br>' +
            '<span style="color:rgba(255,255,255,0.4);font-weight:700;">eller</span><br>' +
            '• Minst <strong style="color:#a78bfa;">5 minuter</strong> — nu: ' + minsElapsed + ' min (' + (minsLeft > 0 ? minsLeft + ' min kvar' : 'klart ✓') + ')' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="_ivLockedAbort" style="flex:1;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.55);font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">Avbryt utan feedback</button>' +
          '<button id="_ivLockedContinue" style="flex:1.4;padding:13px;background:linear-gradient(135deg,#a78bfa,#7c3aed);border:none;color:#fff;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;font-family:inherit;">OK, fortsätt intervjun</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) hideLockedEndModal(); });

    document.getElementById('_ivLockedContinue').onclick = hideLockedEndModal;
    document.getElementById('_ivLockedAbort').onclick = function() {
      hideLockedEndModal();
      if (confirm('Avbryt intervjun helt utan feedback? Dina svar sparas inte.')) {
        // Abandon session utan feedback
        if (state.session && state.session.id) {
          try { abandonSession(state.session.id); } catch(e) {}
        }
        resetToSetup();
        if (window.trainSwitchView) window.trainSwitchView('hub');
      }
    };
  }

  function hideLockedEndModal() {
    var el = document.getElementById('_ivLockedModal');
    if (el) el.remove();
  }

  // Modal när låset är släppt — bekräfta innan feedback
  function showEndConfirmModal() {
    hideEndConfirmModal();
    var overlay = document.createElement('div');
    overlay.id = '_ivEndConfirmModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,28,0.92);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#1e2440;border:1.5px solid rgba(62,180,137,0.4);border-radius:20px;padding:32px 28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,0.6);">' +
        '<div style="font-size:52px;text-align:center;margin-bottom:14px;">🎉</div>' +
        '<div style="font-size:20px;font-weight:900;color:#fff;text-align:center;margin-bottom:12px;">Avsluta intervjun?</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.6);text-align:center;line-height:1.7;margin-bottom:22px;">AI-coachen analyserar dina svar och ger personlig feedback. Detta kan ta 10-20 sekunder.</div>' +
        '<div style="display:flex;gap:10px;">' +
          '<button id="_ivEndCancel" style="flex:1;padding:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">Fortsätt intervjun</button>' +
          '<button id="_ivEndGo" style="flex:1.3;padding:13px;background:linear-gradient(135deg,#3eb489,#10b981);border:none;color:#fff;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;font-family:inherit;">Få feedback →</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) hideEndConfirmModal(); });
    document.getElementById('_ivEndCancel').onclick = hideEndConfirmModal;
    document.getElementById('_ivEndGo').onclick = function() {
      hideEndConfirmModal();
      endInterview();
    };
  }

  function hideEndConfirmModal() {
    var el = document.getElementById('_ivEndConfirmModal');
    if (el) el.remove();
  }

  // Stor overlay som blockerar interaktion under AI-generering
  function showInterviewLoadingOverlay(title, subtitle) {
    hideInterviewLoadingOverlay();
    var overlay = document.createElement('div');
    overlay.id = '_ivLoadingOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(10,12,28,0.92);backdrop-filter:blur(8px);z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:40px 20px;text-align:center;';
    overlay.innerHTML =
      '<div style="font-size:72px;animation:_ivSpin 1.4s linear infinite;filter:drop-shadow(0 4px 20px rgba(124,58,237,0.4));">⏳</div>' +
      '<div style="font-size:20px;font-weight:900;color:#fff;letter-spacing:0.3px;max-width:420px;">' + escapeHtml(title || 'AI analyserar...') + '</div>' +
      '<div style="font-size:14px;color:rgba(255,255,255,0.55);max-width:400px;line-height:1.7;">' + escapeHtml(subtitle || 'Ett ögonblick — detta tar vanligtvis 10-20 sekunder.') + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.25);margin-top:16px;letter-spacing:0.5px;">🔒 Klicka inte bort sidan under tiden</div>';

    // CSS-animation för spinner
    if (!document.getElementById('_ivSpinStyle')) {
      var s = document.createElement('style');
      s.id = '_ivSpinStyle';
      s.textContent = '@keyframes _ivSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }';
      document.head.appendChild(s);
    }

    document.body.appendChild(overlay);
  }

  function hideInterviewLoadingOverlay() {
    var existing = document.getElementById('_ivLoadingOverlay');
    if (existing) existing.remove();
  }

  // ══════════════════════════════════════════════════════════════
  // PDF: Ladda ner 10 övningsfrågor för branschen
  // Använder window.jspdf om tillgängligt (redan laddat i huvudappen),
  // annars fallback till en utskriftsbar HTML-sida som öppnas i ny flik.
  // ══════════════════════════════════════════════════════════════
  function downloadPracticeQuestionsPDF() {
    var branch = (state.session && state.session.branch) || state.setup.branch || '📚 Annat / Eget val';
    var questions = getPracticeQuestionsFor(branch);
    var branchLabel = branch;
    var dateStr = new Date().toLocaleDateString('sv-SE');

    // Försök med jsPDF om det finns globalt
    try {
      var jsPDF = null;
      if (window.jspdf && window.jspdf.jsPDF) jsPDF = window.jspdf.jsPDF;
      else if (window.jsPDF) jsPDF = window.jsPDF;

      if (jsPDF) {
        var doc = new jsPDF({ unit: 'mm', format: 'a4' });
        var pageW = 210, margin = 20, y = margin;

        // Header — gul accent
        doc.setFillColor(240, 192, 64);
        doc.rect(0, 0, pageW, 10, 'F');
        y = 22;

        // Titel
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(30, 36, 64);
        doc.text('10 intervjufrågor att öva på', margin, y);
        y += 9;

        // Subtitle
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 120);
        doc.text(branchLabel, margin, y);
        y += 6;

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 160);
        doc.text('Skriv ut och öva hemma · CVmatchen · ' + dateStr, margin, y);
        y += 10;

        // Separator
        doc.setDrawColor(230, 230, 235);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageW - margin, y);
        y += 8;

        // Intro-box
        doc.setFillColor(248, 245, 230);
        doc.rect(margin, y, pageW - (margin * 2), 16, 'F');
        doc.setTextColor(80, 80, 90);
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.text('Läs frågorna högt, spela gärna in dig själv och lyssna tillbaka.', margin + 4, y + 6);
        doc.text('Använd STAR-metoden: Situation → Task → Action → Result.', margin + 4, y + 11);
        y += 22;

        // Frågor
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(30, 36, 64);

        questions.forEach(function(q, i) {
          // Kolla om vi behöver ny sida
          if (y > 265) { doc.addPage(); y = margin; }

          // Nummer i gul cirkel-känsla (rektangel)
          doc.setFillColor(240, 192, 64);
          doc.roundedRect(margin, y - 4, 8, 6, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(30, 36, 64);
          doc.text(String(i + 1), margin + 4, y + 0.5, { align: 'center' });

          // Fråga
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(30, 36, 64);
          var lines = doc.splitTextToSize(q, pageW - (margin * 2) - 14);
          doc.text(lines, margin + 12, y + 1);
          y += (lines.length * 5.2) + 3;

          // Linjer att skriva svar på
          for (var L = 0; L < 3; L++) {
            if (y > 275) { doc.addPage(); y = margin; }
            doc.setDrawColor(220, 220, 225);
            doc.setLineWidth(0.25);
            doc.line(margin + 12, y + 3.5, pageW - margin, y + 3.5);
            y += 6;
          }
          y += 4;
        });

        // Footer
        if (y > 270) { doc.addPage(); y = margin; }
        y = Math.max(y, 275);
        doc.setDrawColor(230, 230, 235);
        doc.line(margin, y, pageW - margin, y);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 160);
        doc.text('CVmatchen av PathfinderAI · cvmatchen.com', margin, y + 5);

        var fileName = 'Ovningsfragor-' + branchLabel.replace(/[^\wåäöÅÄÖ]+/g, '-').replace(/^-|-$/g, '') + '.pdf';
        doc.save(fileName);
        return;
      }
    } catch (e) {
      if (window.ivDebug) ivDebug.log('PDF-fel: ' + (e.message || e));
    }

    // Fallback: öppna utskriftsbar HTML i ny flik
    var html = [
      '<!doctype html><html><head><meta charset="utf-8"><title>Övningsfrågor — ' + escapeHtml(branchLabel) + '</title>',
      '<style>',
      'body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;color:#1e2440;}',
      'h1{border-bottom:4px solid #f0c040;padding-bottom:10px;margin-bottom:6px;}',
      '.sub{color:#777;font-size:14px;margin-bottom:20px;}',
      '.intro{background:#fdf7e4;padding:12px 16px;border-left:4px solid #f0c040;font-style:italic;margin-bottom:24px;}',
      'ol{line-height:2.2;padding-left:20px;}',
      'ol li{margin-bottom:20px;page-break-inside:avoid;}',
      '.ans{border-bottom:1px solid #ddd;height:22px;margin:8px 0;}',
      '.footer{margin-top:40px;border-top:1px solid #eee;padding-top:12px;color:#999;font-size:12px;}',
      '@media print{.no-print{display:none;}}',
      '</style></head><body>',
      '<h1>10 intervjufrågor att öva på</h1>',
      '<div class="sub">' + escapeHtml(branchLabel) + ' · ' + dateStr + ' · CVmatchen</div>',
      '<div class="intro">Läs frågorna högt, spela gärna in dig själv och lyssna tillbaka. Använd STAR-metoden: Situation → Task → Action → Result.</div>',
      '<button class="no-print" onclick="window.print()" style="padding:10px 20px;background:#f0c040;border:none;border-radius:6px;font-weight:bold;cursor:pointer;margin-bottom:20px;">🖨️ Skriv ut / Spara som PDF</button>',
      '<ol>',
      questions.map(function(q) {
        return '<li>' + escapeHtml(q) + '<div class="ans"></div><div class="ans"></div><div class="ans"></div></li>';
      }).join(''),
      '</ol>',
      '<div class="footer">CVmatchen av PathfinderAI · cvmatchen.com</div>',
      '</body></html>'
    ].join('');

    var w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }

  async function endInterview() {
    tts.cancel();
    stt.stop();
    showScreen('feedback');

    // Visa stor blockerande overlay medan AI analyserar — förhindrar att
    // användaren klickar sig vidare innan feedbacken är klar
    showInterviewLoadingOverlay(
      'AI-coachen analyserar din intervju',
      'Vi går igenom dina svar och skriver personlig feedback. Detta tar vanligtvis 10-20 sekunder.'
    );

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

    // Uppdatera PDF-erbjudande-kortets brancher-text
    var pdfLabel = $('#ivPracticeBranchLabel');
    if (pdfLabel && state.session && state.session.branch) {
      pdfLabel.textContent = state.session.branch;
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

      var feedback = await callClaude(
        [{ role: 'user', content: 'Ge feedback enligt instruktionerna.' }],
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
    } finally {
      // Alltid ta bort overlay — även om AI failar
      hideInterviewLoadingOverlay();
    }
  }

  function renderTranscript() {
    var box = $('#ivTranscript');
    if (!box) return;

    // Para ihop intervjuarens fråga med användarens påföljande svar
    // så vi får en Q&A-lista istället för en lång blandad ström.
    var pairs = [];
    for (var i = 0; i < state.messages.length; i++) {
      var m = state.messages[i];
      if (m.role !== 'interviewer') continue;
      var next = state.messages[i + 1];
      var answer = (next && next.role === 'candidate') ? next.content : null;
      pairs.push({ question: m.content, answer: answer });
    }

    if (!pairs.length) {
      box.innerHTML = '<div style="color:rgba(255,255,255,0.35);font-size:13px;text-align:center;padding:20px;">Inga frågor att visa.</div>';
      return;
    }

    box.innerHTML = pairs.map(function(p, idx) {
      var qNum = idx + 1;
      var hasAnswer = !!p.answer;
      return [
        '<div class="iv-qa-item" data-qa-idx="' + idx + '">',
        '  <button class="iv-qa-toggle" type="button">',
        '    <span class="iv-qa-num">' + qNum + '</span>',
        '    <span class="iv-qa-question">' + escapeHtml(p.question) + '</span>',
        '    <span class="iv-qa-chevron">▾</span>',
        '  </button>',
        '  <div class="iv-qa-answer" aria-hidden="true">',
             (hasAnswer
                ? '<div class="iv-qa-answer-label">Ditt svar</div>' +
                  '<div class="iv-qa-answer-text">' + escapeHtml(p.answer) + '</div>'
                : '<div class="iv-qa-answer-label">Inget svar</div>' +
                  '<div class="iv-qa-answer-text" style="color:rgba(255,255,255,0.35);font-style:italic;">Du hann inte svara på denna fråga innan intervjun avslutades.</div>'
             ),
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    // Klick-handler: toggla expand/collapse
    box.querySelectorAll('.iv-qa-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var item = btn.closest('.iv-qa-item');
        if (!item) return;
        var isOpen = item.classList.toggle('iv-qa-item--open');
        var ans = item.querySelector('.iv-qa-answer');
        if (ans) ans.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
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

    // ─── TIPS (steg-för-steg) ─────────────────
    var tipsBack = $('#ivTipsBackBtn');
    if (tipsBack) tipsBack.addEventListener('click', function(){
      // Om vi är på första tipset → tillbaka till setup
      // Annars → föregående tips
      if (typeof prevTipOrBack === 'function') prevTipOrBack();
      else showScreen('setup');
    });
    var tipsNext = $('#ivTipsNextBtn');
    if (tipsNext) tipsNext.addEventListener('click', function(){
      if (typeof nextTipOrStart === 'function') nextTipOrStart();
    });

    // ─── METOD-VÄLJARE ──────────────────
    // Klick på ett metodkort markerar det och aktiverar start-knappen
    var methodCards = root.querySelectorAll('.iv-method-card');
    methodCards.forEach(function(card) {
      card.addEventListener('click', function() {
        methodCards.forEach(function(c) { c.classList.remove('iv-method-card--active'); });
        card.classList.add('iv-method-card--active');
        state.inputMode = card.getAttribute('data-method') || 'type';
        // Aktivera start-knappen
        var startBtn = $('#ivMethodStartBtn');
        if (startBtn) { startBtn.disabled = false; startBtn.style.opacity = '1'; }
      });
    });
    var methodStart = $('#ivMethodStartBtn');
    if (methodStart) methodStart.addEventListener('click', function() {
      ivDebug.log('🎯 Metod vald: ' + state.inputMode + ' — startar intervjun');
      startInterview();
    });
    // Byt-metod-knappen i session-headern
    var methodSwitchBtn = $('#ivMethodSwitchBtn');
    if (methodSwitchBtn) methodSwitchBtn.addEventListener('click', function() {
      showMethodSwitcher();
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
      // iOS: säkerställ att tap direkt fokuserar textarean
      userInput.addEventListener('touchstart', function(e) {
        // Låt default-beteendet ske (fokus + tangentbord)
        if (window.ivDebug && ivDebug.log) ivDebug.log('👆 textarea touchstart');
      }, { passive: true });
      userInput.addEventListener('focus', function() {
        if (window.ivDebug && ivDebug.log) ivDebug.log('👆 textarea focus');
      });
    }
    // iOS: om användaren tappar nånstans i input-baren (utanför själva textarean)
    // ska ändå textarean få fokus. Annars kan användaren fastna.
    var inputBar = root.querySelector('.iv-input-bar');
    if (inputBar && userInput) {
      inputBar.addEventListener('click', function(e) {
        // Om klicket inte var på en knapp → fokusera textarean
        if (!e.target.closest('button')) {
          userInput.focus();
        }
      });
    }

    if (micBtn) micBtn.addEventListener('click', function(){
      if (state.ai.isListening) {
        // Användaren trycker stop — fyll textarean med transkriberad text,
        // låt användaren granska/redigera innan hen trycker skicka.
        // Vi triggar inte skicka automatiskt — för många STT-fel leder annars
        // till att halvfärdiga svar skickas iväg.
        stt.stop();
        // Vänta en kort stund så onresult hinner få final text
        setTimeout(function() {
          var text = stt.finalText.trim();
          if (window.ivDebug && ivDebug.log) ivDebug.log('🎤 stop → finalText: "' + text + '"');
          if (text && userInput) {
            // Lägg till på existerande text (om användaren skrivit nåt innan)
            var existing = userInput.value.trim();
            userInput.value = existing ? existing + ' ' + text : text;
            // Trigga height-adjust
            userInput.dispatchEvent(new Event('input'));
            userInput.focus();
          }
          // Rensa interim-visning
          var interim = $('#ivInterim');
          if (interim) { interim.style.display = 'none'; interim.textContent = ''; }
        }, 300);
      } else {
        // Avbryt AI-tal om det pågår (barge-in)
        tts.cancel();
        stt.start();
      }
    });

    if (endBtn) endBtn.addEventListener('click', function(){
      if (typeof checkEndInterviewLock === 'function') checkEndInterviewLock();
    });

    // Uppdatera knappens utseende var 10:e sekund under pågående intervju
    // så den blir "grön/klickbar-känsla" när låset släpper.
    if (endBtn) {
      setInterval(function() {
        if (state.phase === 'session') updateEndBtnLockStyle();
      }, 10000);
      // Och en gång direkt vid start
      setTimeout(updateEndBtnLockStyle, 200);
    }

    // ─── FEEDBACK ─────────────────
    var fbBack = $('#ivFbBackBtn');
    if (fbBack) fbBack.addEventListener('click', function(){
      resetToSetup();
    });

    // PDF med 10 övningsfrågor för branschen
    var pdfBtn = $('#ivPracticePdfBtn');
    if (pdfBtn) pdfBtn.addEventListener('click', function() {
      try { downloadPracticeQuestionsPDF(); }
      catch(e) { showError('Kunde inte skapa PDF: ' + (e.message || e)); }
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

  // Auto-init är avstängd — intervju-modulen initieras på begäran
  // av Träning-hubben via window.ivInit() när användaren klickar på
  // "Intervjuträning"-rutan. Detta hindrar UI:t från att byggas upp
  // i en dold panel vid sidladdning (vilket gjorde att den blev synlig
  // samtidigt som hub-vyn).

})();
