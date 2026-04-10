/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          bg: '#0B0B1A',
          dark: '#080812',
          mid: '#0d0d1f',
        },
        cyan: {
          accent: '#00D9FF',
        },
        text: {
          muted: '#8892b0',
          mid: '#a8b2d1',
          bright: '#ccd6f6',
        }
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
