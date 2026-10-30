import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { MemberStats, Profile, supabase } from './supabase';
import { Friendship, Relation, friendIdsOf, relationOf } from './social';

export type { Friendship, Relation } from './social';
export { podiumOrder, streakRanking, suggestionsFor } from './social';

interface Community {
  loaded: boolean;
  profiles: Profile[];
  byId: Map<string, Profile>;
  stats: Map<string, MemberStats>;
  friendships: Friendship[];
  friendIds: Set<string>;
  incoming: Friendship[];
  relation: (other: string) => Relation;
  refresh: () => Promise<void>;
  sendRequest: (other: string) => Promise<void>;
  accept: (other: string) => Promise<void>;
  /** Refuză o cerere, o retrage pe a mea sau elimină un prieten. */
  remove: (other: string) => Promise<void>;
}

const CommunityContext = createContext<Community | null>(null);

/** Membrii, statisticile și prieteniile, încărcate o dată și reîmprospătate la revenirea în aplicație. Cu ~50 de oameni, încap toate în memorie. */
export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { session, profile: me, checkIns } = useAuth();
  const myId = session?.user.id;
  const [loaded, setLoaded] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [statsList, setStatsList] = useState<MemberStats[]>([]);
  const [friendships, setFriendships] = useState<Friendship[]>([]);

  const refresh = useCallback(async () => {
    if (!myId) return;
    const [p, s, f] = await Promise.all([
      supabase.from('profiles').select('*').order('first_name'),
      supabase.from('member_stats').select('*'),
      supabase.from('friendships').select('*'),
    ]);
    if (p.data) setProfiles(p.data as Profile[]);
    if (s.data) setStatsList(s.data as MemberStats[]);
    if (f.data) setFriendships(f.data as Friendship[]);
    if (!p.error) setLoaded(true);
  }, [myId]);

  useEffect(() => {
    if (!myId) {
      setProfiles([]);
      setStatsList([]);
      setFriendships([]);
      setLoaded(false);
      return;
    }
    refresh();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => sub.remove();
  }, [myId, refresh]);

  // După check-in-ul zilei, seria mea s-a schimbat.
  useEffect(() => {
    if (checkIns) refresh();
  }, [checkIns, refresh]);

  // Profilul meu proaspăt editat (poză, bio) apare imediat și în listă.
  useEffect(() => {
    if (me) setProfiles((prev) => (prev.some((p) => p.id === me.id) ? prev.map((p) => (p.id === me.id ? me : p)) : prev));
  }, [me]);

  const value = useMemo<Community>(() => {
    const byId = new Map(profiles.map((p) => [p.id, p]));
    const stats = new Map(statsList.map((s) => [s.user_id, s]));
    const pair = (other: string) =>
      `and(requester.eq.${myId},addressee.eq.${other}),and(requester.eq.${other},addressee.eq.${myId})`;

    return {
      loaded,
      profiles,
      byId,
      stats,
      friendships,
      friendIds: myId ? friendIdsOf(myId, friendships) : new Set(),
      incoming: friendships.filter((f) => f.status === 'pending' && f.addressee === myId),
      relation: (other) => relationOf(myId, other, friendships),
      refresh,

      sendRequest: async (other) => {
        if (!myId) return;
        const acceptTheirs = async () => {
          const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('requester', other).eq('addressee', myId);
          if (error) throw error;
        };
        // Dacă celălalt mi-a trimis deja o cerere, „Adaugă” înseamnă de fapt „Acceptă”.
        if (relationOf(myId, other, friendships) === 'received') {
          await acceptTheirs();
        } else {
          const { error } = await supabase.from('friendships').insert({ requester: myId, addressee: other });
          // 23505 = există deja o legătură; dacă e cererea lui, tocmai trimisă, o acceptăm.
          if (error?.code === '23505') await acceptTheirs();
          else if (error) throw error;
        }
        await refresh();
      },

      accept: async (other) => {
        if (!myId) return;
        const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('requester', other).eq('addressee', myId);
        if (error) throw error;
        await refresh();
      },

      remove: async (other) => {
        if (!myId) return;
        const { error } = await supabase.from('friendships').delete().or(pair(other));
        if (error) throw error;
        await refresh();
      },
    };
  }, [loaded, profiles, statsList, friendships, myId, refresh]);

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error('useCommunity must be inside CommunityProvider');
  return ctx;
}
