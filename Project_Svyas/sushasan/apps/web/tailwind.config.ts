import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron:       { DEFAULT: '#FF9933', light: '#FFD699', dark: '#c8741a' },
        'india-green': '#138808',
        navy:          { DEFAULT: '#0B1F3A', light: '#1a3560' },
        graphite:      '#0A0A0A',
        paper:         '#fafaf7',
        ink:           { DEFAULT: '#0a0a0a', 2: '#3a3a36', 3: '#7a766d', 4: '#b3b0a8' },
        // Issue colours
        traffic:    '#EF4444',
        water:      '#3B82F6',
        electricity:'#F59E0B',
        garbage:    '#10B981',
        other:      '#8B5CF6',
      },
      fontFamily: {
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
