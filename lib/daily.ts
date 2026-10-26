import DAILY_VERSES from '../data/daily-verses.json';
import { Language } from '../i18n/translations';
import { formatRef, VerseRef } from './bible';

interface DailyEntry extends VerseRef {
  t: string;
}

const VERSES = DAILY_VERSES as unknown as Record<Language, DailyEntry>[];
const START = Date.UTC(2026, 0, 1);

/** Același verset toată ziua, altul a doua zi; lista se reia după ~6 luni. */
export function dailyIndex(date = new Date()) {
  const days = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - START) / 86_400_000);
  return ((days % VERSES.length) + VERSES.length) % VERSES.length;
}

export function getDailyVerse(lang: Language, date = new Date()) {
  const entry = VERSES[dailyIndex(date)][lang];
  return {
    ref: { b: entry.b, c: entry.c, v: entry.v, ve: entry.ve } as VerseRef,
    reference: formatRef(lang, entry),
    text: entry.t,
  };
}
