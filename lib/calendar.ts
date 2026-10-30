import type { Language } from '../i18n/translations';

type Localized = Record<Language, string>;

/** Un eveniment importat dintr-un calendar Google public (fișier .ics). Datele sunt ISO, ca să se poată salva în cache. */
export interface CalendarEvent {
  id: string;
  calendar: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
}

/** O apariție concretă în calendarul aplicației: serviciu săptămânal sau eveniment importat. */
export interface Occurrence {
  key: string;
  kind: 'service' | 'event';
  title: string;
  subtitle?: string;
  details?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

export interface WeeklyService {
  day: number;
  time: string;
  durationMin?: number;
  title: Localized;
}

const DAY_MS = 86_400_000;

// ---------- Parser .ics ----------

function unescapeText(s: string) {
  return s
    .replace(/\\n/gi, '\n')
    .replace(/\\([,;\\])/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/** 20260904T190000 (ora locală a bisericii), 20260904T160000Z (UTC) sau 20261113 (toată ziua). */
function parseIcsDate(value: string, params: string): { date: Date; allDay: boolean } | null {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  if (!h || params.includes('VALUE=DATE')) return { date: new Date(+y, +mo - 1, +d), allDay: true };
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s)), allDay: false };
  // Orele cu TZID (Europe/Chisinau) le luăm ca oră locală: aplicația e folosită în Moldova.
  return { date: new Date(+y, +mo - 1, +d, +h, +mi, +s), allDay: false };
}

const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Desface un eveniment repetat săptămânal (FREQ=WEEKLY) în apariții separate; alte reguli rămân doar cu prima apariție. */
function expandWeekly(rule: string, start: Date, end: Date, exdates: Set<number>, until: Date): [Date, Date][] {
  const parts = Object.fromEntries(rule.split(';').map((p) => p.split('=') as [string, string]));
  if (parts.FREQ !== 'WEEKLY') return [[start, end]];
  const interval = Math.max(1, Number(parts.INTERVAL) || 1);
  const count = parts.COUNT ? Number(parts.COUNT) : Infinity;
  const ruleUntil = parts.UNTIL ? parseIcsDate(parts.UNTIL, '')?.date : undefined;
  const last = ruleUntil && ruleUntil < until ? ruleUntil : until;
  const days = parts.BYDAY ? parts.BYDAY.split(',').map((d: string) => WEEKDAYS.indexOf(d.slice(-2))) : [start.getDay()];
  const duration = end.getTime() - start.getTime();

  const out: [Date, Date][] = [];
  const weekStart = new Date(start.getFullYear(), start.getMonth(), start.getDate() - start.getDay());
  let made = 0;
  for (let w = 0; made < count && w < 520; w += interval) {
    for (const day of [...days].sort()) {
      const occ = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + w * 7 + day, start.getHours(), start.getMinutes());
      if (occ < start) continue;
      if (occ > last || made >= count) return out;
      made++;
      if (!exdates.has(occ.getTime())) out.push([occ, new Date(occ.getTime() + duration)]);
    }
  }
  return out;
}

/** Citește un fișier .ics și întoarce evenimentele din intervalul [from, until]. */
export function parseIcs(text: string, calendar: string, from: Date, until: Date): CalendarEvent[] {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const raw: Record<string, { params: string; value: string }[]>[] = [];
  let current: Record<string, { params: string; value: string }[]> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') current = {};
    else if (line === 'END:VEVENT') {
      if (current) raw.push(current);
      current = null;
    } else if (current) {
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      const [name, ...params] = line.slice(0, colon).split(';');
      (current[name] ??= []).push({ params: params.join(';'), value: line.slice(colon + 1) });
    }
  }

  const prop = (e: (typeof raw)[number], name: string) => e[name]?.[0];

  // Aparițiile modificate separat (RECURRENCE-ID) înlocuiesc apariția din seria repetată.
  const overridden = new Set<string>();
  for (const e of raw) {
    const rid = prop(e, 'RECURRENCE-ID');
    const uid = prop(e, 'UID')?.value;
    const date = rid && parseIcsDate(rid.value, rid.params);
    if (uid && date) overridden.add(`${uid}@${date.date.getTime()}`);
  }

  const events: CalendarEvent[] = [];
  for (const e of raw) {
    if (prop(e, 'STATUS')?.value === 'CANCELLED') continue;
    const dtstart = prop(e, 'DTSTART');
    const start = dtstart && parseIcsDate(dtstart.value, dtstart.params);
    if (!start) continue;
    const dtend = prop(e, 'DTEND');
    const endParsed = dtend && parseIcsDate(dtend.value, dtend.params);
    const end = endParsed ? endParsed.date : new Date(start.date.getTime() + (start.allDay ? DAY_MS : 3_600_000));
    const uid = prop(e, 'UID')?.value ?? `${dtstart.value}`;

    const exdates = new Set<number>();
    for (const ex of e.EXDATE ?? []) {
      for (const v of ex.value.split(',')) {
        const d = parseIcsDate(v, ex.params);
        if (d) exdates.add(d.date.getTime());
      }
    }

    const rrule = prop(e, 'RRULE')?.value;
    const spans: [Date, Date][] = rrule ? expandWeekly(rrule, start.date, end, exdates, until) : [[start.date, end]];

    for (const [s, en] of spans) {
      if (en < from || s > until) continue;
      if (rrule && overridden.has(`${uid}@${s.getTime()}`)) continue;
      events.push({
        id: `${uid}@${s.getTime()}`,
        calendar,
        title: unescapeText(prop(e, 'SUMMARY')?.value ?? ''),
        description: unescapeText(prop(e, 'DESCRIPTION')?.value ?? ''),
        location: unescapeText(prop(e, 'LOCATION')?.value ?? ''),
        start: s.toISOString(),
        end: en.toISOString(),
        allDay: start.allDay,
      });
    }
  }
  return events.sort((a, b) => a.start.localeCompare(b.start));
}

// ---------- Traduceri pentru titlurile cunoscute ----------

const RU_TITLES: Record<string, string> = {
  tineret: 'Молодёжное служение',
  'grup mic': 'Малая группа',
  'grup de creștere': 'Группа роста',
  'serviciu divin': 'Богослужение',
  'seară de rugăciune': 'Молитвенный вечер',
  'seara de rugaciune': 'Молитвенный вечер',
  'seara de marturii': 'Вечер свидетельств',
  'seară de mărturii': 'Вечер свидетельств',
  'rugaciunea cu fratii': 'Молитва братьев',
  'rugăciunea cu frații': 'Молитва братьев',
  'tabără de casă': 'Домашний лагерь',
  'tabăra de tineret': 'Молодёжный лагерь',
  'tineretul conduce serviciul de dimineață': 'Молодёжь ведёт утреннее богослужение',
  'la colindat': 'Колядки',
  crăciun: 'Рождество',
  paștele: 'Пасха',
  'joia mare': 'Великий четверг',
  'picnic betania': 'Пикник «Вифания»',
  subotnik: 'Субботник',
  'malcishnik & devishnik': 'Мальчишник и девичник',
};

export function localizeTitle(title: string, lang: Language) {
  if (lang === 'ro') return title;
  const key = title.replace(/\*+$/, '').trim().toLowerCase();
  return RU_TITLES[key] ? RU_TITLES[key] + (title.endsWith('*') ? '*' : '') : title;
}

// ---------- Apariții (servicii + evenimente) ----------

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** Prima linie din descriere e de obicei tema serii; restul sunt detalii. */
function splitDescription(description: string) {
  const [first = '', ...rest] = description.split('\n');
  return { subtitle: first.trim() || undefined, details: rest.join('\n').trim() || undefined };
}

/**
 * Toate aparițiile dintre `from` și `to` (exclusiv), sortate.
 * Un serviciu săptămânal e ascuns în ziua în care un eveniment din calendar acoperă ora lui
 * (ex.: vineri 19:00 „Tineret” devine „Seara de mărturii”, cu tema din calendar).
 */
export function buildOccurrences(services: WeeklyService[], events: CalendarEvent[], lang: Language, from: Date, to: Date): Occurrence[] {
  const out: Occurrence[] = [];

  const timed: Occurrence[] = [];
  for (const e of events) {
    const start = new Date(e.start);
    const end = new Date(e.end);
    if (end <= from || start >= to) continue;
    const { subtitle, details } = splitDescription(e.description);
    const occ: Occurrence = {
      key: e.id,
      kind: 'event',
      title: localizeTitle(e.title, lang),
      subtitle,
      details,
      location: e.location || undefined,
      start,
      end,
      allDay: e.allDay,
    };
    out.push(occ);
    if (!e.allDay) timed.push(occ);
  }

  for (let day = startOfDay(from); day < to; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    for (const s of services) {
      if (s.day !== day.getDay()) continue;
      const [h, m] = s.time.split(':').map(Number);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
      const end = new Date(start.getTime() + (s.durationMin ?? 120) * 60_000);
      if (end <= from || start >= to) continue;
      const covered = timed.some((e) => e.start <= start && e.end > start) || timed.some((e) => sameDay(e.start, start) && Math.abs(e.start.getTime() - start.getTime()) <= 30 * 60_000);
      if (covered) continue;
      out.push({ key: `service:${s.day}:${s.time}:${dayKey(day)}`, kind: 'service', title: s.title[lang], start, end, allDay: false });
    }
  }

  return out.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.getTime() - b.start.getTime());
}

/** Următoarea apariție cu oră (sau cea care e în desfășurare acum). */
export function nextOccurrence(services: WeeklyService[], events: CalendarEvent[], lang: Language, now = new Date()) {
  const list = buildOccurrences(services, events, lang, now, new Date(now.getTime() + 15 * DAY_MS)).filter((o) => !o.allDay);
  const next = list.sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  return next ? { occurrence: next, live: next.start <= now } : null;
}

export function formatTime(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
