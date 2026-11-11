/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F1A2E',
        ink: '#101827',
        muted: '#5B6473',
        accent: '#3B9BEA',
        blush: '#F6EAF8',
        periwinkle: '#E3E8FB',
        mist: '#F0F1F3',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Chakra Petch', 'Poppins', 'system-ui', 'sans-serif'],
        jersey: ['"Jersey 25"', 'Chakra Petch', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
