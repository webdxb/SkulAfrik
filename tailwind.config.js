export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Glacial Indifference', 'system-ui', 'sans-serif'],
        sans: ['Glacial Indifference', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Klasoo brand violet, matching the official logo (#6D28D9), mapped onto
        // Tailwind's indigo scale so every existing indigo-XXX class across the
        // app picks it up automatically — one single source of brand color truth.
        indigo: {
          50: '#f3eefc',
          100: '#e4d7f8',
          200: '#c9b0f2',
          300: '#ab85ea',
          400: '#8c5ce2',
          500: '#7c3aed', // bright violet accent
          600: '#6D28D9', // Klasoo primary (matches the logo)
          700: '#5b21b6', // darker violet, hover states
          800: '#4c1d95', // deep violet
          900: '#3b1578',
          950: '#28104f',
        },
      },
    },
  },
  plugins: [],
}
