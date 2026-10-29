// Test local pentru supabase/schema.sql, fără Supabase: Postgres în memorie (PGlite) cu auth/storage simulate.
// Rulare (dintr-un folder temporar, ca să nu instalezi PGlite în proiect):
//   mkdir -p /tmp/pgtest && cd /tmp/pgtest && npm i @electric-sql/pglite
//   cp ~/bisbetania/supabase/test-schema.mjs . && node test-schema.mjs ~/bisbetania/supabase/schema.sql
// (scriptul se copiază lângă node_modules, pentru că Node caută pachetele lângă fișierul rulat)
// Verifică: schema rulează de două ori, codul de invitație greșit e respins, profilurile, seria, check-in-ul și regulile RLS.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const q = (s) => db.exec(s);
// Simulăm ce oferă Supabase: rolurile, auth.users, auth.uid(), storage.
await q(`
create role anon; create role authenticated;
create schema auth; create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
`);
const sql = readFileSync(process.argv[2], 'utf8');
await q(sql); console.log('schema OK');
await q(sql); console.log('a doua rulare OK');
await q(`insert into invite_codes(code) values ('BETANIA')`);
try { await q(`insert into auth.users(raw_user_meta_data) values ('{"invite":"GRESIT","nickname":"x"}')`); console.log('EROARE: a acceptat cod greșit'); }
catch (e) { console.log('cod greșit respins:', e.message); }
await q(`insert into auth.users(id, raw_user_meta_data) values ('11111111-1111-1111-1111-111111111111','{"invite":"betania ","nickname":"Ilie_C","first_name":"Ilie","last_name":"Cornos"}'),
  ('22222222-2222-2222-2222-222222222222','{"invite":"BETANIA","nickname":"maria","first_name":"Maria"}')`);
console.log((await db.query(`select nickname, first_name from profiles order by nickname`)).rows);
console.log('nickname liber "maria":', (await db.query(`select nickname_available('Maria') a`)).rows[0].a);
// zile active: 3 zile la rând până azi + una mai veche
await q(`insert into activity_days values
 ('11111111-1111-1111-1111-111111111111', (now() at time zone 'Europe/Chisinau')::date),
 ('11111111-1111-1111-1111-111111111111', (now() at time zone 'Europe/Chisinau')::date - 1),
 ('11111111-1111-1111-1111-111111111111', (now() at time zone 'Europe/Chisinau')::date - 2),
 ('11111111-1111-1111-1111-111111111111', (now() at time zone 'Europe/Chisinau')::date - 10),
 ('22222222-2222-2222-2222-222222222222', (now() at time zone 'Europe/Chisinau')::date - 3)`);
await q(`insert into friendships values ('11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222222','accepted')`);
await q(`insert into memory_scores(user_id, verse_id, fill, "order", recall) values ('11111111-1111-1111-1111-111111111111','20:16:3',2,3,3)`);
console.log((await db.query(`select s.*, p.nickname from member_stats s join profiles p on p.id = s.user_id order by nickname`)).rows);
// check_in ca utilizator
await q(`set test.uid = '22222222-2222-2222-2222-222222222222'; select check_in(); select check_in();`);
console.log('zile maria:', (await db.query(`select count(*) c from activity_days where user_id='22222222-2222-2222-2222-222222222222'`)).rows[0].c);

// ---------- Reguli RLS, rulate ca utilizator logat (rolul „authenticated”) ----------
await q(`grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;`);
const U1 = '11111111-1111-1111-1111-111111111111';
const U3 = '33333333-3333-3333-3333-333333333333';
const U4 = '44444444-4444-4444-4444-444444444444';
await q(`insert into auth.users(id, raw_user_meta_data) values
  ('${U3}', '{"invite":"BETANIA","nickname":"ion"}'), ('${U4}', '{"invite":"BETANIA","nickname":"ana"}')`);

let failed = 0;
async function as(uid, sql) {
  await q(`set role authenticated; select set_config('test.uid', '${uid}', false);`);
  try { return await db.query(sql); } finally { await q('reset role'); }
}
async function expectRows(name, uid, sql, n) {
  try {
    const r = await as(uid, sql);
    const got = r.affectedRows ?? r.rows.length;
    const count = r.rows.length || got;
    if (count === n) console.log(`  ✓ ${name}`);
    else { failed++; console.log(`  ✗ ${name}: ${count} rânduri, așteptat ${n}`); }
  } catch (e) { failed++; console.log(`  ✗ ${name}: eroare ${e.message}`); }
}
async function expectFail(name, uid, sql) {
  try { await as(uid, sql); failed++; console.log(`  ✗ ${name}: a fost permis`); }
  catch { console.log(`  ✓ ${name}`); }
}

console.log('RLS:');
await expectRows('trimit o cerere de prietenie', U3, `insert into friendships(requester, addressee) values ('${U3}', '${U4}') returning *`, 1);
await expectFail('nu pot trimite cerere în numele altcuiva', U3, `insert into friendships(requester, addressee) values ('${U4}', '${U1}')`);
await expectFail('nu pot crea direct o prietenie acceptată', U3, `insert into friendships(requester, addressee, status) values ('${U3}', '${U1}', 'accepted')`);
await expectFail('nu există cerere dublă inversă', U4, `insert into friendships(requester, addressee) values ('${U4}', '${U3}')`);
await expectRows('un străin nu poate accepta cererea altcuiva', U1, `update friendships set status = 'accepted' where requester = '${U3}' and addressee = '${U4}' returning *`, 0);
await expectFail('destinatarul nu poate schimba expeditorul', U4, `update friendships set requester = '${U1}' where requester = '${U3}' and addressee = '${U4}'`);
await expectRows('destinatarul acceptă', U4, `update friendships set status = 'accepted' where requester = '${U3}' and addressee = '${U4}' returning *`, 1);

await expectRows('postez o cerere doar pentru prieteni', U3, `insert into wall_prayers(user_id, text, visibility) values ('${U3}', 'Pentru examen', 'friends') returning *`, 1);
await expectRows('prietenul o vede', U4, `select * from wall_prayers where user_id = '${U3}'`, 1);
await expectRows('un străin nu o vede', U1, `select * from wall_prayers where user_id = '${U3}'`, 0);
await expectRows('postez o cerere pentru toți', U3, `insert into wall_prayers(user_id, text) values ('${U3}', 'Pentru familie') returning *`, 1);
await expectRows('străinul o vede pe cea publică', U1, `select * from wall_prayers where user_id = '${U3}'`, 1);
await expectRows('străinul nu poate șterge cererea altcuiva', U1, `delete from wall_prayers where user_id = '${U3}' returning *`, 0);
await expectRows('mă rog pentru cineva', U1, `insert into prayer_support(prayer_id, user_id) select id, '${U1}' from wall_prayers where visibility = 'all' and user_id = '${U3}' returning *`, 1);
await expectFail('nu mă pot ruga în numele altcuiva', U1, `insert into prayer_support(prayer_id, user_id) select id, '${U4}' from wall_prayers where visibility = 'all' and user_id = '${U3}'`);
await expectRows('autorul își marchează cererea ca răspunsă', U3, `update wall_prayers set answered_at = now() where visibility = 'all' and user_id = '${U3}' returning *`, 1);

await expectFail('nu pot adăuga direct zile active', U3, `insert into activity_days values ('${U3}', current_date)`);
await expectRows('check-in în numele meu', U3, `select check_in()`, 1);
await expectRows('îmi salvez scorul la memorare', U3, `insert into memory_scores(user_id, verse_id, fill) values ('${U3}', '43:3:16', 3) returning *`, 1);
await expectFail('nu pot salva scorul altcuiva', U3, `insert into memory_scores(user_id, verse_id, fill) values ('${U4}', '43:3:16', 3)`);
await expectRows('bifez o lecție', U3, `insert into lesson_reads(user_id, lesson_id) values ('${U3}', 'lectia-5') returning *`, 1);
await expectRows('re-bifez o lecție (upsert cu ignoreDuplicates = ON CONFLICT DO NOTHING)', U3, `insert into lesson_reads(user_id, lesson_id) values ('${U3}', 'lectia-5') on conflict (user_id, lesson_id) do nothing returning *`, 0);
await expectFail('upsert cu DO UPDATE pe lecții e refuzat (fără drept de UPDATE)', U3, `insert into lesson_reads(user_id, lesson_id) values ('${U3}', 'lectia-5') on conflict (user_id, lesson_id) do update set created_at = now()`);
await expectRows('upsert pe scorurile de memorare (au drept de UPDATE)', U3, `insert into memory_scores(user_id, verse_id, fill) values ('${U3}', '43:3:16', 2) on conflict (user_id, verse_id) do update set fill = greatest(memory_scores.fill, excluded.fill) returning *`, 1);
await expectFail('nu pot citi codurile de invitație', U3, `select * from invite_codes`);
await expectRows('nu pot edita profilul altcuiva', U3, `update profiles set bio = 'x' where id = '${U4}' returning *`, 0);
await expectRows('îmi editez profilul', U3, `update profiles set bio = 'Salut' where id = '${U3}' returning *`, 1);
await expectRows('văd statisticile membrilor', U3, `select * from member_stats`, 4);
await expectRows('numărul de cereri (și cele doar pentru prieteni) e același și pentru un străin', U1, `select * from member_stats where user_id = '${U3}' and prayers_posted = 2`, 1);

console.log(failed ? `\n${failed} TESTE PICATE` : '\nToate testele RLS au trecut.');
process.exit(failed ? 1 : 0);
