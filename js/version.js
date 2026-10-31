/**
 * Kapka života — jediné místo s číslem verze aplikace.
 * Stejné číslo musí být v sw.js (APP_VERSION) a v ?v= odkazech v index.html
 * (hlídá test tests/version.test.js).
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 */
(function (global) {
  const APP_VERSION = '1.2.3';
  const PUBLIC_URL = 'https://holub5305-dotcom.github.io/kapka-zivota/';
  global.KapkaVersion = { APP_VERSION, PUBLIC_URL };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KapkaVersion;
})(typeof window !== 'undefined' ? window : globalThis);
