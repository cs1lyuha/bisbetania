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
        cream: token('bg'),
        card: token('card'),
        ink: token('ink'),
        muted: token('muted'),
        line: token('line'),
      },
    },
  },
  plugins: [],
};
