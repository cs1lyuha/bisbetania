// Logica pură a comunității (fără React și fără rețea), ca să poată fi testată direct cu Node.
import type { MemberStats, Profile } from './supabase';

export interface Friendship {
  requester: string;
  addressee: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

export type Relation = 'self' | 'none' | 'friends' | 'sent' | 'received';

/** Legătura dintre mine și altcineva. */
export function relationOf(me: string | undefined, other: string, friendships: Friendship[]): Relation {
  if (!me) return 'none';
  if (me === other) return 'self';
  const f = friendships.find((x) => (x.requester === me && x.addressee === other) || (x.requester === other && x.addressee === me));
  if (!f) return 'none';
  if (f.status === 'accepted') return 'friends';
  return f.requester === me ? 'sent' : 'received';
}

export function friendIdsOf(user: string, friendships: Friendship[]) {
  return new Set(
    friendships
      .filter((f) => f.status === 'accepted' && (f.requester === user || f.addressee === user))
      .map((f) => (f.requester === user ? f.addressee : f.requester)),
  );
}

/**
 * Sugestii de prieteni: toți cei cu care n-am încă nicio legătură,
 * întâi cei cu cei mai mulți prieteni comuni, apoi cei cu seria cea mai lungă (activi), apoi alfabetic.
 */
export function suggestionsFor(me: string, profiles: Profile[], friendships: Friendship[], stats: Map<string, MemberStats>) {
  const mine = friendIdsOf(me, friendships);
  return profiles
    .filter((p) => relationOf(me, p.id, friendships) === 'none')
    .map((p) => {
      const theirs = friendIdsOf(p.id, friendships);
      const mutual = [...theirs].filter((id) => mine.has(id)).length;
      return { profile: p, mutual };
    })
    .sort(
      (a, b) =>
        b.mutual - a.mutual ||
        (stats.get(b.profile.id)?.current_streak ?? 0) - (stats.get(a.profile.id)?.current_streak ?? 0) ||
        a.profile.first_name.localeCompare(b.profile.first_name),
    );
}

/** Clasamentul seriilor: seria curentă, apoi recordul, apoi zilele active. */
export function streakRanking(profiles: Profile[], stats: Map<string, MemberStats>) {
  return profiles
    .map((p) => ({ profile: p, stats: stats.get(p.id) }))
    .filter((x) => (x.stats?.active_days ?? 0) > 0)
    .sort(
      (a, b) =>
        (b.stats?.current_streak ?? 0) - (a.stats?.current_streak ?? 0) ||
        (b.stats?.best_streak ?? 0) - (a.stats?.best_streak ?? 0) ||
        (b.stats?.active_days ?? 0) - (a.stats?.active_days ?? 0),
    );
}
