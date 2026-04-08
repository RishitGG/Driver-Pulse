/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      colors: {
        uber: {
          black: '#000000',
          white: '#FFFFFF',
          green: '#06C167',
          blue: '#276EF1',
          red: '#E11900',
          orange: '#FF6937',
          yellow: '#FFC043',
          gray: {
            50: '#F6F6F6',
            100: '#EEEEEE',
            200: '#E2E2E2',
            300: '#CBCBCB',
            400: '#AFAFAF',
            500: '#757575',
            600: '#545454',
            700: '#333333',
            800: '#1F1F1F',
            900: '#141414',
          },
        },
      },
    },
  },
  plugins: [],
}
