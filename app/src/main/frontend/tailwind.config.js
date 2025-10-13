/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: { '2xl': '1rem' },
      boxShadow: {
        card: '0 6px 20px rgba(0,0,0,.06)',
        cardHover: '0 10px 28px rgba(0,0,0,.10)',
      },
    },
  },
  plugins: [],
};