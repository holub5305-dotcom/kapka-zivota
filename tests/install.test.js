/* Testy průvodce instalací (js/install.js) — rozpoznání prohlížeče a obsah návodů. */
const assert = require('assert');
global.window = { KapkaVersion: { PUBLIC_URL: 'https://holub5305-dotcom.github.io/kapka-zivota/' } };
require('../js/install.js');
const K = window.KapkaInstall;

const UA = {
  chrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  edge: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 EdgA/130.0.0.0',
  firefox: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  opera: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 OPR/85.0.0.0',
  mi: 'Mozilla/5.0 (Linux; U; Android 13; cs-cz; 23053RN02Y Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/112.0.5615.136 Mobile Safari/537.36 XiaoMi/MiuiBrowser/14.10.1-gn',
  ddg: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile DuckDuckGo/5 Safari/537.36',
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  iosChromeOld: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/116.0 Mobile/15E148 Safari/604.1',
  iosEdge: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/126.0 Mobile/15E148 Safari/605.1.15',
  iosFx: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/129.0 Mobile/15E148 Safari/605.1.15',
  fbAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-A546B Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/487.0.0.53.79;]',
  msgAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/480.0.0.40.109;]',
  igIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 354.0.0.30.80 (iPhone15,2; iOS 18_1; cs_CZ)',
  tiktok: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 trill_350000 BytedanceWebview/d8a21c6',
  unknownWv: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36',
  iosWebview: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
  dChrome: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  dEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  dFx: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  dSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
};
const k = (ua, env) => K.detect(ua, env).kind;
const cases = [
  [UA.chrome, {}, 'android-chrome'],
  [UA.chrome, { isBrave: true }, 'android-brave'],
  [UA.samsung, {}, 'android-samsung'],
  [UA.edge, {}, 'android-edge'],
  [UA.firefox, {}, 'android-firefox'],
  [UA.opera, {}, 'android-opera'],
  [UA.mi, {}, 'android-mi'],
  [UA.ddg, {}, 'android-duckduckgo'],
  [UA.iosSafari, {}, 'ios-safari'],
  [UA.ipad, { maxTouchPoints: 5 }, 'ios-safari'],
  [UA.iosChrome, {}, 'ios-chrome'],
  [UA.iosChromeOld, {}, 'ios-chrome'],
  [UA.iosEdge, {}, 'ios-edge'],
  [UA.iosFx, {}, 'ios-firefox'],
  [UA.fbAndroid, {}, 'inapp-android'],
  [UA.msgAndroid, {}, 'inapp-android'],
  [UA.igIos, {}, 'inapp-ios'],
  [UA.tiktok, {}, 'inapp-android'],
  [UA.unknownWv, {}, 'inapp-android'],
  [UA.iosWebview, {}, 'inapp-ios'],
  [UA.dChrome, {}, 'desktop-chrome'],
  [UA.dChrome, { isBrave: true }, 'desktop-brave'],
  [UA.dEdge, {}, 'desktop-edge'],
  [UA.dFx, {}, 'desktop-firefox'],
  [UA.dSafari, {}, 'desktop-safari'],
  ['', {}, 'other']
];
for (const [ua, env, exp] of cases) assert.strictEqual(k(ua, env), exp, ua + ' → ' + exp);

assert.strictEqual(K.detect(UA.fbAndroid).inApp, 'Facebook');
assert.strictEqual(K.detect(UA.msgAndroid).inApp, 'Messenger');
assert.strictEqual(K.detect(UA.igIos).inApp, 'Instagram');
assert.strictEqual(K.detect(UA.tiktok).inApp, 'TikTok');
assert.ok(Math.abs(K.detect(UA.iosChromeOld).iosVersion - 15.07) < 1e-9);
assert.ok(K.detect(UA.ipad, { maxTouchPoints: 5 }).iosVersion >= 18);

// každý druh: max 4 kroky, každý krok jedna věta s ikonou, CZ i EN názvy, závěr „Hotovo!“
const allKinds = K.SWITCH_GROUPS.flatMap((g) => g[1]).concat(['other']);
for (const kind of allKinds) {
  const g = K.guide(kind, {});
  assert.ok(g.steps.length >= 1 && g.steps.length <= 4, kind + ' počet kroků');
  for (const s of g.steps) assert.ok(s.ico, kind + ' ikona');
  for (const s of g.src) assert.ok(K.SOURCES[s], kind + ' zdroj ' + s);
  const html = K.renderGuide(kind, {});
  assert.ok(html.includes('data-guide="' + kind + '"'));
  assert.ok(html.includes('Mám jiný prohlížeč'));
  if (!kind.startsWith('inapp')) assert.ok(html.includes('Hotovo!</b> Kapku života najdete na ploše.'), kind + ' hotovo');
  assert.ok(!/<img[^>]+src="http/.test(html), 'žádné externí obrázky');
}
const has = (kind, s, info) => K.renderGuide(kind, { info: info || {} }).includes(s);
assert.ok(has('android-chrome', 'Nainstalovat aplikaci') && has('android-chrome', '/ Install app'));
assert.ok(has('android-samsung', 'Add page to') && has('android-samsung', '≡'));
assert.ok(has('ios-safari', 'Přidat na plochu') && has('ios-safari', 'Add to Home Screen') && has('ios-safari', '/ Share'));
assert.ok(has('ios-safari', 'vlastní úložiště'));
assert.ok(has('ios-chrome', 'Add to Home Screen', { iosVersion: 18.01 }));
assert.ok(has('ios-chrome', 'Safari', { iosVersion: 15.07 }) && has('ios-chrome', 'data-copy-link', { iosVersion: 15.07 }));
assert.ok(has('inapp-android', 'Open in browser') && has('inapp-android', 'data-copy-link') && has('inapp-android', 'data-open-chrome'));
assert.ok(has('inapp-ios', 'Open in Safari') && !has('inapp-ios', 'data-open-chrome'));
assert.ok(has('inapp-android', 'aplikace Facebook', { inApp: 'Facebook' }));
// BIP: ruční kroky schované v <details>
assert.ok(K.renderGuide('android-chrome', { bip: true }).includes('<details class="inst-manual">'));

// intent:// jen na pevnou veřejnou adresu, s návratem na https
const iu = K.intentUrl();
assert.strictEqual(
  iu,
  'intent://holub5305-dotcom.github.io/kapka-zivota/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fholub5305-dotcom.github.io%2Fkapka-zivota%2F;end'
);
console.log('install.test.js OK (' + cases.length + ' UA)');
