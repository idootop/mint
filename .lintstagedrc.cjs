module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --cache', 'prettier --write --cache'],
  '*.{json,md,mdx}': ['prettier --write --cache'],
};
