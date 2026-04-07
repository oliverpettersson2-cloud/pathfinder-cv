// cvmatchen-patch.js
// Lägg till EN rad precis innan </body> i index.html:
// <script src="cvmatchen-patch.js"></script>

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

  window.addEventListener('load', function () {

    const _original = window.matchaApplyTextForAd;

    window.matchaApplyTextForAd = function (hitId, altIdx) {

      // Blocka BARA icke-VIP vid 3/dag
      if (!isVIP() && matchedToday() >= 3) {
        if (typeof showToast === 'function') {
          showToast('⚠️ Max 3 CV-matcher per dag — prova igen imorgon!', 'error');
        }
        return;
      }

      // Kör originalet
      _original(hitId, altIdx);

      // Injicera räknarbadgen efter att success-rutan ritats
      setTimeout(function () {
        const count = Math.min(matchedToday(), 3);
        const left  = 3 - count;

        // Hitta "Profiltext sparad!"-textnoden
        document.querySelectorAll('*').forEach(function (el) {
          if (el.childElementCount === 0 && el.textContent.trim() === 'Profiltext sparad!') {
            // Kolla att badge inte redan finns
            if (el.parentNode.querySelector('.cv-dagsgrans')) return;

            const badge = document.createElement('div');
            badge.className = 'cv-dagsgrans';
            badge.style.cssText =
              'display:inline-flex;align-items:center;gap:8px;' +
              'background:rgba(62,180,137,0.12);border:1.5px solid rgba(62,180,137,0.35);' +
              'border-radius:20px;padding:5px 14px;margin-bottom:10px;';

            const vip = isVIP();
            badge.innerHTML =
              '<span style="font-size:16px;font-weight:900;color:#3eb489;">CV ' + count + '/3</span>' +
              '<span style="font-size:11px;color:rgba(255,255,255,0.45);">' +
              (vip
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
