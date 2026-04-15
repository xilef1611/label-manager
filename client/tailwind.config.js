/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef3f2',
          100: '#fee4e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        orange: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      }
    },
  },
  plugins: [],
};
