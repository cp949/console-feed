import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/lib/**',
      '**/node_modules/**',
    ],
  },
  {
    files: [
      'apps/demo/src/**/*.{ts,tsx}',
      'packages/console-feed/src/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]
