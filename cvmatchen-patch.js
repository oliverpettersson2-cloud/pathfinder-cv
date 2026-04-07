// cvmatchen-patch.js
// <script src="cvmatchen-patch.js"></script> precis innan </body>

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

  // ── Modal: dagsgräns nådd ─────────────────────────
  function showLimitModal() {
    const existing = document.getElementById('limitModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'limitModal';
    modal.style.cssText =
      'position:fixed;inset:0;z-index:99999;display:flex;align-items:flex-end;' +
      'justify-content:center;background:rgba(0,0,0,0.6);padding:20px;';
    modal.innerHTML =
      '<div style="background:#1e2440;border-radius:20px 20px 0 0;padding:28px 24px 44px;' +
      'width:100%;max-width:480px;border-top:3px solid #e85d26;' +
      'box-shadow:0 -8px 40px rgba(0,0,0,0.5);">' +
        '<div style="font-size:40px;text-align:center;margin-bottom:12px;">🌙</div>' +
        '<div style="font-size:18px;font-weight:900;color:#fff;text-align:center;margin-bottom:8px;">' +
          'Du har matchat 3 CV idag' +
        '</div>' +
        '<div style="font-size:13px;color:rgba(255,255,255,0.5);text-align:center;' +
        'line-height:1.7;margin-bottom:24px;">' +
          'Gränsen är 3 matcher per dygn.<br>' +
          'Kom tillbaka imorgon och matcha nya jobb! 💪' +
        '</div>' +
        '<button id="limitModalClose" style="width:100%;padding:14px;background:#e85d26;' +
        'border:none;color:#fff;font-size:15px;font-weight:800;border-radius:12px;' +
        'cursor:pointer;font-family:inherit;">' +
          'Okej, ses imorgon! 👋' +
        '</button>' +
      '</div>';

    document.body.appendChild(modal);
    document.getElementById('limitModalClose').onclick = function () { modal.remove(); };
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }


  // ── Steg 2: instruktionsbanner ───────────────────
  function injectStep2Banner() {
    const resultsEl = document.getElementById('matchaSearchResults');
    if (!resultsEl || resultsEl.querySelector('.step2-banner')) return;
    if (!resultsEl.children.length) return;

    const banner = document.createElement('div');
    banner.className = 'step2-banner';
    banner.style.cssText =
      'display:flex;align-items:center;gap:10px;' +
      'background:rgba(240,192,64,0.08);border:1.5px solid rgba(240,192,64,0.25);' +
      'border-radius:12px;padding:10px 14px;margin-bottom:10px;';
    banner.innerHTML =
      '<span style="font-size:18px;">👆</span>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">' +
        '<strong style="color:#f0c040;">Tryck på en annons</strong> för att öppna den — ' +
        'sedan <strong style="color:#f0c040;">✨ Matcha mot CV</strong> för att få din profiltext.' +
      '</div>';

    resultsEl.insertBefore(banner, resultsEl.firstChild);
  }


  // ── Kompakt räknarbadge i success-rutan ──────────
  function injectCounterBadge() {
    const count = Math.min(matchedToday(), 3);
    const left  = 3 - count;

    document.querySelectorAll('*').forEach(function (el) {
      if (el.childElementCount === 0 && el.textContent.trim() === 'Profiltext sparad!') {
        if (el.parentNode.querySelector('.cv-dagsgrans')) return;

        const badge = document.createElement('div');
        badge.className = 'cv-dagsgrans';
        badge.style.cssText =
          'display:inline-flex;align-items:center;gap:6px;' +
          'background:rgba(62,180,137,0.1);border:1px solid rgba(62,180,137,0.25);' +
          'border-radius:20px;padding:3px 10px;margin-bottom:8px;font-size:12px;';
        badge.innerHTML =
          '<span style="font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
          '<span style="color:rgba(255,255,255,0.4);">·</span>' +
          '<span style="color:rgba(255,255,255,0.45);">' +
          (isVIP()
            ? 'VIP 👑'
            : left > 0
              ? left + ' kvar idag'
              : 'inga kvar idag'
          ) + '</span>';

        el.parentNode.insertBefore(badge, el);
      }
    });
  }


  // ── Init ─────────────────────────────────────────
  window.addEventListener('load', function () {

    // Observera steg 2-resultat
    const resultsEl = document.getElementById('matchaSearchResults');
    if (resultsEl) {
      new MutationObserver(injectStep2Banner).observe(resultsEl, { childList: true });
    }

    // Override matchaApplyTextForAd
    const _original = window.matchaApplyTextForAd;

    window.matchaApplyTextForAd = function (hitId, altIdx) {
      if (!isVIP() && matchedToday() >= 3) {
        showLimitModal();
        return;
      }
      _original(hitId, altIdx);
      setTimeout(injectCounterBadge, 150);
    };

  });

})();
