-- 002 · Numărul de cereri de rugăciune din statistici e același pentru toți membrii
-- (înainte, cererile „doar pentru prieteni” nu se numărau pentru cei care nu le pot vedea).

-- Câte cereri a postat cineva, numărând și pe cele „doar pentru prieteni” (fără să le arate conținutul),
-- ca realizarea „Cerere încrezătoare” să arate la fel pentru toți membrii.
create or replace function public.prayers_posted_count(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from wall_prayers where user_id = p_user;
$$;
revoke execute on function public.prayers_posted_count(uuid) from public, anon;
grant execute on function public.prayers_posted_count(uuid) to authenticated;

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
  public.prayers_posted_count(p.id) as prayers_posted,
  (select count(*) from public.prayer_support ps where ps.user_id = p.id)::int as prayers_supported
from public.profiles p;

grant select on public.member_stats to authenticated;
