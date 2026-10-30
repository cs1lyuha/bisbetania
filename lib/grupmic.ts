import { BOOKS } from './bible';
import type { CalendarEvent } from './calendar';

/** O lecție de la Grup mic, citită din descrierea evenimentului din calendarul tineretului. */
export interface Lesson {
  id: string; // id-ul evenimentului din calendar
  number: number;
  b: number;
  c: number;
  vFrom?: number;
  vTo?: number;
  passage: string; // „Ioan 6:1–21”, exact ca în calendar
  title: string; // „Dragostea care caută și vindecă”
  summary?: string; // a doua linie din descriere
  start: Date;
  end: Date;
}

const GROUP_TITLES = ['grup mic', 'grup de creștere', 'grup de crestere'];

// Numele cele mai lungi primele, ca „1 Ioan” să nu fie confundat cu „Ioan”.
const BOOKS_BY_NAME = [...BOOKS].sort((a, b) => b.ro.length - a.ro.length);

/** „Lecția 6 · Ioan 6:1–21 — Dragostea, care se îngrijește...” → lecția 6, Ioan 6, versetele 1–21. */
export function parseLesson(e: CalendarEvent): Lesson | null {
  if (!GROUP_TITLES.includes(e.title.trim().toLowerCase())) return null;
  const [first = '', ...rest] = e.description.split('\n');
  const m = first.match(/^Lec[țţt]ia\s+(\d+)\s*[·•.\-–]\s*(.+?)\s*[—–-]\s+(.+)$/i);
  if (!m) return null;
  const [, number, passage, title] = m;

  const book = BOOKS_BY_NAME.find((bk) => passage.toLowerCase().startsWith(bk.ro.toLowerCase() + ' '));
  if (!book) return null;
  const ref = passage.slice(book.ro.length).trim().match(/^(\d+)(?::(\d+)\s*[–-]\s*(\d+))?/);
  if (!ref) return null;
  const c = Number(ref[1]);
  if (c < 1 || c > book.chapters) return null;

  return {
    id: e.id,
    number: Number(number),
    b: book.id,
    c,
    vFrom: ref[2] ? Number(ref[2]) : undefined,
    vTo: ref[3] ? Number(ref[3]) : undefined,
    passage: passage.trim(),
    title: title.trim(),
    summary: rest.join('\n').trim() || undefined,
    start: new Date(e.start),
    end: new Date(e.end),
  };
}

export function lessonsFrom(events: CalendarEvent[]) {
  return events
    .map(parseLesson)
    .filter((l): l is Lesson => !!l)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Lecția la care ne pregătim: cea de azi (până se termină întâlnirea) sau următoarea. */
export function currentLesson(lessons: Lesson[], now = new Date()) {
  return lessons.find((l) => l.end > now) ?? null;
}
