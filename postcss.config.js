module.exports = {
  plugins: {
    'postcss-import': {},
    'tailwindcss/nesting': {},
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-nested': {},
    'postcss-preset-env': {
      features: { 
        'nesting-rules': false,
        'custom-selectors': true,
      },
      browsers: 'last 2 versions',
    },
  },
};
