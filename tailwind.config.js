module.exports = {
  darkMode: 'class',
  future: {},
  purge: [],
  theme: {
    extend: {
      colors: {
        'primary': '#4c1d95'
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
    },
  },
}
