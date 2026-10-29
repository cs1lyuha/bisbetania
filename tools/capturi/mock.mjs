// Date inventate pentru capturi (nicio persoană reală). Cererile către Supabase sunt interceptate și primesc aceste date.
const id = (n) => `aaaaaaaa-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const ME = id(1);
const now = Date.now();
const ago = (h) => new Date(now - h * 3600_000).toISOString();

const P = (n, nickname, first_name, last_name, bio = '', favorite_verse = null) => ({
  id: id(n), nickname, first_name, last_name, bio, avatar_url: null, favorite_verse, created_at: ago(24 * (60 - n)),
});

export const profiles = [
  P(1, 'alex.m', 'Alex', 'Moraru', 'Iubesc muzica de închinare și drumețiile. Cânt la chitară în echipa de laudă 🎸', { lang: 'ro', b: 43, c: 15, v: 5 }),
  P(2, 'ana_rusu', 'Ana', 'Rusu', 'Studentă la medicină. Mă rog pentru fiecare pacient.', { lang: 'ro', b: 50, c: 4, v: 13 }),
  P(3, 'ionut.c', 'Ionuț', 'Ceban', 'Fotografie, fotbal și Grup mic miercurea.'),
  P(4, 'maria.popa', 'Maria', 'Popa', '„Domnul este Păstorul meu” — de mică.', { lang: 'ro', b: 19, c: 23, v: 1 }),
  P(5, 'dan_lungu', 'Daniel', 'Lungu', 'Liceul „Spiru Haret”, clasa a XI-a.'),
  P(6, 'elena.cojocaru', 'Elena', 'Cojocaru', ''),
  P(7, 'andrei.m', 'Andrei', 'Munteanu', 'Coordonez echipa media la Tineret.'),
  P(8, 'cristina.b', 'Cristina', 'Botnaru', 'Iubesc copiii și școala duminicală ☀️'),
  P(9, 'natasha', 'Наталья', 'Иванова', 'Люблю петь и печь пироги для молодёжки 🙂', { lang: 'ru', b: 45, c: 8, v: 28 }),
  P(10, 'dima.p', 'Дмитрий', 'Петров', ''),
  P(11, 'mihai.ursu', 'Mihai', 'Ursu', 'Mecanic auto, încă învăț să mă rog mai mult.'),
];

const S = (n, current_streak, best_streak, active_days, friends, verses_mastered, lessons_read, prayers_posted, prayers_supported) => ({
  user_id: id(n), current_streak, best_streak, active_days, friends, verses_mastered, lessons_read, prayers_posted, prayers_supported,
});

export const member_stats = [
  S(1, 12, 15, 34, 3, 3, 5, 2, 7),
  S(2, 21, 21, 40, 3, 6, 7, 3, 14),
  S(3, 8, 11, 27, 3, 1, 4, 0, 3),
  S(4, 3, 9, 30, 2, 2, 6, 1, 9),
  S(5, 1, 4, 9, 0, 0, 1, 1, 0),
  S(6, 0, 2, 5, 0, 0, 0, 0, 1),
  S(7, 15, 30, 52, 2, 4, 6, 1, 11),
  S(8, 5, 6, 18, 1, 1, 3, 0, 4),
  S(9, 9, 9, 22, 0, 2, 2, 1, 6),
  S(10, 0, 3, 6, 0, 0, 0, 0, 0),
  S(11, 2, 2, 4, 0, 0, 1, 0, 1),
];

const F = (a, b, status = 'accepted', h = 200) => ({ requester: id(a), addressee: id(b), status, created_at: ago(h) });
export const friendships = [
  F(1, 2), F(3, 1), F(1, 4),
  F(5, 1, 'pending', 3), // cerere primită
  F(1, 6, 'pending', 20), // cerere trimisă
  F(2, 7), F(3, 7), F(4, 8), F(2, 3),
];

const W = (pid, n, text, visibility, hoursAgo, supporters, answered = false) => ({
  id: `prayer-${pid}`, user_id: id(n), text, visibility, answered_at: answered ? ago(hoursAgo / 2) : null, created_at: ago(hoursAgo),
  prayer_support: supporters.map((s) => ({ user_id: id(s) })),
});
export const wall_prayers = [
  W(1, 2, 'Vă rog să vă rugați pentru examenul meu de anatomie de vineri. Am învățat mult, dar am emoții 🙏', 'all', 2, [3, 4, 7, 9]),
  W(2, 4, 'Bunica mea e internată de câteva zile. Rugați-vă pentru vindecare și pace pentru familia noastră.', 'all', 26, [1, 2, 3, 7, 8, 9, 11]),
  W(3, 1, 'Pentru tabăra de casă din noiembrie — să vină și prietenii pe care i-am invitat.', 'friends', 50, [2, 4]),
  W(4, 9, 'Молитесь, пожалуйста, за мою подругу Олю — она впервые придёт на молодёжку в пятницу.', 'all', 74, [1, 2, 7]),
  W(5, 7, 'Mulțumim pentru rugăciuni — am primit locul de muncă! Dumnezeu e credincios.', 'all', 140, [1, 2, 3, 4, 5, 8], true),
];

const M = (n, verse_id, fill, order, recall) => ({ user_id: id(n), verse_id, fill, order, recall, updated_at: ago(n) });
const WEEK = '20:16:3';
export const memory_scores = [
  M(1, WEEK, 3, 2, 0), M(2, WEEK, 3, 3, 3), M(7, WEEK, 3, 3, 2), M(4, WEEK, 2, 3, 2), M(9, WEEK, 3, 2, 1), M(3, WEEK, 1, 2, 0),
];

export const LESSON = 'gjqs0pkhgn9c84b5ua9pkl31q8@google.com@1793811600000'; // Lecția 5 · Ioan 5
export const lesson_reads = [2, 3, 7, 8, 4].map((n) => ({ user_id: id(n), lesson_id: LESSON, created_at: ago(n) }));

export const tables = { profiles, member_stats, friendships, wall_prayers, memory_scores, lesson_reads };

export function fakeSession() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(now / 1000) + 365 * 86400;
  const user = {
    id: ME, aud: 'authenticated', role: 'authenticated', email: 'alex@example.com',
    app_metadata: { provider: 'email' }, user_metadata: { nickname: 'alex.m' }, created_at: ago(24 * 59),
  };
  return {
    access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, role: 'authenticated', exp })}.fake`,
    refresh_token: 'fake-refresh', token_type: 'bearer', expires_in: 365 * 86400, expires_at: exp, user,
  };
}
