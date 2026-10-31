/**
 * Kapka života — sdílení aplikace.
 * Sdílí se VÝHRADNĚ veřejná adresa aplikace a krátký pevný text.
 * Nikdy se nesdílí žádná data z deníku, připomínek ani nastavení
 * a do adresy se nepřidávají žádné sledovací parametry.
 */
(function (global) {
  const PUBLIC_URL = (global.KapkaVersion && global.KapkaVersion.PUBLIC_URL) || 'https://holub5305-dotcom.github.io/kapka-zivota/';

  function payload() {
    return {
      title: 'Kapka života',
      text: 'Kapka života – bezplatná česká aplikace pro dárce krve a plazmy. Zdarma, bez reklam a bez registrace.',
      url: PUBLIC_URL
    };
  }

  function toast(msg) {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('kapka-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'kapka-toast';
      el.className = 'kapka-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      el.hidden = true;
    }, 3500);
  }

  function legacyCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand && document.execCommand('copy');
      ta.remove();
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  async function copyLink() {
    let ok = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(PUBLIC_URL);
        ok = true;
      }
    } catch (e) {
      ok = false;
    }
    if (!ok) ok = legacyCopy(PUBLIC_URL);
    if (ok) toast('Odkaz zkopírován: ' + PUBLIC_URL);
    else toast('Kopírování se nepodařilo. Odkaz: ' + PUBLIC_URL);
    return ok;
  }

  async function shareApp() {
    const data = payload();
    if (navigator.share) {
      try {
        if (!navigator.canShare || navigator.canShare(data)) {
          await navigator.share(data);
          return 'shared';
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
        // jiná chyba → záložně zkopírovat odkaz
      }
    }
    const ok = await copyLink();
    return ok ? 'copied' : 'failed';
  }

  global.KapkaShare = { PUBLIC_URL, payload, shareApp, copyLink, toast };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KapkaShare;
})(typeof window !== 'undefined' ? window : globalThis);
