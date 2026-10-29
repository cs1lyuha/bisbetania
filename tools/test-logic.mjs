// Teste pentru logica pură (fără React, fără rețea).
// Rulare: node --experimental-strip-types --no-warnings tools/test-logic.mjs
const { relationOf, friendIdsOf, suggestionsFor, streakRanking, podiumOrder } = await import('../lib/social.ts');
const { ACHIEVEMENTS, progressOf, earnedIds, nextInFamily, closestAchievement, progressHint, streakToRecord, recordNote } = await import('../lib/achievements.ts');
const { pluralWord, countLabel } = await import('../lib/format.ts');
const { supportersSentence, prayedSentence } = await import('../lib/wall.ts');

let failed = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) failed++;
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok ? '' : ` → ${JSON.stringify(got)}, așteptat ${JSON.stringify(want)}`}`);
};

const P = (id, first) => ({ id, nickname: id, first_name: first, last_name: '', bio: '', avatar_url: null, favorite_verse: null, created_at: '' });
const S = (id, current, best = current, days = best) => ({ user_id: id, current_streak: current, best_streak: best, active_days: days, friends: 0, verses_mastered: 0, lessons_read: 0, prayers_posted: 0, prayers_supported: 0 });
const F = (requester, addressee, status = 'accepted') => ({ requester, addressee, status, created_at: '' });

console.log('Relații:');
const fs = [F('me', 'ana'), F('ion', 'me', 'pending'), F('me', 'dan', 'pending'), F('ana', 'eva'), F('ion', 'eva')];
check('eu', relationOf('me', 'me', fs), 'self');
check('prieten (indiferent cine a trimis)', relationOf('me', 'ana', fs), 'friends');
check('cerere primită', relationOf('me', 'ion', fs), 'received');
check('cerere trimisă', relationOf('me', 'dan', fs), 'sent');
check('nicio legătură', relationOf('me', 'eva', fs), 'none');
check('nelogat', relationOf(undefined, 'ana', fs), 'none');
check('prietenii Evei', [...friendIdsOf('eva', fs)].sort(), ['ana', 'ion']);

console.log('Sugestii:');
const people = [P('ana', 'Ana'), P('ion', 'Ion'), P('dan', 'Dan'), P('eva', 'Eva'), P('zoe', 'Zoe'), P('bob', 'Bob')];
const stats = new Map([S('zoe', 9), S('bob', 2)].map((s) => [s.user_id, s]));
const sug = suggestionsFor('me', people, fs, stats).map((x) => `${x.profile.id}:${x.mutual}`);
check('fără prieteni/cereri existente; întâi prietenii comuni, apoi seria', sug, ['eva:1', 'zoe:0', 'bob:0']);
check('fără membri', suggestionsFor('me', [], [], new Map()), []);
check('prietenii comuni ai Evei, pentru poze', suggestionsFor('me', people, fs, stats)[0].mutualIds, ['ana']);

console.log('Clasament:');
const rstats = new Map([S('ana', 5, 9, 20), S('ion', 5, 12, 15), S('dan', 0, 3, 3), S('eva', 0, 0, 0)].map((s) => [s.user_id, s]));
check('serie, apoi record; fără cei inactivi', streakRanking(people, rstats).map((x) => x.profile.id), ['ion', 'ana', 'dan']);
check('podium 2 · 1 · 3', podiumOrder(['a', 'b', 'c', 'd']).map((x) => `${x.place}${x.item}`), ['2b', '1a', '3c']);
check('podium cu doi', podiumOrder(['a', 'b']).map((x) => `${x.place}${x.item}`), ['2b', '1a']);
check('podium cu unul', podiumOrder(['a']).map((x) => `${x.place}${x.item}`), ['1a']);
check('podium gol', podiumOrder([]), []);

console.log('Realizări:');
const streak7 = ACHIEVEMENTS.find((x) => x.id === 'streak_7');
check('6 din 7 nu e obținută', progressOf(streak7, S('x', 6)).earned, false);
check('7 din 7 e obținută', progressOf(streak7, S('x', 1, 7)).earned, true);
check('progresul nu trece de 100%', progressOf(streak7, S('x', 40)).ratio, 1);
check('fără statistici', earnedIds(null), []);
check('seria ruptă nu pierde realizarea (după record)', earnedIds(S('x', 0, 8)).filter((id) => id.startsWith('streak')), ['streak_3', 'streak_7']);
check('id-uri unice', new Set(ACHIEVEMENTS.map((x) => x.id)).size, ACHIEVEMENTS.length);
const byId = (id) => ACHIEVEMENTS.find((x) => x.id === id);
const alex = { ...S('x', 12, 15, 34), friends: 3, verses_mastered: 3, lessons_read: 5, prayers_posted: 2, prayers_supported: 7 };
check('după Flacără urmează Foc viu', nextInFamily(byId('streak_7'), alex)?.id, 'streak_30');
check('după ultima din familie nu mai e nimic', nextInFamily(byId('streak_100'), alex), undefined);
check('sare peste cele deja obținute', nextInFamily(byId('streak_3'), S('x', 1, 8))?.id, 'streak_30');
check('cea mai aproape: Mijlocitor 7/10 (înaintea lui Credincios 34/50)', closestAchievement(alex)?.achievement.id, 'support_10');
check('nicio realizare începută', closestAchievement(S('x', 0, 0, 0)), null);
check('toate obținute', closestAchievement({ ...S('x', 100, 100, 100), friends: 9, verses_mastered: 30, lessons_read: 30, prayers_posted: 3, prayers_supported: 20 }), null);
check('indiciu RO', progressHint(byId('support_10'), 7, 'ro'), 'Te-ai rugat pentru 7 din 10 cereri');
check('indiciu RO cu „de”', progressHint(byId('streak_30'), 15, 'ro'), 'Recordul tău: 15 din 30 de zile la rând');
check('indiciu RO, 100', progressHint(byId('streak_100'), 15, 'ro'), 'Recordul tău: 15 din 100 de zile la rând');
check('indiciu RU', progressHint(byId('memory_20'), 3, 'ru'), 'Выучено 3 из 20 стихов');
check('ținta 1: spunem ce e de făcut', progressHint(byId('prayer_1'), 0, 'ro'), byId('prayer_1').desc.ro);
check('seria sub record: 4 zile până la unul nou', streakToRecord(12, 15), { ratio: 0.8, daysLeft: 4 });
check('seria e recordul', streakToRecord(15, 15), { ratio: 1, daysLeft: null });
check('seria ruptă', streakToRecord(0, 5), { ratio: 0, daysLeft: 6 });
check('nicio zi încă', streakToRecord(0, 0), { ratio: 0, daysLeft: 1 });
check('record mai mic decât seria (date vechi)', streakToRecord(4, 3), { ratio: 1, daysLeft: null });
check('nota recordului RO', recordNote('ro', 4), 'Încă 4 zile până la un record nou');
check('nota recordului RO, o zi', recordNote('ro', 1), 'Încă 1 zi până la un record nou');
check('nota recordului RO, 21', recordNote('ro', 21), 'Încă 21 de zile până la un record nou');
check('nota recordului RU', [1, 3, 5, 11, 22].map((n) => recordNote('ru', n)), ['Ещё 1 день до нового рекорда', 'Ещё 3 дня до нового рекорда', 'Ещё 5 дней до нового рекорда', 'Ещё 11 дней до нового рекорда', 'Ещё 22 дня до нового рекорда']);
check('doar cuvântul (RO)', [1, 12].map((n) => pluralWord('ro', n, ['zi', 'zile'], ['день', 'дня', 'дней'])), ['zi', 'zile']);
check('doar cuvântul (RO) cu „de”', [25, 100, 101, 119, 120].map((n) => pluralWord('ro', n, ['zi', 'zile'], ['день', 'дня', 'дней'])), ['de zile', 'de zile', 'zile', 'zile', 'de zile']);
check('countLabel RO cu „de”', [countLabel('ro', 22, ['zi activă', 'zile active'], ['', '', '']), countLabel('ro', 9, ['zi activă', 'zile active'], ['', '', ''])], ['22 de zile active', '9 zile active']);
check('doar cuvântul (RU)', [1, 3, 12, 21].map((n) => pluralWord('ru', n, ['zi', 'zile'], ['день', 'дня', 'дней'])), ['день', 'дня', 'дней', 'день']);

console.log('Peretele de rugăciune:');
check('nimeni', supportersSentence('ro', []), '');
check('unul', supportersSentence('ro', ['Ana']), 'Ana se roagă pentru tine');
check('doi', supportersSentence('ro', ['Ana', 'Maria']), 'Ana și Maria se roagă pentru tine');
check('mai mulți', supportersSentence('ru', ['Ana', 'Maria', 'Ion', 'Eva']), 'Ana, Maria и ещё 2 молятся за тебя');
check('tu și alții', prayedSentence('ro', 6, true), 'Tu și încă 5 v-ați rugat');
check('doar tu', prayedSentence('ru', 1, true), 'Ты молился(ась) за эту просьбу');
check('alții, RO', prayedSentence('ro', 5, false), '5 persoane s-au rugat');
check('alții, RO de la 20', prayedSentence('ro', 21, false), '21 de persoane s-au rugat');
check('alții, RO 100', prayedSentence('ro', 100, false), '100 de persoane s-au rugat');
check('alții, RU 3', prayedSentence('ru', 3, false), 'Молились 3 человека');
check('alții, RU 12', prayedSentence('ru', 12, false), 'Молились 12 человек');
check('nimeni s-a rugat', prayedSentence('ro', 0, false), '');

console.log(failed ? `\n${failed} TESTE PICATE` : '\nToate testele de logică au trecut.');
process.exit(failed ? 1 : 0);
