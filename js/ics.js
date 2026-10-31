/**
 * Kapka života — tvorba souboru .ics („Uložit do kalendáře“), RFC 5545.
 * Čistá funkce bez DOM, aby šla testovat v Node (tests/ics.test.js).
 * Časy se zapisují v UTC (přípona Z) — kalendář je zobrazí v místním čase
 * (Europe/Prague včetně letního času), takže není potřeba VTIMEZONE.
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 */
(function (global) {
  const CRLF = '\r\n';

  /** Escapování hodnoty typu TEXT (RFC 5545, 3.3.11): \ ; , a konce řádků. */
  function escapeText(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n');
  }

  function utf8Len(ch) {
    const c = ch.codePointAt(0);
    if (c < 0x80) return 1;
    if (c < 0x800) return 2;
    if (c < 0x10000) return 3;
    return 4;
  }

  /** Zalomení řádku po max. 75 oktetech (UTF-8), nikdy uprostřed znaku (3.1). */
  function foldLine(line) {
    const out = [];
    let cur = '';
    let len = 0;
    let limit = 75; // pokračovací řádky začínají mezerou, která se také počítá
    for (const ch of String(line)) {
      const l = utf8Len(ch);
      if (len + l > limit) {
        out.push(cur);
        cur = ' ';
        len = 1;
        limit = 75;
      }
      cur += ch;
      len += l;
    }
    out.push(cur);
    return out.join(CRLF);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Datum a čas v UTC: 20261105T130900Z */
  function utcStamp(d) {
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  }

  /** Doba trvání před začátkem, např. -P1D, -PT2H, -P1DT3H15M, PT0M. */
  function beforeDuration(minutes) {
    const m = Math.round(minutes);
    if (m <= 0) return 'PT0M';
    const days = Math.floor(m / 1440);
    const hours = Math.floor((m % 1440) / 60);
    const mins = m % 60;
    let s = '-P';
    if (days) s += days + 'D';
    if (hours || mins) {
      s += 'T';
      if (hours) s += hours + 'H';
      if (mins) s += mins + 'M';
    }
    return s;
  }

  /**
   * Spočítá upozornění pro kalendář.
   * Vrací { ok: true, trigger } nebo { ok: false, reason } — vlastní čas po začátku
   * termínu se už tiše nemění na „den předem“.
   */
  function alarmFor(reminder) {
    const start = new Date(reminder.datetime);
    if (reminder.notifyMode === 'hours_2') return { ok: true, trigger: '-PT2H' };
    if (reminder.notifyMode === 'custom') {
      const c = new Date(reminder.customNotifyAt || '');
      if (!reminder.customNotifyAt || Number.isNaN(c.getTime())) return { ok: false, reason: 'invalid' };
      const diffMin = Math.round((start.getTime() - c.getTime()) / 60000);
      if (diffMin < 0) return { ok: false, reason: 'after_start' };
      return { ok: true, trigger: beforeDuration(diffMin) };
    }
    return { ok: true, trigger: '-P1D' };
  }

  function safeUidPart(id) {
    const s = String(id || '').replace(/[^A-Za-z0-9._-]/g, '');
    return s || 'termin-' + Date.now().toString(36);
  }

  /**
   * Vytvoří text .ics. Vrací { ics, alarm } — alarm.ok === false znamená,
   * že soubor je bez upozornění (a UI to uživateli krátce řekne).
   */
  function build(reminder, now) {
    const start = new Date(reminder.datetime);
    if (Number.isNaN(start.getTime())) throw new Error('Neplatné datum');
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const stamp = now instanceof Date ? now : new Date();
    const alarm = alarmFor(reminder);
    const summary = String(reminder.title || '').trim() || 'Připomínka odběru';
    // Stejný obsah jako dřív (stanice, poznámka, zdroj) — nic dalšího se nepřidává.
    const desc = [
      reminder.stationName ? 'Stanice: ' + reminder.stationName : '',
      reminder.note || '',
      'Zdroj: ' + (reminder.source || 'Vlastní'),
      'Uloženo z aplikace Kapka života'
    ]
      .filter(Boolean)
      .join('\n');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Kapka zivota//Kapka zivota//CS',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      // stejné UID jako v 1.2.3 → opakované uložení termín v kalendáři aktualizuje
      'UID:' + safeUidPart(reminder.id) + '@kapka-zivota',
      'DTSTAMP:' + utcStamp(stamp),
      'DTSTART:' + utcStamp(start),
      'DTEND:' + utcStamp(end),
      'SUMMARY:' + escapeText(summary),
      'DESCRIPTION:' + escapeText(desc)
    ];
    if (alarm.ok) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'TRIGGER:' + alarm.trigger,
        'DESCRIPTION:' + escapeText(summary),
        'END:VALARM'
      );
    }
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return { ics: lines.map(foldLine).join(CRLF) + CRLF, alarm };
  }

  const api = { escapeText, foldLine, utcStamp, beforeDuration, alarmFor, build };
  global.KapkaIcs = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
