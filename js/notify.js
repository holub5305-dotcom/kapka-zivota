/**
 * Kapka života — text a označení oznámení připomínek (v1.2.5).
 * Čisté funkce bez přístupu k úložišti; používá je js/app.js a testy.
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena.
 */
(function (global) {
  const TITLE = 'Kapka života – připomínka';
  const LATE_PREFIX = 'Opožděné upozornění: ';
  /** Oznámení je „opožděné“, pokud přijde víc než 2 minuty po plánovaném čase. */
  const LATE_THRESHOLD_MS = 2 * 60 * 1000;
  const DAYS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];

  function toDate(v) {
    const d = v instanceof Date ? v : new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function time(d) {
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  /** „čt 5. 11. v 14:00“ (rok jen pokud není letošní). */
  function formatWhen(value, now) {
    const d = toDate(value);
    if (!d) return '';
    const n = toDate(now) || new Date();
    const year = d.getFullYear() !== n.getFullYear() ? ' ' + d.getFullYear() : '';
    return DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + (d.getMonth() + 1) + '.' + year + ' v ' + time(d);
  }

  /** Plánovaný čas pro poznámku u opožděného oznámení: „v 13:30“ nebo „5. 11. v 13:30“. */
  function formatPlanned(value, now) {
    const d = toDate(value);
    if (!d) return '';
    const n = toDate(now) || new Date();
    if (sameDay(d, n)) return 'v ' + time(d);
    const year = d.getFullYear() !== n.getFullYear() ? ' ' + d.getFullYear() : '';
    return d.getDate() + '. ' + (d.getMonth() + 1) + '.' + year + ' v ' + time(d);
  }

  function isLate(dueMs, nowMs) {
    return typeof dueMs === 'number' && typeof nowMs === 'number' && nowMs - dueMs > LATE_THRESHOLD_MS;
  }

  /**
   * Sestaví oznámení pro připomínku.
   * @param reminder {id, title, datetime}
   * @param dueMs plánovaný čas upozornění (ms)
   * @param nowMs skutečný čas doručení (ms)
   */
  function build(reminder, dueMs, nowMs) {
    const eventDate = toDate(reminder.datetime);
    const name = String(reminder.title || '').trim() || 'Připomínka odběru';
    const now = new Date(nowMs);
    let body = name + (eventDate ? ' · ' + formatWhen(eventDate, now) : '');
    const late = isLate(dueMs, nowMs);
    if (late) {
      const planned = formatPlanned(new Date(dueMs), now);
      body = LATE_PREFIX + body + (planned ? ' (mělo přijít ' + planned + ')' : '');
    }
    return {
      title: TITLE,
      body,
      tag: 'kapka-rem-' + reminder.id,
      timestamp: eventDate ? eventDate.getTime() : nowMs,
      late
    };
  }

  const api = { TITLE, LATE_PREFIX, LATE_THRESHOLD_MS, formatWhen, formatPlanned, isLate, build };
  global.KapkaNotify = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
