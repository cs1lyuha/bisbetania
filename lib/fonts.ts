// Fonturile redesign-ului: Inter pentru interfață, Source Serif 4 pentru titluri, nume, cifre și versete.
// Din Inter importăm doar greutățile folosite (pachetul întreg ar pune în aplicație toate cele 18 fișiere).
// Source Serif 4 e din pachetul oficial Adobe (assets/fonts, licența OFL alături), în mărimile optice potrivite:
// „Subhead” pentru titluri și cifre mari, „Text” pentru versete. Fișierele din Google Fonts sunt doar la o mărime
// optică mică, mai lată și mai grea, și titlurile arătau altfel decât în planșele designerului.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

/**
 * Numele familiilor, pentru stilurile inline. Greutatea vine din familie, nu din `fontWeight`:
 * pe Android un fontWeight peste un font propriu îl înlocuiește cu cel al sistemului.
 * Aceleași nume sunt în tailwind.config.js (font-ui…, font-display…).
 */
export const FONT = {
  ui: 'Inter_400Regular',
  uiMedium: 'Inter_500Medium',
  uiSemibold: 'Inter_600SemiBold',
  uiBold: 'Inter_700Bold',
  serif: 'SourceSerif4Text_400Regular',
  serifItalic: 'SourceSerif4Text_400Italic',
  serifSemibold: 'SourceSerif4Subhead_600SemiBold',
} as const;

export const FONT_FILES = {
  [FONT.ui]: Inter_400Regular,
  [FONT.uiMedium]: Inter_500Medium,
  [FONT.uiSemibold]: Inter_600SemiBold,
  [FONT.uiBold]: Inter_700Bold,
  [FONT.serif]: require('../assets/fonts/SourceSerif4-Regular.ttf'),
  [FONT.serifItalic]: require('../assets/fonts/SourceSerif4-It.ttf'),
  [FONT.serifSemibold]: require('../assets/fonts/SourceSerif4Subhead-Semibold.ttf'),
};
