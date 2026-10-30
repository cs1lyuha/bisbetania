# Redesign P2 + P4: notițe pentru implementare

Sursa: [`BisBetania-Redesign-P2-P4.pdf`](BisBetania-Redesign-P2-P4.pdf) (16 pagini). Fiecare pagină e un ecran lung, iar 1pt de telefon = 2,25px la 216 dpi.

| Pagini | Ecran | Variante |
|---|---|---|
| 1–3 | Profil | luminos, întunecat, violet întunecat |
| 4–9 | Membri | luminos, întunecat, ocean (paginile 4–6); Clasament luminos, întunecat, amber (paginile 7–9) |
| 10–13 | Peretele de rugăciune | luminos, întunecat, violet, rusă |
| 14–16 | Felicitarea pentru realizare | luminos, întunecat, teal întunecat |

## Fonturi
- **Interfața:** Inter. Pachet: `@expo-google-fonts/inter`.
- **Serif:** Source Serif 4 (titluri, nume, cifre, inițialele din avatar, versete în *italic*). Pachet: `@expo-google-fonts/source-serif-4`.
- Ambele au diacritice românești și chirilice. Se încarcă cu `expo-font`, deci merg prin OTA.

## Iconițe
Par să fie din setul **Lucide** (`lucide-react-native`, care folosește `react-native-svg`, deja instalat):
- realizări: flame, flame-kindling, calendar-check, lightbulb, gem, book-open, users, user-plus, message-square-more
- **mâinile în rugăciune:** Lucide nu are această iconiță; o propunere e `hands-pray` din MaterialCommunityIcons

## Profil
- **Antetul:** `primaryDeep` înalt (~230pt), cu arcuri concentrice subțiri (alb ~10%) și titlul „Profil” centrat.
- **Avatarul:** 120pt, pe jumătate peste antet, cu inel `bg` de ~6pt; fundal `primary-light`, inițiale serif `primary`.
- **Numele:** serif bold ~30. Dedesubt, „@nick · N prieteni”, apoi bio-ul centrat și butonul alb „✎ Editează profilul”.
- **Cardul de statistici, împărțit în două:**
  - stânga, pe `primary`: SERIA, cifra serif 56, bara de progres până la record, „Încă N zile până la un record nou”
  - dreapta: Record și Zile active (cifre serif)
- **Versetul preferat:** card `primary-light`, ghilimele mari decorative, text serif *italic* 20, „— Ioan 15:5” și „Capitolul ›”.
- **Realizările:**
  - card „Aproape: X”, cu bara și textul de progres
  - grilă cu **4 coloane**: cercuri de 56pt, pline cu `primary` când sunt obținute, iar cele neobținute au un **inel de progres**; dedesubt, numele și „15/30”

## Membri
- **Antetul:** titlu serif și subtitlu, plus comutatorul Membri/Clasament **în antet** (fundal alb ~15%, opțiunea activă albă, cu text `primary`).
- **Cererile de prietenie:** rând pe `primary-light`, cu „acum 3 ore”, Acceptă (plin) și Refuză (text).
- **Sugestiile:** carduri de ~150pt care se derulează **orizontal**, cu avatarul de 56, numele, pozele prietenilor comuni și „Adaugă”.
- **Listele:** avatar de 44 cu inițiale serif, 🔥 cu numărul, săgeată; pastila „🕓 Cerere trimisă” în rând.
- **Clasamentul:**
  - un rând de explicație cu 🔥
  - **podium** cu ordinea 2-1-3: locul 1 are avatar de 76 cu inel dublu și bloc `primary`; locurile 2 și 3 au blocuri `primary-light` și cifre serif
  - eu am inel amber și eticheta „TU”
  - lista de la locul 4, cu numărul serif și „Record 9 · 22 zile active”

## Peretele de rugăciune
- **Compunerea:** avatarul meu, textul, separator, meniul „🌐 Toți membrii ⌄” și „Trimite”.
- **Filtrele cu număr:** „Toate 5”, „Ale mele 1”.
- **Cardul de cerere:** „acum 2 h · 🌐 Toți membrii”, pastila „Tu”, butonul „🙏 Mă voi ruga” (`primary-light`) sau „Mă rog ✓” (`primary`), avatare de 32 + „+N”.
- **Cererea mea:** „Ana și Maria se roagă pentru tine”, „◯✓ Marchează răspunsă” și coșul de gunoi.
- **Cererea răspunsă:** card `primary-light`, „✓ Răspunsă”, text serif, „Tu și încă 5 v-ați rugat”.

## Felicitarea
- Cardul e plasat sus. Cercul cu iconița de 80pt are **raze** în jur.
- Titlul e serif 34, urmat de descriere.
- Rândul „Următoarea: Foc viu 15/30” are bară de progres.
- Dedesubt: butonul „Slavă Domnului!”, linkul „Vezi realizările” și „1 din 2”.
- **În modul întunecat**, textul de pe butoanele pline e închis la culoare (`bg`).

## Cum s-a implementat (diferențe față de notițele de mai sus)
- **Inter** vine din `@expo-google-fonts/inter`, doar greutățile 400, 500, 600 și 700.
- **Source Serif 4** nu vine din `@expo-google-fonts/source-serif-4`: fișierele din Google Fonts sunt la o mărime optică mică (mai late și mai grele decât în planșe). Sunt fișierele oficiale Adobe, în `assets/fonts/` (licența OFL alături), în mărimile optice potrivite: *Subhead Semibold* pentru titluri, nume și cifre, *Text Regular* și *Text Italic* pentru versete și cererile răspunse.
- **Iconițele** sunt SVG proprii în `components/Icon.tsx`, cu traseele din Lucide (licența ISC e în fișier), nu pachetul `lucide-react-native` (ar fi adus ~1500 de iconițe în aplicație). Ce nu există în Lucide e desenat în același stil: mâinile în rugăciune, rugul aprins, inima cu Cuvântul, trei persoane, podiumul.
- **Token nou `onPrimary`** (clasa `text-on-primary`): alb pe accent în modul luminos, `bg` în cel întunecat.
- **Mărimile textului** sunt măsurate din planșe (lățimea acelorași cuvinte în PDF și în aplicație): text 15–16, secundar 12–13, etichete 11, titlul antetului 24, numele din profil 30, cifra seriei 46.
- **Antetul nou** (`ScreenHeader`: titlu serif, butonul „înapoi” de 44pt) se vede pe toate ecranele, nu doar pe cele din planșe.
- **Capturile de comparație:** `HEIGHT=1720 node tools/capturi/shoot.mjs …` face capturi lungi, cât paginile din PDF; variantele din planșe (clasament auriu, perete vișiniu întunecat, felicitare smarald întunecat) sunt în `shoot.mjs`.
