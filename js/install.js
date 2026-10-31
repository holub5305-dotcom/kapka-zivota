/*
 * Kapka života — průvodce instalací na plochu podle zařízení a prohlížeče.
 * Rozpoznání probíhá jen v zařízení (user-agent + dostupné funkce), nic se neukládá ani neodesílá.
 * Postupy vycházejí z oficiální nápovědy prohlížečů (viz SOURCES); kde se názvy položek
 * v různých verzích liší, jsou formulované obecně a česky i anglicky.
 */
(function (global) {
  const PUBLIC_URL =
    (global.KapkaVersion && global.KapkaVersion.PUBLIC_URL) || 'https://holub5305-dotcom.github.io/kapka-zivota/';

  const SOURCES = {
    chromeAndroid: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid',
    chromeIos: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DiOS',
    chromeDesktop: 'https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DDesktop',
    apple: 'https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios',
    appleMac: 'https://support.apple.com/guide/safari/use-safari-web-apps-ibrw9e991864/mac',
    webkit164: 'https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/',
    samsung: 'https://developer.samsung.com/internet/android/web-developer-guide.html',
    brave: 'https://support.brave.app/hc/en-us/articles/39077114659597',
    firefox: 'https://support.mozilla.org/kb/use-web-apps-firefox-android',
    edge: 'https://learn.microsoft.com/microsoft-edge/progressive-web-apps/ux',
    opera: 'https://help.opera.com/en/mobile/android/',
    facebook: 'https://www.facebook.com/help/289776536190480',
    intents: 'https://developer.chrome.com/docs/android/intents'
  };

  const NAMES = {
    'android-chrome': 'Chrome (Android)',
    'android-samsung': 'Samsung Internet',
    'android-brave': 'Brave (Android)',
    'android-edge': 'Microsoft Edge (Android)',
    'android-firefox': 'Firefox (Android)',
    'android-opera': 'Opera (Android)',
    'android-mi': 'Mi Browser / Xiaomi (Redmi, POCO)',
    'android-duckduckgo': 'DuckDuckGo (Android)',
    'android-other': 'Jiný prohlížeč (Android)',
    'ios-safari': 'Safari (iPhone / iPad)',
    'ios-chrome': 'Chrome (iPhone / iPad)',
    'ios-edge': 'Microsoft Edge (iPhone / iPad)',
    'ios-firefox': 'Firefox (iPhone / iPad)',
    'ios-other': 'Jiný prohlížeč (iPhone / iPad)',
    'inapp-android': 'Prohlížeč uvnitř aplikace (Android)',
    'inapp-ios': 'Prohlížeč uvnitř aplikace (iPhone / iPad)',
    'desktop-chrome': 'Chrome (počítač)',
    'desktop-edge': 'Microsoft Edge (počítač)',
    'desktop-brave': 'Brave (počítač)',
    'desktop-firefox': 'Firefox (počítač)',
    'desktop-safari': 'Safari (Mac)',
    other: 'Jiný prohlížeč'
  };

  const SWITCH_GROUPS = [
    ['Android', ['android-chrome', 'android-samsung', 'android-brave', 'android-edge', 'android-firefox', 'android-opera', 'android-mi', 'android-duckduckgo', 'android-other']],
    ['iPhone / iPad', ['ios-safari', 'ios-chrome', 'ios-edge', 'ios-firefox', 'ios-other']],
    ['Odkaz otevřený v aplikaci (Facebook, Messenger, Instagram…)', ['inapp-android', 'inapp-ios']],
    ['Počítač', ['desktop-chrome', 'desktop-edge', 'desktop-brave', 'desktop-firefox', 'desktop-safari']]
  ];

  const INAPP = [
    ['Messenger', /Messenger|Orca-Android|MessengerForiOS|MessengerLite/i],
    ['Instagram', /Instagram/i],
    ['Facebook', /FBAN|FBAV|FB_IAB|FB4A|FBIOS|\[FB/i],
    ['TikTok', /musical_ly|TikTok|BytedanceWebview|trill_/i],
    ['WhatsApp', /WhatsApp/i],
    ['Snapchat', /Snapchat/i],
    ['LinkedIn', /LinkedInApp/i],
    ['X (Twitter)', /Twitter(?:Android)?\//i],
    ['LINE', /\bLine\//],
    ['Gmail', /GmailApp|Gmail\//i],
    ['Google', /\bGSA\//]
  ];

  /**
   * Čistá funkce: z user-agentu a dostupných funkcí určí platformu a prohlížeč.
   * env: { maxTouchPoints, isBrave }
   */
  function detect(ua, env) {
    ua = ua || '';
    env = env || {};
    const r = { os: 'desktop', browser: 'other', inApp: null, iosVersion: null, kind: 'other' };
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (env.maxTouchPoints || 0) > 1);
    const isAndroid = !isIOS && /Android/i.test(ua);
    if (isIOS) {
      r.os = 'ios';
      const m = ua.match(/OS (\d+)[_.](\d+)/) || ua.match(/Version\/(\d+)\.(\d+)/);
      if (m) r.iosVersion = parseInt(m[1], 10) + parseInt(m[2], 10) / 100;
    } else if (isAndroid) r.os = 'android';

    if (r.os !== 'desktop') {
      for (const [name, re] of INAPP) {
        if (re.test(ua)) {
          r.inApp = name;
          break;
        }
      }
    }

    if (r.os === 'ios') {
      if (r.inApp) r.browser = 'inapp';
      else if (/CriOS/i.test(ua)) r.browser = 'chrome';
      else if (/EdgiOS/i.test(ua)) r.browser = 'edge';
      else if (/FxiOS/i.test(ua)) r.browser = 'firefox';
      else if (/OPiOS|OPT\/|DuckDuckGo|Brave|YaBrowser/i.test(ua)) r.browser = 'other';
      else if (/Safari\//i.test(ua) && /Version\//i.test(ua)) r.browser = 'safari';
      else {
        // WebKit bez značky Safari = vestavěný prohlížeč jiné aplikace
        r.browser = 'inapp';
        r.inApp = r.inApp || '';
      }
    } else if (r.os === 'android') {
      if (r.inApp) r.browser = 'inapp';
      else if (/SamsungBrowser/i.test(ua)) r.browser = 'samsung';
      else if (/MiuiBrowser|XiaoMi\//i.test(ua)) r.browser = 'mi';
      else if (/DuckDuckGo/i.test(ua)) r.browser = 'duckduckgo';
      else if (/EdgA\//i.test(ua)) r.browser = 'edge';
      else if (/OPR\/|OPX\/|Opera/i.test(ua)) r.browser = 'opera';
      else if (/Firefox\/|FxAndroid/i.test(ua)) r.browser = 'firefox';
      else if (env.isBrave) r.browser = 'brave';
      else if (/; wv\)/.test(ua)) {
        r.browser = 'inapp';
        r.inApp = '';
      } else if (/HuaweiBrowser|HeyTapBrowser|YaBrowser|Vivaldi|UCBrowser|OPPOBrowser|VivoBrowser/i.test(ua)) r.browser = 'other';
      else if (/Chrome\//i.test(ua)) r.browser = 'chrome';
    } else {
      if (/Edg\//i.test(ua)) r.browser = 'edge';
      else if (/Firefox\//i.test(ua)) r.browser = 'firefox';
      else if (env.isBrave) r.browser = 'brave';
      else if (/OPR\//i.test(ua)) r.browser = 'other';
      else if (/Chrome\//i.test(ua)) r.browser = 'chrome';
      else if (/Safari\//i.test(ua)) r.browser = 'safari';
    }
    if (r.browser === 'inapp') r.kind = r.os === 'ios' ? 'inapp-ios' : 'inapp-android';
    else r.kind = NAMES[r.os + '-' + r.browser] ? r.os + '-' + r.browser : r.os === 'desktop' ? 'other' : r.os + '-other';
    return r;
  }

  // ---------- vlastní ikony (žádná loga prohlížečů) ----------
  const S = (p) =>
    `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICO = {
    dots: S('<circle cx="12" cy="5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="19" r="1.6" fill="currentColor"/>'),
    dotsh: S('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>'),
    burger: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
    share: S('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 11H5v10h14V11h-2"/>'),
    plus: S('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>'),
    install: S('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/><path d="M10.5 18.5h3"/>'),
    check: S('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
    toggle: S('<rect x="3" y="7" width="18" height="10" rx="5"/><circle cx="16" cy="12" r="3" fill="currentColor"/>'),
    open: S('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
    copy: S('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
    monitor: S('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 7v5M9.5 9.5 12 12l2.5-2.5M8 20h8"/>'),
    info: S('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>')
  };

  const L = (cz, en) => `<b>„${cz}“</b>${en ? ` <span class="inst-en" lang="en">/ ${en}</span>` : ''}`;

  function intentUrl() {
    const u = new URL(PUBLIC_URL);
    return (
      'intent://' + u.host + u.pathname + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' +
      encodeURIComponent(PUBLIC_URL) + ';end'
    );
  }

  const ANDROID_NOTE = {
    ico: 'info',
    html: 'Ikona se neobjevila? Některé telefony (např. Xiaomi, Redmi, POCO) vyžadují, aby měl prohlížeč povolené oprávnění ' +
      L('Zástupci na ploše', 'Home screen shortcuts') + ' v Nastavení → Aplikace.'
  };
  const IOS_NOTE = {
    ico: 'info',
    html: 'Na iPhonu a iPadu má aplikace na ploše vlastní úložiště. Své záznamy z prohlížeče do ní přenesete přes Více → Export a obnova.'
  };

  function iosShareSteps(where) {
    return [
      { ico: 'share', html: 'Klepněte na ' + L('Sdílet', 'Share') + ' ' + where + '.' },
      { ico: 'plus', html: 'Sjeďte níž a zvolte ' + L('Přidat na plochu', 'Add to Home Screen') + '.' },
      { ico: 'check', html: 'Klepněte na ' + L('Přidat', 'Add') + '.' }
    ];
  }

  /** Vrátí popis návodu pro daný druh prohlížeče. */
  function guide(kind, info) {
    info = info || {};
    const app = info.inApp ? info.inApp : '';
    const iosOld = info.iosVersion && info.iosVersion < 16.4;
    switch (kind) {
      case 'android-chrome':
        return {
          src: ['chromeAndroid'],
          steps: [
            { ico: 'dots', html: 'Klepněte na menu <b>⋮</b> vpravo nahoře.' },
            { ico: 'install', html: 'Zvolte ' + L('Nainstalovat aplikaci', 'Install app') + ' nebo ' + L('Přidat na plochu', 'Add to Home screen') + '.' },
            { ico: 'check', html: 'Potvrďte klepnutím na ' + L('Nainstalovat', 'Install') + '.' }
          ],
          notes: [ANDROID_NOTE]
        };
      case 'android-brave':
        return {
          src: ['brave'],
          steps: [
            { ico: 'dots', html: 'Klepněte na menu <b>⋮</b> (nahoře nebo dole na liště).' },
            { ico: 'install', html: 'Zvolte ' + L('Nainstalovat aplikaci', 'Install app') + ' nebo ' + L('Přidat na plochu', 'Add to Home screen') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Nainstalovat', 'Install') + ' nebo ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [ANDROID_NOTE]
        };
      case 'android-samsung':
        return {
          src: ['samsung'],
          steps: [
            { ico: 'burger', html: 'Klepněte na menu <b>≡</b> vpravo dole.' },
            { ico: 'plus', html: 'Zvolte ' + L('Přidat stránku do', 'Add page to') + ' a pak ' + L('Domovská obrazovka', 'Home screen') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [
            { ico: 'info', html: 'Vidíte v adresním řádku ikonu se šipkou nebo plusem? Můžete klepnout přímo na ni.' },
            ANDROID_NOTE
          ]
        };
      case 'android-edge':
        return {
          src: ['edge'],
          steps: [
            { ico: 'burger', html: 'Klepněte na menu dole (<b>≡</b> nebo <b>⋯</b>).' },
            { ico: 'install', html: 'Zvolte ' + L('Přidat do telefonu', 'Add to phone') + ' nebo ' + L('Nainstalovat aplikaci', 'Install app') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Nainstalovat', 'Install') + ' nebo ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [ANDROID_NOTE]
        };
      case 'android-firefox':
        return {
          src: ['firefox'],
          steps: [
            { ico: 'dots', html: 'Klepněte na menu <b>⋮</b>.' },
            { ico: 'plus', html: 'Zvolte ' + L('Přidat na plochu', 'Add to Home screen') + ' (ve starších verzích ' + L('Instalovat', 'Install') + ').' },
            { ico: 'check', html: 'Potvrďte ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [ANDROID_NOTE]
        };
      case 'android-opera':
        return {
          src: ['opera'],
          steps: [
            { ico: 'dots', html: 'Klepněte na menu <b>⋮</b> vpravo v adresním řádku.' },
            { ico: 'plus', html: 'Zvolte ' + L('Přidat do…', 'Add to…') + ' a pak ' + L('Plocha', 'Home screen') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [ANDROID_NOTE]
        };
      case 'android-mi':
      case 'android-duckduckgo':
      case 'android-other':
        return {
          src: ['chromeAndroid'],
          steps: [
            { ico: 'dots', html: 'Otevřete menu prohlížeče (<b>⋮</b>, <b>⋯</b> nebo <b>≡</b>).' },
            { ico: 'plus', html: 'Zvolte ' + L('Přidat na plochu', 'Add to Home screen') + ' nebo ' + L('Nainstalovat aplikaci', 'Install app') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [
            { ico: 'info', html: 'Názvy položek se v tomto prohlížeči liší podle verze. Když volbu nenajdete, otevřete Kapku v Chrome – tam to jde nejsnáz.' },
            ANDROID_NOTE
          ],
          actions: ['chrome', 'copy']
        };
      case 'ios-safari':
        return {
          src: ['apple'],
          steps: [
            { ico: 'share', html: 'Klepněte na ' + L('Sdílet', 'Share') + ' (čtvereček se šipkou). Nevidíte ho? Klepněte nejdřív na <b>⋯</b>.' },
            { ico: 'plus', html: 'Sjeďte níž a zvolte ' + L('Přidat na plochu', 'Add to Home Screen') + '.' },
            { ico: 'toggle', html: 'Pokud se ukáže ' + L('Otevřít jako webovou aplikaci', 'Open as Web App') + ', nechte ji zapnutou.' },
            { ico: 'check', html: 'Klepněte na ' + L('Přidat', 'Add') + '.' }
          ],
          notes: [IOS_NOTE]
        };
      case 'ios-chrome':
      case 'ios-edge':
      case 'ios-firefox':
      case 'ios-other':
        if (iosOld) {
          return {
            src: ['apple', 'webkit164'],
            title: 'Na této verzi iOS přidáte Kapku na plochu jen ze Safari.',
            steps: [
              { ico: 'copy', html: 'Zkopírujte odkaz tlačítkem níže.' },
              { ico: 'globe', html: 'Otevřete Safari a odkaz vložte do adresního řádku.' },
              { ico: 'share', html: 'V Safari klepněte na ' + L('Sdílet', 'Share') + ' a zvolte ' + L('Přidat na plochu', 'Add to Home Screen') + '.' }
            ],
            notes: [IOS_NOTE],
            actions: ['copy']
          };
        }
        return {
          src: kind === 'ios-chrome' ? ['chromeIos', 'webkit164'] : ['webkit164', 'apple'],
          steps: iosShareSteps(
            kind === 'ios-chrome'
              ? 'vpravo v adresním řádku'
              : '(v adresním řádku nebo v menu <b>⋯</b> / <b>≡</b>)'
          ),
          notes: [
            { ico: 'info', html: 'Volba chybí? Funguje od iOS 16.4. Jinak zkopírujte odkaz a otevřete ho v Safari.' },
            IOS_NOTE
          ],
          actions: ['copy']
        };
      case 'inapp-android':
        return {
          src: ['facebook', 'intents'],
          title:
            (app ? 'Stránka je otevřená uvnitř aplikace ' + app + '.' : 'Stránka je otevřená uvnitř jiné aplikace.') +
            ' Odtud instalace nejde – otevřete ji v prohlížeči.',
          steps: [
            { ico: 'dots', html: 'Klepněte na <b>⋮</b> nebo <b>⋯</b> vpravo nahoře.' },
            { ico: 'open', html: 'Zvolte ' + L('Otevřít v prohlížeči', 'Open in browser') + ' nebo ' + L('Otevřít v Chrome', 'Open in Chrome') + '.' },
            { ico: 'install', html: 'V prohlížeči klepněte na ' + L('Nainstalovat zdarma', '') + '.' }
          ],
          notes: [{ ico: 'info', html: 'Nebo použijte tlačítka níže.' }],
          actions: ['chrome', 'copy']
        };
      case 'inapp-ios':
        return {
          src: ['facebook', 'apple'],
          title:
            (app ? 'Stránka je otevřená uvnitř aplikace ' + app + '.' : 'Stránka je otevřená uvnitř jiné aplikace.') +
            ' Odtud instalace nejde – otevřete ji v Safari.',
          steps: [
            { ico: 'dotsh', html: 'Klepněte na <b>⋯</b> nebo ikonu kompasu/šipky (nahoře či dole).' },
            { ico: 'open', html: 'Zvolte ' + L('Otevřít v Safari', 'Open in Safari') + ' nebo ' + L('Otevřít v prohlížeči', 'Open in browser') + '.' },
            { ico: 'share', html: 'V Safari klepněte na ' + L('Sdílet', 'Share') + ' a zvolte ' + L('Přidat na plochu', 'Add to Home Screen') + '.' }
          ],
          notes: [{ ico: 'info', html: 'Volbu nenajdete? Zkopírujte odkaz, otevřete Safari a vložte ho do adresního řádku.' }, IOS_NOTE],
          actions: ['copy']
        };
      case 'desktop-chrome':
      case 'desktop-brave':
        return {
          src: [kind === 'desktop-brave' ? 'brave' : 'chromeDesktop'],
          steps: [
            { ico: 'monitor', html: 'V adresním řádku klikněte na ikonu instalace (monitor se šipkou).' },
            { ico: 'dots', html: 'Nebo v menu zvolte ' + L('Uložit a sdílet', 'Save and share') + ' → ' + L('Nainstalovat stránku jako aplikaci', 'Install page as app') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Nainstalovat', 'Install') + '.' }
          ]
        };
      case 'desktop-edge':
        return {
          src: ['edge'],
          steps: [
            { ico: 'monitor', html: 'V adresním řádku klikněte na ikonu ' + L('Aplikace je k dispozici', 'App available') + '.' },
            { ico: 'dotsh', html: 'Nebo v menu <b>⋯</b> zvolte ' + L('Aplikace', 'Apps') + ' → ' + L('Nainstalovat tento web jako aplikaci', 'Install this site as an app') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Nainstalovat', 'Install') + '.' }
          ]
        };
      case 'desktop-safari':
        return {
          src: ['appleMac'],
          steps: [
            { ico: 'share', html: 'V Safari klikněte na ' + L('Sdílet', 'Share') + ' (nebo menu ' + L('Soubor', 'File') + ') a zvolte ' + L('Přidat do Docku', 'Add to Dock') + '.' },
            { ico: 'check', html: 'Potvrďte ' + L('Přidat', 'Add') + '.' }
          ]
        };
      case 'desktop-firefox':
        return {
          src: ['firefox'],
          title: 'Firefox na počítači webové aplikace obvykle neinstaluje.',
          steps: [
            { ico: 'globe', html: 'Otevřete Kapku v Chrome, Edge nebo Brave a postupujte podle návodu pro ně.' }
          ],
          actions: ['copy']
        };
      default:
        return {
          src: ['chromeAndroid', 'apple'],
          steps: [
            { ico: 'dots', html: 'Otevřete menu prohlížeče.' },
            { ico: 'plus', html: 'Hledejte ' + L('Nainstalovat aplikaci', 'Install app') + ' nebo ' + L('Přidat na plochu', 'Add to Home screen') + '.' },
            { ico: 'check', html: 'Potvrďte přidání.' }
          ],
          notes: [{ ico: 'info', html: 'Nejspolehlivější je Chrome na Androidu a Safari na iPhonu.' }],
          actions: ['copy']
        };
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /**
   * HTML průvodce. opts: { info, bip, switchOpen }
   */
  function renderGuide(kind, opts) {
    opts = opts || {};
    const info = opts.info || {};
    if (!NAMES[kind]) kind = 'other';
    const g = guide(kind, info);
    const name = NAMES[kind] + (kind.startsWith('inapp') && info.inApp ? ' – ' + info.inApp : '');
    const steps =
      '<ol class="inst-steps">' +
      g.steps
        .map(
          (s, i) =>
            `<li class="inst-step"><span class="inst-num" aria-hidden="true">${i + 1}</span><span class="inst-ico" aria-hidden="true">${ICO[s.ico] || ''}</span><span class="inst-txt">${s.html}</span></li>`
        )
        .join('') +
      '</ol>' +
      (kind.startsWith('inapp')
        ? ''
        : `<p class="inst-done"><img src="icons/icon-192.png" alt="" width="40" height="40" /> <span><b>Hotovo!</b> Kapku života najdete na ploše.</span></p>`);
    const actions = (g.actions || [])
      .map((a) => {
        if (a === 'copy')
          return `<button type="button" class="btn btn-secondary inst-act" data-copy-link>${ICO.copy}<span>Zkopírovat odkaz</span></button>`;
        if (a === 'chrome' && (kind.startsWith('android') || kind === 'inapp-android'))
          return `<a class="btn btn-primary inst-act" data-open-chrome href="${esc(intentUrl())}" rel="noopener">${ICO.open}<span>Otevřít v Chrome</span></a>`;
        return '';
      })
      .join('');
    const notes = (g.notes || [])
      .map((n) => `<p class="inst-note"><span class="inst-note-ico" aria-hidden="true">${ICO[n.ico] || ''}</span><span>${n.html}</span></p>`)
      .join('');
    const switcher =
      `<div class="inst-switch" id="inst-switch" ${opts.switchOpen ? '' : 'hidden'}>` +
      '<p class="inst-switch-t">Vyberte svůj prohlížeč:</p>' +
      SWITCH_GROUPS.map(
        ([label, kinds]) =>
          `<div class="inst-switch-g"><p class="inst-switch-h">${esc(label)}</p><div class="inst-switch-list">` +
          kinds
            .map(
              (k) =>
                `<button type="button" class="inst-kind${k === kind ? ' is-current' : ''}" data-inst-kind="${k}" aria-pressed="${k === kind}">${esc(NAMES[k])}</button>`
            )
            .join('') +
          '</div></div>'
      ).join('') +
      '</div>';
    const manual = opts.bip
      ? `<details class="inst-manual"><summary>Nefunguje to? Postup ručně</summary>${steps}</details>`
      : steps;
    return (
      `<div class="inst-guide" data-guide="${kind}">` +
      `<p class="inst-for"><span>Návod pro: <strong data-inst-name>${esc(name)}</strong></span> ` +
      `<button type="button" class="linkish inst-switch-btn" data-inst-switch aria-expanded="${opts.switchOpen ? 'true' : 'false'}" aria-controls="inst-switch">Mám jiný prohlížeč</button></p>` +
      switcher +
      (g.title ? `<p class="inst-title">${esc(g.title)}</p>` : '') +
      manual +
      (actions ? `<div class="inst-actions">${actions}</div>` : '') +
      notes +
      `<p class="inst-src">Postup podle nápovědy: ${g.src
        .map((k) => `<a href="${esc(SOURCES[k])}" target="_blank" rel="noopener">${esc(new URL(SOURCES[k]).hostname.replace(/^www\./, ''))}</a>`)
        .join(', ')}. Názvy položek se mohou podle verze prohlížeče mírně lišit.</p>` +
      '</div>'
    );
  }

  global.KapkaInstall = { detect, guide, renderGuide, intentUrl, NAMES, SWITCH_GROUPS, SOURCES, PUBLIC_URL };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.KapkaInstall;
})(typeof window !== 'undefined' ? window : globalThis);
