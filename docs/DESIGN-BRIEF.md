# BisBetania · Brief de design

Aplicația mobilă a bisericii **Betania** (Moldova) pentru tineret și comunitate. Documentul descrie ce există acum, ce limite tehnice sunt și ce așteptăm de la design.

> 📸 **Capturile ecranelor actuale:** [`docs/design/`](design/README.md)
>
> **Pe scurt:** design system-ul există și funcționează (6 culori × mod luminos/întunecat). Vrem o identitate vizuală mai matură și mai caldă, ecrane de comunitate mai frumoase și un set propriu de insigne pentru realizări. Totul trebuie să rămână implementabil cu token-urile de mai jos.

---

## 1. Despre aplicație

| | |
|---|---|
| **Pentru cine** | Tinerii și membrii bisericii Betania, aproximativ 14–35 de ani; maxim ~50 de conturi. Sunt și minori. |
| **Limbi** | Română și rusă, comutabile oricând. Textele în rusă sunt adesea cu 20–35% mai lungi. |
| **Platforme** | iPhone (principal) și Android. Expo / React Native, nu web. |
| **Ton** | Cald, liniștit, respectuos, modern. Spiritual fără să fie „bisericesc” învechit; jocurile și seriile sunt motivante, nu agresive sau de tip casino. |
| **Versiune** | 1.2.0 |

**Funcțiile principale:**
- **Biblia offline:** Cornilescu (RO) și Sinodala (RU), cu căutare, evidențiere în 4 culori și versetul zilei.
- **Calendar:** întâlnirile săptămânale plus evenimentele tineretului dintr-un calendar Google.
- **Grup mic:** lecția săptămânii (de exemplu „Lecția 5 · Ioan 5”), cu „Am citit” și cine a mai citit.
- **Memorare:** versetul săptămânii și 3 jocuri scurte (Completează, Ordonează, Din memorie), cu 1–3 stele.
- **Comunitate:**
  - cont cu cod de invitație
  - profil cu poză, bio și versetul preferat
  - prieteni și sugestii
  - serii zilnice 🔥 și 14 realizări
  - clasamente
  - peretele de rugăciune („🙏 Mă voi ruga”)
- **Planuri de citire, jurnal personal de rugăciune, donații (MIA/QR), contacte și live pe YouTube.**

---

## 2. Design system-ul actual

### 2.1 Culori: neutre
| Token | Luminos | Întunecat | Folosire |
|---|---|---|---|
| `bg` (`bg-cream`) | `#F5F1EB` | `#0E1311` | fundalul ecranelor (crem cald, nu alb) |
| `card` | `#FFFFFF` | `#18201C` | carduri, liste, bara de jos |
| `ink` | `#1F2937` | `#E9EEEA` | text principal |
| `muted` | `#787E87` | `#97A19B` | text secundar, etichete, iconițe inactive |
| `line` | `#ECE7E0` | `#26302B` | margini 1px, separatoare |

### 2.2 Culori: accent (6 teme, utilizatorul alege în Personalizare)
| Temă | `primary` luminos | `primary` întunecat | `primary-light` luminos | `primary-light` întunecat |
|---|---|---|---|---|
| **betania** (implicit) | `#1A472A` | `#4C9A6A` | `#EAF4EC` | `#1C2E23` |
| ocean | `#1E4E8C` | `#5B8FD6` | `#E8EFF9` | `#1A2638` |
| burgundy | `#7A1F3D` | `#C7577A` | `#F7E9EE` | `#33191F` |
| violet | `#5B3A8E` | `#9A7BD0` | `#F0EAF8` | `#261E33` |
| amber | `#8A5A12` | `#D49A3A` | `#F8F0E1` | `#332A1A` |
| teal | `#0F5E63` | `#3FA7A9` | `#E3F2F2` | `#16302F` |

- **`primaryDeep`** = culoarea `light` a accentului, în ambele moduri. Se folosește pentru antetul paginilor și cardurile „hero” închise.
- **`heroOverlay`** = `primaryDeep` cu opacitate 72%, peste poza bisericii de pe Acasă.
- **Excepții permise:** alb pe `primary`, flacăra seriei `#F59E0B`/`#FFB347` și fundalul semitransparent al modalurilor.

### 2.3 Culori de evidențiere în Biblie
| | Luminos | Întunecat |
|---|---|---|
| galben | `#FDF0B5` | `#5A4B12` |
| verde | `#D5F0D9` | `#1F4A2B` |
| albastru | `#D6E6FB` | `#1D3554` |
| roz | `#F9D9E6` | `#4D2235` |

### 2.4 Tipografie
- **Interfața:** fontul sistemului (SF Pro pe iOS, Roboto pe Android).
- **Textul biblic și versetele:** serif (Georgia pe iOS, serif pe Android). Utilizatorul poate dezactiva serif-ul și alege mărimea între 14 și 28 (implicit 18).
- **Scara folosită acum** (neformalizată, de curățat):

| Rol | Mărime / greutate |
|---|---|
| titlu mare (Acasă, profil) | 28 / 24 bold |
| titlu antet | 19 bold |
| titlu card | 17–19 bold |
| verset pe card | 18–19 serif, interlinie ~1,5 |
| text | 15–16 |
| secundar | 13–14 |
| etichetă de secțiune | **11, bold, MAJUSCULE, spațiere largă**, culoare `muted` |
| mărunt | 10–12 |

### 2.5 Forme, spațieri, umbre
- **Colțuri:** carduri 16 (`rounded-2xl`) și 24 (`rounded-3xl`), butoane 12–16, pastile complet rotunde, poze de profil rotunde.
- **Spațieri:** pe grilă de 4. Marginea ecranului e 16, padding-ul cardurilor 16–20, distanța dintre carduri 10–16.
- **Margini:** 1px `line` pe toate cardurile. Umbrele sunt minime (elevation 2–6 pe Android).
- **Atingeri:** zona de atingere minimă e de 40–44pt. La atingere există vibrații ușoare (haptics).

### 2.6 Iconițe
**Ionicons** (setul din Expo), varianta *outline*, cu varianta plină pentru starea activă. Dacă propui iconițe proprii, livrează-le în SVG, pe grilă de 24.

### 2.7 Imagini existente
- **`assets/images/church.png`:** fotografia bisericii, din dronă, folosită pe Acasă și pe Donează, sub un strat colorat cu accentul temei.
- **`assets/images/icon.png`:** iconița aplicației. Splash-ul are fundal `#1A472A`.

---

## 3. Componente existente
| Componentă | Ce e |
|---|---|
| **ScreenHeader** | Antetul paginilor: fundal `primaryDeep`, săgeata „înapoi” în cerc translucid, titlu 19 bold și subtitlu opțional, acțiune opțională în dreapta |
| **Hero** | Poza bisericii cu strat colorat; jos se topește în culoarea fundalului, iar la tras în jos se întinde |
| **Bara de taburi** | 4 taburi: Acasă · Biblia · Donează · Mai mult; iconiță + etichetă, activ = `primary` |
| **Card** | `card` + margine `line` + colțuri 16/24 |
| **Etichetă de secțiune** | 11, majuscule, `muted`, deasupra cardurilor |
| **MemberRow** | Rând de membru: poză 44, nume, @nickname sau subtitlu, flacăra seriei, element în dreapta |
| **Avatar** | Poză rotundă sau inițiale albe pe `primary` |
| **FriendButton** | Stări: Adaugă (plin) · Cerere trimisă · Acceptă/Refuză · Prieteni (contur) |
| **OccurrenceCard** | Rând de calendar: oră (sau ☀ toată ziua), bară verticală colorată, titlu, temă, „peste 2 zile”/„Acum” |
| **LessonCard** | Lecția de la Grup mic: data, pasajul, titlul, rezumatul, „Citește” + „Am citit”, pozele celor care au citit |
| **Stars** | 1–3 stele (pline/contur) |
| **AchievementsGrid** | Grilă 3 coloane: insigna 56×56, titlu, progres sau descriere |
| **AchievementCelebration** | Modal centrat: „Realizare nouă!”, insignă 96, titlu, descriere, „Slavă Domnului!” |
| **Butoane** | Principal: fundal `primary`, text alb bold, colțuri 12–16. Secundar: contur 2px `primary` pe `primary-light`. Terțiar: text `primary` |
| **Pastile/chip-uri** | Filtre și opțiuni: activ = `primary-light` + margine `primary` |
| **Comutatorul RO/RU** | Pastilă albă activă pe fundal translucid |

---

## 4. Inventarul ecranelor (24 + un modal)

**Taburi**
1. **Acasă**:
   - antetul cu poza bisericii: buton de culori, poza ta de profil, 🔥 seria, RO/RU, salutul, numele bisericii
   - cardul **Versetul zilei**, peste marginea pozei (inimă, copiere, trimitere, „Capitolul →”)
   - grila 3×2 de acțiuni rapide
   - cardul „Următoarea întâlnire” (`primaryDeep`)
   - cardul Grup mic, planul de citire, „Continuă lectura”, anunțuri
2. **Biblia:** cărțile Vechiului și Noului Testament, căutarea, continuarea lecturii.
3. **Donează:** poza, sume rapide, sumă proprie, buton mare, cod QR, versetul despre dărnicie.
4. **Mai mult:** cardul de profil sau „Intră în comunitate”, apoi meniul pe secțiuni (Viața spirituală · Biserica · Aplicația), cu badge-uri.

**Biblie și viață spirituală**

5. **Cititorul** (`citire`): textul capitolului (serif, mărime reglabilă), versete selectabile, bara de jos cu culori de evidențiere, copiere, trimitere și ⭐ verset preferat, navigarea între capitole.
6. **Căutare:** câmp de căutare, rezultate cu cuvântul evidențiat.
7. **Salvate:** versetele evidențiate.
8. **Planuri** și **Planul**: lista planurilor și zilele cu bife.
9. **Memorare:** cardul versetului săptămânii (cu „Ascunde”), cele 3 jocuri cu stele, clasamentul săptămânii, repetarea versetelor trecute.
10. **Jocul** (3 variante):
    - **Completează:** text cu goluri și cuvinte de ales
    - **Ordonează:** bucăți de verset de pus în ordine
    - **Din memorie:** doar primele litere, cu butoanele „Încă un cuvânt” și „Verifică”
    - **Rezultatul:** insigna, stelele, „Încă o dată” și „Următorul joc”
11. **Jurnalul de rugăciune** (personal, pe telefon): cereri, „Răspunsă”, link spre peretele comunității.

**Biserică**

12. **Calendar:** grila lunii cu puncte (eveniment al tineretului / serviciu), ziua aleasă, „În curând”, „Adaugă în Google Calendar”.
13. **Program:** card spre calendar, întâlnirile săptămânale, următoarele 14 zile, anunțuri.
14. **Grup mic:** lecția curentă și lista celor 29 de lecții ale sezonului, cu progres.
15. **Contacte și live.**
16. **Istoria bisericii** (video YouTube).
17. **Mulțumim** (după donație).

**Comunitate**

18. **Cont:** Intră / Cont nou (cod de invitație, nickname, prenume, nume, email, parolă).
19. **Profil:**
    - poza (104), numele, @nickname, numărul de prieteni, bio
    - butonul de prietenie, pe profilul altcuiva
    - 3 statistici: **Seria** (plin, `primary`), Record, Zile active
    - cardul cu versetul preferat
    - grila de realizări, „Membru din…”
20. **Editare profil:** poza cu buton de cameră, câmpurile, versetul preferat, Salvează, Ieși din cont, Șterge contul.
21. **Membri** (tab Membri / Clasament): căutare, cereri de prietenie, sugestii („2 prieteni comuni”), prietenii mei, toți membrii; clasamentul seriilor cu 🥇🥈🥉.
22. **Peretele de rugăciune:** compunere (text, „Toți membrii”/„Doar prietenii”, Trimite), filtrele Toate/Ale mele, carduri de cerere (autor, timp, text, „🙏 Mă voi ruga · N” cu pozele celor care se roagă, „Răspunsă ✓”).
23. **Felicitarea pentru o realizare** (modal).

**Aplicația**

24. **Personalizare:** cele 6 culori, Sistem/Luminos/Întunecat, textul Bibliei (mărime, serif), notificarea zilnică, limba.

**Stări de proiectat pentru fiecare ecran cu date:** se încarcă, gol, fără internet, neautentificat (comunitatea cere cont), date lungi (nume și cereri lungi, rusă).

---

## 5. Constrângeri tehnice (ca designul să poată fi implementat 1:1)
1. **Culorile vin doar din token-uri:**
   - `bg`, `card`, `ink`, `muted`, `line`, `primary`, `primary-light`, `primaryDeep`
   - Fiecare ecran trebuie să arate bine în **toate cele 6 accente × luminos/întunecat**. Nu proiecta pe o singură culoare „de brand” fixă.
   - Dacă propui token-uri noi (de exemplu `success`, `warning` sau un al doilea accent), dă valorile pentru ambele moduri.
2. **Fonturi proprii se pot adăuga** (prin expo-font), dar cel mult 1–2 familii, cu licență liberă (Google Fonts) și diacritice complete RO (ă â î ș ț) și chirilice.
3. **Animațiile** să fie simple: fade, scale, slide, spring. Fără Lottie sau 3D, care ar cere module noi.
4. **Lățimi de referință:** 375pt (iPhone) și 412dp (Android). Respectă zonele sigure (notch, bara de jos).
5. **Text dinamic:** versetele au mărimea aleasă de utilizator (14–28), iar layout-ul trebuie să suporte și 28.
6. **Fără elemente care cer date pe care nu le avem:** nu există feed public, mesaje private sau email.
7. **Iconițele:** Ionicons sau SVG propriu. Fără PNG pentru iconițe.

---

## 6. Ce cerem de la design (priorități)

### P1: Identitate și sistem
- **Iconița aplicației și ecranul de start** (splash), la nivel de App Store, plecând de la verde Betania `#1A472A` și biserica de pe deal.
- **Scara tipografică formalizată:** 6–8 stiluri cu nume (Display, Title, Headline, Body, Callout, Caption, Label), cu mărime, greutate și interlinie. Plus o eventuală pereche de fonturi, dacă aduce un plus clar.
- **Componentele de bază** într-o singură pagină de referință: butoane (toate stările), chip-uri, carduri, rânduri de listă, câmpuri de formular, pastile de stare, modal, stări goale.

### P2: Ecranele de comunitate (sunt cele mai noi și cele mai „simple” vizual)
- **Profil:** antet mai expresiv (poate un fundal cu accentul în spatele pozei), statistici, versetul preferat ca „citat” frumos, grila de realizări.
- **Membri:** lista, sugestiile (poate carduri orizontale glisante), clasamentul (podium pentru primii 3?).
- **Peretele de rugăciune:** cardul de cerere, stările „Mă voi ruga” / „Mă rog” / „Răspunsă”, compunerea.
- **Felicitarea pentru realizare:** un moment de bucurie, cald, nu ca la jocurile de noroc.

### P3: Setul de insigne pentru cele 14 realizări
Acum sunt iconițe Ionicons într-un pătrat colorat. Vrem **insigne proprii, coerente** (SVG, care merg pe orice accent), în stările obținut / neobținut.

| ID | Nume RO / RU | Condiție |
|---|---|---|
| `streak_3` | Scânteie / Искра | 3 zile la rând |
| `streak_7` | Flacără / Пламя | 7 zile la rând |
| `streak_30` | Foc viu / Живой огонь | 30 de zile la rând |
| `streak_100` | Rugul aprins / Неопалимая купина | 100 de zile la rând |
| `days_50` | Credincios / Верный | 50 de zile active |
| `memory_1` | Primul verset / Первый стих | 1 verset memorat |
| `memory_5` | Cuvântul în inimă / Слово в сердце | 5 versete |
| `memory_20` | Comoară ascunsă / Сокровище в сердце | 20 de versete |
| `lessons_5` | Pregătit / Готов | 5 lecții de la Grup mic |
| `lessons_15` | Ucenic / Ученик | 15 lecții |
| `friends_1` | Primul prieten / Первый друг | 1 prieten |
| `friends_5` | Părtășie / Общение | 5 prieteni |
| `prayer_1` | Cerere încrezătoare / С доверием | prima cerere pe perete |
| `support_10` | Mijlocitor / Ходатай | te-ai rugat pentru 10 cereri |

### P4: Acasă și jocurile
- **Acasă:** ierarhie mai clară; acum sunt multe carduri la rând (verset, acțiuni, întâlnire, Grup mic, plan, lectură, anunțuri).
- **Jocurile de memorare:** feedback la răspuns corect sau greșit, progresul în joc, ecranul de rezultat.
- **Stările goale cu ilustrații simple:** comunitatea goală, perete fără cereri, fără internet.

### Opțional
- **Imagine de distribuit pentru un verset** (story Instagram 1080×1920 și pătrat 1080×1080), în toate accentele.

---

## 7. Livrabile
- **Formatul:** Figma (sau Claude Design), cu pagini separate: Fundații · Componente · Ecrane · Insigne.
- **Pentru fiecare ecran:** luminos + întunecat, cu accentul **betania**, plus **o captură cu alt accent** (de exemplu violet) ca dovadă că sistemul ține.
- **Cel puțin un ecran-cheie în rusă,** pentru textele lungi.
- **Valorile cu numele token-urilor** de mai sus (nu doar hex), spațieri pe grila de 4.
- **Exporturi:** SVG pentru insigne și iconițe, PNG 1024×1024 pentru iconița aplicației, splash-ul în 1284×2778.
- **O listă scurtă de „schimbări față de acum”** pentru fiecare ecran, ca să poată fi implementată pe etape.

---

## 8. Resurse
- **Codul:** `github.com/cs1lyuha/bisbetania`, ramura `biblia-si-pagini-noi`.
  - temele: `lib/theme.tsx`
  - componentele: `components/`
  - ecranele: `app/`
- **Textele RO/RU:** `i18n/translations.ts`.
- **Poza bisericii și iconița actuală:** `assets/images/`.
- **Capturi de ecran actuale:** [`docs/design/`](design/README.md). Sunt 89 de capturi ale celor 36 de ecrane, în luminos și întunecat, cu cele mai importante și în rusă și în celelalte culori. Două planșe de ansamblu arată totul dintr-o privire, iar datele comunității sunt inventate.
