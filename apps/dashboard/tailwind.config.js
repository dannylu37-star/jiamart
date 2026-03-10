/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E84E1B',
          dark:    '#CC3300',
          light:   '#FF6B3D',
        },
        sidebar: '#1a1a2e',
      },
    },
  },
  plugins: [],
}
