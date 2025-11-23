/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './App.tsx',
    './*.{js,ts,jsx,tsx,mdx}', 
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        surface: '#0F0F0F',
        surfaceHighlight: '#1A1A1A',
        primary: {
          DEFAULT: '#9945FF', // Solana Purple
          dark: '#7c3aed',
        },
        accent: {
          DEFAULT: '#ffd8b4', // Peach/Gold Accent
          hover: '#ffcba0',
        },
        success: '#14F195', // Solana Green
        gold: '#ffd700',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-space)', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'orb-1': 'orb-float-1 12s ease-in-out infinite',
        'orb-2': 'orb-float-2 15s ease-in-out infinite',
        'orb-3': 'orb-float-3 14s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}