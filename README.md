# Kapka života

Osobní PWA pro dárce krve a plazmy v České republice.

- **Zdarma**, bez povinné registrace
- Data zůstávají ve Vašem prohlížeči (`localStorage`, klíč `kapka-zivota-v1`)
- Nejde o oficiální aplikaci nemocnic ani Českého červeného kříže
- Nestanovuje zdravotní způsobilost ani automatické datum dalšího odběru

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
