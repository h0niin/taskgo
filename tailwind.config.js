/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Canvas backgrounds
        purple:  '#8B5CF6',
        orange:  '#F97316',
        teal:    '#14B8A6',
        emerald: '#10B981',
        // Card fills
        cream:   '#FEF9C3',
        creamDark: '#FEF08A',
        lavender: '#EDE9FE',
        mint:    '#D1FAE5',
        // CTA buttons
        lime:    '#84CC16',
        hotpink: '#EC4899',
        violet:  '#A855F7',
        // Neutrals
        black:   '#000000',
        white:   '#FFFFFF',
      },
      fontWeight: {
        black: '900',
      },
    },
  },
  plugins: [],
};
