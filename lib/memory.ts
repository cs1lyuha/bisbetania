import DAILY_VERSES from '../data/daily-verses.json';
import type { Language } from '../i18n/translations';
import { formatRef } from './bible';

/** Cele trei jocuri scurte pentru memorare. */
export type GameId = 'fill' | 'order' | 'recall';
export const GAMES: GameId[] = ['fill', 'order', 'recall'];

/** Stele obținute la fiecare joc (1–3), pentru un verset. */
export type MemoryScore = Partial<Record<GameId, number>> & { at?: number };

type Entry = (typeof DAILY_VERSES)[number];

// Doar versete scurte, de un singur verset, ca să încapă într-un minut de joc.
const MEMORY_VERSES: Entry[] = DAILY_VERSES.filter((d) => d.ro.t.length <= 140 && d.ru.t.length <= 160 && d.ro.ve === d.ro.v);

const FIRST_MONDAY = Date.UTC(2026, 0, 5);
// Pas prim cu numărul de versete, ca săptămânile la rând să sară prin listă (nu doar Psalmi unul după altul).
const STEP = 37;
const pick = (week: number) => {
  const n = MEMORY_VERSES.length;
  return MEMORY_VERSES[(((week * STEP) % n) + n) % n];
};
const WEEK_MS = 7 * 86_400_000;

export function weekIndex(date = new Date()) {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((local - FIRST_MONDAY) / WEEK_MS);
}

export interface MemoryVerse {
  id: string; // „43:14:6” (după numerotarea românească)
  reference: string;
  text: string;
  week: number;
}

function toVerse(entry: Entry, lang: Language, week: number): MemoryVerse {
  const r = entry.ro;
  return {
    id: `${r.b}:${r.c}:${r.v}`,
    reference: formatRef(lang, entry[lang]),
    text: entry[lang].t.replace(/^[„“‘"]+|[”"’]+$/g, '').trim(),
    week,
  };
}

/** Versetul săptămânii: se schimbă în fiecare luni. */
export function getWeeklyVerse(lang: Language, date = new Date()) {
  const week = weekIndex(date);
  return toVerse(pick(week), lang, week);
}

/** Versetele din săptămânile anterioare (cele mai noi primele), pentru repetare. */
export function previousVerses(lang: Language, count: number, date = new Date()) {
  const week = weekIndex(date);
  return Array.from({ length: Math.min(count, MEMORY_VERSES.length - 1) }, (_, i) => toVerse(pick(week - i - 1), lang, week - i - 1));
}

export function findVerse(lang: Language, id: string) {
  const entry = MEMORY_VERSES.find((d) => `${d.ro.b}:${d.ro.c}:${d.ro.v}` === id);
  return entry ? toVerse(entry, lang, -1) : null;
}

export const words = (text: string) => text.split(/\s+/).filter(Boolean);

/** Cuvântul fără semne de punctuație, pentru comparații și pentru prima literă. */
export const bare = (word: string) => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

/** Alege cuvintele ascunse la „Completează”: cele mai lungi, cam o treime din verset, în ordinea din text. */
export function pickBlanks(tokens: string[]) {
  const count = Math.max(2, Math.round(tokens.length * 0.3));
  return tokens
    .map((w, i) => ({ i, len: bare(w).length }))
    .filter((x) => x.len >= 3)
    .sort((a, b) => b.len - a.len || a.i - b.i)
    .slice(0, count)
    .map((x) => x.i)
    .sort((a, b) => a - b);
}

/** Împarte versetul în bucăți de 2–4 cuvinte pentru „Ordonează” (maxim 6 bucăți). */
export function chunks(tokens: string[]) {
  const size = Math.max(2, Math.ceil(tokens.length / 6));
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i += size) out.push(tokens.slice(i, i + size).join(' '));
  return out;
}

export function shuffle<T>(items: T[], seed = Date.now()) {
  const a = [...items];
  let s = seed % 2147483647 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 3 stele fără greșeli, 2 stele cu cel mult 2 greșeli, altfel 1. */
export const starsFor = (mistakes: number) => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

/** Un verset e „memorat” când toate cele trei jocuri au fost terminate. */
export const isMastered = (score?: MemoryScore) => !!score && GAMES.every((g) => (score[g] ?? 0) > 0);

export const totalStars = (score?: MemoryScore) => GAMES.reduce((sum, g) => sum + (score?.[g] ?? 0), 0);
