/* Hlídá, že číslo verze je všude stejné (version.js, sw.js, index.html ?v=). */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const { APP_VERSION, PUBLIC_URL } = require(path.join(root, 'js/version.js'));
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
assert.strictEqual(PUBLIC_URL, 'https://holub5305-dotcom.github.io/kapka-zivota/');
const swV = (sw.match(/const APP_VERSION = '([^']+)'/) || [])[1];
assert.strictEqual(swV, APP_VERSION, 'sw.js APP_VERSION');
const vs = [...html.matchAll(/\?v=([^"']+)/g)].map((m) => m[1]);
assert.ok(vs.length >= 10, 'index.html má ?v= odkazy');
vs.forEach((v) => assert.strictEqual(v, APP_VERSION, 'index.html ?v=' + v));
// každý skript/CSS z index.html musí být v PRECACHE
const assets = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"?]+)\?v=/g)].map((m) => m[1]);
assets.forEach((a) => assert.ok(sw.includes("'./" + a + "' + V"), 'precache ' + a));
['share/qr-kapka-zivota.svg', 'share/qr-kapka-zivota.png', 'share/letak.html', 'share/letak-kapka-zivota.pdf'].forEach((f) => {
  assert.ok(fs.existsSync(path.join(root, f)), 'existuje ' + f);
  assert.ok(sw.includes("'./" + f + "'"), 'precache ' + f);
});
assert.ok(html.includes('<meta name="author" content="Vladimír Holub"'), 'meta author');
console.log('version.test.js OK (' + APP_VERSION + ', ' + vs.length + ' odkazů, ' + assets.length + ' assetů)');
