/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  "rules": {
    "semi": ["error", "never"],
    "quotes": ["error", "single"],
    "eol-last": ["error","always"],
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-explicit-any": "off"
}
};