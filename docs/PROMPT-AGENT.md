Lucrezi la aplicația bisericii „Betania” din `~/bisbetania` (GitHub cs1lyuha/bisbetania, ramura `biblia-si-pagini-noi`). Răspunde-mi mereu în română, cu diacritice corecte. Urmăresc terminalul în timp real, așa că folosește timeout-uri scurte și scrie-mi pe scurt ce faci pe parcurs.

## Ce trebuie făcut
Termină partea socială a aplicației (etapele 2–5 de mai jos) la nivelul de calitate al codului existent: același stil, același design și același mod de a scrie codul. După fiecare etapă rulează testele din secțiunea „Testare”. Treci la etapa următoare doar când etapa curentă trece toate testele.

## Înainte să scrii cod: citește proiectul
Citește cu atenție, ca să preiei stilul:
- `lib/auth.tsx`, `lib/supabase.ts`, `config/supabase.ts`: conturile (Supabase, email + parolă, cod de invitație)
- `supabase/schema.sql`: toate tabelele, politicile RLS și view-ul `member_stats` (seria, prietenii, versetele memorate, lecțiile citite, rugăciunile). Majoritatea datelor de care ai nevoie există deja aici.
- `app/profil.tsx`, `app/editeaza-profil.tsx`, `app/cont.tsx`, `components/Avatar.tsx`
- `app/memorare.tsx`, `app/joc.tsx`, `lib/memory.ts` (jocurile de memorare), `app/grup-mic.tsx`, `lib/grupmic.ts`, `components/LessonCard.tsx`
- `app/(tabs)/index.tsx` (Acasă), `app/(tabs)/mai-mult.tsx`, `components/ScreenHeader.tsx`, `lib/theme.tsx`, `lib/user-data.tsx`, `i18n/translations.ts`
- `git log --oneline -12`, ca să vezi cum sunt scrise commit-urile

## Stilul și designul (obligatoriu)
- Expo SDK 55, expo-router (rutele sunt fișiere în `app/`), React Native 0.83, TypeScript strict, NativeWind v4.
- **Culorile se dau doar prin clasele-token**, ca să meargă toate temele (6 culori, mod luminos și întunecat):
  - fundal `bg-cream`, carduri `bg-card` cu `border border-line`
  - text `text-ink` / `text-muted`
  - accent `bg-primary` / `text-primary` / `bg-primary-light`
  - în stiluri inline folosește `colors.*` din `useTheme()`
  - **Nicio culoare hardcodată**, cu excepția textului alb pe `bg-primary`.
- **Cardurile:** `rounded-2xl`/`rounded-3xl`, `p-4`/`p-5`.
- **Etichetele de secțiune:** `text-muted text-[11px] font-bold uppercase tracking-widest`.
- **Antetul paginilor:** `ScreenHeader`.
- **Iconițele:** Ionicons, varianta `-outline`.
- **Vibrațiile:** `tap()` la atingere, `success()` la reușită (din `lib/haptics`).
- **Orice text din interfață** trece prin `t('cheie')`, cu ambele variante (`ro` și `ru`) în `i18n/translations.ts`. Rusa trebuie să fie naturală, nu traducere mot-à-mot.
- **Comentariile din cod** sunt în română, scurte, și explică *de ce*, ca în fișierele existente.
- **`Animated.View` nu primește `className`.** Pune un `View` cu `className` înăuntru: pe web stilurile NativeWind nu se aplică pe componentele animate.
- **Datele din Supabase** trec prin politicile RLS. Fiecare tabel nou primește RLS, politici și `grant`-uri explicite, după modelul din `schema.sql`.

## Etapele
**Etapa 2: Membri și prieteni**
- Pagina `app/membri.tsx` cu:
  - toți membrii înregistrați și căutare după nume sau nickname
  - **sugestii**: cei care nu-mi sunt prieteni, întâi cei cu prieteni comuni
  - cererile primite (Acceptă / Refuză) și cererile trimise
- Pe profilul altcuiva (`app/profil.tsx?id=…`): butoanele Adaugă prieten / Cerere trimisă / Acceptă / Elimină prietenul.
- Un badge cu cererile în așteptare pe „Mai mult”, plus intrarea „Membri” în meniu.

**Etapa 3: Serii și realizări (vizibile pentru toți membrii)**
- `lib/achievements.ts` calculează realizările doar din `member_stats`. Exemple:
  - 🔥 serie de 3 / 7 / 30 / 100 de zile
  - primul verset memorat; 5 și 20 de versete memorate
  - 5 și 15 lecții de la Grup mic citite
  - 1 și 5 prieteni
  - prima cerere pe peretele de rugăciune; 10 „mă rog pentru tine”
- Pe profil: grila de realizări, cele neobținute estompate și cu progres.
- **Felicitare animată o singură dată** când se deblochează o realizare. Ce s-a văzut deja se ține local, în AsyncStorage.
- **Flacăra cu seria pe Acasă**, lângă poză.
- **Clasamentul seriilor** în pagina Membri.
- **Ziua activă = simpla intrare în aplicație.** Există deja: RPC `check_in` în `lib/auth.tsx`.

**Etapa 4: Peretele de rugăciune și sincronizare**
- Pagina `app/perete.tsx` cu:
  - cereri vizibile pentru toți sau doar pentru prieteni (tabelele `wall_prayers` și `prayer_support` există deja)
  - butonul „🙏 Mă rog pentru tine”, cu numărul de oameni și avatarele lor
  - „Răspunsă ✓” pentru propriile cereri, plus ștergere
  - tragere în jos pentru reîmprospătare
- **Sincronizare** când utilizatorul e logat: `memory` → `memory_scores` și `lessonsRead` → `lesson_reads`. Upsert, cu îmbinarea datelor locale existente.
- **Clasamentul săptămânal la memorare** în `app/memorare.tsx`.
- **Pe `LessonCard`:** avatarele prietenilor care au citit deja lecția.

**Etapa 5: Pregătirea versiunii**
- Versiunea 1.2.0 în `app.json` și `package.json`.
- README actualizat (e scris în rusă).
- Lista pașilor pentru mine:
  - `eas build` e necesar, pentru că `expo-image-picker` e modul nativ nou
  - după build, `eas update` pentru schimbările următoare

## Testare (după fiecare etapă, în ordinea asta)
1. **Tipuri și build:**
   - `npx tsc --noEmit` trebuie să treacă fără erori.
   - `npx expo export --platform android --output-dir <scratchpad>` trebuie să facă bundle-ul.
2. **Baza de date:**
   - Orice schimbare SQL intră în `supabase/schema.sql`, care trebuie să rămână rulabil de mai multe ori. Pune-o și separat, în `supabase/migrations/NNN_nume.sql`; eu o rulez în Supabase → SQL Editor.
   - Testeaz-o local cu `supabase/test-schema.mjs` (instrucțiunile sunt în capul fișierului; PGlite se instalează în scratchpad, nu în proiect).
   - Extinde testul cu cazuri pentru politicile RLS noi. De exemplu: o cerere „doar prieteni” nu e văzută de un străin; nimeni nu poate accepta o cerere de prietenie trimisă altcuiva.
3. **Logica pură** (realizări, sugestii, clasamente) se testează cu scripturi `node --experimental-strip-types`, pe date inventate, inclusiv cazuri limită: zero membri, serie ruptă ieri sau azi, ora Moldovei.
4. **Interfața în browser** (Chrome, prin claude-in-chrome), pe varianta web a aplicației:
   - Lățime de telefon, ~400px: `document.getElementById('root').style.width='400px'`.
   - Verifică în română și rusă, în mod luminos și întunecat, plus încă o culoare de accent.
   - Fă capturi la fiecare ecran nou.
5. **Tester independent:**
   - După etape, pornește un subagent separat ca tester. Dă-i lista funcțiilor etapei și cere-i să caute bug-uri în cod și în interfață: stări goale, erori de rețea, texte netraduse, culori hardcodate, deconectare, cont nou fără date.
   - Repară tot ce găsește și rulează din nou pașii 1–4.
6. **La final:** o listă scurtă cu ce trebuie să verific eu pe telefon.

## Pornirea variantei web pentru teste
```
cd ~/bisbetania
npm i --no-save react-native-web@0.21.2 react-dom@19.2.0 @expo/metro-runtime react-native-web-webview
systemd-run --user --unit=bisexpo --collect -p WorkingDirectory=$HOME/bisbetania -E CI=1 npx expo start --web --port 8081 --clear
```
- **Overlay-ul „Cannot manually set color scheme”:** apare doar pe web și se închide din X.
- **Watcher-ul Tailwind cade când adaugi fișiere noi:** repornește serviciul (`systemctl --user stop bisexpo`, apoi comanda de mai sus).
- **Rutele noi dau erori `tsc` până repornește serverul**, care regenerează tipurile.
- **Când ai terminat:**
  - oprește serverul: `systemctl --user stop bisexpo`
  - rulează `npm prune`, ca să scoți pachetele web temporare
  - verifică că `package.json` nu s-a schimbat din cauza lor

## Reguli importante
- ⛔ **NU porni emulatorul Android.** Mi-a repornit calculatorul de 3 ori. Testezi doar pe web.
- **Conturi de test:** nu crea conturi și nu introduce parole. Când ai nevoie de un cont nou (de exemplu un al doilea, pentru prieteni), cere-mi mie să-l creez în aplicație, pe http://localhost:8081/cont. Am deja contul meu, cu codul de invitație.
- **Commit-uri:**
  - **Fără** linia `Co-Authored-By: Claude` și fără mențiuni despre Claude în commit-uri.
  - Git nu are identitate globală, așa că folosește `git -c user.name=ilyuha -c user.email=ilie.cornos@iis.utm.md commit …`.
  - Mesajele de commit în română, după modelul celor existente; câte un commit pe etapă.
  - Push pe `biblia-si-pagini-noi`. **Nu face merge în `main` fără să mă întrebi.**
- **Fișierele modificate de mine, încă necomise:** `app.json`, `eas.json`, `package.json`, `package-lock.json`, `.gitignore`. Conțin setările mele pentru iOS și expo-updates, plus pachetele Supabase, `react-native-url-polyfill` și `expo-image-picker`. **Întreabă-mă înainte să le incluzi într-un commit.** Folderul `dist/` nu se comite.
- **Chei Supabase:** în `config/supabase.ts` e doar cheia publică (publishable). Nu-mi cere și nu folosi cheia `secret`/`service_role` sau parola bazei de date. Schimbările de bază de date le rulez eu în SQL Editor.
- **Email:** Supabase nu trimite emailuri (fără SMTP, „Confirm email” e oprit). Nu construi funcții care depind de email.
- **Aplicația e pentru maxim ~50 de oameni din biserică, inclusiv minori.** Datele se văd doar de membrii logați. Nu expune nimic public.
- **Dacă ceva e ambiguu**, alege varianta cea mai simplă și sigură, apoi spune-mi ce ai ales.

Începe prin a citi fișierele de mai sus și a-mi scrie, în 5–8 rânduri, planul pentru etapa 2. Apoi treci la treabă.
