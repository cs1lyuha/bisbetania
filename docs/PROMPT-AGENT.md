Lucrezi la aplicația bisericii „Betania” din `~/bisbetania` (GitHub cs1lyuha/bisbetania, ramura `biblia-si-pagini-noi`). Răspunde-mi mereu în română, cu diacritice corecte. Urmăresc terminalul în timp real, așa că folosește timeout-uri scurte și scrie-mi pe scurt ce faci pe parcurs.

**Sarcina mea pentru tine:** <SCRIE AICI CE VREI SĂ FACĂ AGENTUL>

## Ce este aplicația (versiunea 1.2.0, totul e gata și testat)
- **Biblia offline:** Cornilescu 1924 și Sinodala. Are căutare, evidențiere, versetul zilei, planuri de citire și notificare zilnică.
- **Calendar:** întâlnirile săptămânale (miercuri 19:00 Grup de creștere, vineri 19:00 Tineret, duminică 10:00 Serviciu divin) și evenimentele calendarului Google public „Tineretul BETANIA” (fișier .ics, citit live).
- **Grup mic:** lecția săptămânii e citită din descrierea evenimentelor („Lecția 5 · Ioan 5 — …”), cu bifa „Am citit” și lista celor care au citit.
- **Memorare:** versetul săptămânii și 3 jocuri (Completează, Ordonează, Din memorie), cu stele și clasament săptămânal.
- **Conturi** (Supabase): email + parolă + cod de invitație.
  - Profil: poză, nickname, nume, bio, versetul preferat (⭐ din cititor)
  - Membri și prieteni: sugestii după prietenii comuni, cereri
  - Serii (ziua activă = intrarea în aplicație, RPC `check_in`)
  - 14 realizări calculate din view-ul `member_stats`, cu felicitare
  - Clasamentul seriilor
  - Peretele de rugăciune (pentru toți sau doar pentru prieteni, „🙏 Mă rog”, „Răspunsă”)
  - Sincronizarea stelelor de la memorare și a lecțiilor citite
- **Donații MIA/QR, contacte, live pe YouTube, 6 culori, mod luminos și întunecat, RO/RU.**

## Înainte să scrii cod: citește
- `README.md` (în rusă): ce face aplicația și structura ei
- `git log --oneline -15`: cum arată commit-urile
- Fișierele atinse de sarcina ta. Pentru partea socială:
  - logica: `lib/auth.tsx`, `lib/community.tsx`, `lib/social.ts` (pur), `lib/achievements.ts`, `lib/sync.tsx`
  - baza de date: `supabase/schema.sql`
  - ecranele: `app/membri.tsx`, `app/perete.tsx`, `app/profil.tsx`
- Ca să preiei stilul, cel puțin un ecran întreg: `app/membri.tsx` sau `app/memorare.tsx`.

## Stilul și designul (obligatoriu)
- Expo SDK 58, expo-router (rutele sunt fișiere în `app/`), React Native 0.88 (Node ≥ 22.13), TypeScript strict, NativeWind v4, Supabase JS.
- Ref-urile spre componente React Native au tipurile instanței (de exemplu `useRef<ScrollViewInstance>(null)`, importat ca tip din `react-native`).
- **Culorile se dau doar prin token-uri**, ca să meargă toate temele (6 culori, mod luminos și întunecat):
  - fundal `bg-cream`, carduri `bg-card` cu `border border-line`
  - text `text-ink` / `text-muted`
  - accent `bg-primary` / `text-primary` / `bg-primary-light`
  - textul de pe accent: `text-on-primary` / `colors.onPrimary` (alb ziua, închis noaptea), nu `text-white`
  - în stiluri inline folosește `colors.*` din `useTheme()`
  - **Nicio culoare hardcodată**, cu excepția textului alb pe antetul `primaryDeep` și a flăcării seriei (`#F59E0B` / `#FFB347`).
- **Cardurile:** `rounded-2xl`/`rounded-3xl`, `p-4`/`p-5`.
- **Etichetele de secțiune:** componenta `SectionLabel` (11, `font-ui-bold`, majuscule, spațiere largă, `muted`).
- **Fonturile** (`lib/fonts.ts`): Inter cu `font-ui`, `font-ui-medium`, `font-ui-semibold`, `font-ui-bold`; Source Serif 4 cu `font-display` (versete), `font-display-italic`, `font-display-semibold` (titluri, nume, cifre). Greutatea e în familie: **nu** pune `font-bold`/`fontWeight` peste ele (pe Android revine fontul sistemului). Mărimile: text 15–16, secundar 12–13, etichete 11 (vezi `docs/design/REDESIGN-P2-P4-NOTE.md`).
- **Componente existente:**
  - antetul paginilor: `ScreenHeader`
  - membri: `MemberRow`, `Avatar`, `FriendButton`
- **Iconițele:** `components/Icon.tsx` (SVG în stilul Lucide; adaugă acolo ce lipsește). Ionicons doar în ecranele încă nerefăcute; verifică numele în glyphmap.
- **Vibrațiile:** `tap()` la atingere, `success()` la reușită (din `lib/haptics`).
- **Orice text din interfață** trece prin `t('cheie')`, cu `ro` și `ru` în `i18n/translations.ts`. Rusa trebuie să fie naturală; pentru plurale folosește `countLabel`.
- **Comentariile din cod** sunt în română, scurte, și explică *de ce*.
- **`Animated.View` nu primește `className`.** Pune un `View` cu `className` înăuntru: pe web stilurile NativeWind nu se aplică pe componentele animate.
- **Logica pură** (fără React și fără rețea) stă în fișiere `.ts` separate, ca să poată fi testată cu Node (vezi `lib/social.ts`).
- **Baza de date:**
  - Fiecare tabel nou primește RLS, politici și `grant`-uri explicite, după modelul din `schema.sql`.
  - La UPDATE dă drept doar pe coloanele necesare (vezi `grant update (status)` la `friendships`).

## Testare (obligatorie, în ordinea asta)
1. **Tipuri și build:**
   - `npx tsc --noEmit` trebuie să treacă fără erori.
   - `npx expo export --platform android --output-dir <scratchpad>` trebuie să facă bundle-ul.
2. **Logica:** `node --experimental-strip-types --no-warnings tools/test-logic.mjs`. Adaugă cazuri noi pentru orice logică nouă, inclusiv cazuri limită.
3. **Baza de date:**
   - Orice schimbare SQL intră în `supabase/schema.sql`, care trebuie să rămână rulabil de mai multe ori, și separat în `supabase/migrations/NNN_nume.sql`, pe care o rulez eu în Supabase → SQL Editor.
   - Testeaz-o cu `supabase/test-schema.mjs` (instrucțiunile sunt în capul fișierului; PGlite se instalează în scratchpad).
   - Adaugă verificări RLS pentru tot ce e nou: ce e permis și ce trebuie refuzat.
4. **Interfața în browser** (Chrome, prin claude-in-chrome), pe varianta web:
   - Lățime de telefon: `document.getElementById('root').style.width='400px'`.
   - Verifică în română și rusă, în mod luminos și întunecat, plus altă culoare de accent. Salvează setările originale (`language`, `settings` din localStorage) și pune-le înapoi la final.
   - În Chrome sunt logat cu contul meu real, așa că **nu posta, nu trimite cereri de prietenie și nu bifa nimic** fără să mă întrebi. Doar te uiți. Dacă tot ai creat date de test, anulează-le și spune-mi.
5. **Tester independent:**
   - Pornește un subagent separat, care doar citește codul. Dă-i lista schimbărilor și cere-i bug-uri concrete, cu fișier:linie și scenariu: hook-uri, bucle, RLS care ar refuza în tăcere, schimbarea contului pe același telefon, stări goale sau fără rețea, texte netraduse, culori hardcodate.
   - Repară ce e real și rulează din nou pașii 1–3.
6. **La final:** o listă scurtă cu ce verific eu pe telefon.

## Pornirea variantei web
```
cd ~/bisbetania
npm i --no-save react-native-web@~0.21.4 react-dom@19.3.0 @expo/metro-runtime@~58.0.15 react-native-web-webview
systemd-run --user --unit=bisexpo --collect -p WorkingDirectory=$HOME/bisbetania -E CI=1 npx expo start --web --port 8081 --clear
```
- **Overlay-ul „Cannot manually set color scheme”:** apare doar pe web și se închide din X (aproximativ x=413, y=98).
- **Watcher-ul Tailwind cade când adaugi fișiere noi:** repornește serviciul (`systemctl --user stop bisexpo`, apoi comanda de mai sus).
- **Rutele noi dau erori `tsc` până repornește serverul**, care regenerează tipurile.
- **Dacă schimbările din config nu apar**, pornește din nou cu `--clear`.
- **Când ai terminat:**
  - oprește serverul: `systemctl --user stop bisexpo`
  - rulează `npm prune`, ca să scoți pachetele web temporare
  - verifică că `package.json` nu s-a schimbat din cauza lor

## Reguli importante
- ⛔ **NU porni emulatorul Android.** Mi-a repornit calculatorul de 3 ori.
- **Conturi de test:** nu crea conturi și nu introduce parole. Dacă ai nevoie de al doilea cont (de exemplu pentru prieteni), cere-mi mie să-l creez pe http://localhost:8081/cont.
- **Commit-uri:**
  - **Fără** linia `Co-Authored-By: Claude` și fără mențiuni despre Claude.
  - Folosește `git -c user.name=ilyuha -c user.email=ilie.cornos@iis.utm.md commit …`.
  - Mesajele în română, după modelul celor existente.
  - Push pe `biblia-si-pagini-noi`. **Nu face merge în `main` fără să mă întrebi.**
- **Fișierele modificate de mine:** în `app.json`, `eas.json`, `package.json` și `package-lock.json` am setările pentru iOS și expo-updates. Dacă sunt încă necomise, întreabă-mă înainte să le incluzi într-un commit. Folderul `dist/` nu se comite.
- **Supabase:**
  - Folosește doar cheia publică din `config/supabase.ts`. Nu-mi cere cheia `secret`/`service_role` și nici parola bazei de date.
  - Nu există server de email („Confirm email” e oprit), deci nu construi funcții care depind de email.
- **Utilizatorii:** maxim ~50 de oameni din biserică, inclusiv minori. Datele se văd doar de membrii logați. Nu expune nimic public.
- **Modul nativ nou** (orice pachet cu cod nativ) înseamnă un build nou (`eas build`). Restul ajunge pe telefoane prin `eas update`; `runtimeVersion` urmează versiunea aplicației.
- **Dacă ceva e ambiguu**, alege varianta cea mai simplă și sigură, apoi spune-mi ce ai ales.

## Idei pentru mai departe (dacă nu-ți dau altă sarcină)
1. **„Vin și eu” la întâlniri și check-in cu cod QR la intrare** (prezența intră la realizări).
2. **Rol de lider:** anunțuri și notificări push trimise tuturor din aplicație.
3. **Server de email (SMTP, de exemplu Resend) pentru „Am uitat parola”.**
4. **Actualizări live** pe peretele de rugăciune și la cererile de prietenie (Supabase Realtime).
5. **Zilele de naștere ale membrilor** și felicitări.

Începe prin a citi fișierele de mai sus și a-mi scrie, în 5–8 rânduri, planul. Apoi treci la treabă.
