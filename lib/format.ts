import type { Language } from '../i18n/translations';

export const DAY_NAMES: Record<Language, string[]> = {
  ro: ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
};

/** În română, de la 20 în sus (dacă ultimele două cifre fac 0 sau trec de 19) numărul cere „de”: „25 de zile”, dar „15 zile”, „101 zile”. */
export function roNeedsDe(n: number) {
  return n >= 20 && (n % 100 === 0 || n % 100 >= 20);
}

function plural(lang: Language, n: number, ro: [string, string], ru: [string, string, string]) {
  if (lang === 'ro') return `${n} ${roNeedsDe(n) ? 'de ' : ''}${n === 1 ? ro[0] : ro[1]}`;
  const mod10 = n % 10;
  const mod100 = n % 100;
  const form = mod10 === 1 && mod100 !== 11 ? 0 : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 1 : 2;
  return `${n} ${ru[form]}`;
}

/** „peste 2 zile”, „peste 3 h 20 min”, „через 5 дней” */
export function timeUntil(lang: Language, target: Date, now = new Date()) {
  const minutes = Math.max(1, Math.round((target.getTime() - now.getTime()) / 60_000));
  const prefix = lang === 'ro' ? 'peste' : 'через';
  if (minutes < 60) return `${prefix} ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${prefix} ${hours} ${lang === 'ro' ? 'h' : 'ч'}${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  const days = Math.round(hours / 24);
  return `${prefix} ${plural(lang, days, ['zi', 'zile'], ['день', 'дня', 'дней'])}`;
}

export function formatDate(lang: Language, date: Date | number) {
  return new Date(date).toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function countLabel(lang: Language, n: number, ro: [string, string], ru: [string, string, string]) {
  return plural(lang, n, ro, ru);
}

/** Doar cuvântul potrivit numărului („zile”, „дня”), pentru când cifra se scrie separat (mare, serif). */
export function pluralWord(lang: Language, n: number, ro: [string, string], ru: [string, string, string]) {
  return plural(lang, n, ro, ru).slice(String(n).length + 1);
}

export const MONTH_NAMES: Record<Language, string[]> = {
  ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

/** Zilele săptămânii, începând cu luni. */
export const WEEKDAY_SHORT: Record<Language, string[]> = {
  ro: ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

/** „Miercuri, 28 octombrie” / „Среда, 28 октября” */
export function formatDayTitle(lang: Language, date: Date) {
  const dayMonth = date.toLocaleDateString(lang === 'ro' ? 'ro-RO' : 'ru-RU', { day: 'numeric', month: 'long' });
  return `${DAY_NAMES[lang][date.getDay()]}, ${dayMonth}`;
}

/** „acum 5 min”, „acum 3 h”, „ieri”, „12 octombrie” */
export function timeAgo(lang: Language, date: Date, now = new Date()) {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  const ro = lang === 'ro';
  if (minutes < 1) return ro ? 'acum' : 'только что';
  if (minutes < 60) return ro ? `acum ${minutes} min` : `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ro ? `acum ${hours} h` : `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return ro ? 'ieri' : 'вчера';
  if (days < 7) return ro ? `acum ${days} zile` : plural('ru', days, ['', ''], ['день', 'дня', 'дней']) + ' назад';
  return date.toLocaleDateString(ro ? 'ro-RO' : 'ru-RU', { day: 'numeric', month: 'long' });
}
