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
        sf: {
          bg: '#0c0d12',
          card: '#141622',
          cardBorder: '#232738',
          cardHover: '#1c1f30',
          accent: '#e11d48',
          gold: '#f59e0b',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          cyan: '#06b6d4',
          orange: '#f97316',
          yellow: '#eab308',
          driveRush: '#00f0ff',
          punish: '#ef4444',
          activeHit: '#f43f5e',
          recovery: '#64748b',
          startup: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Teko', 'Impact', 'Arial Black', 'sans-serif']
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite'
      }
    },
  },
  plugins: [],
}
