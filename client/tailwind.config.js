/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Display face for the big temperature and section titles.
        display: ['Sora', 'system-ui', 'sans-serif'],
        // Workhorse body / UI face.
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        drift: {
          '0%, 100%': { transform: 'translateX(-3px)' },
          '50%': { transform: 'translateX(3px)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(3px)' },
        },
        flicker: {
          '0%, 100%, 70%': { opacity: '1' },
          '72%, 76%': { opacity: '0.4' },
          '74%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 5s ease-in-out infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
        drift: 'drift 6s ease-in-out infinite',
        bob: 'bob 2.4s ease-in-out infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
