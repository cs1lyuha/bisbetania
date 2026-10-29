// Textele peretelui de rugăciune care depind de numere și nume (pure, ca să poată fi testate cu Node).
import type { Language } from '../i18n/translations';

/** „Ana și Maria se roagă pentru tine”, „Ana, Maria și încă 2 se roagă pentru tine”. Gol dacă nu se roagă nimeni. */
export function supportersSentence(lang: Language, names: string[]) {
  const ro = lang === 'ro';
  if (!names.length) return '';
  if (names.length === 1) return ro ? `${names[0]} se roagă pentru tine` : `${names[0]} молится за тебя`;
  if (names.length === 2) return ro ? `${names[0]} și ${names[1]} se roagă pentru tine` : `${names[0]} и ${names[1]} молятся за тебя`;
  const rest = names.length - 2;
  return ro ? `${names[0]}, ${names[1]} și încă ${rest} se roagă pentru tine` : `${names[0]}, ${names[1]} и ещё ${rest} молятся за тебя`;
}

/** Sub o cerere răspunsă: cine s-a rugat pentru ea („Tu și încă 5 v-ați rugat”). Gol dacă nimeni. */
export function prayedSentence(lang: Language, total: number, includesMe: boolean) {
  const ro = lang === 'ro';
  if (total <= 0) return '';
  if (includesMe) {
    const others = total - 1;
    if (!others) return ro ? 'Te-ai rugat pentru această cerere' : 'Ты молился(ась) за эту просьбу';
    return ro ? `Tu și încă ${others} v-ați rugat` : `Ты и ещё ${others} молились`;
  }
  if (total === 1) return ro ? 'O persoană s-a rugat' : 'Молился 1 человек';
  if (ro) return `${total}${total % 100 >= 20 ? ' de' : ''} persoane s-au rugat`;
  const mod10 = total % 10;
  const mod100 = total % 100;
  const word = mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 'человека' : 'человек';
  return `Молились ${total} ${word}`;
}
