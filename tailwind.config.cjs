/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#000000',
        panel: '#000000',
      },
      boxShadow: {
        card: '0 14px 40px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
}
