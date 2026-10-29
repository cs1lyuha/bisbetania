-- BisBetania · baza de date comună (Supabase)
-- Se rulează o singură dată: Supabase → SQL Editor → New query → lipește tot fișierul → Run.
-- Poate fi rulat din nou fără să strice datele (folosește „if not exists” / „or replace”).

-- ============================================================
-- Coduri de invitație: fără cod valid nu se poate crea cont.
-- Nu au politici RLS, deci aplicația nu le poate citi; se verifică doar în trigger-ul de mai jos.
-- ============================================================
create table if not exists public.invite_codes (
  code text primary key,
  uses int not null default 0,
  max_uses int not null default 80,
  active boolean not null default true
);
alter table public.invite_codes enable row level security;

-- ============================================================
-- Profiluri
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nickname text not null unique check (nickname ~ '^[a-z0-9_.]{3,20}$'),
  first_name text not null default '' check (char_length(first_name) <= 40),
  last_name text not null default '' check (char_length(last_name) <= 40),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar_url text,
  favorite_verse jsonb, -- {"b":43,"c":3,"v":16} după numerotarea românească
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "membrii văd profilurile" on public.profiles;
create policy "membrii văd profilurile" on public.profiles for select to authenticated using (true);
drop policy if exists "fiecare își editează profilul" on public.profiles;
create policy "fiecare își editează profilul" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- La înregistrare: verifică codul de invitație și creează profilul.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_code text := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite', '')));
begin
  update invite_codes set uses = uses + 1
    where code = v_code and active and uses < max_uses;
  if not found then
    raise exception 'INVALID_INVITE';
  end if;

  insert into profiles (id, nickname, first_name, last_name)
  values (
    new.id,
    lower(trim(new.raw_user_meta_data ->> 'nickname')),
    trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    trim(coalesce(new.raw_user_meta_data ->> 'last_name', ''))
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Verifică dacă un nickname e liber (pentru formularul de înregistrare, înainte de cont).
create or replace function public.nickname_available(p_nickname text) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (select 1 from profiles where nickname = lower(trim(p_nickname)));
$$;
grant execute on function public.nickname_available(text) to anon, authenticated;

-- Ștergerea propriului cont (cu tot ce ține de el, prin „on delete cascade”).
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = public as $$
  delete from auth.users where id = auth.uid();
$$;
grant execute on function public.delete_my_account() to authenticated;

-- ============================================================
-- Zilele active (seria): o zi contează dacă ai intrat în aplicație.
-- ============================================================
create table if not exists public.activity_days (
  user_id uuid not null references public.profiles on delete cascade,
  day date not null,
  primary key (user_id, day)
);
alter table public.activity_days enable row level security;

drop policy if exists "membrii văd zilele active" on public.activity_days;
create policy "membrii văd zilele active" on public.activity_days for select to authenticated using (true);

-- Ziua se socotește după ora Moldovei, pe server, ca să nu depindă de ceasul telefonului.
create or replace function public.check_in() returns void
language sql security definer set search_path = public as $$
  insert into activity_days (user_id, day)
  values (auth.uid(), (now() at time zone 'Europe/Chisinau')::date)
  on conflict do nothing;
$$;
grant execute on function public.check_in() to authenticated;

-- ============================================================
-- Prieteni
-- ============================================================
create table if not exists public.friendships (
  requester uuid not null references public.profiles on delete cascade,
  addressee uuid not null references public.profiles on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
alter table public.friendships enable row level security;

drop policy if exists "membrii văd prieteniile" on public.friendships;
create policy "membrii văd prieteniile" on public.friendships for select to authenticated using (true);
drop policy if exists "trimiți cereri doar în numele tău" on public.friendships;
create policy "trimiți cereri doar în numele tău" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending');
drop policy if exists "doar destinatarul acceptă" on public.friendships;
create policy "doar destinatarul acceptă" on public.friendships for update to authenticated
  using (addressee = auth.uid()) with check (addressee = auth.uid());
drop policy if exists "oricare dintre cei doi poate șterge" on public.friendships;
create policy "oricare dintre cei doi poate șterge" on public.friendships for delete to authenticated
  using (auth.uid() in (requester, addressee));

create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable set search_path = public as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;

-- ============================================================
-- Peretele de rugăciune
-- ============================================================
create table if not exists public.wall_prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  text text not null check (char_length(text) between 1 and 500),
  visibility text not null default 'all' check (visibility in ('all', 'friends')),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.wall_prayers enable row level security;

drop policy if exists "vezi cererile publice, ale prietenilor și ale tale" on public.wall_prayers;
create policy "vezi cererile publice, ale prietenilor și ale tale" on public.wall_prayers for select to authenticated
  using (visibility = 'all' or user_id = auth.uid() or public.are_friends(user_id, auth.uid()));
drop policy if exists "scrii doar în numele tău" on public.wall_prayers;
create policy "scrii doar în numele tău" on public.wall_prayers for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "îți editezi doar cererile tale" on public.wall_prayers;
create policy "îți editezi doar cererile tale" on public.wall_prayers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "îți ștergi doar cererile tale" on public.wall_prayers;
create policy "îți ștergi doar cererile tale" on public.wall_prayers for delete to authenticated
  using (user_id = auth.uid());

-- „🙏 Mă rog pentru tine”
create table if not exists public.prayer_support (
  prayer_id uuid not null references public.wall_prayers on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (prayer_id, user_id)
);
alter table public.prayer_support enable row level security;

drop policy if exists "membrii văd cine se roagă" on public.prayer_support;
create policy "membrii văd cine se roagă" on public.prayer_support for select to authenticated using (true);
drop policy if exists "te rogi doar în numele tău" on public.prayer_support;
create policy "te rogi doar în numele tău" on public.prayer_support for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists "îți retragi doar rugăciunea ta" on public.prayer_support;
create policy "îți retragi doar rugăciunea ta" on public.prayer_support for delete to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- Memorare și Grup mic (sincronizate de pe telefon, pentru clasament și realizări)
-- ============================================================
create table if not exists public.memory_scores (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  verse_id text not null, -- „43:3:16”
  fill int not null default 0 check (fill between 0 and 3),
  "order" int not null default 0 check ("order" between 0 and 3),
  recall int not null default 0 check (recall between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (user_id, verse_id)
);
alter table public.memory_scores enable row level security;

drop policy if exists "membrii văd scorurile" on public.memory_scores;
create policy "membrii văd scorurile" on public.memory_scores for select to authenticated using (true);
drop policy if exists "îți salvezi doar scorurile tale" on public.memory_scores;
create policy "îți salvezi doar scorurile tale" on public.memory_scores for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.lesson_reads (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  lesson_id text not null, -- id-ul evenimentului din calendarul tineretului
  created_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
alter table public.lesson_reads enable row level security;

drop policy if exists "membrii văd cine a citit" on public.lesson_reads;
create policy "membrii văd cine a citit" on public.lesson_reads for select to authenticated using (true);
drop policy if exists "îți bifezi doar lecțiile tale" on public.lesson_reads;
create policy "îți bifezi doar lecțiile tale" on public.lesson_reads for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- Statistici pe membru (seria, realizările se calculează din ele în aplicație)
-- ============================================================
create or replace view public.member_stats with (security_invoker = true) as
with days as (
  select user_id, day, day - (row_number() over (partition by user_id order by day))::int as grp
  from public.activity_days
),
streaks as (
  select user_id, max(day) as last_day, count(*)::int as len
  from days group by user_id, grp
),
today as (select (now() at time zone 'Europe/Chisinau')::date as d)
select
  p.id as user_id,
  coalesce((select s.len from streaks s, today
            where s.user_id = p.id and s.last_day >= today.d - 1
            order by s.last_day desc limit 1), 0) as current_streak,
  coalesce((select max(s.len) from streaks s where s.user_id = p.id), 0) as best_streak,
  (select count(*) from public.activity_days a where a.user_id = p.id)::int as active_days,
  (select count(*) from public.friendships f
     where f.status = 'accepted' and p.id in (f.requester, f.addressee))::int as friends,
  (select count(*) from public.memory_scores m
     where m.user_id = p.id and m.fill > 0 and m."order" > 0 and m.recall > 0)::int as verses_mastered,
  (select count(*) from public.lesson_reads l where l.user_id = p.id)::int as lessons_read,
  (select count(*) from public.wall_prayers w where w.user_id = p.id)::int as prayers_posted,
  (select count(*) from public.prayer_support ps where ps.user_id = p.id)::int as prayers_supported
from public.profiles p;

grant select on public.member_stats to authenticated;

-- ============================================================
-- Poze de profil: bucket public, fiecare scrie doar în folderul lui (avatars/<id>/...)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar: încarci doar în folderul tău" on storage.objects;
create policy "avatar: încarci doar în folderul tău" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar: înlocuiești doar poza ta" on storage.objects;
create policy "avatar: înlocuiești doar poza ta" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatar: ștergi doar poza ta" on storage.objects;
create policy "avatar: ștergi doar poza ta" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
