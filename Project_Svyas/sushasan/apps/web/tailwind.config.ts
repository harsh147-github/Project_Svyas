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
      keyframes: {
        'hint-rise': {
          '0%':   { opacity: '0', transform: 'translateX(-50%) translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        'arrow-bounce': {
          '0%, 100%': { transform: 'translateY(0)'   },
          '50%':       { transform: 'translateY(6px)' },
        },
        'card-slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(60px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'overlay-fade': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'hint-rise':     'hint-rise 0.5s ease-out both',
        'bounce-slow':   'arrow-bounce 1.2s ease-in-out 4',
        'card-slide-up': 'card-slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) both',
        'overlay-fade':  'overlay-fade 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
