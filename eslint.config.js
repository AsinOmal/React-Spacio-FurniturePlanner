import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Vitest exposes these as globals (vite.config.js → test.globals = true),
// so ESLint must be told about them or it reports "not defined".
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
}

export default defineConfig([
  // The backend has its own ESLint config; dist/ is generated build output.
  globalIgnores(['dist', 'server', 'coverage']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Some files intentionally co-locate shared constants/helpers with their
      // components (e.g. Scene3D). This rule only affects HMR fast-refresh DX,
      // not correctness, so we don't fail the build on it.
      'react-refresh/only-export-components': 'off',
      // eslint-plugin-react-hooks v7 ships experimental React-Compiler rules
      // that flag framework-idiomatic patterns — React Three Fiber mutating
      // `camera.position` inside useFrame, and fetch-on-mount effects. We keep
      // the classic, high-value hooks rules (rules-of-hooks, exhaustive-deps,
      // purity) and disable only the experimental ones below.
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/globals': 'off',
    },
  },
  {
    // Test files run under Vitest with global test APIs + Node globals.
    files: ['src/test/**/*.{js,jsx}', '**/*.test.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node, ...vitestGlobals },
    },
  },
])
