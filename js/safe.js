/**
 * Kapka života — bezpečnostní pomůcky (v1.2.8)
 *   - KapkaSafe.esc()      … escapování textu pro vložení do HTML (text i hodnoty atributů)
 *   - KapkaSafe.isSafeId() … povolený tvar id záznamu (^[A-Za-z0-9_-]{1,64}$)
 *   - ochrana proti vložení do cizí stránky (rámu): aplikace se v rámu nespustí
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 */
(function (global) {
  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
  }

  function isSafeId(v) {
    return typeof v === 'string' && ID_RE.test(v);
  }

  /* —— Ochrana proti vložení do rámu (clickjacking) ——
   * frame-ancestors nejde nastavit přes <meta>, proto kontrola ve skriptu.
   * Ve vlastním okně ani v nainstalované aplikaci se nic nemění. */
  let framed = false;
  try {
    framed = !!global.document && global.top !== global.self;
  } catch (e) {
    framed = !!global.document;
  }

  function showFramedNotice() {
    const doc = global.document;
    if (!doc || !doc.body) return;
    const direct = String(global.location.href).split('#')[0];
    while (doc.body.firstChild) doc.body.removeChild(doc.body.firstChild);
    const box = doc.createElement('main');
    box.className = 'framed-notice';
    box.style.maxWidth = '32rem';
    box.style.margin = '3rem auto';
    box.style.padding = '1.5rem';
    box.style.textAlign = 'center';
    const h = doc.createElement('h1');
    h.textContent = 'Kapka života';
    const p = doc.createElement('p');
    p.style.lineHeight = '1.5';
    p.textContent = 'Z bezpečnostních důvodů se aplikace nespouští uvnitř jiné webové stránky. Otevřete ji prosím přímo na oficiální adrese.';
    const a = doc.createElement('a');
    a.href = direct;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = 'btn btn-primary';
    a.textContent = 'Otevřít Kapku života';
    box.appendChild(h);
    box.appendChild(p);
    box.appendChild(a);
    doc.body.appendChild(box);
  }

  if (framed && global.document) {
    if (global.document.readyState === 'loading') global.document.addEventListener('DOMContentLoaded', showFramedNotice);
    else showFramedNotice();
  }

  global.KapkaSafe = { esc, isSafeId, framed, ID_RE };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KapkaSafe;
})(typeof window !== 'undefined' ? window : globalThis);
