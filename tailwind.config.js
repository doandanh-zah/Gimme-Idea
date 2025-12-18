/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9945FF',
        secondary: '#14F195',
        accent: '#FFD700',
        dark: '#0a0a0a',
      },
    },
  },
  plugins: [],
}
