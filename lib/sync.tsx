import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './auth';
import { useCommunity } from './community';
import { useUserData } from './user-data';
import { supabase } from './supabase';
import { GAMES, MemoryScore } from './memory';

interface ServerRow {
  verse_id: string;
  fill: number;
  order: number;
  recall: number;
}

// Al cui cont sunt stelele și lecțiile salvate pe telefon (ca să nu treacă în contul fratelui care se loghează după tine).
const OWNER_KEY = 'syncOwner';
const RETRY_MS = 15_000;

const better = (local: MemoryScore, server?: MemoryScore) => GAMES.some((g) => (local[g] ?? 0) > (server?.[g] ?? 0));

/**
 * Ține în cont stelele de la memorare și lecțiile de la Grup mic, ca să conteze la realizări și clasamente.
 * La intrarea în cont aduce ce e pe server; apoi trimite doar schimbările (cu o mică pauză, ca să nu scrie la fiecare atingere).
 */
export default function SyncBridge() {
  const { session } = useAuth();
  const { refresh } = useCommunity();
  const { memory, lessonsRead, mergeRemote, resetSynced } = useUserData();
  const uid = session?.user.id;
  const server = useRef<{ memory: Record<string, MemoryScore>; lessons: Set<string> } | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Prima încărcare din cont; fără internet mai încercăm din 15 în 15 secunde și la revenirea în aplicație.
  useEffect(() => {
    server.current = null;
    setReady(false);
    if (!uid) return;
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      const [m, l, owner] = await Promise.all([
        supabase.from('memory_scores').select('verse_id, fill, order, recall').eq('user_id', uid),
        supabase.from('lesson_reads').select('lesson_id').eq('user_id', uid),
        AsyncStorage.getItem(OWNER_KEY).catch(() => null),
      ]);
      if (!alive) return;
      if (m.error || l.error) {
        retry = setTimeout(() => setAttempt((a) => a + 1), RETRY_MS);
        return;
      }
      await AsyncStorage.setItem(OWNER_KEY, uid).catch(() => {});
      if (!alive) return;
      // Alt cont decât cel căruia îi aparțin datele locale: pornim de la ce are el pe server.
      if (owner && owner !== uid) resetSynced();

      const remote: Record<string, MemoryScore> = {};
      for (const r of (m.data ?? []) as ServerRow[]) remote[r.verse_id] = { fill: r.fill, order: r.order, recall: r.recall };
      const lessons = (l.data ?? []).map((r) => r.lesson_id as string);
      server.current = { memory: remote, lessons: new Set(lessons) };
      mergeRemote(remote, lessons);
      setReady(true);
    })();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !server.current) setAttempt((a) => a + 1);
    });
    return () => {
      alive = false;
      clearTimeout(retry);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, attempt]);

  useEffect(() => {
    if (!uid || !ready || !server.current) return;
    const timer = setTimeout(async () => {
      const state = server.current;
      if (!state) return;
      const rows = Object.entries(memory)
        .filter(([id, score]) => better(score, state.memory[id]))
        .map(([id, score]) => ({
          user_id: uid,
          verse_id: id,
          fill: Math.max(score.fill ?? 0, state.memory[id]?.fill ?? 0),
          order: Math.max(score.order ?? 0, state.memory[id]?.order ?? 0),
          recall: Math.max(score.recall ?? 0, state.memory[id]?.recall ?? 0),
          updated_at: new Date().toISOString(),
        }));
      const added = lessonsRead.filter((id) => !state.lessons.has(id));
      const removed = [...state.lessons].filter((id) => !lessonsRead.includes(id));
      if (!rows.length && !added.length && !removed.length) return;

      // Fiecare tabel se marchează separat ca sincronizat; ce n-a mers se retrimite la următoarea schimbare.
      let changed = false;
      if (rows.length) {
        const { error } = await supabase.from('memory_scores').upsert(rows, { onConflict: 'user_id,verse_id' });
        if (!error) {
          for (const r of rows) state.memory[r.verse_id] = { fill: r.fill, order: r.order, recall: r.recall };
          changed = true;
        }
      }
      if (added.length) {
        // „ignoreDuplicates” = ON CONFLICT DO NOTHING: tabelul are doar drept de INSERT, nu și de UPDATE.
        const { error } = await supabase
          .from('lesson_reads')
          .upsert(added.map((lesson_id) => ({ user_id: uid, lesson_id })), { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });
        if (!error) {
          added.forEach((id) => state.lessons.add(id));
          changed = true;
        }
      }
      if (removed.length) {
        const { error } = await supabase.from('lesson_reads').delete().eq('user_id', uid).in('lesson_id', removed);
        if (!error) {
          removed.forEach((id) => state.lessons.delete(id));
          changed = true;
        }
      }
      if (changed) refresh();
    }, 1500);
    return () => clearTimeout(timer);
  }, [uid, ready, memory, lessonsRead, refresh]);

  return null;
}
