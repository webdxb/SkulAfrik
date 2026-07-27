export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // PayPal brand blues (Pal Blue / dark #003087, Pay Blue / light #009CDE)
        // mapped onto Tailwind's indigo scale so every existing indigo-XXX class
        // in the app picks these up automatically.
        indigo: {
          50: '#eaf3fb',
          100: '#cfe4f6',
          200: '#a3cbee',
          300: '#6fadE3',
          400: '#3d90d6',
          500: '#0079C1', // PayPal "Pal Blue" accent
          600: '#009CDE', // PayPal light blue
          700: '#00457C', // PayPal darker accent blue
          800: '#003087', // PayPal primary dark blue
          900: '#012169', // PayPal navy
          950: '#001c4d',
        },
      },
    },
  },
  plugins: [],
}
