/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beauty: {
          cream: '#FAF7F5',  // Soft backdrop cream
          clay: '#F2EAE4',   // Soft warm neutral for panels
          rose: '#EAD5C9',   // Warm blush sand accent
          blush: '#F9EAE1',  // Warm light rose
          sage: '#E2ECE9',   // Herbal sage green for stock badges / safe items
          taupe: '#8D7B70',  // Muted wood/taupe primary
          dark: '#2C2523',   // Near-black charcoal warm brown for text
          accent: '#D9A78B', // Soft rose gold/accent coral
          gold: '#D4AF37',   // Champagne gold for special ratings/badges
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        }
      }
    },
  },
  plugins: [],
}
