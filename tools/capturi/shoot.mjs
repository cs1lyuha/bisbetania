// Capturi ale aplicației (build web) în Chrome fără interfață, la mărime de iPhone, cu Supabase simulat.
// Pași:
//   npm i --no-save react-native-web@0.21.2 react-dom@19.2.0 @expo/metro-runtime react-native-web-webview
//   npx expo export --platform web --output-dir /tmp/bisbetania-web
//   node tools/capturi/shoot.mjs /tmp/bisbetania-web docs/design/screens [filtru, ex. „perete” sau „special”]
//   npm prune   (scoate pachetele web temporare)
// Opțional: CHROME=/cale/spre/chrome (dacă nu e „google-chrome”), HEIGHT=1720 (capturi lungi, cât paginile planșelor).
// Datele comunității sunt inventate (mock.mjs); cererile către Supabase nu pleacă din browser.
import http from 'node:http';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ME, tables, fakeSession } from './mock.mjs';

const [WEB, OUT, FILTER] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const PORT = 8790, DEBUG = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- server static cu fallback la index.html (aplicație cu o singură pagină) ----------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.bible': 'application/octet-stream', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(WEB, path);
  if (!existsSync(file) || path === '/' || !extname(path)) file = join(WEB, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(PORT);

// ---------- Chrome + CDP ----------
const profileDir = join(tmpdir(), 'bisbetania-capturi-chrome');
rmSync(profileDir, { recursive: true, force: true });
// CHROME=/cale/spre/chrome dacă nu e instalat ca „google-chrome” (de exemplu Chromium).
// Ca root (de exemplu într-un container) Chrome pornește doar fără sandbox.
const chrome = spawn(process.env.CHROME ?? 'google-chrome', [...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), '--headless=new', `--remote-debugging-port=${DEBUG}`, `--user-data-dir=${profileDir}`, '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore' });
let targets;
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${DEBUG}/json`)).json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
  await sleep(250);
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0;
const pending = new Map();
const handlers = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method && handlers.has(msg.method)) handlers.get(msg.method)(msg.params);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)));
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

// ---------- Supabase simulat ----------
function answer(url, method, headers) {
  const u = new URL(url);
  const path = u.pathname;
  if (path.startsWith('/auth/v1/')) {
    if (path.endsWith('/user')) return [200, fakeSession().user];
    if (path.endsWith('/token')) return [200, fakeSession()];
    return [204, null];
  }
  if (path.startsWith('/rest/v1/rpc/')) return path.endsWith('nickname_available') ? [200, true] : [204, null];
  if (path.startsWith('/rest/v1/')) {
    if (method !== 'GET' && method !== 'HEAD') return [201, []];
    const table = path.split('/').pop();
    let rows = [...(tables[table] ?? [])];
    for (const [k, v] of u.searchParams) {
      if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
      if (v.startsWith('eq.')) rows = rows.filter((r) => String(r[k]) === v.slice(3));
      else if (v.startsWith('in.(')) { const set = v.slice(4, -1).split(','); rows = rows.filter((r) => set.includes(String(r[k]))); }
    }
    if (table === 'wall_prayers' || table === 'profiles') rows.sort((a, b) => (table === 'profiles' ? a.first_name.localeCompare(b.first_name) : b.created_at.localeCompare(a.created_at)));
    const single = (headers.Accept ?? headers.accept ?? '').includes('vnd.pgrst.object');
    return [200, single ? rows[0] ?? null : rows];
  }
  return [404, {}];
}

handlers.set('Fetch.requestPaused', async (p) => {
  const url = p.request.url;
  try {
    if (url.includes('supabase.co')) {
      if (p.request.method === 'OPTIONS') {
        return send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 204, responseHeaders: cors() });
      }
      const [code, body] = answer(url, p.request.method, p.request.headers);
      return send('Fetch.fulfillRequest', {
        requestId: p.requestId, responseCode: code,
        responseHeaders: [...cors(), { name: 'content-type', value: 'application/json' }],
        body: Buffer.from(body === null ? '' : JSON.stringify(body)).toString('base64'),
      });
    }
    // Calendarul Google și church.json de pe GitHub: folosim copiile din aplicație (rezultat stabil).
    if (url.includes('calendar.google.com') || url.includes('raw.githubusercontent.com')) return send('Fetch.failRequest', { requestId: p.requestId, errorReason: 'Failed' });
    return send('Fetch.continueRequest', { requestId: p.requestId });
  } catch (e) { console.error('fetch handler', e.message); }
});
const cors = () => [
  { name: 'access-control-allow-origin', value: `http://localhost:${PORT}` },
  { name: 'access-control-allow-headers', value: '*' },
  { name: 'access-control-allow-methods', value: '*' },
  { name: 'access-control-allow-credentials', value: 'true' },
];

await send('Page.enable');
await send('Runtime.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
// HEIGHT=1720 face capturi lungi (tot ecranul derulat), pentru comparația cu planșele designerului.
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: Number(process.env.HEIGHT ?? 844), deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Chisinau' });
// Zonele sigure ale unui iPhone (notch sus, bara de jos), ca antetul și bara de taburi să arate ca pe telefon.
try {
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 47, bottom: 34, left: 0, right: 0 } });
  console.log('zone sigure: simulate');
} catch (e) {
  console.log('zone sigure: nesuportat —', e.message);
}

// ---------- pregătirea stării (limbă, temă, sesiune) ----------
const ALL_ACH = ['streak_3', 'streak_7', 'streak_30', 'streak_100', 'days_50', 'memory_1', 'memory_5', 'memory_20', 'lessons_5', 'lessons_15', 'friends_1', 'friends_5', 'prayer_1', 'support_10'];
async function prepare({ lang = 'ro', mode = 'light', accent = 'betania', loggedIn = true, seen = ALL_ACH }) {
  await send('Page.navigate', { url: `http://localhost:${PORT}/__setup.html` });
  await sleep(400);
  const state = {
    language: JSON.stringify(lang),
    settings: JSON.stringify({ accent, mode, fontSize: 18, serif: true, notify: false, notifyHour: 8 }),
    memory: JSON.stringify({ '20:16:3': { fill: 3, order: 2 }, '43:3:16': { fill: 3, order: 3, recall: 3 }, '19:23:1': { fill: 2, order: 3, recall: 2 }, '50:4:13': { fill: 3, order: 3, recall: 3 } }),
    lessonsRead: JSON.stringify([]),
    syncOwner: ME,
    [`seenAchievements:${ME}`]: JSON.stringify(seen),
    lastRead: JSON.stringify({ b: 43, c: 5 }),
    favorites: JSON.stringify([
      { key: 'ro:43:3:16', lang: 'ro', b: 43, c: 3, v: 16, text: 'Fiindcă atât de mult a iubit Dumnezeu lumea, că a dat pe singurul Lui Fiu, pentru ca oricine crede în El să nu piară, ci să aibă viața veșnică.', color: 'yellow', at: Date.now() - 86400000 },
      { key: 'ro:19:23:1', lang: 'ro', b: 19, c: 23, v: 1, text: 'Domnul este Păstorul meu: nu voi duce lipsă de nimic.', color: 'green', at: Date.now() - 3 * 86400000 },
      { key: 'ro:50:4:13', lang: 'ro', b: 50, c: 4, v: 13, text: 'Pot totul în Hristos, care mă întărește.', color: 'blue', at: Date.now() - 6 * 86400000 },
    ]),
    activePlan: JSON.stringify('gospels'),
    plans: JSON.stringify({ gospels: { start: new Date(Date.now() - 8 * 86400000).toISOString().slice(0, 10), done: [0, 1, 2, 3, 4, 5, 6] } }),
    prayers: JSON.stringify([
      { id: 'p1', text: 'Înțelepciune pentru alegerea facultății', at: Date.now() - 2 * 86400000 },
      { id: 'p2', text: 'Pentru prietenul meu Vlad, să-L cunoască pe Isus', at: Date.now() - 9 * 86400000 },
      { id: 'p3', text: 'Pace în familie', at: Date.now() - 30 * 86400000, answeredAt: Date.now() - 5 * 86400000 },
    ]),
  };
  if (loggedIn) state['sb-lproyfrfblxjfhyubqol-auth-token'] = JSON.stringify(fakeSession());
  await evaluate(`localStorage.clear(); ${Object.entries(state).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')} true`);
}

async function open(route, wait = 2800) {
  await send('Page.navigate', { url: `http://localhost:${PORT}${route}` });
  await sleep(wait);
}

async function clickText(text, { exact = true, nth = 0 } = {}) {
  const rect = await evaluate(`(() => {
    let el;
    if (${exact}) {
      const els = [...document.querySelectorAll('div, span')].filter((e) => e.innerText?.trim() === ${JSON.stringify(text)});
      el = els[${nth}];
    } else {
      // Textul poate sta într-un element care conține și alte noduri (de ex. numărul versetului): căutăm nodul de text.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const hits = [];
      while (walker.nextNode()) if (walker.currentNode.textContent.includes(${JSON.stringify(text)})) hits.push(walker.currentNode.parentElement);
      el = hits[${nth}];
    }
    if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (!rect) return console.warn(`  (nu găsesc „${text}”)`);
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
  await sleep(700);
}

async function scroll(px) {
  await evaluate(`(() => {
    const els = [...document.querySelectorAll('div')].filter((e) => e.scrollHeight > e.clientHeight + 40 && ['auto', 'scroll'].includes(getComputedStyle(e).overflowY));
    const el = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (el) el.scrollTop = ${px}; return !!el;
  })()`);
  await sleep(600);
}

async function typeInto(placeholderPart, text) {
  await evaluate(`(() => {
    const el = [...document.querySelectorAll('input, textarea')].find((e) => (e.placeholder || '').includes(${JSON.stringify(placeholderPart)}));
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype, 'value').set;
    // Fără conturul de focus pe care îl desenează versiunile noi de Chrome (pe telefon nu există).
    el.focus(); el.style.outline = 'none'; setter.call(el, ${JSON.stringify(text)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true;
  })()`);
  await sleep(1500);
}

let count = 0;
async function shot(name) {
  // Fereastra modală de pe web pune focusul pe primul buton și Chrome îi desenează un contur (pe telefon nu există).
  await evaluate('document.activeElement?.blur?.(); true');
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
  writeFileSync(join(OUT, `${name}.jpg`), Buffer.from(data, 'base64'));
  count++;
  console.log(`  ✓ ${name}`);
}

// ---------- scenariile ----------
const SCREENS = [
  ['01-acasa', '/', null],
  ['02-acasa-jos', '/', () => scroll(760)],
  ['03-biblia', '/biblia'],
  ['04-cititor', '/citire?b=43&c=3&v=16', null, 4500],
  ['05-cititor-selectie', '/citire?b=43&c=3&v=16', () => clickText('atât de mult a iubit', { exact: false }), 4500],
  ['06-cautare', '/cautare', () => typeInto('', 'dragoste'), 4500],
  ['07-salvate', '/favorite'],
  ['08-planuri', '/planuri'],
  ['09-plan', '/plan?id=gospels'],
  ['10-memorare', '/memorare'],
  ['11-memorare-jos', '/memorare', () => scroll(560)],
  ['12-joc-completeaza', '/joc?game=fill&id=20%3A16%3A3'],
  ['13-joc-ordoneaza', '/joc?game=order&id=20%3A16%3A3'],
  ['14-joc-din-memorie', '/joc?game=recall&id=20%3A16%3A3'],
  ['15-grup-mic', '/grup-mic'],
  ['16-calendar', '/calendar?date=2026-11-04T12%3A00%3A00'],
  ['17-program', '/program'],
  ['18-jurnal-rugaciune', '/rugaciuni'],
  ['19-perete-rugaciune', '/perete'],
  ['20-perete-rugaciune-jos', '/perete', () => scroll(520)],
  ['21-membri', '/membri'],
  ['22-membri-jos', '/membri', () => scroll(600)],
  ['23-clasament', '/membri', () => clickText('Clasament')],
  ['24-profil', '/profil'],
  ['25-profil-realizari', '/profil', () => scroll(600)],
  ['26-profil-alt-membru', `/profil?id=aaaaaaaa-0000-4000-8000-000000000007`],
  ['27-editeaza-profil', '/editeaza-profil'],
  ['28-mai-mult', '/mai-mult'],
  ['29-doneaza', '/doneaza'],
  ['30-contacte', '/contacte'],
  ['31-setari', '/setari'],
  ['32-istoria', '/istoria'],
  ['33-multumim', '/thank-you'],
];

// Variante: [sufix, setări, ecrane]
const RU_SET = ['01-acasa', '10-memorare', '15-grup-mic', '19-perete-rugaciune', '21-membri', '24-profil', '25-profil-realizari', '12-joc-completeaza'];
const VARIANTS = [
  ['luminos', { mode: 'light' }, SCREENS.map((s) => s[0])],
  ['intunecat', { mode: 'dark' }, SCREENS.map((s) => s[0])],
  ['ru-luminos', { lang: 'ru', mode: 'light' }, RU_SET],
  ['violet-intunecat', { mode: 'dark', accent: 'violet' }, ['01-acasa', '24-profil', '19-perete-rugaciune']],
  ['ocean-luminos', { mode: 'light', accent: 'ocean' }, ['01-acasa', '21-membri', '10-memorare']],
  ['burgundy-luminos', { mode: 'light', accent: 'burgundy' }, ['01-acasa']],
  ['amber-intunecat', { mode: 'dark', accent: 'amber' }, ['01-acasa']],
  ['teal-luminos', { mode: 'light', accent: 'teal' }, ['01-acasa']],
  // Variantele din planșele redesign-ului P2 (docs/design/BisBetania-Redesign-P2-P4.pdf).
  ['amber-luminos', { mode: 'light', accent: 'amber' }, ['23-clasament']],
  ['burgundy-intunecat', { mode: 'dark', accent: 'burgundy' }, ['19-perete-rugaciune']],
];

for (const [suffix, settings, names] of VARIANTS) {
  console.log(`— ${suffix}`);
  for (const [name, route, action, wait] of SCREENS) {
    if (!names.includes(name)) continue;
    const full = `${name}--${suffix}`;
    if (FILTER && !full.includes(FILTER)) continue;
    await prepare(settings);
    await open(route, wait);
    if (action) await action();
    await shot(full);
  }
}

// Ecrane speciale: contul (neautentificat) și felicitarea pentru o realizare nouă.
const wantSpecial = (name) => !FILTER || FILTER === 'special' || name.includes(FILTER);
for (const mode of ['light', 'dark']) {
  const suffix = mode === 'light' ? 'luminos' : 'intunecat';
  if (!wantSpecial(`34-cont-intra--${suffix}`) && !wantSpecial(`35-cont-nou--${suffix}`)) continue;
  await prepare({ mode, loggedIn: false });
  await open('/cont');
  await shot(`34-cont-intra--${suffix}`);
  await clickText('Cont nou');
  await shot(`35-cont-nou--${suffix}`);
}
// Două realizări noi deodată („1 din 2”): Flacără, apoi Cerere încrezătoare.
for (const [suffix, settings] of [['luminos', { mode: 'light' }], ['intunecat', { mode: 'dark' }], ['teal-intunecat', { mode: 'dark', accent: 'teal' }]]) {
  if (!wantSpecial(`36-felicitare-realizare--${suffix}`)) continue;
  await prepare({ ...settings, seen: ALL_ACH.filter((x) => x !== 'streak_7' && x !== 'prayer_1') });
  await open('/profil', 3800);
  await shot(`36-felicitare-realizare--${suffix}`);
}

console.log(`\n${count} capturi în ${OUT}`);
ws.close();
chrome.kill();
server.close();
process.exit(0);
