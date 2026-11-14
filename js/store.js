/**
 * Kapka života — lokální úložiště (localStorage)
 * Klíč je verzovaný: aktualizace aplikace nesmí smazat data.
 */
(function (global) {
  const STORAGE_KEY = 'kapka-zivota-v1';

  const DEFAULT_STATE = {
    version: 1,
    welcomeDone: false,
    theme: 'system', // system | light | dark
    donations: [],
    reminders: [],
    updatedAt: null
  };

  function uid(prefix) {
    return (
      (prefix || 'id') +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 9)
    );
  }

  function loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Kapka: nepodařilo se načíst data', e);
      return null;
    }
  }

  function normalize(state) {
    const s = Object.assign({}, DEFAULT_STATE, state || {});
    if (!Array.isArray(s.donations)) s.donations = [];
    if (!Array.isArray(s.reminders)) s.reminders = [];
    if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = 'system';
    s.welcomeDone = !!s.welcomeDone;
    // Volitelné (aditivní) pole: pohlaví jen pro orientační roční limit odběrů krve.
    // Když chybí, nic se nedoplňuje — existující data zůstávají beze změny.
    if ('donorSex' in s && !['muz', 'zena'].includes(s.donorSex)) delete s.donorSex;
    s.version = 1;
    return s;
  }

  function save(state) {
    const next = normalize(state);
    next.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    global.dispatchEvent(new CustomEvent('kapka:store', { detail: next }));
    return next;
  }

  function getState() {
    return normalize(loadRaw() || DEFAULT_STATE);
  }

  function update(mutator) {
    const current = getState();
    const draft = JSON.parse(JSON.stringify(current));
    const result = mutator(draft) || draft;
    return save(result);
  }

  /* —— Donations —— */
  function listDonations() {
    return getState()
      .donations.slice()
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function getDonation(id) {
    return getState().donations.find((d) => d.id === id) || null;
  }

  function upsertDonation(input) {
    const item = {
      id: input.id || uid('don'),
      type: input.type === 'Plazma' ? 'Plazma' : 'Krev',
      date: String(input.date || '').slice(0, 10),
      place: String(input.place || '').trim(),
      note: String(input.note || '').trim(),
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!item.date) throw new Error('Datum je povinné');
    return update((s) => {
      const i = s.donations.findIndex((d) => d.id === item.id);
      if (i >= 0) s.donations[i] = Object.assign({}, s.donations[i], item);
      else s.donations.push(item);
      return s;
    });
  }

  function deleteDonation(id) {
    return update((s) => {
      s.donations = s.donations.filter((d) => d.id !== id);
      return s;
    });
  }

  function donationStats() {
    const list = listDonations();
    const blood = list.filter((d) => d.type === 'Krev').length;
    const plasma = list.filter((d) => d.type === 'Plazma').length;
    return {
      total: list.length,
      blood,
      plasma,
      last: list[0] || null
    };
  }

  /* —— Reminders —— */
  function listReminders() {
    return getState()
      .reminders.slice()
      .sort((a, b) => {
        const da = a.datetime || a.date || '';
        const db = b.datetime || b.date || '';
        return String(da).localeCompare(String(db));
      });
  }

  function getReminder(id) {
    return getState().reminders.find((r) => r.id === id) || null;
  }

  function upsertReminder(input) {
    const notifyMode = ['day_before', 'hours_2', 'custom'].includes(input.notifyMode)
      ? input.notifyMode
      : 'day_before';
    const item = {
      id: input.id || uid('rem'),
      title: String(input.title || '').trim() || 'Připomínka odběru',
      datetime: String(input.datetime || '').trim(),
      source: input.source === 'Ze stanice' ? 'Ze stanice' : 'Vlastní',
      stationId: input.stationId || '',
      stationName: String(input.stationName || '').trim(),
      notifyMode,
      customNotifyAt: notifyMode === 'custom' ? String(input.customNotifyAt || '').trim() : '',
      note: String(input.note || '').trim(),
      notifiedAt: input.notifiedAt || null,
      createdAt: input.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (!item.datetime) throw new Error('Datum a čas jsou povinné');
    return update((s) => {
      const i = s.reminders.findIndex((r) => r.id === item.id);
      if (i >= 0) {
        const prev = s.reminders[i];
        // v1.2.5: při změně termínu nebo času upozornění se připomínka znovu ohlásí;
        // úprava jen názvu/poznámky stav „už upozorněno“ zachová.
        const keep = notifyTimeChanged(prev, item) ? null : prev.notifiedAt || null;
        s.reminders[i] = Object.assign({}, prev, item, { notifiedAt: keep });
      }
      else s.reminders.push(item);
      return s;
    });
  }

  function deleteReminder(id) {
    return update((s) => {
      s.reminders = s.reminders.filter((r) => r.id !== id);
      return s;
    });
  }

  function markReminderNotified(id) {
    return update((s) => {
      const r = s.reminders.find((x) => x.id === id);
      if (r) r.notifiedAt = new Date().toISOString();
      return s;
    });
  }

  function timeOf(v) {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? null : t;
  }

  /** v1.2.5: změnil se termín nebo okamžik upozornění? */
  function notifyTimeChanged(prev, next) {
    if (!prev || !next) return true;
    if (timeOf(prev.datetime) !== timeOf(next.datetime)) return true;
    const a = notifyAtFor(prev);
    const b = notifyAtFor(next);
    return (a ? a.getTime() : null) !== (b ? b.getTime() : null);
  }

  function notifyAtFor(reminder) {
    const when = new Date(reminder.datetime);
    if (Number.isNaN(when.getTime())) return null;
    if (reminder.notifyMode === 'hours_2') {
      return new Date(when.getTime() - 2 * 60 * 60 * 1000);
    }
    if (reminder.notifyMode === 'custom' && reminder.customNotifyAt) {
      const c = new Date(reminder.customNotifyAt);
      return Number.isNaN(c.getTime()) ? null : c;
    }
    // day_before: stejný čas o den dříve
    return new Date(when.getTime() - 24 * 60 * 60 * 1000);
  }

  /* —— Settings / welcome —— */
  function setWelcomeDone(done) {
    return update((s) => {
      s.welcomeDone = !!done;
      return s;
    });
  }

  function setTheme(theme) {
    if (!['system', 'light', 'dark'].includes(theme)) theme = 'system';
    return update((s) => {
      s.theme = theme;
      return s;
    });
  }

  /* —— Export / restore —— */
  function exportPayload() {
    const s = getState();
    return {
      app: 'kapka-zivota',
      format: 1,
      exportedAt: new Date().toISOString(),
      data: {
        version: s.version,
        welcomeDone: s.welcomeDone,
        theme: s.theme,
        donorSex: s.donorSex || undefined,
        donations: s.donations,
        reminders: s.reminders
      }
    };
  }

  /* —— v1.2.8: kontrola importovaných dat ——
   * Soubor zálohy může být podvržený. Každé pole se proto převezme jen ve správném tvaru:
   * id jen jako ^[A-Za-z0-9_-]{1,64}$ (jinak nové id), texty jen jako text s omezenou délkou,
   * data a časy jen jako platné datum. Uložená data uživatele se tím nemění. */
  const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
  const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;
  const ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
  const MAX_ITEMS = 10000;

  function safeId(v, prefix) {
    return typeof v === 'string' && ID_RE.test(v) ? v : uid(prefix);
  }

  function safeText(v, max) {
    if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
    if (typeof v !== 'string') return '';
    return v.slice(0, max);
  }

  function safeYmd(v) {
    if (typeof v !== 'string') return '';
    const ymd = v.slice(0, 10);
    if (!YMD_RE.test(ymd)) return '';
    const d = new Date(ymd + 'T12:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd ? ymd : '';
  }

  function safeIso(v) {
    if (typeof v !== 'string' || v.length > 40 || !ISO_RE.test(v)) return '';
    return Number.isNaN(new Date(v).getTime()) ? '' : v;
  }

  function plainObjects(list) {
    return (Array.isArray(list) ? list : [])
      .slice(0, MAX_ITEMS)
      .filter((x) => x && typeof x === 'object' && !Array.isArray(x));
  }

  function parseImport(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('Neplatný soubor');
    const data = obj.data || obj;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Chybí data');
    const now = new Date().toISOString();
    return {
      welcomeDone: data.welcomeDone === true,
      theme: ['system', 'light', 'dark'].includes(data.theme) ? data.theme : undefined,
      donorSex: ['muz', 'zena'].includes(data.donorSex) ? data.donorSex : undefined,
      donations: plainObjects(data.donations)
        .map((d) => ({
          id: safeId(d.id, 'don'),
          type: d.type === 'Plazma' ? 'Plazma' : 'Krev',
          date: safeYmd(d.date),
          place: safeText(d.place, 500),
          note: safeText(d.note, 5000),
          createdAt: safeIso(d.createdAt) || now,
          updatedAt: safeIso(d.updatedAt) || now
        }))
        .filter((d) => d.date),
      reminders: plainObjects(data.reminders)
        .map((r) => {
          const notifyMode = ['day_before', 'hours_2', 'custom'].includes(r.notifyMode) ? r.notifyMode : 'day_before';
          return {
            id: safeId(r.id, 'rem'),
            title: safeText(r.title, 500) || 'Připomínka',
            datetime: safeIso(r.datetime) || safeIso(r.date),
            source: r.source === 'Ze stanice' ? 'Ze stanice' : 'Vlastní',
            stationId: typeof r.stationId === 'string' && ID_RE.test(r.stationId) ? r.stationId : '',
            stationName: safeText(r.stationName, 500),
            notifyMode,
            customNotifyAt: safeIso(r.customNotifyAt),
            note: safeText(r.note, 5000),
            notifiedAt: safeIso(r.notifiedAt) || null,
            createdAt: safeIso(r.createdAt) || now,
            updatedAt: safeIso(r.updatedAt) || now
          };
        })
        .filter((r) => r.datetime)
    };
  }

  function mergeImport(parsed) {
    return update((s) => {
      const donIds = new Set(s.donations.map((d) => d.id));
      const remIds = new Set(s.reminders.map((r) => r.id));
      for (const d of parsed.donations) {
        if (!donIds.has(d.id)) {
          s.donations.push(d);
          donIds.add(d.id);
        }
      }
      for (const r of parsed.reminders) {
        if (!remIds.has(r.id)) {
          s.reminders.push(r);
          remIds.add(r.id);
        }
      }
      if (parsed.theme) s.theme = parsed.theme;
      if (parsed.donorSex && !s.donorSex) s.donorSex = parsed.donorSex;
      return s;
    });
  }

  function replaceImport(parsed) {
    return update((s) => {
      s.donations = parsed.donations.slice();
      s.reminders = parsed.reminders.slice();
      if (typeof parsed.welcomeDone === 'boolean') s.welcomeDone = parsed.welcomeDone;
      if (parsed.theme) s.theme = parsed.theme;
      if (parsed.donorSex) s.donorSex = parsed.donorSex;
      return s;
    });
  }

  function setDonorSex(sex) {
    return update((s) => {
      if (sex === 'muz' || sex === 'zena') s.donorSex = sex;
      else delete s.donorSex;
      return s;
    });
  }

  function applyThemeToDocument(theme) {
    const root = document.documentElement;
    const t = theme || getState().theme;
    root.removeAttribute('data-theme');
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
  }

  global.KapkaStore = {
    STORAGE_KEY,
    uid,
    getState,
    listDonations,
    getDonation,
    upsertDonation,
    deleteDonation,
    donationStats,
    listReminders,
    getReminder,
    upsertReminder,
    deleteReminder,
    markReminderNotified,
    notifyAtFor,
    notifyTimeChanged,
    setWelcomeDone,
    setTheme,
    setDonorSex,
    exportPayload,
    parseImport,
    ID_RE,
    mergeImport,
    replaceImport,
    applyThemeToDocument
  };

  // Node / test export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = global.KapkaStore;
  }
})(typeof window !== 'undefined' ? window : globalThis);
