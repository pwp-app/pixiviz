module.exports = {
  extends: ['eslint-config-ali/vue', 'prettier', 'prettier/vue'],
  overrides: [
    {
      files: ['src/main.js'],
      parser: '@babel/eslint-parser',
    },
  ],
};
