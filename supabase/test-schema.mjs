// Test local pentru supabase/schema.sql, fără Supabase: Postgres în memorie (PGlite) cu auth/storage simulate.
// Rulare (dintr-un folder temporar, ca să nu instalezi PGlite în proiect):
//   mkdir -p /tmp/pgtest && cd /tmp/pgtest && npm i @electric-sql/pglite
//   node ~/bisbetania/supabase/test-schema.mjs ~/bisbetania/supabase/schema.sql
// Verifică: schema rulează de două ori, codul de invitație greșit e respins, profilurile, seria, check-in-ul.
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
