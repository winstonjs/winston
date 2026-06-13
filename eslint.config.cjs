const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = compat.config({
  env: {
    jest: true,
  },
  extends: '@dabh/eslint-config-populist',
  parserOptions: {
    ecmaVersion: 2022,
  },
  rules: {
    'one-var': ['error', { var: 'never', let: 'never', const: 'never' }],
    strict: 0,
  },
});
