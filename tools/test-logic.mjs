// Teste pentru logica pură (fără React, fără rețea).
// Rulare: node --experimental-strip-types --no-warnings tools/test-logic.mjs
const { relationOf, friendIdsOf, suggestionsFor, streakRanking } = await import('../lib/social.ts');
const { ACHIEVEMENTS, progressOf, earnedIds } = await import('../lib/achievements.ts');

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

console.log('Clasament:');
const rstats = new Map([S('ana', 5, 9, 20), S('ion', 5, 12, 15), S('dan', 0, 3, 3), S('eva', 0, 0, 0)].map((s) => [s.user_id, s]));
check('serie, apoi record; fără cei inactivi', streakRanking(people, rstats).map((x) => x.profile.id), ['ion', 'ana', 'dan']);

console.log('Realizări:');
const streak7 = ACHIEVEMENTS.find((x) => x.id === 'streak_7');
check('6 din 7 nu e obținută', progressOf(streak7, S('x', 6)).earned, false);
check('7 din 7 e obținută', progressOf(streak7, S('x', 1, 7)).earned, true);
check('progresul nu trece de 100%', progressOf(streak7, S('x', 40)).ratio, 1);
check('fără statistici', earnedIds(null), []);
check('seria ruptă nu pierde realizarea (după record)', earnedIds(S('x', 0, 8)).filter((id) => id.startsWith('streak')), ['streak_3', 'streak_7']);
check('id-uri unice', new Set(ACHIEVEMENTS.map((x) => x.id)).size, ACHIEVEMENTS.length);

console.log(failed ? `\n${failed} TESTE PICATE` : '\nToate testele de logică au trecut.');
process.exit(failed ? 1 : 0);
