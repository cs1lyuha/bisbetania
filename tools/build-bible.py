#!/usr/bin/env python3
"""Generează Biblia offline și versetele zilei pentru aplicație.

Surse (descărcate o singură dată în folderul dat ca argument):
  https://api.getbible.net/v2/cornilescu.json  -> Cornilescu 1924 (RO)
  https://api.getbible.net/v2/synodal.json     -> Синодальный перевод 1876 (RU, domeniu public)
  https://raw.githubusercontent.com/thiagobodruk/bible/master/json/ro_vdc.json
      -> folosit DOAR ca referință pentru a repara cuvintele lipite din Cornilescu (ex. „Civoi”)

Rezultat:
  assets/bible/ro.bible, assets/bible/ru.bible   [carte][capitol][verset] = text (JSON)
  data/daily-verses.json                          versete populare, text RO + RU

Utilizare: python3 tools/build-bible.py <folder-cu-surse>
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Referințe în numerotarea protestantă (ca în Cornilescu): (carte, capitol, verset[, verset final]).
# Cărțile sunt numerotate 1–66 (Geneza = 1, Apocalipsa = 66).
DAILY = [
    (43, 3, 16), (24, 29, 11), (50, 4, 13), (45, 8, 28), (20, 3, 5, 6), (23, 41, 10),
    (19, 23, 1), (6, 1, 9), (40, 11, 28), (45, 12, 2), (50, 4, 6, 7), (55, 1, 7),
    (23, 40, 31), (19, 46, 1), (43, 14, 6), (40, 6, 33), (45, 5, 8), (58, 11, 1),
    (47, 5, 17), (48, 2, 20), (49, 2, 8, 9), (46, 13, 4), (46, 13, 13), (19, 119, 105),
    (19, 37, 4), (19, 27, 1), (19, 91, 1, 2), (19, 121, 1, 2), (19, 34, 8), (19, 139, 14),
    (19, 51, 10), (19, 103, 2), (19, 118, 24), (19, 16, 11), (19, 55, 22), (19, 62, 1),
    (19, 73, 26), (19, 90, 12), (19, 100, 4), (19, 145, 18), (19, 147, 3), (19, 32, 8),
    (19, 19, 14), (19, 4, 8), (19, 3, 3), (19, 18, 2), (19, 28, 7), (19, 29, 11),
    (19, 31, 24), (19, 42, 11), (19, 56, 3), (19, 84, 11), (19, 86, 5), (19, 94, 19),
    (19, 107, 1), (19, 116, 1), (19, 138, 8), (20, 18, 10), (20, 16, 3), (20, 4, 23),
    (20, 22, 6), (20, 17, 17), (20, 15, 1), (20, 16, 9), (20, 19, 21), (20, 1, 7),
    (20, 11, 25), (20, 30, 5), (23, 26, 3), (23, 43, 2), (23, 53, 5), (23, 40, 8),
    (23, 9, 6), (23, 54, 10), (23, 55, 8, 9), (23, 43, 19), (23, 58, 11), (23, 30, 15),
    (23, 12, 2), (24, 17, 7), (24, 33, 3), (24, 31, 3), (25, 3, 22, 23), (33, 6, 8),
    (36, 3, 17), (34, 1, 7), (35, 3, 19), (4, 6, 24, 26), (5, 31, 6), (5, 31, 8),
    (6, 24, 15), (9, 16, 7), (14, 7, 14), (16, 8, 10), (13, 16, 11), (2, 14, 14),
    (2, 15, 2), (1, 1, 1), (1, 28, 15), (18, 19, 25), (21, 3, 1), (39, 3, 10),
    (38, 4, 6), (40, 5, 14), (40, 5, 16), (40, 6, 34), (40, 7, 7), (40, 18, 20),
    (40, 19, 26), (40, 28, 20), (40, 22, 37), (40, 5, 8), (40, 5, 9), (40, 4, 4),
    (41, 9, 23), (41, 10, 27), (41, 11, 24), (42, 1, 37), (42, 6, 31), (42, 6, 38),
    (43, 1, 1), (43, 1, 12), (43, 8, 12), (43, 8, 32), (43, 10, 10), (43, 10, 11),
    (43, 11, 25), (43, 13, 34), (43, 14, 1), (43, 14, 27), (43, 15, 5), (43, 15, 13),
    (43, 16, 33), (43, 6, 35), (44, 1, 8), (44, 4, 12), (44, 16, 31), (44, 20, 35),
    (45, 1, 16), (45, 3, 23), (45, 6, 23), (45, 8, 1), (45, 8, 31), (45, 8, 38, 39),
    (45, 10, 9), (45, 10, 17), (45, 12, 12), (45, 15, 13), (46, 10, 13), (46, 15, 58),
    (46, 16, 14), (47, 5, 7), (47, 9, 7), (47, 12, 9), (48, 5, 22, 23), (48, 6, 9),
    (49, 3, 20), (49, 4, 32), (49, 6, 10), (50, 1, 6), (50, 4, 4), (50, 4, 8),
    (50, 4, 19), (51, 3, 2), (51, 3, 23), (52, 5, 16, 18), (53, 3, 3), (54, 4, 12),
    (55, 3, 16), (58, 4, 16), (58, 12, 2), (58, 13, 5), (58, 13, 8), (58, 10, 23),
    (59, 1, 2), (59, 1, 5), (59, 4, 8), (59, 1, 17), (60, 5, 7), (60, 2, 9),
    (61, 3, 9), (62, 1, 9), (62, 4, 8), (62, 4, 18), (62, 4, 19), (62, 5, 14),
    (66, 3, 20), (66, 21, 4),
]

# Versete unde Sinodala are alt număr (verificate manual): (carte, capitol, verset) -> (capitol, verset)
RU_OVERRIDES = {(20, 18, 10): (18, 11)}

# Psalmii au altă numerotare în Sinodală (după Septuaginta).
def synodal_psalm(chapter, verse):
    if chapter <= 8 or chapter >= 148:
        return chapter, verse
    if chapter == 9:
        return 9, verse
    if chapter == 10:
        return 9, verse + 21
    if 11 <= chapter <= 113:
        return chapter - 1, verse
    if chapter in (114, 115):
        return 113, verse if chapter == 114 else verse + 8
    if chapter == 116:
        return (114, verse) if verse <= 9 else (115, verse - 9)
    if 117 <= chapter <= 146:
        return chapter - 1, verse
    return (146, verse) if verse <= 11 else (147, verse - 11)

NOTE_RE = re.compile(r'&lt;note&gt;.*?&lt;/note&gt;')
TITLE_RE = re.compile(r'&lt;title[^&]*&gt;(.*?)&lt;/title&gt;')
# În sursă, titlul psalmului următor e uneori lipit la ultimul verset al celui precedent.
GLUED_TITLES = {30: 'Псалом Давида. Учение.'}


def clean_ro(text):
    text = text.translate(str.maketrans('şţŞŢ', 'șțȘȚ'))
    text = re.sub(r'\s+([,.;:!?])', r'\1', text)
    return re.sub(r'\s+', ' ', text).strip()


def clean_ru(text):
    text = NOTE_RE.sub('', text)
    return re.sub(r'\s+', ' ', text).strip()


WORD_RE = re.compile(r'[\wăâîșțĂÂÎȘȚ-]+')


def fix_glued_words(ro, ref_path):
    """Despărțește cuvintele lipite din sursă când referința are aceleași două cuvinte separate."""
    ref = json.loads(Path(ref_path).read_text(encoding='utf-8-sig'))
    vocab = {w for b in ref for c in b['chapters'] for v in c for w in WORD_RE.findall(v)}
    fixed = 0
    for b, ref_book in zip(ro, ref):
        for c, ref_chapter in zip(b, ref_book['chapters']):
            if len(c) != len(ref_chapter):
                continue
            for i, (text, ref_text) in enumerate(zip(c, ref_chapter)):
                ref_words = WORD_RE.findall(ref_text)
                for x, y in zip(ref_words, ref_words[1:]):
                    glued = x + y
                    if glued not in vocab and re.search(rf'(?<![\w]){re.escape(glued)}(?![\w])', text):
                        text = re.sub(rf'(?<![\w]){re.escape(glued)}(?![\w])', f'{x} {y}', text)
                        fixed += 1
                # literă mică urmată de majusculă în același cuvânt: „pogorîDuhul”
                text, n = re.subn(r'([a-zăâîșț])([A-ZĂÂÎȘȚ])', r'\1 \2', text)
                fixed += n
                c[i] = text
    return fixed


def fix_synodal_titles(psalms):
    for i, chapter in enumerate(psalms[:-1]):
        last = chapter[-1]
        title = None
        m = TITLE_RE.search(last)
        if m:
            title, last = m.group(1), TITLE_RE.sub('', last)
        elif GLUED_TITLES.get(i + 1) and last.rstrip().endswith(GLUED_TITLES[i + 1]):
            title = GLUED_TITLES[i + 1]
            last = last.rstrip()[:-len(title)]
        if title:
            chapter[-1] = clean_ru(last)
            psalms[i + 1][0] = f'{title} {psalms[i + 1][0]}'


def load(path, clean, max_chapters=None, raw=False):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    books = {b['nr']: b for b in data['books'] if b['nr'] <= 66}
    out = []
    for nr in range(1, 67):
        chapters = books[nr]['chapters']
        limit = (max_chapters or {}).get(nr)
        if limit:
            chapters = chapters[:limit]
        out.append([[v['text'] if raw else clean(v['text']) for v in c['verses']] for c in chapters])
    return out


def main():
    src = Path(sys.argv[1])
    ro = load(src / 'cornilescu.json', clean_ro)
    print('cuvinte lipite reparate:', fix_glued_words(ro, src / 'ro_vdc.json'))
    # Sinodala are Psalmul 151 și Daniel 13–14 (adăugiri deuterocanonice) — rămânem la canonul de 66 de cărți.
    ru = load(src / 'synodal.json', clean_ru, {19: 150, 27: 12}, raw=True)
    fix_synodal_titles(ru[18])
    ru = [[[clean_ru(v) for v in c] for c in b] for b in ru]

    out_dir = ROOT / 'assets' / 'bible'
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, bible in (('ro', ro), ('ru', ru)):
        (out_dir / f'{name}.bible').write_text(
            json.dumps(bible, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    daily = []
    for ref in DAILY:
        b, c, v = ref[:3]
        ve = ref[3] if len(ref) > 3 else v
        rc, rv = (c, v)
        rve = ve
        if b == 19:
            rc, rv = synodal_psalm(c, v)
            # titlurile psalmilor sunt numărate ca versete în Sinodală
            offset = len(ru[b - 1][rc - 1]) - len(ro[b - 1][c - 1]) if (rc, rv) == (c - 1, v) or rc == c else 0
            rv += max(offset, 0)
            rve = rv + (ve - v)
        if (b, c, v) in RU_OVERRIDES:
            rc, rv = RU_OVERRIDES[(b, c, v)]
            rve = rv + (ve - v)
        entry = {
            'ro': {'b': b, 'c': c, 'v': v, 've': ve, 't': ' '.join(ro[b - 1][c - 1][v - 1:ve])},
            'ru': {'b': b, 'c': rc, 'v': rv, 've': rve, 't': ' '.join(ru[b - 1][rc - 1][rv - 1:rve])},
        }
        daily.append(entry)
    (ROOT / 'data').mkdir(exist_ok=True)
    (ROOT / 'data' / 'daily-verses.json').write_text(
        json.dumps(daily, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(daily)} versete ale zilei; RO {sum(len(c) for b in ro for c in b)} versete, '
          f'RU {sum(len(c) for b in ru for c in b)} versete')


if __name__ == '__main__':
    main()
