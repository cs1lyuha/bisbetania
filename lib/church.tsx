import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BUNDLED from '../content/church.json';
import { CHURCH_CONTENT_URL } from '../config/links';
import { Language } from '../i18n/translations';

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

export interface ChurchContent {
  services: Service[];
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

function isValid(x: any): x is ChurchContent {
  return x && Array.isArray(x.services) && Array.isArray(x.announcements) && x.contacts && typeof x.contacts === 'object';
}

const ChurchContext = createContext<ChurchContent>(BUNDLED as ChurchContent);

/** Programul și anunțurile vin din content/church.json de pe GitHub (cu copie locală pentru offline). */
export function ChurchProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<ChurchContent>(BUNDLED as ChurchContent);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        const cached = raw ? JSON.parse(raw) : null;
        if (alive && isValid(cached)) setContent(cached);
      })
      .catch(() => {});

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    fetch(`${CHURCH_CONTENT_URL}?t=${Math.floor(Date.now() / 3_600_000)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((remote) => {
        if (!alive || !isValid(remote)) return;
        setContent(remote);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch(() => {});
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  return <ChurchContext.Provider value={content}>{children}</ChurchContext.Provider>;
}

export function useChurch() {
  return useContext(ChurchContext);
}

/** Următorul serviciu (sau cel care e în desfășurare acum). */
export function nextService(services: Service[], now = new Date()) {
  let best: { service: Service; start: Date; live: boolean } | null = null;
  for (const service of services) {
    const [h, m] = service.time.split(':').map(Number);
    for (let week = 0; week < 2; week++) {
      const start = new Date(now);
      start.setHours(h, m, 0, 0);
      start.setDate(start.getDate() + ((service.day - now.getDay() + 7) % 7) + week * 7);
      const end = new Date(start.getTime() + (service.durationMin ?? 90) * 60_000);
      if (end <= now) continue;
      const live = start <= now;
      if (!best || start < best.start) best = { service, start, live };
      break;
    }
  }
  return best;
}
