import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Language } from '../i18n/translations';

/** [carte][capitol][verset] = text; indicii pornesc de la 0. Generat de tools/build-bible.py */
export type BibleData = string[][][];

export interface VerseRef {
  b: number; // 1–66
  c: number;
  v: number;
  ve?: number;
}

const SOURCES: Record<Language, number> = {
  ro: require('../assets/bible/ro.bible'),
  ru: require('../assets/bible/ru.bible'),
};

export const TRANSLATION_NAME: Record<Language, string> = {
  ro: 'Cornilescu 1924',
  ru: 'Синодальный перевод',
};

// [nume RO, nume RU, număr de capitole]
const BOOK_TABLE: [string, string, number][] = [
  ['Geneza', 'Бытие', 50], ['Exodul', 'Исход', 40], ['Leviticul', 'Левит', 27],
  ['Numeri', 'Числа', 36], ['Deuteronomul', 'Второзаконие', 34], ['Iosua', 'Иисус Навин', 24],
  ['Judecători', 'Судьи', 21], ['Rut', 'Руфь', 4], ['1 Samuel', '1 Царств', 31],
  ['2 Samuel', '2 Царств', 24], ['1 Împărați', '3 Царств', 22], ['2 Împărați', '4 Царств', 25],
  ['1 Cronici', '1 Паралипоменон', 29], ['2 Cronici', '2 Паралипоменон', 36], ['Ezra', 'Ездра', 10],
  ['Neemia', 'Неемия', 13], ['Estera', 'Есфирь', 10], ['Iov', 'Иов', 42],
  ['Psalmii', 'Псалтирь', 150], ['Proverbe', 'Притчи', 31], ['Eclesiastul', 'Екклесиаст', 12],
  ['Cântarea Cântărilor', 'Песнь Песней', 8], ['Isaia', 'Исаия', 66], ['Ieremia', 'Иеремия', 52],
  ['Plângerile lui Ieremia', 'Плач Иеремии', 5], ['Ezechiel', 'Иезекииль', 48], ['Daniel', 'Даниил', 12],
  ['Osea', 'Осия', 14], ['Ioel', 'Иоиль', 3], ['Amos', 'Амос', 9],
  ['Obadia', 'Авдий', 1], ['Iona', 'Иона', 4], ['Mica', 'Михей', 7],
  ['Naum', 'Наум', 3], ['Habacuc', 'Аввакум', 3], ['Țefania', 'Софония', 3],
  ['Hagai', 'Аггей', 2], ['Zaharia', 'Захария', 14], ['Maleahi', 'Малахия', 4],
  ['Matei', 'От Матфея', 28], ['Marcu', 'От Марка', 16], ['Luca', 'От Луки', 24],
  ['Ioan', 'От Иоанна', 21], ['Faptele Apostolilor', 'Деяния', 28], ['Romani', 'Римлянам', 16],
  ['1 Corinteni', '1 Коринфянам', 16], ['2 Corinteni', '2 Коринфянам', 13], ['Galateni', 'Галатам', 6],
  ['Efeseni', 'Ефесянам', 6], ['Filipeni', 'Филиппийцам', 4], ['Coloseni', 'Колоссянам', 4],
  ['1 Tesaloniceni', '1 Фессалоникийцам', 5], ['2 Tesaloniceni', '2 Фессалоникийцам', 3], ['1 Timotei', '1 Тимофею', 6],
  ['2 Timotei', '2 Тимофею', 4], ['Tit', 'Титу', 3], ['Filimon', 'Филимону', 1],
  ['Evrei', 'Евреям', 13], ['Iacov', 'Иакова', 5], ['1 Petru', '1 Петра', 5],
  ['2 Petru', '2 Петра', 3], ['1 Ioan', '1 Иоанна', 5], ['2 Ioan', '2 Иоанна', 1],
  ['3 Ioan', '3 Иоанна', 1], ['Iuda', 'Иуды', 1], ['Apocalipsa', 'Откровение', 22],
];

export const BOOKS = BOOK_TABLE.map(([ro, ru, chapters], i) => ({ id: i + 1, ro, ru, chapters }));
export const OLD_TESTAMENT = BOOKS.slice(0, 39);
export const NEW_TESTAMENT = BOOKS.slice(39);

export function bookName(b: number, lang: Language) {
  return BOOKS[b - 1]?.[lang] ?? '';
}

export function formatRef(lang: Language, { b, c, v, ve }: Partial<VerseRef> & { b: number }) {
  let name = bookName(b, lang);
  if (b === 19 && v) name = lang === 'ro' ? 'Psalmul' : 'Псалом';
  if (!c) return name;
  if (!v) return `${name} ${c}`;
  return `${name} ${c}:${v}${ve && ve !== v ? `–${ve}` : ''}`;
}

export const verseKey = (lang: Language, b: number, c: number, v: number) => `${lang}:${b}:${c}:${v}`;

const cache: Partial<Record<Language, Promise<BibleData>>> = {};
const loaded: Partial<Record<Language, BibleData>> = {};

async function readBible(lang: Language): Promise<BibleData> {
  const asset = Asset.fromModule(SOURCES[lang]);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const text = Platform.OS === 'web' ? await (await fetch(uri)).text() : await new File(uri).text();
  return JSON.parse(text);
}

export function loadBible(lang: Language): Promise<BibleData> {
  if (!cache[lang]) {
    cache[lang] = readBible(lang).then((data) => {
      loaded[lang] = data;
      return data;
    });
    cache[lang]!.catch(() => {
      delete cache[lang];
    });
  }
  return cache[lang]!;
}

export function useBible(lang: Language) {
  const [data, setData] = useState<BibleData | null>(loaded[lang] ?? null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(loaded[lang] ?? null);
    setError(false);
    loadBible(lang)
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [lang]);

  return { data, error };
}

// --- Căutare (fără diacritice, fără majuscule) ---

const FOLD: Record<string, string> = {
  ă: 'a', â: 'a', î: 'i', ș: 's', ş: 's', ț: 't', ţ: 't', ё: 'е', й: 'и',
};

export function fold(text: string) {
  return text.toLowerCase().replace(/[ăâîșşțţёй]/g, (ch) => FOLD[ch] ?? ch);
}

const searchIndex: Partial<Record<Language, { b: number; c: number; v: number; folded: string }[]>> = {};

export interface SearchHit {
  b: number;
  c: number;
  v: number;
  text: string;
}

export function searchBible(data: BibleData, lang: Language, query: string, limit = 200) {
  const q = fold(query.trim());
  if (q.length < 3) return { hits: [] as SearchHit[], total: 0 };
  if (!searchIndex[lang]) {
    const rows: { b: number; c: number; v: number; folded: string }[] = [];
    data.forEach((book, bi) =>
      book.forEach((chapter, ci) =>
        chapter.forEach((verse, vi) => rows.push({ b: bi + 1, c: ci + 1, v: vi + 1, folded: fold(verse) })),
      ),
    );
    searchIndex[lang] = rows;
  }
  const hits: SearchHit[] = [];
  let total = 0;
  for (const row of searchIndex[lang]!) {
    if (row.folded.includes(q)) {
      total++;
      if (hits.length < limit) hits.push({ b: row.b, c: row.c, v: row.v, text: data[row.b - 1][row.c - 1][row.v - 1] });
    }
  }
  return { hits, total };
}
