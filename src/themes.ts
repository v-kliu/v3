export interface Theme {
  id: string
  name: string
  vars: Record<string, string>
}

export const themes: Theme[] = [
  {
    id: 'newspaper',
    name: 'Newspaper',
    vars: {
      '--bg': '#E8DEC8',
      '--bg-alt': '#DDD3B8',
      '--text': '#1a1a1a',
      '--text-muted': '#5a5a5a',
      '--text-faint': '#9A8E78',
      '--accent': '#8B0000',
      '--border': '#B8AC92',
    },
  },
  {
    id: 'parchment',
    name: 'Parchment',
    vars: {
      '--bg': '#F0E9D6',
      '--bg-alt': '#E8E0C8',
      '--text': '#1a1a1a',
      '--text-muted': '#5a5a5a',
      '--text-faint': '#9A8E78',
      '--accent': '#8B0000',
      '--border': '#C4BAA0',
    },
  },
  {
    id: 'hacker',
    name: 'Hacker',
    vars: {
      '--bg': '#050505',
      '--bg-alt': '#0f0f0f',
      '--text': '#e0e0e0',
      '--text-muted': '#909090',
      '--text-faint': '#505050',
      '--accent': '#00ff41',
      '--border': '#222222',
    },
  },
  {
    id: 'space',
    name: 'Deep Space',
    vars: {
      '--bg': '#0B0C1E',
      '--bg-alt': '#111228',
      '--text': '#ccd6f6',
      '--text-muted': '#8892b0',
      '--text-faint': '#4a5568',
      '--accent': '#00D9FF',
      '--border': '#1e2440',
    },
  },
  {
    id: 'sepia',
    name: 'Daguerreotype',
    vars: {
      '--bg': '#F2E6C8',
      '--bg-alt': '#EAD8AE',
      '--text': '#1a0f00',
      '--text-muted': '#5c3d1e',
      '--text-faint': '#9e7e52',
      '--accent': '#7C5B14',
      '--border': '#C9A96E',
    },
  },
  {
    id: 'forest',
    name: 'Midnight Forest',
    vars: {
      '--bg': '#080f09',
      '--bg-alt': '#0d1a0e',
      '--text': '#c8e6cc',
      '--text-muted': '#6aab74',
      '--text-faint': '#355c3a',
      '--accent': '#4ade80',
      '--border': '#162e1a',
    },
  },
  {
    id: 'crimson',
    name: 'Crimson Noir',
    vars: {
      '--bg': '#120408',
      '--bg-alt': '#1c0810',
      '--text': '#f0d0d8',
      '--text-muted': '#a06070',
      '--text-faint': '#5a3040',
      '--accent': '#ff4d6d',
      '--border': '#2e1020',
    },
  },
  {
    id: 'abyss',
    name: 'Abyss',
    vars: {
      '--bg': '#020b14',
      '--bg-alt': '#041625',
      '--text': '#cce8f5',
      '--text-muted': '#5090b0',
      '--text-faint': '#284e65',
      '--accent': '#06b6d4',
      '--border': '#092438',
    },
  },
  {
    id: 'desert',
    name: 'Desert Dusk',
    vars: {
      '--bg': '#F5E4C0',
      '--bg-alt': '#EDCF98',
      '--text': '#2D1B00',
      '--text-muted': '#6b4a1e',
      '--text-faint': '#A87840',
      '--accent': '#C2410C',
      '--border': '#D4A45A',
    },
  },
  {
    id: 'rose',
    name: 'Rose & Ash',
    vars: {
      '--bg': '#F5ECF0',
      '--bg-alt': '#EADAE0',
      '--text': '#1a0810',
      '--text-muted': '#7a4455',
      '--text-faint': '#AA7888',
      '--accent': '#9B2335',
      '--border': '#D4A0B0',
    },
  },
]
