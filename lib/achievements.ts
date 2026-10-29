// Realizările se calculează doar din statisticile publice ale membrului (view-ul member_stats),
// așa că toți le văd la fel și nu trebuie salvate separat.
import type { Language } from '../i18n/translations';
import type { IconName } from '../components/Icon';
import type { MemberStats } from './supabase';

type Localized = Record<Language, string>;
type Metric = Exclude<keyof MemberStats, 'user_id'>;

export interface Achievement {
  id: string;
  icon: IconName;
  metric: Metric;
  goal: number;
  title: Localized;
  desc: Localized;
}

const a = (id: string, icon: IconName, metric: Metric, goal: number, title: Localized, desc: Localized): Achievement => ({ id, icon, metric, goal, title, desc });

export const ACHIEVEMENTS: Achievement[] = [
  // Seria: după record, ca realizarea să rămână și dacă seria se rupe.
  a('streak_3', 'flame', 'best_streak', 3, { ro: 'Scânteie', ru: 'Искра' }, { ro: '3 zile la rând în aplicație', ru: '3 дня подряд в приложении' }),
  a('streak_7', 'flame-filled', 'best_streak', 7, { ro: 'Flacără', ru: 'Пламя' }, { ro: 'O săptămână întreagă la rând', ru: 'Целая неделя подряд' }),
  a('streak_30', 'flame-kindling', 'best_streak', 30, { ro: 'Foc viu', ru: 'Живой огонь' }, { ro: '30 de zile la rând', ru: '30 дней подряд' }),
  a('streak_100', 'burning-bush', 'best_streak', 100, { ro: 'Rugul aprins', ru: 'Неопалимая купина' }, { ro: '100 de zile la rând', ru: '100 дней подряд' }),
  a('days_50', 'calendar-check', 'active_days', 50, { ro: 'Credincios', ru: 'Верный' }, { ro: '50 de zile active în total', ru: '50 активных дней всего' }),

  a('memory_1', 'lightbulb', 'verses_mastered', 1, { ro: 'Primul verset', ru: 'Первый стих' }, { ro: 'Un verset memorat (toate cele 3 jocuri)', ru: 'Выучен один стих (все 3 игры)' }),
  a('memory_5', 'heart-word', 'verses_mastered', 5, { ro: 'Cuvântul în inimă', ru: 'Слово в сердце' }, { ro: '5 versete memorate', ru: '5 выученных стихов' }),
  a('memory_20', 'gem', 'verses_mastered', 20, { ro: 'Comoară ascunsă', ru: 'Сокровище в сердце' }, { ro: '20 de versete memorate', ru: '20 выученных стихов' }),

  a('lessons_5', 'book-open', 'lessons_read', 5, { ro: 'Pregătit', ru: 'Готов' }, { ro: '5 lecții de la Grup mic citite', ru: '5 прочитанных уроков малой группы' }),
  a('lessons_15', 'users', 'lessons_read', 15, { ro: 'Ucenic', ru: 'Ученик' }, { ro: '15 lecții de la Grup mic citite', ru: '15 прочитанных уроков малой группы' }),

  a('friends_1', 'user-plus', 'friends', 1, { ro: 'Primul prieten', ru: 'Первый друг' }, { ro: 'Primul prieten în aplicație', ru: 'Первый друг в приложении' }),
  a('friends_5', 'users-three', 'friends', 5, { ro: 'Părtășie', ru: 'Общение' }, { ro: '5 prieteni', ru: '5 друзей' }),

  a('prayer_1', 'message-square-more', 'prayers_posted', 1, { ro: 'Cerere încrezătoare', ru: 'С доверием' }, { ro: 'Prima cerere pe peretele de rugăciune', ru: 'Первая просьба на стене молитвы' }),
  a('support_10', 'praying-hands', 'prayers_supported', 10, { ro: 'Mijlocitor', ru: 'Ходатай' }, { ro: 'Te-ai rugat pentru 10 cereri', ru: 'Помолился(ась) за 10 просьб' }),
];

export function progressOf(achievement: Achievement, stats?: MemberStats | null) {
  const value = stats ? Number(stats[achievement.metric]) || 0 : 0;
  return { value: Math.min(value, achievement.goal), ratio: Math.min(1, value / achievement.goal), earned: value >= achievement.goal };
}

export function earnedIds(stats?: MemberStats | null) {
  return ACHIEVEMENTS.filter((x) => progressOf(x, stats).earned).map((x) => x.id);
}

/** Următoarea realizare din aceeași familie (de exemplu Flacără → Foc viu), dacă mai e una de obținut. */
export function nextInFamily(achievement: Achievement, stats?: MemberStats | null) {
  return ACHIEVEMENTS.find((x) => x.metric === achievement.metric && x.goal > achievement.goal && !progressOf(x, stats).earned);
}

/** Realizarea neobținută cea mai aproape de final (după procent); la egalitate, prima din listă. Nimic dacă n-a început niciuna. */
export function closestAchievement(stats?: MemberStats | null) {
  let best: { achievement: Achievement; progress: ReturnType<typeof progressOf> } | null = null;
  for (const achievement of ACHIEVEMENTS) {
    const progress = progressOf(achievement, stats);
    if (progress.earned || progress.ratio === 0) continue;
    if (!best || progress.ratio > best.progress.ratio) best = { achievement, progress };
  }
  return best;
}

/** În română, de la 20 în sus numărul cere „de”: „30 de zile”, dar „15 zile” (aceeași regulă ca roNeedsDe din format.ts; fișierele pure nu se importă între ele, ca să meargă direct cu Node). */
const roCount = (n: number, word: string) => `${n}${n >= 20 && (n % 100 === 0 || n % 100 >= 20) ? ' de' : ''} ${word}`;

const HINTS: Record<Metric, Record<Language, (value: number, goal: number) => string>> = {
  current_streak: { ro: (v, g) => `${v} din ${roCount(g, 'zile la rând')}`, ru: (v, g) => `${v} из ${g} дней подряд` },
  best_streak: { ro: (v, g) => `Recordul tău: ${v} din ${roCount(g, 'zile la rând')}`, ru: (v, g) => `Твой рекорд: ${v} из ${g} дней подряд` },
  active_days: { ro: (v, g) => `${v} din ${roCount(g, 'zile active')}`, ru: (v, g) => `${v} из ${g} активных дней` },
  friends: { ro: (v, g) => `Ai ${v} din ${roCount(g, 'prieteni')}`, ru: (v, g) => `${v} из ${g} друзей` },
  verses_mastered: { ro: (v, g) => `Ai memorat ${v} din ${roCount(g, 'versete')}`, ru: (v, g) => `Выучено ${v} из ${g} стихов` },
  lessons_read: { ro: (v, g) => `Ai citit ${v} din ${roCount(g, 'lecții')}`, ru: (v, g) => `Прочитано ${v} из ${g} уроков` },
  prayers_posted: { ro: (v, g) => `${v} din ${roCount(g, 'cereri')} pe perete`, ru: (v, g) => `${v} из ${g} просьб на стене` },
  prayers_supported: { ro: (v, g) => `Te-ai rugat pentru ${v} din ${roCount(g, 'cereri')}`, ru: (v, g) => `Ты помолился(ась) за ${v} из ${g} просьб` },
};

/** Cât mai e până la o realizare, spus omului („Te-ai rugat pentru 7 din 10 cereri”). La ținta 1 spunem direct ce e de făcut. */
export function progressHint(achievement: Achievement, value: number, lang: Language) {
  if (achievement.goal === 1) return achievement.desc[lang];
  return HINTS[achievement.metric][lang](Math.min(value, achievement.goal), achievement.goal);
}

/**
 * Seria față de record: cât din bară e plină și câte zile mai sunt până la un record nou
 * (recordul e întrecut abia când seria trece de el). `null` = seria de acum e chiar recordul.
 */
export function streakToRecord(current: number, best: number) {
  const record = Math.max(best, current);
  if (record === 0) return { ratio: 0, daysLeft: 1 };
  if (current >= record) return { ratio: 1, daysLeft: null };
  return { ratio: current / record, daysLeft: record - current + 1 };
}

/** „Încă 4 zile până la un record nou” / „Ещё 4 дня до нового рекорда”. */
export function recordNote(lang: Language, daysLeft: number) {
  if (lang === 'ro') return `Încă ${daysLeft === 1 ? '1 zi' : roCount(daysLeft, 'zile')} până la un record nou`;
  const mod10 = daysLeft % 10;
  const mod100 = daysLeft % 100;
  const word = mod10 === 1 && mod100 !== 11 ? 'день' : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'дня' : 'дней';
  return `Ещё ${daysLeft} ${word} до нового рекорда`;
}
