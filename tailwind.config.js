/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FDFBF7',
          100: '#FBF5EB',
          200: '#F5E6CC',
          300: '#EED3A8',
          400: '#E4BC7A',
          500: '#D4AF37', // Royal Gold
          600: '#B89428',
          700: '#91721D',
          800: '#6C5315',
          900: '#4A370C',
        },
        noir: {
          950: '#070709',
          900: '#0C0D10',
          850: '#121318',
          800: '#181A20',
          750: '#1F222B',
          700: '#2A2E3B',
          600: '#41475A',
        },
        saffron: {
          500: '#F59E0B',
          600: '#D97706',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cinzel', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse': 'spin-reverse 25s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FBF5EB 0%, #D4AF37 50%, #B89428 100%)',
        'dark-overlay': 'radial-gradient(circle at center, rgba(12,13,16,0.3) 0%, rgba(7,7,9,0.85) 100%)',
        'vignette': 'linear-gradient(to bottom, rgba(7,7,9,0.85) 0%, rgba(7,7,9,0.2) 30%, rgba(7,7,9,0.2) 70%, rgba(7,7,9,0.95) 100%)',
      }
    },
  },
  plugins: [],
}
