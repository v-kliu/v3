/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
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
        syne: ['var(--font-syne)', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
