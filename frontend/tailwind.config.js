/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        segesta: {
          lavender: '#D1D1F0',
          skyblue: '#E0F2FF',
          peach: '#FCE4EC',
          cyan: '#80DEEA',
          mint: '#B2DFDB',
          electric: '#4FA9FF',
          white: '#F8F9FA',
          gray: '#B0BEC5',
          slate: '#546E7A',
        }
      }
    },
  },
  plugins: [],
}
