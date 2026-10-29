import React, { createContext, useContext, useMemo } from 'react';
import { Language } from '../i18n/translations';
import { HighlightColor } from './theme';
import { PlanId } from './plans';
import { dateKey, usePersistentState } from './storage';
import type { GameId, MemoryScore } from './memory';

export interface Favorite {
  key: string; // verseKey(lang, b, c, v)
  lang: Language;
  b: number;
  c: number;
  v: number;
  ve?: number;
  text: string;
  color: HighlightColor;
  at: number;
}

export interface PlanProgress {
  start: string; // YYYY-MM-DD
  done: number[]; // indicii zilelor citite
}

export interface Prayer {
  id: string;
  text: string;
  at: number;
  answeredAt?: number;
}

interface UserData {
  favorites: Favorite[];
  highlightOf: (key: string) => HighlightColor | undefined;
  setHighlight: (items: Omit<Favorite, 'color' | 'at'>[], color: HighlightColor | null) => void;
  removeFavorite: (key: string) => void;

  lastRead: { b: number; c: number } | null;
  setLastRead: (pos: { b: number; c: number }) => void;

  activePlan: PlanId | null;
  plans: Partial<Record<PlanId, PlanProgress>>;
  startPlan: (id: PlanId) => void;
  stopPlan: () => void;
  toggleDay: (id: PlanId, day: number) => void;

  /** Lecțiile de la Grup mic marcate „am citit” (id-urile evenimentelor din calendar). */
  lessonsRead: string[];
  toggleLessonRead: (id: string) => void;

  /** Stelele de la jocurile de memorare, pe verset (cheia e „carte:capitol:verset”). */
  memory: Record<string, MemoryScore>;
  saveGameResult: (verseId: string, game: GameId, stars: number) => void;

  prayers: Prayer[];
  addPrayer: (text: string) => void;
  toggleAnswered: (id: string) => void;
  removePrayer: (id: string) => void;
}

const UserDataContext = createContext<UserData | null>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = usePersistentState<Favorite[]>('favorites', []);
  const [lastRead, setLastRead] = usePersistentState<{ b: number; c: number } | null>('lastRead', null);
  const [activePlan, setActivePlan] = usePersistentState<PlanId | null>('activePlan', null);
  const [plans, setPlans] = usePersistentState<Partial<Record<PlanId, PlanProgress>>>('plans', {});
  const [prayers, setPrayers] = usePersistentState<Prayer[]>('prayers', []);
  const [lessonsRead, setLessonsRead] = usePersistentState<string[]>('lessonsRead', []);
  const [memory, setMemory] = usePersistentState<Record<string, MemoryScore>>('memory', {});

  const value = useMemo<UserData>(() => {
    const byKey = new Map(favorites.map((f) => [f.key, f.color]));
    return {
      favorites,
      highlightOf: (key) => byKey.get(key),
      setHighlight: (items, color) =>
        setFavorites((prev) => {
          const keys = new Set(items.map((i) => i.key));
          const rest = prev.filter((f) => !keys.has(f.key));
          if (!color) return rest;
          const now = Date.now();
          return [...items.map((i) => ({ ...i, color, at: now })), ...rest];
        }),
      removeFavorite: (key) => setFavorites((prev) => prev.filter((f) => f.key !== key)),

      lastRead,
      setLastRead,

      activePlan,
      plans,
      startPlan: (id) => {
        setActivePlan(id);
        setPlans((prev) => (prev[id] ? prev : { ...prev, [id]: { start: dateKey(), done: [] } }));
      },
      stopPlan: () => setActivePlan(null),
      toggleDay: (id, day) =>
        setPlans((prev) => {
          const p = prev[id] ?? { start: dateKey(), done: [] };
          const done = p.done.includes(day) ? p.done.filter((d) => d !== day) : [...p.done, day];
          return { ...prev, [id]: { ...p, done } };
        }),

      lessonsRead,
      toggleLessonRead: (id) => setLessonsRead((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),

      memory,
      // Păstrăm cel mai bun rezultat al fiecărui joc.
      saveGameResult: (verseId, game, stars) =>
        setMemory((prev) => {
          const old = prev[verseId] ?? {};
          return { ...prev, [verseId]: { ...old, [game]: Math.max(old[game] ?? 0, stars), at: Date.now() } };
        }),

      prayers,
      addPrayer: (text) =>
        setPrayers((prev) => [{ id: `${Date.now()}`, text: text.trim(), at: Date.now() }, ...prev]),
      toggleAnswered: (id) =>
        setPrayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, answeredAt: p.answeredAt ? undefined : Date.now() } : p)),
        ),
      removePrayer: (id) => setPrayers((prev) => prev.filter((p) => p.id !== id)),
    };
  }, [favorites, lastRead, activePlan, plans, prayers, lessonsRead, memory, setFavorites, setLastRead, setActivePlan, setPlans, setPrayers, setLessonsRead, setMemory]);

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be inside UserDataProvider');
  return ctx;
}

/** Ziua curentă a planului (0 = prima zi), după data de start. */
export function planDayIndex(progress: PlanProgress, totalDays: number, today = new Date()) {
  const [y, m, d] = progress.start.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const diff = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() - start.getTime()) / 86_400_000);
  return Math.min(Math.max(diff, 0), totalDays - 1);
}
