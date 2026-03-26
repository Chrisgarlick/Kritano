import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Catch empty error handlers that swallow failures
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Flag explicit `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused vars (allow underscore-prefixed)
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],

      // Prefer const
      'prefer-const': 'warn',

      // No var
      'no-var': 'error',
    },
  },
];
