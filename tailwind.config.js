/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Culorile vin din tema aleasă în Setări (lib/theme.tsx), ca variabile CSS.
      colors: {
        primary: token('primary'),
        'primary-light': token('primary-light'),
        'on-primary': token('on-primary'),
        cream: token('bg'),
        card: token('card'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
      },
      // Fonturile încărcate în lib/fonts.ts; greutatea e în numele familiei (fără font-bold peste ele).
      fontFamily: {
        ui: ['Inter_400Regular'],
        'ui-medium': ['Inter_500Medium'],
        'ui-semibold': ['Inter_600SemiBold'],
        'ui-bold': ['Inter_700Bold'],
        display: ['SourceSerif4Text_400Regular'],
        'display-italic': ['SourceSerif4Text_400Italic'],
        'display-semibold': ['SourceSerif4Subhead_600SemiBold'],
      },
    },
  },
  plugins: [],
};
