// cvmatchen-patch.js
// Lägg till <script src="cvmatchen-patch.js"></script> precis innan </body> i index.html

(function () {

  // ── VIP: ingen gräns ─────────────────────────────
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


  // ── Override: matchaApplyTextForAd ───────────────
  // Väntar tills originalfunktionen finns, sedan ersätter vi den
  window.addEventListener('load', function () {

    const _original = window.matchaApplyTextForAd;

    window.matchaApplyTextForAd = function (hitId, altIdx) {

      // Stoppa vanliga användare vid 3/dag
      if (!isVIP() && matchedToday() >= 3) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Max 3 CV-matcher per dag — prova igen imorgon!', 'error');
        }
        return;
      }

      // Annars kör originalet
      _original(hitId, altIdx);

      // Lägg till räknare i success-rutan (om den finns)
      setTimeout(function () {
        const successTitles = document.querySelectorAll('[style*="Profiltext sparad"]');
        successTitles.forEach(function (el) {
          // Lägg inte till räknaren om VIP eller om den redan finns
          if (isVIP()) return;
          if (el.previousElementSibling && el.previousElementSibling.classList.contains('cv-counter')) return;

          const count = Math.min(matchedToday(), 3);
          const badge = document.createElement('div');
          badge.className = 'cv-counter';
          badge.style.cssText =
            'display:inline-flex;align-items:center;gap:8px;' +
            'background:rgba(62,180,137,0.12);border:1.5px solid rgba(62,180,137,0.35);' +
            'border-radius:20px;padding:7px 18px;margin-bottom:14px;';
          badge.innerHTML =
            '<span style="font-size:20px;font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
            '<span style="font-size:11px;color:rgba(255,255,255,0.45);">matcher idag</span>';

          el.parentNode.insertBefore(badge, el);
        });
      }, 100);
    };

  });

})();
