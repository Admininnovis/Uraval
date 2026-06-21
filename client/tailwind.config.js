/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        text: 'var(--text)',
        'ledger-aged': '#F8F1DF',
        'ledger-paper': '#EFE4C9',
        'ledger-ink': '#2F241D',
        'ledger-brown': '#5C4033',
        'ledger-green': '#2F855A',
        'ledger-red': '#9B2C2C',
        'ledger-gold': '#B8860B',
      },
      backgroundImage: {
        'paper-texture': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"400\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.04\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.05\"/></svg>')",
        'ruled-paper': "repeating-linear-gradient(transparent, transparent 31px, #E5E7EB 31px, #E5E7EB 32px)",
        'ledger-ruled': "repeating-linear-gradient(transparent, transparent 27px, #A3B1C6 28px)",
      },
      boxShadow: {
        'notebook': '-5px 0 15px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.05)',
        'notebook-hover': '-8px 0 20px rgba(0, 0, 0, 0.15), 0 12px 25px rgba(0, 0, 0, 0.1)',
        'paper': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      },
      animation: {
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease-out',
        'book-open': 'bookOpen 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bookOpen: {
          '0%': { transform: 'rotateY(-90deg) scale(0.95)', opacity: '0' },
          '100%': { transform: 'rotateY(0) scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
