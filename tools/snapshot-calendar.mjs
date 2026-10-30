// Salvează o copie a calendarelor din content/church.json în content/calendar-snapshot.json.
// Aplicația o folosește până reușește să descarce calendarul live (prima pornire fără internet).
// Rulare: TZ=Europe/Chisinau node --experimental-strip-types tools/snapshot-calendar.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const { parseIcs } = await import('../lib/calendar.ts');
const church = JSON.parse(readFileSync(new URL('../content/church.json', import.meta.url), 'utf8'));

const now = new Date();
const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
const until = new Date(now.getFullYear() + 1, now.getMonth() + 1, 1);

const events = [];
for (const cal of church.calendars ?? []) {
  const text = await (await fetch(cal.ics)).text();
  const parsed = parseIcs(text, cal.id, from, until);
  console.log(`${cal.id}: ${parsed.length} evenimente`);
  events.push(...parsed);
}
writeFileSync(new URL('../content/calendar-snapshot.json', import.meta.url), JSON.stringify({ updated: now.toISOString(), events }, null, 1) + '\n');
