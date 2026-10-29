// Realizările se calculează doar din statisticile publice ale membrului (view-ul member_stats),
// așa că toți le văd la fel și nu trebuie salvate separat.
import type { Language } from '../i18n/translations';
import type { MemberStats } from './supabase';

type Localized = Record<Language, string>;
type Metric = Exclude<keyof MemberStats, 'user_id'>;

export interface Achievement {
  id: string;
  icon: string; // nume Ionicons
  metric: Metric;
  goal: number;
  title: Localized;
  desc: Localized;
}

const a = (id: string, icon: string, metric: Metric, goal: number, title: Localized, desc: Localized): Achievement => ({ id, icon, metric, goal, title, desc });

export const ACHIEVEMENTS: Achievement[] = [
  // Seria: după record, ca realizarea să rămână și dacă seria se rupe.
  a('streak_3', 'flame-outline', 'best_streak', 3, { ro: 'Scânteie', ru: 'Искра' }, { ro: '3 zile la rând în aplicație', ru: '3 дня подряд в приложении' }),
  a('streak_7', 'flame', 'best_streak', 7, { ro: 'Flacără', ru: 'Пламя' }, { ro: 'O săptămână întreagă la rând', ru: 'Целая неделя подряд' }),
  a('streak_30', 'bonfire-outline', 'best_streak', 30, { ro: 'Foc viu', ru: 'Живой огонь' }, { ro: '30 de zile la rând', ru: '30 дней подряд' }),
  a('streak_100', 'bonfire', 'best_streak', 100, { ro: 'Rugul aprins', ru: 'Неопалимая купина' }, { ro: '100 de zile la rând', ru: '100 дней подряд' }),
  a('days_50', 'calendar', 'active_days', 50, { ro: 'Credincios', ru: 'Верный' }, { ro: '50 de zile active în total', ru: '50 активных дней всего' }),

  a('memory_1', 'bulb-outline', 'verses_mastered', 1, { ro: 'Primul verset', ru: 'Первый стих' }, { ro: 'Un verset memorat (toate cele 3 jocuri)', ru: 'Выучен один стих (все 3 игры)' }),
  a('memory_5', 'bulb', 'verses_mastered', 5, { ro: 'Cuvântul în inimă', ru: 'Слово в сердце' }, { ro: '5 versete memorate', ru: '5 выученных стихов' }),
  a('memory_20', 'library', 'verses_mastered', 20, { ro: 'Comoară ascunsă', ru: 'Сокровище в сердце' }, { ro: '20 de versete memorate', ru: '20 выученных стихов' }),

  a('lessons_5', 'people-outline', 'lessons_read', 5, { ro: 'Pregătit', ru: 'Готов' }, { ro: '5 lecții de la Grup mic citite', ru: '5 прочитанных уроков малой группы' }),
  a('lessons_15', 'people', 'lessons_read', 15, { ro: 'Ucenic', ru: 'Ученик' }, { ro: '15 lecții de la Grup mic citite', ru: '15 прочитанных уроков малой группы' }),

  a('friends_1', 'person-add-outline', 'friends', 1, { ro: 'Primul prieten', ru: 'Первый друг' }, { ro: 'Primul prieten în aplicație', ru: 'Первый друг в приложении' }),
  a('friends_5', 'people-circle-outline', 'friends', 5, { ro: 'Părtășie', ru: 'Общение' }, { ro: '5 prieteni', ru: '5 друзей' }),

  a('prayer_1', 'chatbubble-ellipses-outline', 'prayers_posted', 1, { ro: 'Cerere încrezătoare', ru: 'С доверием' }, { ro: 'Prima cerere pe peretele de rugăciune', ru: 'Первая просьба на стене молитвы' }),
  a('support_10', 'heart-circle-outline', 'prayers_supported', 10, { ro: 'Mijlocitor', ru: 'Ходатай' }, { ro: 'Te-ai rugat pentru 10 cereri', ru: 'Помолился(ась) за 10 просьб' }),
];

export function progressOf(achievement: Achievement, stats?: MemberStats | null) {
  const value = stats ? Number(stats[achievement.metric]) || 0 : 0;
  return { value: Math.min(value, achievement.goal), ratio: Math.min(1, value / achievement.goal), earned: value >= achievement.goal };
}

export function earnedIds(stats?: MemberStats | null) {
  return ACHIEVEMENTS.filter((x) => progressOf(x, stats).earned).map((x) => x.id);
}
