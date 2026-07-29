/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f3fa',
          100: '#dde4f2',
          200: '#c0cde8',
          300: '#94abda',
          400: '#6281c7',
          500: '#3e5eb1',
          600: '#2f4997',
          700: '#263b7c',
          800: '#1b264f',
          900: '#151e3f',
          950: '#0b0f24',
        },
      },
    },
  },
  plugins: [],
}
