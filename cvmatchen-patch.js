// cvmatchen-patch.js
// <script src="cvmatchen-patch.js" defer></script> precis innan </body>

(function () {

  // ══════════════════════════════════════════════
  // VIP + DAGSGRÄNS
  // ══════════════════════════════════════════════
  const VIP = ['oliver.pettersson2@gmail.com'];

  function isVIP() {
    try { return VIP.includes(JSON.parse(localStorage.getItem('pathfinder_auth')).email); }
    catch(e) { return false; }
  }

  function matchedToday() {
    const idag = new Date().toDateString();
    try {
      return JSON.parse(localStorage.getItem('pathfinder_matched_cvs') || '[]')
        .filter(c => new Date(c.savedAt).toDateString() === idag).length;
    } catch(e) { return 0; }
  }

  function timeLeft() {
    const m = new Date(); m.setHours(24,0,0,0);
    const d = m - new Date();
    return Math.floor(d/3600000) + ' tim ' + Math.floor((d%3600000)/60000) + ' min';
  }

  function showLimitModal() {
    const ex = document.getElementById('_lm'); if(ex) ex.remove();
    const m = document.createElement('div');
    m.id = '_lm';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.65);';
    m.innerHTML =
      '<div style="background:#1e2440;border-radius:20px 20px 0 0;padding:28px 24px 44px;width:100%;max-width:480px;border-top:3px solid #e85d26;">' +
        '<div style="font-size:44px;text-align:center;margin-bottom:14px;">🌙</div>' +
        '<div style="font-size:19px;font-weight:900;color:#fff;text-align:center;margin-bottom:8px;">Du har matchat 3 CV idag!</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.8;margin-bottom:8px;">Bra jobbat — max antal jobb nådd för idag. 💪<br>Nya matcher öppnar vid midnatt.</div>' +
        '<div style="font-size:12px;color:rgba(232,93,38,0.7);text-align:center;margin-bottom:24px;">⏰ ' + timeLeft() + ' kvar</div>' +
        '<button onclick="document.getElementById(\'_lm\').remove()" style="width:100%;padding:14px;background:#e85d26;border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">Okej, ses imorgon! 👋</button>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  }

  function showBlockModal() {
    const ex = document.getElementById('_lm'); if(ex) ex.remove();
    const m = document.createElement('div');
    m.id = '_lm';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);padding:20px;';
    m.innerHTML =
      '<div style="background:#1e2440;border-radius:20px;padding:28px 24px;width:100%;max-width:380px;border:1px solid rgba(232,93,38,0.4);text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:12px;">🔒</div>' +
        '<div style="font-size:17px;font-weight:900;color:#fff;margin-bottom:8px;">Dagsgränsen nådd</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:8px;">Du har redan matchat 3 CV idag.<br>Nya matcher öppnar vid midnatt.</div>' +
        '<div style="font-size:12px;color:rgba(232,93,38,0.7);margin-bottom:20px;">⏰ ' + timeLeft() + ' kvar</div>' +
        '<button onclick="document.getElementById(\'_lm\').remove()" style="width:100%;padding:13px;background:#e85d26;border:none;color:#fff;font-size:14px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">Stäng</button>' +
      '</div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if(e.target===m) m.remove(); });
  }


  // ══════════════════════════════════════════════
  // STEG 2 — Byt knapptext direkt i matchaBuildCard
  // ══════════════════════════════════════════════
  window.addEventListener('load', function () {

    // Override matchaBuildCard för att byta knapptext
    const _origBuild = window.matchaBuildCard;
    if (typeof _origBuild === 'function') {
      window.matchaBuildCard = function(hit) {
        const card = _origBuild(hit);
        if (!card) return card;
        // Hitta den gula knappen och byt text
        card.querySelectorAll('button').forEach(function(btn) {
          if (btn.textContent.includes('Matcha mot CV')) {
            btn.textContent = '✅ Välj denna annons';
            btn.style.background = 'linear-gradient(135deg,#3eb489,#10b981)';
            btn.style.color = '#fff';
          }
        });
        return card;
      };
    }

    // Fallback — MutationObserver på hela dokumentet
    new MutationObserver(function() {
      document.querySelectorAll('button').forEach(function(btn) {
        // Steg 2 — gul knapp → Välj denna annons
        if (btn.textContent.trim() === '✨ Matcha mot CV' && !btn.dataset.p && !(btn.id||'').startsWith('matchaGenBtn_')) {
          btn.dataset.p = '1';
          btn.textContent = '✅ Välj denna annons';
          btn.style.background = 'linear-gradient(135deg,#3eb489,#10b981)';
          btn.style.color = '#fff';
          btn.style.border = 'none';
        }
        // Steg 3 — lila AI-knapp → ✨ Matcha annons med AI
        if ((btn.id||'').startsWith('matchaGenBtn_') && !btn.dataset.p && !btn.disabled) {
          btn.dataset.p = '1';
          btn.textContent = '✨ Matcha annons med AI';
        }
      });
    }).observe(document.body, { childList: true, subtree: true });


    // ══════════════════════════════════════════
    // DAGSGRÄNS i matchaApplyTextForAd
    // ══════════════════════════════════════════
    const _origApply = window.matchaApplyTextForAd;
    if (typeof _origApply === 'function') {
      window.matchaApplyTextForAd = function(hitId, altIdx) {
        if (!isVIP() && matchedToday() >= 3) { showBlockModal(); return; }
        _origApply(hitId, altIdx);
        // Visa limit-modal om detta var 3:e matchen
        setTimeout(function() {
          if (!isVIP() && matchedToday() >= 3) showLimitModal();
        }, 800);
        // Injicera räknarbadge
        setTimeout(injectBadge, 200);
      };
    }


    // ══════════════════════════════════════════
    // RÄKNARBADGE i success-rutan
    // ══════════════════════════════════════════
    function injectBadge() {
      const count = Math.min(matchedToday(), 3);
      const left  = 3 - count;
      document.querySelectorAll('*').forEach(function(el) {
        if (el.childElementCount === 0 && el.textContent.trim() === 'Profiltext sparad!') {
          if (el.parentNode.querySelector('.cv-badge')) return;
          const b = document.createElement('div');
          b.className = 'cv-badge';
          b.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.25);border-radius:20px;padding:3px 10px;margin-bottom:8px;font-size:12px;';
          b.innerHTML =
            '<span style="font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
            '<span style="color:rgba(255,255,255,0.3);">·</span>' +
            '<span style="color:rgba(255,255,255,0.45);">' +
            (isVIP() ? 'VIP 👑' : left > 0 ? left + ' kvar idag' : 'Nytt vid midnatt 🌙') +
            '</span>';
          el.parentNode.insertBefore(b, el);
        }
      });
    }


    // ══════════════════════════════════════════
    // PROFIL — 2x2 GRID
    // ══════════════════════════════════════════
    function getSaved()   { try{ return JSON.parse(localStorage.getItem('pathfinder_saved_cvs')||'[]'); }   catch(e){ return []; } }
    function getMatched() { try{ return JSON.parse(localStorage.getItem('pathfinder_matched_cvs')||'[]'); } catch(e){ return []; } }
    function getDiary()   {
      const TTL = 45*24*3600*1000;
      try{ return JSON.parse(localStorage.getItem('pathfinder_job_diary')||'[]').filter(e=>Date.now()-e.savedAt<TTL); }
      catch(e){ return []; }
    }
    function getEdu()     { try{ return JSON.parse(localStorage.getItem('pf_saved_edu')||'[]'); } catch(e){ return []; } }

    function rd(ts) {
      const d = Math.floor((Date.now()-ts)/86400000);
      if(d===0) return 'idag'; if(d===1) return 'igår'; if(d<7) return d+' dagar sedan';
      return new Date(ts).toLocaleDateString('sv-SE',{day:'numeric',month:'short'});
    }

    function empty(t,s) {
      return '<div style="text-align:center;padding:32px 16px;"><div style="font-size:36px;margin-bottom:10px;">📭</div>' +
        '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.5);margin-bottom:6px;">'+t+'</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;">'+s+'</div></div>';
    }

    window._ps = null; // aktiv sektion

    window._pt = function(id) {
      window._ps = window._ps === id ? null : id;
      renderGrid();
      if (window._ps) setTimeout(function(){
        const el = document.getElementById('mobSavedCVsList');
        if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
      }, 100);
    };

    function renderGrid() {
      const container = document.getElementById('mobSavedCVsList');
      if (!container) return;

      const saved   = getSaved();
      const matched = getMatched();
      const diary   = getDiary();
      const edu     = getEdu();

      const cats = [
        { id:'saved',   emoji:'📄', label:'Mina CV',           count:saved.length,   max:3    },
        { id:'matched', emoji:'🎯', label:'Mina Matcher',    count:matched.length, max:null },
        { id:'diary',   emoji:'💼', label:'Sökta Arbeten',         count:diary.length,   max:null },
        { id:'edu',     emoji:'🎓', label:'Sparade Utbildningar', count:edu.length,     max:null },
      ];

      let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">';
      cats.forEach(function(c) {
        const a = window._ps === c.id;
        html += '<div onclick="window._pt(\''+c.id+'\')" style="border-radius:16px;padding:16px 12px;cursor:pointer;text-align:center;' +
          'background:'+(a?'rgba(62,180,137,0.12)':'rgba(255,255,255,0.05)')+';' +
          'border:2px solid '+(a?'#3eb489':'rgba(255,255,255,0.08)')+';transition:all 0.15s;">' +
          '<div style="font-size:28px;margin-bottom:6px;">'+c.emoji+'</div>' +
          '<div style="font-size:12px;font-weight:700;color:'+(a?'#fff':'rgba(255,255,255,0.65)')+';line-height:1.3;margin-bottom:8px;">'+c.label+'</div>' +
          '<div style="display:inline-flex;align-items:center;justify-content:center;background:'+(a?'rgba(62,180,137,0.25)':'rgba(255,255,255,0.08)')+';border-radius:20px;padding:2px 10px;font-size:12px;font-weight:800;color:'+(a?'#3eb489':'rgba(255,255,255,0.4)')+';">' +
          c.count+(c.max?'/'+c.max:'')+
          '</div></div>';
      });
      html += '</div>';

      // Innehåll
      const s = window._ps;

      if (s === 'saved') {
        if (!saved.length) { html += empty('Inga sparade CV ännu','Bygg ett CV och tryck "Spara CV-version"'); }
        else {
          saved.sort((a,b)=>b.savedAt-a.savedAt).forEach(function(cv){
            html += '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">' +
              '<div style="flex-shrink:0;width:40px;height:40px;border-radius:10px;background:rgba(62,180,137,0.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;font-family:Georgia,serif;">' +
              '<span style="color:#f0c040;">CV</span><span style="color:#fff;">match</span></div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:#fff;">'+cv.title+'</div>' +
              '<div style="font-size:11px;color:rgba(255,255,255,0.35);">'+rd(cv.savedAt)+'</div></div>' +
              '<button onclick="if(typeof mobShowSavedCVDetail===\'function\') mobShowSavedCVDetail(\''+cv.id+'\')" ' +
              'style="padding:7px 14px;background:#3eb489;border:none;color:#fff;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;">Öppna</button>' +
              '</div>';
          });
          html += '<button onclick="if(typeof mobOpenCV===\'function\'){mobOpenCV();mobSwitchSubTab(\'info\');}" ' +
            'style="width:100%;margin-top:4px;padding:12px;background:none;border:1.5px dashed rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;border-radius:12px;cursor:pointer;font-family:inherit;">+ Skapa nytt CV</button>';
        }
      }

      if (s === 'matched') {
        if (!matched.length) { html += empty('Inga matchade annonser','Gå till Matcha och matcha ditt CV mot ett jobb'); }
        else {
          matched.sort((a,b)=>b.savedAt-a.savedAt).forEach(function(cv){
            const sid = cv.id.replace(/'/g,"\\'");
            html += '<div style="background:rgba(62,180,137,0.05);border:1px solid rgba(62,180,137,0.15);border-radius:14px;padding:14px;margin-bottom:8px;">' +
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
                '<div style="font-size:20px;">🎯</div>' +
                '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+cv.title.replace('Matchat CV – ','')+' </div>' +
                '<div style="font-size:11px;color:rgba(255,255,255,0.35);">'+(cv.company?cv.company+' · ':'')+rd(cv.savedAt)+'</div></div>' +
                '<button onclick="if(typeof mobDeleteMatchedCV===\'function\'){mobDeleteMatchedCV(\''+sid+'\');window._pt(\'matched\');}" ' +
                'style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:18px;cursor:pointer;">✕</button>' +
              '</div>' +
              '<div style="display:flex;gap:7px;">' +
                '<button onclick="if(typeof mobExportMatchedPDF===\'function\') mobExportMatchedPDF(\''+sid+'\')" ' +
                'style="flex:1;padding:9px;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-size:12px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">📄 CV som PDF</button>' +
                (cv.jobUrl?'<a href="'+cv.jobUrl+'" target="_blank" rel="noopener" style="padding:9px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:12px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;">↗</a>':'')+
              '</div></div>';
          });
        }
      }

      if (s === 'diary') {
        if (!diary.length) { html += empty('Inga sökta arbeten','Matchade jobb sparas automatiskt här i 45 dagar'); }
        else {
          const un = diary.filter(e=>!e.applied);
          const ap = diary.filter(e=> e.applied);
          if(un.length){ html += '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,80,80,0.6);margin-bottom:8px;">⏳ Ej sökt ('+un.length+')</div>'; un.forEach(function(e){ html += dc(e,diary.indexOf(e)); }); }
          if(ap.length){ html += '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(62,180,137,0.6);margin:14px 0 8px;">✅ Sökt ('+ap.length+')</div>'; ap.forEach(function(e){ html += dc(e,diary.indexOf(e)); }); }
          html += '<button onclick="if(typeof diaryExport===\'function\') diaryExport()" style="width:100%;margin-top:8px;padding:11px;background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.25);color:#3eb489;font-size:12px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">📋 Exportera aktivitetsrapport</button>';
        }
      }

      if (s === 'edu') {
        if (!edu.length) { html += empty('Inga sparade utbildningar','Gå till AI-SYV och tryck 🏷️ på en utbildning'); }
        else {
          edu.forEach(function(u,i){
            html += '<div style="background:rgba(240,192,64,0.06);border:1px solid rgba(240,192,64,0.18);border-radius:14px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;">' +
              '<div style="font-size:20px;flex-shrink:0;">🎓</div>' +
              '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">'+u.namn+'</div>' +
              '<div style="font-size:11px;color:#f0c040;">'+u.typ+' · '+u.kommun+'</div>' +
              (u.info?'<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">'+u.info+'</div>':'')+
              '</div>' +
              '<button onclick="(function(){var l=JSON.parse(localStorage.getItem(\'pf_saved_edu\')||\'[]\');l.splice('+i+',1);localStorage.setItem(\'pf_saved_edu\',JSON.stringify(l));window._pt(\'edu\');})()" ' +
              'style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:16px;cursor:pointer;padding:0;">✕</button>' +
              '</div>';
          });
        }
      }

      container.innerHTML = html;
    }

    function dc(e, idx) {
      const dStr = new Date(e.savedAt).toLocaleDateString('sv-SE',{day:'numeric',month:'short'});
      return '<div style="background:'+(e.applied?'rgba(62,180,137,0.05)':'rgba(255,80,80,0.04)')+';border:1.5px solid '+(e.applied?'rgba(62,180,137,0.25)':'rgba(255,80,80,0.2)')+';border-radius:12px;padding:12px;margin-bottom:7px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<div style="font-size:18px;">'+(e.applied?'✅':'⏳')+'</div>' +
          '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:700;color:#fff;">'+e.jobTitle+'</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.35);">'+dStr+(e.company?' · '+e.company:'')+'</div></div>' +
          (e.jobUrl?'<a href="'+e.jobUrl+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:rgba(255,255,255,0.3);font-size:13px;text-decoration:none;padding:5px 9px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;">↗</a>':'')+
        '</div>' +
        (!e.applied?'<button onclick="if(typeof diaryMarkApplied===\'function\'){diaryMarkApplied('+idx+');window._pt(\'diary\');}" ' +
          'style="width:100%;margin-top:10px;padding:10px;background:linear-gradient(135deg,#e85d26,#f0a040);border:none;color:#fff;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;font-family:inherit;">🚀 Ja! Jag sökte detta jobb</button>':'')+
        '</div>';
    }

    // Override mobRenderSavedCVs
    window.mobRenderSavedCVs = renderGrid;

    // Rendera när man går till Profil-fliken
    const _origSwitch = window.mobSwitchTab;
    window.mobSwitchTab = function(tab) {
      if(_origSwitch) _origSwitch(tab);
      if(tab === 'export') setTimeout(renderGrid, 150);
    };

    // Rendera om redan på Profil
    const ep = document.getElementById('mobPanel-export');
    if(ep && ep.classList.contains('mob-panel--active')) renderGrid();

  }); // end load

})();


  // ══════════════════════════════════════════════
  // UTBILDNING — Byt fliknamn + Steg 1
  // ══════════════════════════════════════════════
  window.addEventListener('load', function () {

    // Byt "AI-SYV" → "Utbildning" i navbaren
    const tabBtn = document.getElementById('tabBtn-aisyv');
    if (tabBtn) {
      const span = tabBtn.querySelector('span');
      if (span) span.textContent = 'Utbildning';
    }

    // Skapa steg 1-skärmen och injicera den i AI-SYV-panelen
    const panel = document.getElementById('mobPanel-aisyv');
    if (!panel) return;

    const step1 = document.createElement('div');
    step1.id = 'utbStep1';
    step1.style.cssText =
      'position:absolute;inset:0;z-index:50;background:#12172a;overflow-y:auto;padding:20px 16px 40px;';

    step1.innerHTML =
      // Hero
      '<div style="text-align:center;padding:16px 0 24px;">' +
        '<div style="font-size:40px;margin-bottom:10px;">🎓</div>' +
        '<div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:6px;">Utbildning</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.45);line-height:1.6;">Hitta rätt utbildning och ta nästa steg mot jobbet du vill ha.</div>' +
      '</div>' +

      // 4 rutor
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">' +

        // Ruta 1
        _utbCard('🎯','Utbildningar med jobbchanser',
          'Se utbildningar i regionen som faktiskt leder till jobb.',
          'rgba(62,180,137,0.12)','rgba(62,180,137,0.3)','#3eb489',
          'Visa utbildningar med goda jobbchanser i Familjen Helsingborg-regionen') +

        // Ruta 2
        _utbCard('🗺️','Utbildningar nära dig',
          'Utbildningar i Helsingborg och Familjen Helsingborgs 11 kommuner.',
          'rgba(240,192,64,0.1)','rgba(240,192,64,0.3)','#f0c040',
          'Vilka utbildningar finns nära mig i Familjen Helsingborg?') +

        // Ruta 3
        _utbCard('💡','Vad passar mig?',
          'AI analyserar ditt CV och föreslår utbildningar som passar dig.',
          'rgba(124,58,237,0.1)','rgba(124,58,237,0.3)','#a78bfa',
          'Analysera mitt CV och föreslå utbildningar som passar mig') +

        // Ruta 4
        _utbCard('🔖','Mina sparade utbildningar',
          'Se utbildningar du sparat tidigare.',
          'rgba(232,93,38,0.1)','rgba(232,93,38,0.3)','#e85d26',
          null, true) + // null = öppnar sparade, inte chatten

      '</div>' +

      // Gå till AI-chatten-knapp
      '<button onclick="window._utbGotoChat(\'\')" style="width:100%;padding:14px;background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.5);font-size:13px;font-weight:700;border-radius:12px;cursor:pointer;font-family:inherit;">' +
        '💬 Ställ en egen fråga till AI-vägledaren' +
      '</button>';

    panel.style.position = 'relative';
    panel.appendChild(step1);

    // Hjälpfunktion: skapa en ruta
    function _utbCard(emoji, title, desc, bg, border, color, prompt, isSaved) {
      const onclick = isSaved
        ? 'if(typeof syvShowSaved===\'function\') syvShowSaved()'
        : 'window._utbGotoChat(\'' + (prompt||'').replace(/'/g,"\\'") + '\')';
      return '<div onclick="' + onclick + '" style="border-radius:16px;padding:16px 12px;cursor:pointer;text-align:center;' +
        'background:' + bg + ';border:2px solid ' + border + ';transition:all 0.15s;">' +
        '<div style="font-size:28px;margin-bottom:8px;">' + emoji + '</div>' +
        '<div style="font-size:12px;font-weight:800;color:' + color + ';margin-bottom:6px;line-height:1.3;">' + title + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">' + desc + '</div>' +
        '</div>';
    }

    // Gå till steg 2 (chatten) och skriv in prompt
    window._utbGotoChat = function(prompt) {
      const s1 = document.getElementById('utbStep1');
      if (s1) s1.style.display = 'none';
      // Skriv in prompten i chatfältet och skicka
      if (prompt) {
        setTimeout(function() {
          const input = document.getElementById('syvInput') || document.querySelector('#mobPanel-aisyv textarea, #mobPanel-aisyv input[type=text]');
          if (input) {
            input.value = prompt;
            input.dispatchEvent(new Event('input', {bubbles:true}));
            const sendBtn = document.querySelector('#syvSendBtn, #mobPanel-aisyv button[onclick*="syvSend"], #mobPanel-aisyv button[onclick*="Send"]');
            if (sendBtn) sendBtn.click();
          }
        }, 200);
      }
    };

    // Visa steg 1 igen när man byter bort och tillbaka till fliken
    const _origSwitch2 = window.mobSwitchTab;
    window.mobSwitchTab = function(tab) {
      if (_origSwitch2) _origSwitch2(tab);
      if (tab === 'aisyv') {
        const s1 = document.getElementById('utbStep1');
        if (s1) s1.style.display = 'block';
      }
    };

  });


  // ══════════════════════════════════════════════
  // STEG 3 — Röd dagsgräns-banner högst upp
  // ══════════════════════════════════════════════
  window.addEventListener('load', function () {

    function updateDagsBanner() {
      const step3 = document.getElementById('matchaStep3');
      if (!step3 || step3.style.display === 'none') return;

      const count  = matchedToday();   // redan definierad i patchen
      const left   = 3 - count;
      const vip    = isVIP();          // redan definierad i patchen

      let banner = document.getElementById('_dagsBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = '_dagsBanner';
        // Sätt in allra överst i steg 3, innan "Välj CV att matcha mot"
        step3.insertBefore(banner, step3.firstChild);
      }

      // Tid till midnatt
      const mn = new Date(); mn.setHours(24,0,0,0);
      const diff = mn - new Date();
      const h = Math.floor(diff/3600000);
      const m = Math.floor((diff%3600000)/60000);
      const tid = h + ' tim ' + m + ' min';

      if (vip) {
        banner.style.display = 'none';
        return;
      }

      banner.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;gap:10px;' +
        'background:' + (left === 0 ? 'rgba(232,93,38,0.18)' : 'rgba(232,93,38,0.1)') + ';' +
        'border:2px solid ' + (left === 0 ? '#e85d26' : 'rgba(232,93,38,0.4)') + ';' +
        'border-radius:12px;padding:10px 14px;margin-bottom:14px;';

      banner.innerHTML =
        '<div>' +
          '<div style="font-size:13px;font-weight:900;color:#e85d26;margin-bottom:2px;">' +
            (left === 0 ? '🔒 Inga matcher kvar idag' : '🎯 ' + left + ' av 3 matcher kvar idag') +
          '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.4);">' +
            'Resetar om ' + tid +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;">' +
          '<div style="font-size:20px;font-weight:900;color:' + (left === 0 ? '#e85d26' : '#fff') + ';">' +
            count + '/3' +
          '</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.3);">matcher</div>' +
        '</div>';
    }

    // Uppdatera bannern när steg 3 visas
    const observer = new MutationObserver(function() {
      const s3 = document.getElementById('matchaStep3');
      if (s3 && s3.style.display !== 'none') updateDagsBanner();
    });
    const s3el = document.getElementById('matchaStep3');
    if (s3el) observer.observe(s3el, { attributes: true, attributeFilter: ['style'] });

    // Uppdatera efter varje match
    const _origApply2 = window.matchaApplyTextForAd;
    if (typeof _origApply2 === 'function') {
      window.matchaApplyTextForAd = function(hitId, altIdx) {
        _origApply2(hitId, altIdx);
        setTimeout(updateDagsBanner, 300);
      };
    }

  });


  // ══════════════════════════════════════════════
  // STEG 2 — Snabbknappar Familjen Helsingborg
  // ══════════════════════════════════════════════
  window.addEventListener('load', function () {

    const kategorier = [
      { emoji:'🚫', label:'Utan krav',        q:'lager produktion industri'  },
      { emoji:'📦', label:'Lager & logistik', q:'lager logistik'             },
      { emoji:'🤝', label:'Vård & omsorg',    q:'vård omsorg undersköterska' },
      { emoji:'🏗️', label:'Bygg & anläggning',q:'bygg anläggning'            },
      { emoji:'🧹', label:'Städ & service',   q:'städ service'               },
      { emoji:'🍽️', label:'Restaurang & kök', q:'restaurang kök'             },
      { emoji:'🛒', label:'Butik & handel',   q:'butik handel'               },
      { emoji:'🏭', label:'Industri',         q:'industri tillverkning'      },
    ];

    // Hitta rätt plats — efter platsfiltret, innan skeleton
    const skeleton = document.getElementById('matchaSkeleton');
    if (!skeleton) return;

    const wrap = document.createElement('div');
    wrap.id = '_snabbWrap';
    wrap.style.cssText = 'margin-top:16px;margin-bottom:4px;';

    // Rubrik
    wrap.innerHTML =
      '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;' +
      'color:rgba(255,255,255,0.3);margin-bottom:8px;">⚡ Snabbsök i Familjen Helsingborg</div>' +
      '<div id="_snabbBtns" style="display:flex;flex-wrap:wrap;gap:7px;"></div>';

    skeleton.parentNode.insertBefore(wrap, skeleton);

    const btnsEl = document.getElementById('_snabbBtns');

    kategorier.forEach(function(k) {
      const btn = document.createElement('button');
      btn.dataset.q = k.q;
      btn.style.cssText =
        'display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:20px;' +
        'font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;' +
        'background:rgba(255,255,255,0.06);border:1.5px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.6);';
      btn.innerHTML = k.emoji + ' ' + k.label;

      btn.onclick = function() {
        // Markera aktiv
        btnsEl.querySelectorAll('button').forEach(function(b) {
          b.style.background   = 'rgba(255,255,255,0.06)';
          b.style.borderColor  = 'rgba(255,255,255,0.12)';
          b.style.color        = 'rgba(255,255,255,0.6)';
        });
        btn.style.background  = 'rgba(62,180,137,0.15)';
        btn.style.borderColor = '#3eb489';
        btn.style.color       = '#3eb489';

        // Sätt sökfältet och sök
        const input = document.getElementById('matchaSearch');
        if (input) {
          input.value = k.q;
          input.dispatchEvent(new Event('input', {bubbles:true}));
        }
        if (typeof matchaDoSearch === 'function') matchaDoSearch();
      };

      btnsEl.appendChild(btn);
    });

    // Rensa aktiv knapp när användaren skriver själv
    const input = document.getElementById('matchaSearch');
    if (input) {
      input.addEventListener('input', function() {
        btnsEl.querySelectorAll('button').forEach(function(b) {
          b.style.background  = 'rgba(255,255,255,0.06)';
          b.style.borderColor = 'rgba(255,255,255,0.12)';
          b.style.color       = 'rgba(255,255,255,0.6)';
        });
      });
    }

  });
