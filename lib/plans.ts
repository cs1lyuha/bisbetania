import { Language, TranslationKey } from '../i18n/translations';
import { BOOKS, bookName } from './bible';

export const PLANS = [
  { id: 'gospels', from: 40, to: 43, days: 30, icon: 'heart-outline' },
  { id: 'psalms', from: 19, to: 20, days: 60, icon: 'musical-notes-outline' },
  { id: 'nt', from: 40, to: 66, days: 90, icon: 'book-outline' },
  { id: 'year', from: 1, to: 66, days: 365, icon: 'calendar-outline' },
] as const;

export type PlanId = (typeof PLANS)[number]['id'];
export type Reading = { b: number; c: number }[];

export const planTitleKey = (id: PlanId) => `plan_${id}` as TranslationKey;
export const planDescKey = (id: PlanId) => `plan_${id}_desc` as TranslationKey;

const cache: Partial<Record<PlanId, Reading[]>> = {};

/** Împarte capitolele cărților din plan cât mai egal pe zile. */
export function planDays(id: PlanId): Reading[] {
  if (cache[id]) return cache[id]!;
  const plan = PLANS.find((p) => p.id === id)!;
  const chapters: Reading = [];
  for (let b = plan.from; b <= plan.to; b++) {
    for (let c = 1; c <= BOOKS[b - 1].chapters; c++) chapters.push({ b, c });
  }
  const days: Reading[] = [];
  for (let d = 0; d < plan.days; d++) {
    days.push(chapters.slice(Math.floor((d * chapters.length) / plan.days), Math.floor(((d + 1) * chapters.length) / plan.days)));
  }
  cache[id] = days;
  return days;
}

/** „Matei 1–3” sau „Matei 28; Marcu 1–2” */
export function formatReading(reading: Reading, lang: Language) {
  const parts: string[] = [];
  let i = 0;
  while (i < reading.length) {
    let j = i;
    while (j + 1 < reading.length && reading[j + 1].b === reading[i].b) j++;
    const first = reading[i].c;
    const last = reading[j].c;
    parts.push(`${bookName(reading[i].b, lang)} ${first === last ? first : `${first}–${last}`}`);
    i = j + 1;
  }
  return parts.join('; ');
}
