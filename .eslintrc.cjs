/** @type {import("eslint").ESLint.ConfigData} */
const config = {
  extends: ['plugin:@typescript-eslint/recommended', 'next', 'prettier'],
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort'],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-duplicates': 'error',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/display-name': 'off',
    '@next/next/no-css-tags': 'off',
  },
};

module.exports = config;
