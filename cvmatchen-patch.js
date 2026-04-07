// cvmatchen-patch.js
// <script src="cvmatchen-patch.js"></script> precis innan </body>

(function () {

  // ── VIP + dagsgräns ──────────────────────────────
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


  // ── Tydligare steg 2: instruktionsbanner ─────────
  // Körs varje gång sökresultat visas
  function injectStep2Banner() {
    const resultsEl = document.getElementById('matchaSearchResults');
    if (!resultsEl) return;

    // Lägg inte till bannern två gånger
    if (resultsEl.querySelector('.step2-banner')) return;
    if (!resultsEl.children.length) return;

    const banner = document.createElement('div');
    banner.className = 'step2-banner';
    banner.style.cssText =
      'display:flex;align-items:flex-start;gap:10px;' +
      'background:rgba(240,192,64,0.1);border:1.5px solid rgba(240,192,64,0.3);' +
      'border-radius:12px;padding:12px 14px;margin-bottom:12px;';
    banner.innerHTML =
      '<span style="font-size:20px;flex-shrink:0;">👆</span>' +
      '<div>' +
        '<div style="font-size:13px;font-weight:800;color:#f0c040;margin-bottom:3px;">' +
          'Välj en annons att matcha ditt CV mot' +
        '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.5);line-height:1.5;">' +
          'Tryck på en annons för att öppna den — sedan trycker du på ' +
          '<strong style="color:#f0c040;">✨ Matcha mot CV</strong> för att AI:n ska skriva din profiltext.' +
        '</div>' +
      '</div>';

    // Sätt in bannern överst i resultatlistan
    resultsEl.insertBefore(banner, resultsEl.firstChild);
  }

  // Observera när sökresultat ändras och injicera bannern
  window.addEventListener('load', function () {

    const resultsEl = document.getElementById('matchaSearchResults');
    if (resultsEl) {
      const observer = new MutationObserver(function () {
        injectStep2Banner();
      });
      observer.observe(resultsEl, { childList: true, subtree: false });
    }

    // ── Override: matchaApplyTextForAd ─────────────
    const _original = window.matchaApplyTextForAd;

    window.matchaApplyTextForAd = function (hitId, altIdx) {

      // Blocka icke-VIP vid 3/dag
      if (!isVIP() && matchedToday() >= 3) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Max 3 CV-matcher per dag — prova igen imorgon!', 'error');
        }
        return;
      }

      _original(hitId, altIdx);

      // Räknarbadge i success-rutan
      setTimeout(function () {
        const count = Math.min(matchedToday(), 3);
        const left  = 3 - count;

        document.querySelectorAll('*').forEach(function (el) {
          if (el.childElementCount === 0 && el.textContent.trim() === 'Profiltext sparad!') {
            if (el.parentNode.querySelector('.cv-dagsgrans')) return;

            const badge = document.createElement('div');
            badge.className = 'cv-dagsgrans';
            badge.style.cssText =
              'display:inline-flex;align-items:center;gap:8px;' +
              'background:rgba(62,180,137,0.12);border:1.5px solid rgba(62,180,137,0.35);' +
              'border-radius:20px;padding:5px 14px;margin-bottom:10px;';
            badge.innerHTML =
              '<span style="font-size:16px;font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
              '<span style="font-size:11px;color:rgba(255,255,255,0.45);">' +
              (isVIP()
                ? 'matcher idag (VIP 👑)'
                : left > 0
                  ? left + ' matcher kvar idag'
                  : 'inga matcher kvar idag'
              ) +
              '</span>';

            el.parentNode.insertBefore(badge, el);
          }
        });
      }, 150);
    };

  });

})();
