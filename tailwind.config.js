/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette EKVARA — identique à EkvaraFrontend, même 4 couleurs de
        // marque (voir ticket §3). Ne pas diverger : c'est le même produit,
        // un contexte différent.
        ekvara: {
          black: '#090909',
          surface: '#FAFAF8',
          muted: '#A3A3A3',
          lime: '#D9FF43',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
