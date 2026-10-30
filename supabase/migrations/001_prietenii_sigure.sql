-- 001 · Prietenii mai sigure
-- 1) Cel care primește cererea poate schimba DOAR statusul (altfel ar putea pune alt expeditor și ar „împrieteni” pe cineva fără acord).
-- 2) O singură legătură între doi oameni, indiferent cine a trimis cererea (fără A→B și B→A în același timp).
revoke update on public.friendships from authenticated;
grant update (status) on public.friendships to authenticated;

create unique index if not exists friendships_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

-- Funcțiile pentru membri nu sunt pentru vizitatori fără cont.
revoke execute on function public.check_in() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
