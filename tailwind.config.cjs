/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0b1224',
        panel: '#0f172a',
      },
      boxShadow: {
        card: '0 14px 40px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
}
