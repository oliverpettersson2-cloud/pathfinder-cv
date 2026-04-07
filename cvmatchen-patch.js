// cvmatchen-patch.js
// <script src="cvmatchen-patch.js" defer></script> precis innan </body>

(function () {

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

  // ── Tid kvar till midnatt ────────────────────────
  function timeUntilMidnight() {
    const now  = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h + ' tim ' + m + ' min';
  }


  // ════════════════════════════════════════════════
  // LIMIT-MODAL — visas direkt efter 3:e matchen
  // ════════════════════════════════════════════════
  function showLimitModal() {
    const existing = document.getElementById('limitModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'limitModal';
    modal.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;' +
      'justify-content:center;background:rgba(0,0,0,0.65);';
    modal.innerHTML =
      '<div style="background:#1e2440;border-radius:20px 20px 0 0;padding:28px 24px 44px;' +
      'width:100%;max-width:480px;border-top:3px solid #e85d26;box-shadow:0 -8px 40px rgba(0,0,0,0.5);">' +
        '<div style="font-size:44px;text-align:center;margin-bottom:14px;">🌙</div>' +
        '<div style="font-size:19px;font-weight:900;color:#fff;text-align:center;margin-bottom:8px;">' +
          'Du har matchat 3 CV idag!' +
        '</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.8;margin-bottom:8px;">' +
          'Bra jobbat — du har sökt maximalt antal jobb idag. 💪<br>' +
          'Nya matcher öppnar vid midnatt.' +
        '</div>' +
        '<div style="font-size:12px;color:rgba(232,93,38,0.7);text-align:center;margin-bottom:24px;">' +
          '⏰ ' + timeUntilMidnight() + ' kvar' +
        '</div>' +
        '<button id="limitModalClose" style="width:100%;padding:14px;background:#e85d26;border:none;' +
          'color:#fff;font-size:15px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">' +
          'Okej, ses imorgon! 👋' +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
    document.getElementById('limitModalClose').onclick = function () { modal.remove(); };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }

  // Blockera vid försök på 4:e+
  function showBlockModal() {
    const existing = document.getElementById('limitModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'limitModal';
    modal.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;' +
      'justify-content:center;background:rgba(0,0,0,0.65);padding:20px;';
    modal.innerHTML =
      '<div style="background:#1e2440;border-radius:20px;padding:28px 24px;' +
      'width:100%;max-width:380px;border:1px solid rgba(232,93,38,0.4);text-align:center;">' +
        '<div style="font-size:40px;margin-bottom:12px;">🔒</div>' +
        '<div style="font-size:17px;font-weight:900;color:#fff;margin-bottom:8px;">Dagsgränsen nådd</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.7;margin-bottom:8px;">' +
          'Du har redan matchat 3 CV idag.<br>Nya matcher öppnar vid midnatt.' +
        '</div>' +
        '<div style="font-size:12px;color:rgba(232,93,38,0.7);margin-bottom:20px;">' +
          '⏰ ' + timeUntilMidnight() + ' kvar' +
        '</div>' +
        '<button id="blockModalClose" style="width:100%;padding:13px;background:#e85d26;border:none;' +
          'color:#fff;font-size:14px;font-weight:800;border-radius:12px;cursor:pointer;font-family:inherit;">' +
          'Stäng' +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
    document.getElementById('blockModalClose').onclick = function () { modal.remove(); };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }


  // ════════════════════════════════════════════════
  // KOMPAKT SUCCESS-RUTA
  // ════════════════════════════════════════════════
  function injectCounterBadge(savedJobTitle) {
    const count = Math.min(matchedToday(), 3);
    const left  = 3 - count;

    document.querySelectorAll('*').forEach(function (el) {
      if (el.childElementCount === 0 && el.textContent.trim() === 'Profiltext sparad!') {
        if (el.parentNode.querySelector('.cv-dagsgrans')) return;

        // Kompakt räknare
        const badge = document.createElement('div');
        badge.className = 'cv-dagsgrans';
        badge.style.cssText =
          'display:inline-flex;align-items:center;gap:6px;' +
          'background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.25);' +
          'border-radius:20px;padding:3px 10px;margin-bottom:6px;font-size:12px;';
        badge.innerHTML =
          '<span style="font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
          '<span style="color:rgba(255,255,255,0.3);">·</span>' +
          '<span style="color:rgba(255,255,255,0.4);">' +
          (isVIP() ? 'VIP 👑' : left > 0 ? left + ' kvar idag' : 'Nytt igen vid midnatt 🌙') +
          '</span>';

        el.parentNode.insertBefore(badge, el);

        // Krympa "Matchad mot"-boxen till en pill
        const matchBox = el.parentNode.querySelector('[style*="MATCHAD MOT"], [style*="Matchad mot"]');
        const allChildren = Array.from(el.parentNode.children);
        allChildren.forEach(function (child) {
          if (child.textContent.includes('Matchad mot') || child.innerHTML.includes('MATCHAD MOT')) {
            child.style.cssText =
              'display:inline-flex;align-items:center;gap:6px;' +
              'background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.2);' +
              'border-radius:20px;padding:4px 12px;margin-bottom:8px;font-size:11px;' +
              'color:rgba(255,255,255,0.6);max-width:100%;overflow:hidden;';
          }
        });

        // Minska padding på hela föräldern
        const parent = el.closest('[style*="padding:28px"]') || el.closest('[style*="padding: 28px"]');
        if (parent) parent.style.padding = '16px';
      }
    });

    // Visa limit-modal direkt om detta var den 3:e matchen (ej VIP)
    if (!isVIP() && count >= 3) {
      setTimeout(showLimitModal, 800);
    }
  }


  // ════════════════════════════════════════════════
  // STEG 2 — Instruktionsbanner
  // ════════════════════════════════════════════════
  function injectStep2Banner() {
    const resultsEl = document.getElementById('matchaSearchResults');
    if (!resultsEl || resultsEl.querySelector('.step2-banner') || !resultsEl.children.length) return;

    const banner = document.createElement('div');
    banner.className = 'step2-banner';
    banner.style.cssText =
      'display:flex;align-items:center;gap:10px;background:rgba(240,192,64,0.08);' +
      'border:1.5px solid rgba(240,192,64,0.25);border-radius:12px;padding:10px 14px;margin-bottom:10px;';
    banner.innerHTML =
      '<span style="font-size:18px;">👆</span>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">' +
        '<strong style="color:#f0c040;">Tryck på en annons</strong> för att öppna den — ' +
        'sedan <strong style="color:#f0c040;">✨ Matcha mot CV</strong>.' +
      '</div>';
    resultsEl.insertBefore(banner, resultsEl.firstChild);
  }


  // ════════════════════════════════════════════════
  // PROFIL — 2x2 GRID
  // ════════════════════════════════════════════════
  function getSavedCVs()   { try { return JSON.parse(localStorage.getItem('pathfinder_saved_cvs') || '[]'); }   catch(e) { return []; } }
  function getMatchedCVs() { try { return JSON.parse(localStorage.getItem('pathfinder_matched_cvs') || '[]'); } catch(e) { return []; } }
  function getDiary()      {
    const TTL = 45 * 24 * 3600 * 1000;
    try { return JSON.parse(localStorage.getItem('pathfinder_job_diary') || '[]').filter(e => Date.now() - e.savedAt < TTL); }
    catch(e) { return []; }
  }
  function getSavedEdu()   { try { return JSON.parse(localStorage.getItem('pf_saved_edu') || '[]'); } catch(e) { return []; } }

  function relDate(ts) {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d === 0) return 'idag'; if (d === 1) return 'igår';
    if (d < 7) return d + ' dagar sedan';
    return new Date(ts).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  }

  let _activeSection = null;

  function renderProfileGrid() {
    const container = document.getElementById('mobSavedCVsList');
    if (!container) return;

    const savedCVs   = getSavedCVs();
    const matchedCVs = getMatchedCVs();
    const diary      = getDiary();
    const savedEdu   = getSavedEdu();

    const cats = [
      { id: 'saved',   emoji: '📄', label: 'Sparade CV',          count: savedCVs.length,   max: 3    },
      { id: 'matched', emoji: '🎯', label: 'Matchade Annonser',   count: matchedCVs.length, max: null },
      { id: 'diary',   emoji: '💼', label: 'Sökta Arbete',        count: diary.length,      max: null },
      { id: 'edu',     emoji: '🎓', label: 'Sparade Utbildningar', count: savedEdu.length,  max: null },
    ];

    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">';
    cats.forEach(function (cat) {
      const active = _activeSection === cat.id;
      html +=
        '<div onclick="window._patchToggle(\'' + cat.id + '\')" style="' +
          'border-radius:16px;padding:16px 12px;cursor:pointer;text-align:center;' +
          'background:' + (active ? 'rgba(62,180,137,0.12)' : 'rgba(255,255,255,0.05)') + ';' +
          'border:2px solid ' + (active ? '#3eb489' : 'rgba(255,255,255,0.08)') + ';' +
          'transition:all 0.15s;">' +
          '<div style="font-size:28px;margin-bottom:6px;">' + cat.emoji + '</div>' +
          '<div style="font-size:12px;font-weight:700;color:' + (active ? '#fff' : 'rgba(255,255,255,0.65)') + ';line-height:1.3;margin-bottom:8px;">' + cat.label + '</div>' +
          '<div style="display:inline-flex;align-items:center;justify-content:center;' +
            'background:' + (active ? 'rgba(62,180,137,0.25)' : 'rgba(255,255,255,0.08)') + ';' +
            'border-radius:20px;padding:2px 10px;font-size:12px;font-weight:800;' +
            'color:' + (active ? '#3eb489' : 'rgba(255,255,255,0.4)') + ';">' +
            cat.count + (cat.max ? '/' + cat.max : '') +
          '</div>' +
        '</div>';
    });
    html += '</div>';

    if (_activeSection) {
      html += '<div id="profileSectionContent" style="animation:mobFadeIn 0.2s ease;">';
      html += _renderSection(_activeSection, savedCVs, matchedCVs, diary, savedEdu);
      html += '</div>';
    }

    container.innerHTML = html;
  }

  function _renderSection(id, savedCVs, matchedCVs, diary, savedEdu) {
    if (id === 'saved') {
      if (!savedCVs.length) return _empty('Inga sparade CV ännu', 'Bygg ett CV och tryck "Spara CV-version"');
      return savedCVs.sort((a,b) => b.savedAt - a.savedAt).map(function (cv) {
        return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;">' +
          '<div style="flex-shrink:0;width:40px;height:40px;border-radius:10px;background:rgba(62,180,137,0.12);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;font-family:Georgia,serif;">' +
            '<span style="color:#f0c040;">CV</span><span style="color:#fff;">match</span></div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:700;color:#fff;">' + cv.title + '</div>' +
            '<div style="font-size:11px;color:rgba(255,255,255,0.35);">' + relDate(cv.savedAt) + '</div>' +
          '</div>' +
          '<button onclick="if(typeof mobShowSavedCVDetail===\'function\') mobShowSavedCVDetail(\'' + cv.id + '\')" ' +
            'style="padding:7px 14px;background:#3eb489;border:none;color:#fff;font-size:12px;font-weight:700;border-radius:8px;cursor:pointer;font-family:inherit;">Öppna</button>' +
          '</div>';
      }).join('') +
      '<button onclick="if(typeof mobOpenCV===\'function\'){mobOpenCV();mobSwitchSubTab(\'info\');}" ' +
        'style="width:100%;margin-top:4px;padding:12px;background:none;border:1.5px dashed rgba(255,255,255,0.15);color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;border-radius:12px;cursor:pointer;font-family:inherit;">+ Skapa nytt CV</button>';
    }

    if (id === 'matched') {
      if (!matchedCVs.length) return _empty('Inga matchade annonser', 'Gå till Matcha-fliken och matcha ditt CV mot ett jobb');
      return matchedCVs.sort((a,b) => b.savedAt - a.savedAt).map(function (cv) {
        const sid = cv.id.replace(/'/g, "\\'");
        return '<div style="background:rgba(62,180,137,0.05);border:1px solid rgba(62,180,137,0.15);border-radius:14px;padding:14px;margin-bottom:8px;">' +
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
            '<div style="font-size:20px;">🎯</div>' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:13px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + cv.title.replace('Matchat CV – ', '') + '</div>' +
              '<div style="font-size:11px;color:rgba(255,255,255,0.35);">' + (cv.company ? cv.company + ' · ' : '') + relDate(cv.savedAt) + '</div>' +
            '</div>' +
            '<button onclick="if(typeof mobDeleteMatchedCV===\'function\'){mobDeleteMatchedCV(\'' + sid + '\');window._patchToggle(\'matched\');}" ' +
              'style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:18px;cursor:pointer;">✕</button>' +
          '</div>' +
          '<div style="display:flex;gap:7px;">' +
            '<button onclick="if(typeof mobExportMatchedPDF===\'function\') mobExportMatchedPDF(\'' + sid + '\')" ' +
              'style="flex:1;padding:9px;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-size:12px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">📄 CV som PDF</button>' +
            (cv.jobUrl ? '<a href="' + cv.jobUrl + '" target="_blank" rel="noopener" style="padding:9px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);font-size:12px;font-weight:700;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;">↗</a>' : '') +
          '</div></div>';
      }).join('');
    }

    if (id === 'diary') {
      if (!diary.length) return _empty('Inga sökta arbeten', 'Matchade jobb sparas automatiskt här i 45 dagar');
      const unapplied = diary.filter(e => !e.applied);
      const applied   = diary.filter(e =>  e.applied);
      let html = '';
      if (unapplied.length) {
        html += '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(255,80,80,0.6);margin-bottom:8px;">⏳ Ej sökt (' + unapplied.length + ')</div>';
        html += unapplied.map(e => _diaryCard(e, diary.indexOf(e))).join('');
      }
      if (applied.length) {
        html += '<div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:rgba(62,180,137,0.6);margin:14px 0 8px;">✅ Sökt (' + applied.length + ')</div>';
        html += applied.map(e => _diaryCard(e, diary.indexOf(e))).join('');
      }
      html += '<button onclick="if(typeof diaryExport===\'function\') diaryExport()" style="width:100%;margin-top:8px;padding:11px;background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.25);color:#3eb489;font-size:12px;font-weight:700;border-radius:10px;cursor:pointer;font-family:inherit;">📋 Exportera aktivitetsrapport</button>';
      return html;
    }

    if (id === 'edu') {
      if (!savedEdu.length) return _empty('Inga sparade utbildningar', 'Gå till AI-SYV och tryck 🏷️ på en utbildning');
      return savedEdu.map(function (u, i) {
        return '<div style="background:rgba(240,192,64,0.06);border:1px solid rgba(240,192,64,0.18);border-radius:14px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;">' +
          '<div style="font-size:20px;flex-shrink:0;">🎓</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">' + u.namn + '</div>' +
            '<div style="font-size:11px;color:#f0c040;">' + u.typ + ' · ' + u.kommun + '</div>' +
            (u.info ? '<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-top:2px;">' + u.info + '</div>' : '') +
          '</div>' +
          '<button onclick="window._patchRemoveEdu(' + i + ')" style="background:none;border:none;color:rgba(255,255,255,0.2);font-size:16px;cursor:pointer;padding:0;">✕</button>' +
          '</div>';
      }).join('');
    }
    return '';
  }

  function _empty(title, sub) {
    return '<div style="text-align:center;padding:32px 16px;">' +
      '<div style="font-size:36px;margin-bottom:10px;">📭</div>' +
      '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.5);margin-bottom:6px;">' + title + '</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6;">' + sub + '</div></div>';
  }

  function _diaryCard(e, idx) {
    const dStr = new Date(e.savedAt).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    return '<div style="background:' + (e.applied ? 'rgba(62,180,137,0.05)' : 'rgba(255,80,80,0.04)') + ';' +
      'border:1.5px solid ' + (e.applied ? 'rgba(62,180,137,0.25)' : 'rgba(255,80,80,0.2)') + ';' +
      'border-radius:12px;padding:12px;margin-bottom:7px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
        '<div style="font-size:18px;">' + (e.applied ? '✅' : '⏳') + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:700;color:#fff;">' + e.jobTitle + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.35);">' + dStr + (e.company ? ' · ' + e.company : '') + '</div>' +
        '</div>' +
        (e.jobUrl ? '<a href="' + e.jobUrl + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="color:rgba(255,255,255,0.3);font-size:13px;text-decoration:none;padding:5px 9px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;">↗</a>' : '') +
      '</div>' +
      (!e.applied ? '<button onclick="if(typeof diaryMarkApplied===\'function\'){diaryMarkApplied(' + idx + ');window._patchToggle(\'diary\');}" ' +
        'style="width:100%;margin-top:10px;padding:10px;background:linear-gradient(135deg,#e85d26,#f0a040);border:none;color:#fff;font-size:13px;font-weight:800;border-radius:10px;cursor:pointer;font-family:inherit;">🚀 Ja! Jag sökte detta jobb</button>' : '') +
      '</div>';
  }


  // ════════════════════════════════════════════════
  // GLOBALA HELPERS
  // ════════════════════════════════════════════════
  window._patchToggle = function (id) {
    _activeSection = _activeSection === id ? null : id;
    renderProfileGrid();
    if (_activeSection) setTimeout(function () {
      const el = document.getElementById('profileSectionContent');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  window._patchRemoveEdu = function (idx) {
    try {
      const list = JSON.parse(localStorage.getItem('pf_saved_edu') || '[]');
      list.splice(idx, 1);
      localStorage.setItem('pf_saved_edu', JSON.stringify(list));
      window._patchToggle('edu');
    } catch(e) {}
  };


  // ════════════════════════════════════════════════
  // INIT
  // ════════════════════════════════════════════════
  window.addEventListener('load', function () {

    // Override: Profil-grid
    window.mobRenderSavedCVs = renderProfileGrid;

    // Steg 2-banner
    const resultsEl = document.getElementById('matchaSearchResults');
    if (resultsEl) new MutationObserver(injectStep2Banner).observe(resultsEl, { childList: true });

    // Override: matchaApplyTextForAd
    const _original = window.matchaApplyTextForAd;
    window.matchaApplyTextForAd = function (hitId, altIdx) {
      if (!isVIP() && matchedToday() >= 3) {
        showBlockModal();
        return;
      }
      _original(hitId, altIdx);
      setTimeout(function () {
        injectCounterBadge();
        if (document.getElementById('mobPanel-export') &&
            document.getElementById('mobPanel-export').classList.contains('mob-panel--active')) {
          renderProfileGrid();
        }
      }, 150);
    };

    // Override: mobSwitchTab
    const _origSwitch = window.mobSwitchTab;
    window.mobSwitchTab = function (tab) {
      if (_origSwitch) _origSwitch(tab);
      if (tab === 'export') setTimeout(renderProfileGrid, 100);
    };

    // Rendera direkt om Profil redan är aktiv
    const exportPanel = document.getElementById('mobPanel-export');
    if (exportPanel && exportPanel.classList.contains('mob-panel--active')) renderProfileGrid();

  });

})();
