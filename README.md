# Kapka života

Bezplatná česká aplikace pro dárce krve a plazmy.

**Autor projektu: Vladimír Holub**
© 2026 Vladimír Holub. Všechna práva vyhrazena. Podmínky užití viz [LICENSE](LICENSE) (nejde o open-source licenci).

Oficiální adresa: https://holub5305-dotcom.github.io/kapka-zivota/
Aktuální verze: 1.2.1 (`js/version.js`)

- **Zdarma**, bez povinné registrace
- Data zůstávají ve Vašem prohlížeči (`localStorage`, klíč `kapka-zivota-v1`)
- Nejde o oficiální aplikaci nemocnic ani Českého červeného kříže
- Nestanovuje zdravotní způsobilost; datum dalšího odběru na Domů je jen orientační podle obecných pravidel (vyhláška č. 143/2008 Sb.)
- Aplikace není oficiální zdravotnickou službou a nenahrazuje doporučení odběrového centra ani lékaře

## Sdílení, QR kód a leták

- QR kód na oficiální adresu: [`share/qr-kapka-zivota.png`](share/qr-kapka-zivota.png) (1200 × 1200 px), [`share/qr-kapka-zivota.svg`](share/qr-kapka-zivota.svg) (vektor pro tisk)
- Leták k tisku (A4): [`share/letak.html`](share/letak.html), PDF: [`share/letak-kapka-zivota.pdf`](share/letak-kapka-zivota.pdf)
- V aplikaci: Více → Instalace a sdílení / QR kód a leták / O aplikaci

Nemocnice, organizace i dárci mohou aplikaci zdarma doporučovat a sdílet. Bez svolení autora ji však nesmějí vydávat za svůj vlastní projekt.

## Verze a aktualizace

Číslo verze je v `js/version.js` a musí odpovídat `APP_VERSION` v `sw.js` a `?v=` odkazům v `index.html` (hlídá `tests/version.test.js`). Při každé změně zvyšte verzi na všech třech místech.

## Lokální spuštění

```bash
cd /workspace/kapka-zivota
npx --yes serve -l 4173 .
```

Otevřete v prohlížeči: `http://localhost:4173`

## Instalace na Android (Chrome)

1. Otevřete adresu aplikace v Chrome.
2. Klepněte na menu (⋮) → **Nainstalovat aplikaci** / **Přidat na plochu**.
3. Potvrďte instalaci. Aplikace se objeví jako ikona na ploše a běží bez adresního řádku.

## Instalace na tablet / počítač

- **Android tablet:** stejně jako telefon (Chrome).
- **Windows / Linux / macOS (Chrome/Edge):** v adresním řádku ikona instalace, nebo menu → Instalovat Kapka života.
- **iPhone / iPad (Safari):** Sdílet → **Přidat na plochu**. Oznámení z webu fungují spolehlivěji až po přidání na plochu (iOS 16.4+).

## Funkce

1. Domů — statistiky Celkem / Krev / Plazma
2. Dárcovský deník — přidání, úprava, mazání s potvrzením
3. Kalendář a připomínky — upozornění den předem / 2 h / vlastní, export `.ics`
4. Transfuzní stanice — 108 pracovišť, filtry kraj / město / typ / druh
5. Informace pro nové dárce
6. Nastavení — téma, soukromí
7. Export a obnova JSON (sloučení bez duplicit / nahrazení s dvojím potvrzením)

## Oznámení (omezení PWA)

- **Android:** po instalaci a povolení oznámení fungují nejlépe.
- **iOS:** spolehlivá až po „Přidat na plochu“ a udělení oprávnění.
- Aplikace při otevření zkontroluje blízké termíny (banner / Notification API).
- Pro jistotu vždy můžete exportovat termín do kalendáře telefonu (`.ics`).

## Testy

```bash
node tests/store.test.js
node tests/stations.test.js
```

## Nasazení

Statické soubory — vhodné pro Firebase Hosting nebo GitHub Pages.  
**Nasazení až po výslovném souhlasu majitele projektu.**


## Nativní obaly (test)

Webová PWA na GitHub Pages zůstává zdrojem pravdy. Nativní projekty jsou **přídavné** a nesmí mazat kořenové soubory PWA.

| Platforma | Složka | Stack |
|-----------|--------|--------|
| Android | `mobile/` | Capacitor 6, app id `cz.kapkazivota.app` |
| Windows | `desktop/` | Tauri 2 (build přes GitHub Actions `windows.yml`) |

### Synchronizace webových souborů

```bash
bash scripts/sync-www.sh
```

Zkopíruje `index.html`, `css/`, `js/`, `data/`, `icons/`, manifest a `sw.js` do `mobile/www` a `desktop/www`.

### Android (debug APK)

```bash
cd mobile
npm install
npm run sync-www
npx cap sync android
cd android && ./gradlew assembleDebug
# výstup: android/app/build/outputs/apk/debug/app-debug.apk
```

Šablona workflow: `ci/workflows/android.yml` — zkopírujte do `.github/workflows/` (token musí mít scope `workflow`) a spusťte v Actions.

### Windows (NSIS / MSI)

Na Linuxu se Windows instalátor nestaví. Šablona: `ci/workflows/windows.yml` → zkopírujte do `.github/workflows/` a spusťte v Actions (NSIS/MSI artefakty + draft prerelease).

### Přenos dat mezi PWA a nativní app

Úložiště je vždy klíč **`kapka-zivota-v1`**, ale každé prostředí (Chrome / APK / Windows) má vlastní data. Exportujte JSON ve Více → Export a obnova, v nové app soubor načtěte (Sloučit / Nahradit).
