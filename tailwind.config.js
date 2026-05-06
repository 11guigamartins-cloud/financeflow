/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        surface: {
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#080f1a',
        },
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.25)',
        glow: '0 0 20px rgba(14,165,233,0.3)',
      },
    },
  },
  plugins: [],
}

