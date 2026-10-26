import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BUNDLED from '../content/church.json';
import SNAPSHOT from '../content/calendar-snapshot.json';
import { CHURCH_CONTENT_URL } from '../config/links';
import { Language } from '../i18n/translations';
import { CalendarEvent, parseIcs } from './calendar';

type Localized = Record<Language, string>;

export interface Service {
  day: number; // 0 = duminică
  time: string; // HH:MM
  durationMin?: number;
  title: Localized;
}

export interface Announcement {
  id: string;
  date: string;
  title: Localized;
  text: Localized;
}

export interface ChurchCalendar {
  id: string;
  name: Localized;
  ics: string; // link public .ics din Google Calendar
  subscribe?: string; // link pentru abonare în Google Calendar
}

export interface ChurchContent {
  services: Service[];
  calendars?: ChurchCalendar[];
  announcements: Announcement[];
  contacts: {
    address: Localized;
    mapsQuery: string;
    phone: string;
    email: string;
    youtube: string;
    facebook: string;
    instagram: string;
    telegram: string;
  };
}

const CACHE_KEY = 'churchContent';
const EVENTS_CACHE_KEY = 'calendarEvents';

function isValid(x: any): x is ChurchContent {
  return x && Array.isArray(x.services) && Array.isArray(x.announcements) && x.contacts && typeof x.contacts === 'object';
}

type ChurchState = ChurchContent & { events: CalendarEvent[]; eventsUpdated: string | null };

const INITIAL: ChurchState = {
  ...(BUNDLED as ChurchContent),
  events: SNAPSHOT.events as CalendarEvent[],
  eventsUpdated: SNAPSHOT.updated,
};

const ChurchContext = createContext<ChurchState>(INITIAL);

function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

/** Descarcă toate calendarele publice și păstrează evenimentele de acum 6 luni până peste un an. */
async function fetchEvents(calendars: ChurchCalendar[]) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const until = new Date(now.getFullYear() + 1, now.getMonth() + 1, 1);
  const lists = await Promise.all(
    calendars.map(async (cal) => {
      const r = await fetchWithTimeout(cal.ics, 12_000);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return parseIcs(await r.text(), cal.id, from, until);
    }),
  );
  return lists.flat().sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Programul și anunțurile vin din content/church.json de pe GitHub, iar evenimentele din calendarele Google publice.
 * Ambele au copie locală, ca aplicația să meargă și fără internet.
 */
export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ChurchContent>(BUNDLED as ChurchContent);
  const [events, setEvents] = useState<{ list: CalendarEvent[]; updated: string | null }>({
    list: INITIAL.events,
    updated: INITIAL.eventsUpdated,
  });

  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([CACHE_KEY, EVENTS_CACHE_KEY])
      .then(([[, rawContent], [, rawEvents]]) => {
        const cached = rawContent ? JSON.parse(rawContent) : null;
        if (alive && isValid(cached)) setContent(cached);
        const cachedEvents = rawEvents ? JSON.parse(rawEvents) : null;
        if (alive && cachedEvents && Array.isArray(cachedEvents.list) && cachedEvents.updated > (INITIAL.eventsUpdated ?? '')) {
          setEvents(cachedEvents);
        }
      })
      .catch(() => {});

    fetchWithTimeout(`${CHURCH_CONTENT_URL}?t=${Math.floor(Date.now() / 3_600_000)}`, 8000)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((remote) => {
        const usable = isValid(remote) ? remote : null;
        if (alive && usable) {
          setContent(usable);
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(usable)).catch(() => {});
        }
        const calendars = (usable ?? (BUNDLED as ChurchContent)).calendars ?? [];
        if (!calendars.length) return;
        return fetchEvents(calendars).then((list) => {
          if (!alive) return;
          const next = { list, updated: new Date().toISOString() };
          setEvents(next);
          AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(next)).catch(() => {});
        });
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  return (
    <ChurchContext.Provider value={{ ...content, events: events.list, eventsUpdated: events.updated }}>{children}</ChurchContext.Provider>
  );
}

export function useChurch() {
  return useContext(ChurchContext);
}
