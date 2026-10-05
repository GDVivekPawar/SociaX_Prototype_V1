/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#0B1120',
        },
        accent: {
          DEFAULT: '#B45309',
          light: '#D97706',
          dark: '#92400E',
          muted: '#FEF3C7',
        },
        surface: {
          DEFAULT: '#F7F8FA',
          card: '#FFFFFF',
          hover: '#F1F5F9',
        },
      },
    },
  },
  plugins: [],
}
