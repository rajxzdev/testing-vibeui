/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#09090b', 900: '#18181b', 800: '#27272a' },
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        'fade-in-up': { '0%': { opacity: 0, transform: 'translateY(14px)' }, '100%': { opacity: 1, transform: 'none' } },
        'shine': { '0%': { backgroundPosition: '200% center' }, '100%': { backgroundPosition: '-200% center' } },
        'beam': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'slow-pan': { '0%,100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        'blur-in': { '0%': { opacity: 0, filter: 'blur(10px)' }, '100%': { opacity: 1, filter: 'blur(0)' } },
      },
      animation: {
        'fade-in-up': 'fade-in-up .5s ease-out both',
        shine: 'shine 3s linear infinite',
        beam: 'beam 3s linear infinite',
        'slow-pan': 'slow-pan 8s ease-in-out infinite',
        'blur-in': 'blur-in .6s ease-out both',
      },
    },
  },
  plugins: [],
};
